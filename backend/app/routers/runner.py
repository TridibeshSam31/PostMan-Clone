import base64
import json
import re
import time
import uuid
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(tags=["runner"])

TIMEOUT_SECONDS = 30


def resolve_text(text: str | None, variables: dict[str, str]) -> str | None:
    if not text or not isinstance(text, str):
        return text
    def replace(match):
        key = match.group(1).strip()
        return variables.get(key, match.group(0))
    return re.sub(r"\{\{([^}]+)\}\}", replace, text)


def _build_headers(pairs: list[schemas.KeyValuePair], auth_type: str, auth_config: dict) -> dict:
    headers: dict[str, str] = {
        kv.key: kv.value for kv in pairs if kv.enabled and kv.key
    }

    # Only inject auth if the client has NOT already set an Authorization header.
    already_has_auth = any(k.lower() == "authorization" for k in headers)
    if not already_has_auth:
        if auth_type == "bearer":
            token = auth_config.get("token", "")
            if token:
                headers["Authorization"] = f"Bearer {token}"
        elif auth_type == "basic":
            username = auth_config.get("username", "")
            password = auth_config.get("password", "")
            encoded = base64.b64encode(f"{username}:{password}".encode()).decode()
            headers["Authorization"] = f"Basic {encoded}"

    return headers


def _build_params(pairs: list[schemas.KeyValuePair]) -> dict:
    return {kv.key: kv.value for kv in pairs if kv.enabled and kv.key}


def _build_body(body_type: str, body_content: str | None):
    """Return kwargs to pass directly to httpx.AsyncClient.request()."""
    if body_type == "none" or body_content is None:
        return {}
    if body_type == "raw":
        return {"content": body_content.encode()}
    try:
        pairs = json.loads(body_content) if isinstance(body_content, str) else body_content
        if not isinstance(pairs, list):
            pairs = []
    except Exception:
        pairs = []

    if body_type == "form-data":
        return {"files": {p["key"]: (None, p["value"]) for p in pairs if isinstance(p, dict) and p.get("enabled") and p.get("key")}}
    if body_type == "urlencoded":
        return {"data": {p["key"]: p["value"] for p in pairs if isinstance(p, dict) and p.get("enabled") and p.get("key")}}
    return {}


def _save_history(db: Session, payload: schemas.RunnerRequestIn, resolved_url: str, result: schemas.RunnerResponseOut):
    entry = models.History(
        id=str(uuid.uuid4()),
        user_id="default-user",
        workspace_id=payload.workspace_id,
        method=payload.method,
        url=resolved_url,
        raw_url=payload.url,
        headers=json.dumps([kv.model_dump() for kv in payload.headers]),
        params=json.dumps([kv.model_dump() for kv in payload.params]),
        body_type=payload.body_type,
        body_content=payload.body_content,
        auth_type=payload.auth_type,
        auth_config=json.dumps(payload.auth_config),
        status_code=result.status_code,
        response_time_ms=result.response_time_ms,
        response_size_bytes=result.response_size_bytes,
        response_headers=json.dumps(result.headers),
        response_body=result.body,
        error=result.error,
        sent_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    db.commit()


@router.post("/api/run", response_model=schemas.RunnerResponseOut)
async def run_request(payload: schemas.RunnerRequestIn, db: Session = Depends(get_db)):
    # 1. Load active environment's variables
    env_id = payload.environment_id
    if not env_id:
        # Fallback to active environment from DB
        active_env = db.query(models.Environment).filter(models.Environment.is_active == True).first()
        if active_env:
            env_id = active_env.id

    variables = {}
    if env_id:
        db_vars = db.query(models.EnvironmentVariable).filter(
            models.EnvironmentVariable.environment_id == env_id,
            models.EnvironmentVariable.enabled == True
        ).all()
        variables = {v.key: v.value for v in db_vars}

    # 2. Resolve {{variable}} tokens
    resolved_url = resolve_text(payload.url, variables)
    
    resolved_params = []
    for kv in payload.params:
        resolved_params.append(
            schemas.KeyValuePair(
                key=resolve_text(kv.key, variables),
                value=resolve_text(kv.value, variables),
                enabled=kv.enabled
            )
        )

    resolved_headers = []
    for kv in payload.headers:
        resolved_headers.append(
            schemas.KeyValuePair(
                key=resolve_text(kv.key, variables),
                value=resolve_text(kv.value, variables),
                enabled=kv.enabled
            )
        )

    resolved_body_content = resolve_text(payload.body_content, variables)

    resolved_auth_config = {}
    for k, v in payload.auth_config.items():
        if isinstance(v, str):
            resolved_auth_config[k] = resolve_text(v, variables)
        else:
            resolved_auth_config[k] = v

    # 3. Build headers, params, and body
    headers = _build_headers(resolved_headers, payload.auth_type, resolved_auth_config)
    params = _build_params(resolved_params)
    body_kwargs = _build_body(payload.body_type, resolved_body_content)

    # Normalise resolved_url
    if resolved_url:
        resolved_url = resolved_url.strip()

    # SSRF scheme validation
    if not resolved_url or not (resolved_url.startswith("http://") or resolved_url.startswith("https://")):
        result = schemas.RunnerResponseOut(
            status_code=None,
            response_time_ms=0,
            response_size_bytes=0,
            headers={},
            body=None,
            error="URL must start with http:// or https://"
        )
        _save_history(db, payload, resolved_url or "", result)
        return result

    start = time.monotonic()

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS, follow_redirects=True) as client:
            response = await client.request(
                method=payload.method,
                url=resolved_url,
                headers=headers,
                params=params,
                **body_kwargs,
              )

        elapsed_ms = int((time.monotonic() - start) * 1000)
        body_bytes = response.content
        response_size = len(body_bytes)

        try:
            body_text = body_bytes.decode("utf-8")
        except UnicodeDecodeError:
            body_text = body_bytes.decode("latin-1")

        result = schemas.RunnerResponseOut(
            status_code=response.status_code,
            response_time_ms=elapsed_ms,
            response_size_bytes=response_size,
            headers=dict(response.headers),
            body=body_text,
            error=None,
        )

    except httpx.InvalidURL:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        result = schemas.RunnerResponseOut(
            status_code=None,
            response_time_ms=elapsed_ms,
            response_size_bytes=0,
            headers={},
            body=None,
            error="Invalid URL",
        )

    except httpx.TimeoutException:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        result = schemas.RunnerResponseOut(
            status_code=None,
            response_time_ms=elapsed_ms,
            response_size_bytes=0,
            headers={},
            body=None,
            error="Request timed out after 30s",
        )

    except Exception as exc:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        result = schemas.RunnerResponseOut(
            status_code=None,
            response_time_ms=elapsed_ms,
            response_size_bytes=0,
            headers={},
            body=None,
            error=str(exc),
        )

    _save_history(db, payload, resolved_url, result)
    return result


@router.post("/runner/send", response_model=schemas.RunnerResponseOut)
async def run_request_legacy(payload: schemas.RunnerRequestIn, db: Session = Depends(get_db)):
    return await run_request(payload, db)
