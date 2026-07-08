// ---------------------------------------------------------------------------
// Shared key-value pair used in params, headers, form-data, urlencoded body
// ---------------------------------------------------------------------------
export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export type AuthType = "none" | "bearer" | "basic";

export interface BearerAuthConfig {
  token: string;
}

export interface BasicAuthConfig {
  username: string;
  password: string;
}

export type AuthConfig = BearerAuthConfig | BasicAuthConfig | Record<string, string>;

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------
export type BodyType = "none" | "raw" | "form-data" | "urlencoded";
export type RawLanguage = "text" | "json";

// ---------------------------------------------------------------------------
// HTTP Methods
// ---------------------------------------------------------------------------
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

// ---------------------------------------------------------------------------
// Organizations, Teams, Workspaces
// ---------------------------------------------------------------------------
export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Team {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  created_at: string;
  members: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export interface Workspace {
  id: string;
  organization_id: string;
  name: string;
  type: string;
  owner_id: string | null;
  team_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------
export interface Collection {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  requests: SavedRequest[];
  folders: Folder[];
}

export interface CollectionCreate {
  name: string;
  description?: string;
}

export interface CollectionUpdate {
  name?: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Folders (nested inside collections)
// ---------------------------------------------------------------------------
export interface Folder {
  id: string;
  collection_id: string;
  parent_folder_id: string | null;
  name: string;
  order_index: number;
  requests: SavedRequest[];
}

// ---------------------------------------------------------------------------
// Saved Requests (stored in a collection)
// ---------------------------------------------------------------------------
export interface SavedRequest {
  id: string;
  collection_id: string;
  folder_id: string | null;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body_type: BodyType;
  body_raw_type: string | null;
  body_content: string | null;
  auth_type: AuthType;
  auth_config: AuthConfig;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface SavedRequestCreate {
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body_type: BodyType;
  body_raw_type?: string | null;
  body_content?: string | null;
  auth_type: AuthType;
  auth_config: AuthConfig;
  folder_id?: string | null;
  order_index?: number;
}

export type SavedRequestUpdate = Partial<SavedRequestCreate>;

// ---------------------------------------------------------------------------
// Environments
// ---------------------------------------------------------------------------
export interface Environment {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface EnvironmentCreate {
  name: string;
}

// ---------------------------------------------------------------------------
// Environment Variables
// ---------------------------------------------------------------------------
export interface EnvironmentVariable {
  id: string;
  environment_id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface EnvironmentVariableCreate {
  key: string;
  value: string;
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------
export interface HistoryEntry {
  id: string;
  method: HttpMethod;
  url: string;
  raw_url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body_type: BodyType;
  body_content: string | null;
  auth_type: AuthType;
  auth_config: AuthConfig;
  status_code: number | null;
  response_time_ms: number;
  response_size_bytes: number;
  response_headers: Record<string, string>;
  response_body: string | null;
  error: string | null;
  sent_at: string;
}

// ---------------------------------------------------------------------------
// Runner — request sent to POST /api/run
// ---------------------------------------------------------------------------
export interface RunnerRequest {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body_type: BodyType;
  body_content: string | null;
  auth_type: AuthType;
  auth_config: AuthConfig;
  environment_id?: string | null;
  workspace_id?: string | null;
}

// ---------------------------------------------------------------------------
// Runner — response returned by POST /api/run
// ---------------------------------------------------------------------------
export interface RunnerResponse {
  status_code: number | null;
  response_time_ms: number;
  response_size_bytes: number;
  headers: Record<string, string>;
  body: string | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Tab — open request tab in the UI (not persisted)
// ---------------------------------------------------------------------------
export interface RequestTab {
  id: string;
  /** Linked saved request id; null if unsaved */
  savedRequestId: string | null;
  collectionId?: string | null;
  folderId?: string | null;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  bodyType: BodyType;
  bodyContent: string;
  rawLanguage: RawLanguage;
  authType: AuthType;
  authConfig: AuthConfig;
  /** True if the tab has unsaved changes */
  isDirty: boolean;
  /** True while the request is in-flight */
  isLoading: boolean;
  /** Last response received; null before first send */
  response: RunnerResponse | null;
}
