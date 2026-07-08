import type {
  Collection,
  CollectionCreate,
  CollectionUpdate,
  Folder,
  SavedRequest,
  SavedRequestCreate,
  SavedRequestUpdate,
  Environment,
  EnvironmentCreate,
  EnvironmentVariable,
  EnvironmentVariableCreate,
  HistoryEntry,
  RunnerRequest,
  RunnerResponse,
  Organization,
  Workspace,
} from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text}`);
  }
  return res.json();
}

// ── Organizations ─────────────────────────────────────────────
export const organizationsApi = {
  list: () => request<Organization[]>("/api/organizations"),
  get: (id: string) => request<Organization>(`/api/organizations/${id}`),
  create: (body: { name: string; slug: string }) =>
    request<Organization>("/api/organizations", { method: "POST", body: JSON.stringify(body) }),
};

// ── Workspaces ────────────────────────────────────────────────
export const workspacesApi = {
  list: (orgId?: string | null) =>
    request<Workspace[]>(`/api/workspaces${orgId ? `?org_id=${orgId}` : ""}`),
  get: (id: string) => request<Workspace>(`/api/workspaces/${id}`),
  create: (body: { name: string; type: string; team_id?: string | null }, orgId?: string | null) =>
    request<Workspace>(`/api/workspaces${orgId ? `?org_id=${orgId}` : ""}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  delete: (id: string) => request<void>(`/api/workspaces/${id}`, { method: "DELETE" }),
};

// ── Collections ──────────────────────────────────────────────
export const collectionsApi = {
  list: (workspaceId?: string | null) =>
    request<Collection[]>(`/api/collections${workspaceId ? `?workspace_id=${workspaceId}` : ""}`),
  create: (body: CollectionCreate, workspaceId?: string | null) =>
    request<Collection>(`/api/collections${workspaceId ? `?workspace_id=${workspaceId}` : ""}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  rename: (id: string, body: CollectionUpdate) =>
    request<Collection>(`/api/collections/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) =>
    request<void>(`/api/collections/${id}`, { method: "DELETE" }),
};

// ── Requests ─────────────────────────────────────────────────
export const requestsApi = {
  get: (id: string) => request<SavedRequest>(`/api/requests/${id}`),
  create: (collectionId: string, body: SavedRequestCreate) =>
    request<SavedRequest>(`/api/collections/${collectionId}/requests`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: SavedRequestUpdate) =>
    request<SavedRequest>(`/api/requests/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: string) =>
    request<void>(`/api/requests/${id}`, { method: "DELETE" }),
};

// ── Folders ──────────────────────────────────────────────────
export const foldersApi = {
  create: (collectionId: string, name: string, parentFolderId?: string | null) =>
    request<Folder>(`/api/collections/${collectionId}/folders`, {
      method: "POST",
      body: JSON.stringify({ name, parent_folder_id: parentFolderId ?? null }),
    }),
  rename: (id: string, name: string) =>
    request<Folder>(`/api/folders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    }),
  delete: (id: string) =>
    request<void>(`/api/folders/${id}`, { method: "DELETE" }),
};

// ── Environments ──────────────────────────────────────────────
export const environmentsApi = {
  list: (workspaceId?: string | null) =>
    request<Environment[]>(`/api/environments${workspaceId ? `?workspace_id=${workspaceId}` : ""}`),
  create: (body: EnvironmentCreate, workspaceId?: string | null) =>
    request<Environment>(`/api/environments${workspaceId ? `?workspace_id=${workspaceId}` : ""}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  rename: (id: string, name: string) =>
    request<Environment>(`/api/environments/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
  delete: (id: string) =>
    request<void>(`/api/environments/${id}`, { method: "DELETE" }),
  getVariables: (id: string) =>
    request<EnvironmentVariable[]>(`/api/environments/${id}/variables`),
  setVariables: (id: string, vars: EnvironmentVariableCreate[]) =>
    request<EnvironmentVariable[]>(`/api/environments/${id}/variables`, {
      method: "PUT",
      body: JSON.stringify(vars),
    }),
  activate: (id: string) =>
    request<Environment>(`/api/environments/${id}/activate`, { method: "PATCH" }),
};

// ── History ───────────────────────────────────────────────────
export const historyApi = {
  list: (workspaceId?: string | null) =>
    request<HistoryEntry[]>(`/api/history${workspaceId ? `?workspace_id=${workspaceId}` : ""}`),
  get: (id: string) => request<HistoryEntry>(`/api/history/${id}`),
  delete: (id: string) => request<void>(`/api/history/${id}`, { method: "DELETE" }),
  clear: (workspaceId?: string | null) =>
    request<void>(`/api/history${workspaceId ? `?workspace_id=${workspaceId}` : ""}`, { method: "DELETE" }),
};

// ── Runner ────────────────────────────────────────────────────
export async function sendRequest(payload: RunnerRequest): Promise<RunnerResponse> {
  try {
    return await request<RunnerResponse>("/api/run", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return {
      status_code: null,
      response_time_ms: 0,
      response_size_bytes: 0,
      headers: {},
      body: null,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
