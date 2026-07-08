import json
from datetime import datetime
from enum import Enum
from typing import Any
from pydantic import BaseModel, ConfigDict, field_validator


# ---------------------------------------------------------------------------
# Helpers — coerce stored JSON strings → Python objects in Read schemas
# ---------------------------------------------------------------------------

def _parse_json_list(v: Any) -> list:
    if isinstance(v, str):
        return json.loads(v)
    return v


def _parse_json_dict(v: Any) -> dict:
    if isinstance(v, str):
        return json.loads(v)
    return v


# ---------------------------------------------------------------------------
# Shared key-value pair
# ---------------------------------------------------------------------------

class KeyValuePair(BaseModel):
    key: str
    value: str
    enabled: bool = True


# ---------------------------------------------------------------------------
# Organizations
# ---------------------------------------------------------------------------

class OrganizationCreate(BaseModel):
    name: str
    slug: str


class OrganizationUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None


class OrganizationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    created_at: datetime


# ---------------------------------------------------------------------------
# Teams
# ---------------------------------------------------------------------------

class TeamCreate(BaseModel):
    name: str
    description: str | None = None


class TeamUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class TeamMemberAdd(BaseModel):
    user_id: str
    role: str = "editor"  # admin | editor | viewer


class TeamMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    team_id: str
    user_id: str
    role: str
    joined_at: datetime


class TeamRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    name: str
    description: str | None
    created_at: datetime
    members: list[TeamMemberRead] = []


# ---------------------------------------------------------------------------
# Workspaces
# ---------------------------------------------------------------------------

class WorkspaceCreate(BaseModel):
    name: str
    type: str = "personal"  # personal | team
    team_id: str | None = None


class WorkspaceUpdate(BaseModel):
    name: str | None = None


class WorkspaceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    name: str
    type: str
    owner_id: str | None
    team_id: str | None
    created_at: datetime


# ---------------------------------------------------------------------------
# Collections
# ---------------------------------------------------------------------------

class CollectionCreate(BaseModel):
    name: str
    description: str | None = None


class CollectionUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------

class RequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    collection_id: str
    folder_id: str | None
    name: str
    method: str
    url: str
    headers: list[KeyValuePair]
    params: list[KeyValuePair]
    body_type: str
    body_raw_type: str | None
    body_content: str | None
    auth_type: str
    auth_config: dict
    order_index: int
    created_at: datetime
    updated_at: datetime

    @field_validator("headers", "params", mode="before")
    @classmethod
    def parse_list(cls, v: Any) -> list:
        return _parse_json_list(v)

    @field_validator("auth_config", mode="before")
    @classmethod
    def parse_dict(cls, v: Any) -> dict:
        return _parse_json_dict(v)


# ---------------------------------------------------------------------------
# Folders
# ---------------------------------------------------------------------------

class FolderCreate(BaseModel):
    name: str
    parent_folder_id: str | None = None


class FolderUpdate(BaseModel):
    name: str | None = None
    parent_folder_id: str | None = None


class FolderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    collection_id: str
    parent_folder_id: str | None
    name: str
    order_index: int
    requests: list[RequestRead] = []


class CollectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime
    requests: list[RequestRead] = []
    folders: list[FolderRead] = []


class RequestCreate(BaseModel):
    name: str
    method: str = "GET"
    url: str = ""
    headers: list[KeyValuePair] = []
    params: list[KeyValuePair] = []
    body_type: str = "none"
    body_raw_type: str | None = None
    body_content: str | None = None
    auth_type: str = "none"
    auth_config: dict = {}
    folder_id: str | None = None
    order_index: int = 0


class RequestUpdate(BaseModel):
    name: str | None = None
    method: str | None = None
    url: str | None = None
    headers: list[KeyValuePair] | None = None
    params: list[KeyValuePair] | None = None
    body_type: str | None = None
    body_raw_type: str | None = None
    body_content: str | None = None
    auth_type: str | None = None
    auth_config: dict | None = None
    folder_id: str | None = None
    order_index: int | None = None


# ---------------------------------------------------------------------------
# Environments
# ---------------------------------------------------------------------------

class EnvironmentCreate(BaseModel):
    name: str


