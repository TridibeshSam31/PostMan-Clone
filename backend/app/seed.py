"""
Idempotent seed script — populates demo data on first run.
Safe to call on every server restart; skips if data already exists.
"""
import json
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import (
    Collection, Environment, EnvironmentVariable, History, Request, User, Folder,
    Organization, Team, TeamMember, Workspace
)


def _uuid() -> str:
    return str(uuid.uuid4())


def _now(offset_minutes: int = 0) -> datetime:
    return datetime.now(timezone.utc) - timedelta(minutes=offset_minutes)


# ── Helpers ───────────────────────────────────────────────────────────────

def _req(db: Session, collection_id: str, **kwargs) -> Request:
    r = Request(
        id=_uuid(),
        collection_id=collection_id,
        folder_id=kwargs.pop("folder_id", None),
        headers=json.dumps(kwargs.pop("headers", [])),
        params=json.dumps(kwargs.pop("params", [])),
        auth_config=json.dumps(kwargs.pop("auth_config", {})),
        body_type=kwargs.pop("body_type", "none"),
        body_raw_type=kwargs.pop("body_raw_type", None),
        body_content=kwargs.pop("body_content", None),
        auth_type=kwargs.pop("auth_type", "none"),
        order_index=kwargs.pop("order_index", 0),
        **kwargs,
    )
    db.add(r)
    return r


def _hist(db: Session, workspace_id: str, **kwargs) -> History:
    h = History(
        id=_uuid(),
        user_id="default-user",
        workspace_id=workspace_id,
        raw_url=kwargs.pop("raw_url", kwargs.get("url", "")),
        headers=json.dumps(kwargs.pop("headers", [])),
        params=json.dumps(kwargs.pop("params", [])),
        auth_config=json.dumps(kwargs.pop("auth_config", {})),
        response_headers=json.dumps(kwargs.pop("response_headers", {
            "content-type": "application/json; charset=utf-8",
        })),
        body_type=kwargs.pop("body_type", "none"),
        body_content=kwargs.pop("body_content", None),
        auth_type=kwargs.pop("auth_type", "none"),
        error=kwargs.pop("error", None),
        **kwargs,
    )
    db.add(h)
    return h


# ── Main seed function ────────────────────────────────────────────────────

