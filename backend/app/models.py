import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Organization — top-level entity (like a company / team org)
# ---------------------------------------------------------------------------

class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(Text, primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    teams: Mapped[list["Team"]] = relationship(
        "Team", back_populates="organization", cascade="all, delete-orphan"
    )
    workspaces: Mapped[list["Workspace"]] = relationship(
        "Workspace", back_populates="organization", cascade="all, delete-orphan"
    )
    users: Mapped[list["User"]] = relationship(
        "User", back_populates="organization"
    )


# ---------------------------------------------------------------------------
# Team — a group within an organization
# ---------------------------------------------------------------------------

class Team(Base):
    __tablename__ = "teams"

    id: Mapped[str] = mapped_column(Text, primary_key=True, default=_uuid)
    organization_id: Mapped[str] = mapped_column(
        Text, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="teams")
    members: Mapped[list["TeamMember"]] = relationship(
        "TeamMember", back_populates="team", cascade="all, delete-orphan"
    )
    workspaces: Mapped[list["Workspace"]] = relationship(
        "Workspace", back_populates="team"
    )


# ---------------------------------------------------------------------------
# TeamMember — join table linking users to teams with roles
# ---------------------------------------------------------------------------

class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[str] = mapped_column(Text, primary_key=True, default=_uuid)
    team_id: Mapped[str] = mapped_column(
        Text, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        Text, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(Text, nullable=False, default="editor")  # admin | editor | viewer
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    team: Mapped["Team"] = relationship("Team", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="team_memberships")


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(Text, primary_key=True, default=_uuid)
    organization_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    organization: Mapped["Organization | None"] = relationship("Organization", back_populates="users")
    team_memberships: Mapped[list["TeamMember"]] = relationship(
        "TeamMember", back_populates="user", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------------------------
# Workspace — container for collections & environments
# ---------------------------------------------------------------------------

class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(Text, primary_key=True, default=_uuid)
    organization_id: Mapped[str] = mapped_column(
        Text, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(Text, nullable=False, default="personal")  # personal | team
    owner_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    team_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="workspaces")
    team: Mapped["Team | None"] = relationship("Team", back_populates="workspaces")

    collections: Mapped[list["Collection"]] = relationship(
        "Collection", back_populates="workspace", cascade="all, delete-orphan"
    )
    environments: Mapped[list["Environment"]] = relationship(
        "Environment", back_populates="workspace", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------------------------
# Collection — now scoped to a workspace instead of user
# ---------------------------------------------------------------------------

class Collection(Base):
    __tablename__ = "collections"

    id: Mapped[str] = mapped_column(Text, primary_key=True, default=_uuid)
    workspace_id: Mapped[str] = mapped_column(
        Text, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="collections")
    requests: Mapped[list["Request"]] = relationship(
        "Request", back_populates="collection", cascade="all, delete-orphan"
    )
    folders: Mapped[list["Folder"]] = relationship(
        "Folder", back_populates="collection", cascade="all, delete-orphan"
    )


class Folder(Base):
    __tablename__ = "folders"

    id: Mapped[str] = mapped_column(Text, primary_key=True, default=_uuid)
    collection_id: Mapped[str] = mapped_column(
        Text, ForeignKey("collections.id", ondelete="CASCADE"), nullable=False
    )
    parent_folder_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("folders.id", ondelete="CASCADE"), nullable=True
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    collection: Mapped["Collection"] = relationship("Collection", back_populates="folders")
    parent_folder: Mapped["Folder | None"] = relationship("Folder", remote_side=[id], back_populates="subfolders")
    subfolders: Mapped[list["Folder"]] = relationship("Folder", back_populates="parent_folder", cascade="all, delete-orphan")
    requests: Mapped[list["Request"]] = relationship("Request", back_populates="folder", cascade="all, delete-orphan")


class Request(Base):
    __tablename__ = "requests"

    id: Mapped[str] = mapped_column(Text, primary_key=True, default=_uuid)
    collection_id: Mapped[str] = mapped_column(
        Text, ForeignKey("collections.id", ondelete="CASCADE"), nullable=False
    )
    folder_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("folders.id", ondelete="CASCADE"), nullable=True
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    method: Mapped[str] = mapped_column(Text, nullable=False, default="GET")
    url: Mapped[str] = mapped_column(Text, nullable=False, default="")
    headers: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    params: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    body_type: Mapped[str] = mapped_column(Text, nullable=False, default="none")
    body_raw_type: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    auth_type: Mapped[str] = mapped_column(Text, nullable=False, default="none")
    auth_config: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    collection: Mapped["Collection"] = relationship("Collection", back_populates="requests")
    folder: Mapped["Folder | None"] = relationship("Folder", back_populates="requests")


# ---------------------------------------------------------------------------
# Environment — now scoped to a workspace instead of user
# ---------------------------------------------------------------------------

class Environment(Base):
    __tablename__ = "environments"

    id: Mapped[str] = mapped_column(Text, primary_key=True, default=_uuid)
    workspace_id: Mapped[str] = mapped_column(
        Text, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="environments")
    variables: Mapped[list["EnvironmentVariable"]] = relationship(
        "EnvironmentVariable", back_populates="environment", cascade="all, delete-orphan"
    )


class EnvironmentVariable(Base):
    __tablename__ = "environment_variables"

    id: Mapped[str] = mapped_column(Text, primary_key=True, default=_uuid)
    environment_id: Mapped[str] = mapped_column(
        Text, ForeignKey("environments.id", ondelete="CASCADE"), nullable=False
    )
    key: Mapped[str] = mapped_column(Text, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False, default="")
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    environment: Mapped["Environment"] = relationship("Environment", back_populates="variables")


# ---------------------------------------------------------------------------
# History — now includes workspace_id for scoping
# ---------------------------------------------------------------------------

class History(Base):
    __tablename__ = "history"

    id: Mapped[str] = mapped_column(Text, primary_key=True, default=_uuid)
    user_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, default="default-user"
    )
    workspace_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("workspaces.id", ondelete="SET NULL"), nullable=True
    )
    method: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    raw_url: Mapped[str] = mapped_column(Text, nullable=False, default="")
    headers: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    params: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    body_type: Mapped[str] = mapped_column(Text, nullable=False, default="none")
    body_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    auth_type: Mapped[str] = mapped_column(Text, nullable=False, default="none")
    auth_config: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    response_time_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    response_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    response_headers: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    response_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
