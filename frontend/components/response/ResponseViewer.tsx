"use client";

import { useState } from "react";
import { SendHorizontal, AlertCircle } from "lucide-react";
import { useTabStore } from "@/store/tabStore";
import KeyValueTable from "@/components/shared/KeyValueTable";
import { cn, formatBytes, statusColor } from "@/lib/utils";
import type { RunnerResponse } from "@/types";

type ResponseSubTab = "body" | "headers";
type BodyView = "pretty" | "raw";

// ── Status code → text ───────────────────────────────────────
const STATUS_TEXT: Record<number, string> = {
  100: "Continue", 101: "Switching Protocols",
  200: "OK", 201: "Created", 202: "Accepted", 204: "No Content",
  301: "Moved Permanently", 302: "Found", 304: "Not Modified",
  400: "Bad Request", 401: "Unauthorized", 403: "Forbidden",
  404: "Not Found", 405: "Method Not Allowed", 408: "Request Timeout",
  409: "Conflict", 410: "Gone", 422: "Unprocessable Entity", 429: "Too Many Requests",
  500: "Internal Server Error", 501: "Not Implemented",
  502: "Bad Gateway", 503: "Service Unavailable", 504: "Gateway Timeout",
};

function statusText(code: number | null): string {
  if (code === null) return "Error";
  return STATUS_TEXT[code] ?? String(code);
}

// ── JSON syntax highlighter (no external dep) ────────────────
function colorizeJson(raw: string): string {
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(
    /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      if (/^".*":$/.test(match.trim()))
        return `<span style="color:#e06c75">${match}</span>`;     // key
      if (/^"/.test(match))
        return `<span style="color:#98c379">${match}</span>`;     // string
      if (/true|false/.test(match))
        return `<span style="color:#9768d1">${match}</span>`;     // boolean
      if (/null/.test(match))
        return `<span style="color:#9b9b9b">${match}</span>`;     // null
      return `<span style="color:#61affe">${match}</span>`;       // number
    }
  );
}

function tryFormatJson(body: string | null): { formatted: string; isJson: boolean } {
  if (!body) return { formatted: "", isJson: false };
  try {
    const parsed = JSON.parse(body);
    return { formatted: JSON.stringify(parsed, null, 2), isJson: true };
  } catch {
    return { formatted: body, isJson: false };
  }
}

// ── Empty state ──────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center select-none">
      <SendHorizontal size={44} strokeWidth={1.2} className="text-pm-border" />
      <p className="text-pm-muted text-xs">
        Hit <span className="text-pm-text font-medium">Send</span> to get a response
      </p>
    </div>
  );
}

// ── Error state ──────────────────────────────────────────────
function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
      <AlertCircle size={40} strokeWidth={1.3} className="text-method-delete" />
      <p className="text-pm-muted text-xs max-w-sm leading-relaxed">
        <span className="text-method-delete font-medium">Request failed: </span>
        {error}
      </p>
    </div>
  );
}

// ── Status bar ───────────────────────────────────────────────
function StatusBar({ response }: { response: RunnerResponse }) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b border-pm-border flex-shrink-0">
      <span className="text-xs text-pm-muted font-medium">Response</span>
      <div className="flex-1" />
      {response.status_code !== null && (
        <span className={cn("text-xs font-semibold", statusColor(response.status_code))}>
          {response.status_code} {statusText(response.status_code)}
        </span>
      )}
      <span className="text-xs text-pm-muted">
        {response.response_time_ms} ms
      </span>
      <span className="text-xs text-pm-muted">
        {formatBytes(response.response_size_bytes)}
      </span>
    </div>
  );
}

// ── Response body panel ──────────────────────────────────────
function BodyPanel({ body }: { body: string | null }) {
  const [view, setView] = useState<BodyView>("pretty");
  const { formatted, isJson } = tryFormatJson(body);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Pretty / Raw toggle */}
      <div className="flex items-center gap-1 px-4 py-1.5 border-b border-pm-border flex-shrink-0">
        {(["pretty", "raw"] as BodyView[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "px-2.5 py-0.5 rounded text-xs transition-colors capitalize",
              view === v
                ? "bg-pm-active text-pm-text"
                : "text-pm-muted hover:text-pm-text"
            )}
          >
            {v}
          </button>
        ))}
        {view === "pretty" && !isJson && body && (
          <span className="ml-2 text-[10px] text-pm-muted italic">
            (not JSON — showing raw)
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {!body ? (
          <span className="text-pm-muted text-xs">No response body</span>
        ) : view === "pretty" && isJson ? (
          <pre
            className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-all"
            dangerouslySetInnerHTML={{ __html: colorizeJson(formatted) }}
          />
        ) : (
          <pre className="text-xs font-mono text-pm-text leading-relaxed whitespace-pre-wrap break-all">
            {body}
          </pre>
        )}
      </div>
    </div>
  );
}

// ── Response headers panel ───────────────────────────────────
function HeadersPanel({ headers }: { headers: Record<string, string> }) {
  const rows = Object.entries(headers).map(([key, value]) => ({
    key,
    value,
    enabled: true,
  }));
  return (
    <div className="overflow-auto">
      {rows.length === 0 ? (
        <p className="px-4 py-3 text-xs text-pm-muted">No response headers</p>
      ) : (
        <KeyValueTable rows={rows} onChange={() => {}} readOnly />
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────
export default function ResponseViewer() {
  const [subTab, setSubTab] = useState<ResponseSubTab>("body");
  const tab = useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const response = tab?.response ?? null;

  if (!response) return <EmptyState />;
  if (response.error && response.status_code === null)
    return <ErrorState error={response.error} />;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Status bar */}
      <StatusBar response={response} />

      {/* Sub-tabs: Body | Headers */}
      <div className="flex items-end border-b border-pm-border flex-shrink-0 px-4">
        {(["body", "headers"] as ResponseSubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={cn(
              "px-3 py-2 text-xs capitalize border-b-2 transition-colors",
              subTab === t
                ? "text-pm-orange border-pm-orange font-medium"
                : "text-pm-muted border-transparent hover:text-pm-text"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {subTab === "body" && <BodyPanel body={response.body} />}
        {subTab === "headers" && <HeadersPanel headers={response.headers} />}
      </div>
    </div>
  );
}
