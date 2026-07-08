"use client";

import { useTabStore } from "@/store/tabStore";
import { cn } from "@/lib/utils";
import type { AuthType } from "@/types";

const AUTH_TYPES: { key: AuthType; label: string }[] = [
  { key: "none",   label: "No Auth" },
  { key: "bearer", label: "Bearer Token" },
  { key: "basic",  label: "Basic Auth" },
];

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-pm-muted font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className="h-9 px-3 rounded bg-pm-input border border-pm-border text-pm-text text-xs
                   placeholder:text-pm-muted focus:outline-none focus:border-pm-orange transition-colors"
      />
    </div>
  );
}

export default function AuthTab() {
  const activeTabId = useTabStore((s) => s.activeTabId);
  const tab = useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const updateTab = useTabStore((s) => s.updateTab);

  if (!tab || !activeTabId) return null;

  const config = tab.authConfig as Record<string, string>;

  function setAuthType(at: AuthType) {
    if (!activeTabId) return;
    updateTab(activeTabId, { authType: at, authConfig: {}, isDirty: true });
  }

  function setConfigField(field: string, value: string) {
    if (!activeTabId) return;
    updateTab(activeTabId, {
      authConfig: { ...config, [field]: value },
      isDirty: true,
    });
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: auth type list ──────────────────────────── */}
      <div className="w-48 border-r border-pm-border flex-shrink-0 overflow-y-auto">
        <p className="px-3 pt-3 pb-2 text-[11px] text-pm-muted font-medium uppercase tracking-wide">
          Type
        </p>
        {AUTH_TYPES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setAuthType(key)}
            className={cn(
              "w-full text-left px-3 py-2 text-xs transition-colors border-l-2",
              tab.authType === key
                ? "text-pm-orange border-pm-orange bg-pm-hover/50"
                : "text-pm-muted border-transparent hover:text-pm-text hover:bg-pm-hover/30"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Right: config fields ──────────────────────────── */}
      <div className="flex-1 p-5 overflow-y-auto">
        {tab.authType === "none" && (
          <p className="text-pm-muted text-xs leading-relaxed mt-1">
            This request does not use any authorization. Select an auth type from the list to configure credentials.
          </p>
        )}

        {tab.authType === "bearer" && (
          <div className="max-w-lg flex flex-col gap-4">
            <p className="text-pm-muted text-xs">
              The authorization header will be automatically generated when you send the request.
            </p>
            <InputField
              label="Token"
              value={config.token ?? ""}
              onChange={(v) => setConfigField("token", v)}
              placeholder="<token>"
            />
            <div className="px-3 py-2 rounded bg-pm-input border border-pm-border text-xs text-pm-muted">
              Header preview:{" "}
              <span className="text-pm-text font-mono">
                Authorization: Bearer {config.token ? config.token : "<token>"}
              </span>
            </div>
          </div>
        )}

        {tab.authType === "basic" && (
          <div className="max-w-lg flex flex-col gap-4">
            <p className="text-pm-muted text-xs">
              Credentials will be Base64-encoded and sent as an Authorization header.
            </p>
            <InputField
              label="Username"
              value={config.username ?? ""}
              onChange={(v) => setConfigField("username", v)}
              placeholder="username"
            />
            <InputField
              label="Password"
              value={config.password ?? ""}
              onChange={(v) => setConfigField("password", v)}
              type="password"
              placeholder="password"
            />
          </div>
        )}
      </div>
    </div>
  );
}