def run_seed() -> None:
    db: Session = SessionLocal()
    try:
        # Idempotency check — skip if organization already exists
        if db.query(Organization).first():
            return

        # ── Organization & Team ───────────────────────────────
        org = Organization(id=_uuid(), name="Tridisam's Team", slug="tridisam-s-team")
        db.add(org)
        db.flush()

        team = Team(id=_uuid(), organization_id=org.id, name="Backend Devs", description="API Backend Developers")
        db.add(team)
        db.flush()

        # Seed user linked to organization
        default_user = db.query(User).filter(User.id == "default-user").first()
        if not default_user:
            default_user = User(id="default-user", name="Default User", email="tridisam@example.com", organization_id=org.id)
            db.add(default_user)
        else:
            default_user.organization_id = org.id
            default_user.email = "tridisam@example.com"
        db.flush()

        # Add user to team
        member = TeamMember(id=_uuid(), team_id=team.id, user_id="default-user", role="admin")
        db.add(member)
        db.flush()

        # ── Workspaces ────────────────────────────────────────
        # 1. Personal Workspace
        personal_ws = Workspace(
            id=_uuid(),
            organization_id=org.id,
            name="My Workspace",
            type="personal",
            owner_id="default-user"
        )
        db.add(personal_ws)
        
        # 2. Team Workspace
        team_ws = Workspace(
            id=_uuid(),
            organization_id=org.id,
            name="Team Workspace",
            type="team",
            team_id=team.id
        )
        db.add(team_ws)
        db.flush()

        # ── Collections (in Personal Workspace) ────────────────

        # 1. JSONPlaceholder
        jp = Collection(id=_uuid(), name="JSONPlaceholder",
                        description="Sample REST requests against jsonplaceholder.typicode.com",
                        workspace_id=personal_ws.id)
        db.add(jp)
        db.flush()

        # Create a folder for nested requests
        posts_folder = Folder(id=_uuid(), collection_id=jp.id, name="Posts API", order_index=0)
        db.add(posts_folder)
        db.flush()

        _req(db, jp.id, folder_id=posts_folder.id, name="Get all posts",     method="GET",
             url="https://jsonplaceholder.typicode.com/posts")
        _req(db, jp.id, folder_id=posts_folder.id, name="Get post by ID",    method="GET",
             url="https://jsonplaceholder.typicode.com/posts/1")
        _req(db, jp.id, folder_id=posts_folder.id, name="Create post",       method="POST",
             url="https://jsonplaceholder.typicode.com/posts",
             body_type="raw",
             body_raw_type="json",
             body_content=json.dumps({
                 "title": "foo", "body": "bar", "userId": 1
             }, indent=2),
             headers=[{"key": "Content-Type", "value": "application/json", "enabled": True}])
        _req(db, jp.id, folder_id=posts_folder.id, name="Delete post",       method="DELETE",
             url="https://jsonplaceholder.typicode.com/posts/1")

        # 2. HTTPBin
        hb = Collection(id=_uuid(), name="HTTPBin",
                        description="Useful HTTP testing endpoints from httpbin.org",
                        workspace_id=personal_ws.id)
        db.add(hb)
        db.flush()

        _req(db, hb.id, name="GET /get",          method="GET",
             url="https://httpbin.org/get",
             params=[{"key": "foo", "value": "bar", "enabled": True}])
        _req(db, hb.id, name="POST /post",        method="POST",
             url="https://httpbin.org/post",
             body_type="raw",
             body_raw_type="json",
             body_content='{"message": "hello httpbin"}',
             headers=[{"key": "Content-Type", "value": "application/json", "enabled": True}])
        _req(db, hb.id, name="GET /status/404",   method="GET",
             url="https://httpbin.org/status/404")

        # 3. Variable demo collection
        rr = Collection(id=_uuid(), name="Variable Demo",
                        description="Uses {{baseUrl}} to demonstrate environment variable resolution",
                        workspace_id=personal_ws.id)
        db.add(rr)
        db.flush()

        _req(db, rr.id, name="List users",        method="GET",
             url="{{baseUrl}}/users",
             params=[{"key": "_limit", "value": "5", "enabled": True}])
        _req(db, rr.id, name="Get user by ID",    method="GET",
             url="{{baseUrl}}/users/1")

        # ── Environments (in Personal Workspace) ──────────────

        # JSONPlaceholder Env is marked active (is_active=True)
        env_prod = Environment(id=_uuid(), name="JSONPlaceholder Env", workspace_id=personal_ws.id, is_active=True)
        db.add(env_prod)
        db.flush()

        db.add(EnvironmentVariable(
            id=_uuid(), environment_id=env_prod.id,
            key="baseUrl", value="https://jsonplaceholder.typicode.com", enabled=True,
        ))

        env_local = Environment(id=_uuid(), name="Local Dev", workspace_id=personal_ws.id, is_active=False)
        db.add(env_local)
        db.flush()

        db.add(EnvironmentVariable(
            id=_uuid(), environment_id=env_local.id,
            key="baseUrl", value="http://localhost:3000/api", enabled=True,
        ))
        db.add(EnvironmentVariable(
            id=_uuid(), environment_id=env_local.id,
            key="authToken", value="dev-secret-token", enabled=True,
        ))

        # ── History (in Personal Workspace) ───────────────────

        jp_posts_body = json.dumps([
            {"userId": 1, "id": 1, "title": "sunt aut facere repellat", "body": "quia et suscipit"},
            {"userId": 1, "id": 2, "title": "qui est esse", "body": "est rerum tempore"},
        ])

        jp_post1_body = json.dumps({
            "userId": 1, "id": 1,
            "title": "sunt aut facere repellat provident occaecati excepturi optio",
            "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita",
        })

        jp_create_body = json.dumps({"id": 101, "title": "foo", "body": "bar", "userId": 1})

        hb_get_body = json.dumps({
            "args": {"foo": "bar"},
            "headers": {"Host": "httpbin.org", "User-Agent": "python-httpx/0.27.0"},
            "origin": "1.2.3.4",
            "url": "https://httpbin.org/get?foo=bar",
        })

        _hist(db, workspace_id=personal_ws.id,
              method="GET", url="https://jsonplaceholder.typicode.com/posts",
              raw_url="https://jsonplaceholder.typicode.com/posts",
              status_code=200, response_time_ms=142, response_size_bytes=len(jp_posts_body),
              response_body=jp_posts_body,
              sent_at=_now(offset_minutes=2))

        _hist(db, workspace_id=personal_ws.id,
              method="GET", url="https://jsonplaceholder.typicode.com/posts/1",
              raw_url="https://jsonplaceholder.typicode.com/posts/1",
              status_code=200, response_time_ms=89, response_size_bytes=len(jp_post1_body),
              response_body=jp_post1_body,
              sent_at=_now(offset_minutes=5))

        _hist(db, workspace_id=personal_ws.id,
              method="POST", url="https://jsonplaceholder.typicode.com/posts",
              raw_url="https://jsonplaceholder.typicode.com/posts",
              body_type="raw",
              body_content='{"title":"foo","body":"bar","userId":1}',
              headers=[{"key": "Content-Type", "value": "application/json", "enabled": True}],
              status_code=201, response_time_ms=230, response_size_bytes=len(jp_create_body),
              response_body=jp_create_body,
              response_headers={"content-type": "application/json; charset=utf-8", "location": "/posts/101"},
              sent_at=_now(offset_minutes=10))

        _hist(db, workspace_id=personal_ws.id,
              method="GET", url="https://httpbin.org/status/404",
              raw_url="https://httpbin.org/status/404",
              status_code=404, response_time_ms=310, response_size_bytes=0,
              response_body="",
              sent_at=_now(offset_minutes=15))

        _hist(db, workspace_id=personal_ws.id,
              method="GET", url="https://httpbin.org/get",
              raw_url="https://httpbin.org/get",
              params=[{"key": "foo", "value": "bar", "enabled": True}],
              status_code=200, response_time_ms=347, response_size_bytes=len(hb_get_body),
              response_body=hb_get_body,
              sent_at=_now(offset_minutes=20))

        db.commit()
        print("[seed] Demo data seeded successfully with organization and workspaces")

    except Exception as exc:
        db.rollback()
        print(f"[seed] Seed failed: {exc}")
    finally:
        db.close()