class EnvironmentUpdate(BaseModel):
    name: str


class EnvironmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    name: str
    is_active: bool
    created_at: datetime


# ---------------------------------------------------------------------------
# Environment Variables
# ---------------------------------------------------------------------------

class EnvironmentVariableCreate(BaseModel):
    key: str
    value: str
    enabled: bool = True


class EnvironmentVariableRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    environment_id: str
    key: str
    value: str
    enabled: bool


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------

class HistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    method: str
    url: str
    raw_url: str
    workspace_id: str | None
    headers: list[KeyValuePair]
    params: list[KeyValuePair]
    body_type: str
    body_content: str | None
    auth_type: str
    auth_config: dict
    status_code: int | None
    response_time_ms: int
    response_size_bytes: int
    response_headers: dict
    response_body: str | None
    error: str | None
    sent_at: datetime

    @field_validator("headers", "params", mode="before")
    @classmethod
    def parse_list(cls, v: Any) -> list:
        return _parse_json_list(v)

    @field_validator("auth_config", "response_headers", mode="before")
    @classmethod
    def parse_dict(cls, v: Any) -> dict:
        return _parse_json_dict(v)


class HistorySummary(BaseModel):
    """Lightweight shape returned by GET /api/history list."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    method: str
    url: str
    status_code: int | None
    response_time_ms: int
    response_size_bytes: int
    error: str | None
    sent_at: datetime


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

class RunnerRequestIn(BaseModel):
    method: str
    url: str
    headers: list[KeyValuePair] = []
    params: list[KeyValuePair] = []
    body_type: str = "none"
    body_content: str | None = None
    auth_type: str = "none"
    auth_config: dict = {}
    environment_id: str | None = None
    workspace_id: str | None = None


class RunnerResponseOut(BaseModel):
    status_code: int | None
    response_time_ms: int
    response_size_bytes: int
    headers: dict
    body: str | None
    error: str | None


# ---------------------------------------------------------------------------
# Workspace Members
# ---------------------------------------------------------------------------

class MemberRole(str, Enum):
    ADMIN = "ADMIN"
    EDITOR = "EDITOR"
    VIEWER = "VIEWER"


class WorkspaceMemberCreate(BaseModel):
    user_id: str
    role: MemberRole = MemberRole.VIEWER


class WorkspaceMemberUpdate(BaseModel):
    role: MemberRole


class WorkspaceMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    workspace_id: str
    role: MemberRole
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Workspace Invites
# ---------------------------------------------------------------------------

class WorkspaceInviteCreate(BaseModel):
    expires_at: datetime | None = None


class WorkspaceInviteAccept(BaseModel):
    token: str


class WorkspaceInviteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    token: str
    created_by_id: str
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# WebSocket Presets
# ---------------------------------------------------------------------------

class WebSocketPresetCreate(BaseModel):
    name: str
    url: str
    protocols: list[str] = []
    params: list[KeyValuePair] = []


class WebSocketPresetUpdate(BaseModel):
    name: str | None = None
    url: str | None = None
    protocols: list[str] | None = None
    params: list[KeyValuePair] | None = None


class WebSocketPresetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str | None
    name: str
    url: str
    protocols: list[str]
    params: list[KeyValuePair]
    created_at: datetime
    updated_at: datetime

    @field_validator("protocols", mode="before")
    @classmethod
    def parse_protocols(cls, v):
        return _parse_json_list(v)

    @field_validator("params", mode="before")
    @classmethod
    def parse_params(cls, v):
        return _parse_json_list(v)


# ---------------------------------------------------------------------------
# WebSocket Messages
# ---------------------------------------------------------------------------

class Direction(str, Enum):
    INCOMING = "INCOMING"
    OUTGOING = "OUTGOING"


class WebSocketMessageCreate(BaseModel):
    payload: str
    direction: Direction = Direction.OUTGOING
    connection_id: str | None = None
    meta: dict = {}


class WebSocketMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    preset_id: str | None
    connection_id: str | None
    direction: Direction
    payload: str | None
    size: int | None
    meta: dict
    timestamp: datetime

    @field_validator("meta", mode="before")
    @classmethod
    def parse_meta(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v
