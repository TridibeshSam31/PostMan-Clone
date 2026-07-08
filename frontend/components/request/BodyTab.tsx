"use client";

import { useTabStore } from "@/store/tabStore";
import KeyValueTable from "@/components/shared/KeyValueTable";
import { cn } from "@/lib/utils";
import type { BodyType, RawLanguage, KeyValuePair } from "@/types";

const BODY_TYPES: { key: BodyType; label: string }[] = [
  { key: "none",       label: "None" },
  { key: "raw",        label: "raw" },
  { key: "form-data",  label: "form-data" },
  { key: "urlencoded", label: "x-www-form-urlencoded" },
];

const RAW_LANGS: { key: RawLanguage; label: string }[] = [
  { key: "text", label: "Text" },
  { key: "json", label: "JSON" },
];

function safeParseKV(content: string): KeyValuePair[] {
  try {
    const p = JSON.parse(content);
    if (Array.isArray(p)) return p;
  } catch {}
  return [];
}

export default function BodyTab() {
  const activeTabId = useTabStore((s) => s.activeTabId);
  const tab = useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const updateTab = useTabStore((s) => s.updateTab);

  if (!tab || !activeTabId) return null;

  function setBodyType(bt: BodyType) {
    if (!activeTabId) return;
    updateTab(activeTabId, { bodyType: bt, isDirty: true });
  }

  function setRawLang(lang: RawLanguage) {
    if (!activeTabId) return;
    updateTab(activeTabId, { rawLanguage: lang, isDirty: true });
  }

  function setRawContent(content: string) {
    if (!activeTabId) return;
    updateTab(activeTabId, { bodyContent: content, isDirty: true });
  }

  function setKVPairs(pairs: KeyValuePair[]) {
    if (!activeTabId) return;
    updateTab(activeTabId, {
      bodyContent: JSON.stringify(pairs),
      isDirty: true,
    });
  }

  function formatJson() {
    try {
      const formatted = JSON.stringify(JSON.parse(tab!.bodyContent), null, 2);
      setRawContent(formatted);
    } catch {
      // not valid JSON — leave as-is
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Body type selector ────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-pm-border flex-shrink-0">
        {BODY_TYPES.map(({ key, label }) => (
          <label
            key={key}
            className="flex items-center gap-1.5 cursor-pointer select-none text-xs"
          >
            <input
              type="radio"
              name="body-type"
              checked={tab.bodyType === key}
              onChange={() => setBodyType(key)}
              className="accent-pm-orange cursor-pointer"
            />
            <span
              className={
                tab.bodyType === key ? "text-pm-orange font-medium" : "text-pm-muted"
              }
            >
              {label}
            </span>
          </label>
        ))}

        {/* raw language selector */}
        {tab.bodyType === "raw" && (
          <div className="ml-auto flex items-center gap-1">
            {RAW_LANGS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setRawLang(key)}
                className={cn(
                  "px-2.5 py-0.5 rounded text-xs transition-colors",
                  tab.rawLanguage === key
                    ? "bg-pm-active text-pm-text"
                    : "text-pm-muted hover:text-pm-text"
                )}
              >
                {label}
              </button>
            ))}
            {tab.rawLanguage === "json" && (
              <button
                onClick={formatJson}
                className="ml-2 px-2.5 py-0.5 rounded text-xs text-pm-muted
                           border border-pm-border hover:text-pm-text hover:border-pm-muted transition-colors"
              >
                Beautify
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Body content ─────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {tab.bodyType === "none" && (
          <div className="flex items-center justify-center h-full text-pm-muted text-xs">
            This request does not have a body
          </div>
        )}

        {tab.bodyType === "raw" && (
          <textarea
            value={tab.bodyContent}
            onChange={(e) => setRawContent(e.target.value)}
            placeholder={
              tab.rawLanguage === "json"
                ? '{\n  "key": "value"\n}'
                : "Request body…"
            }
            spellCheck={false}
            className="w-full h-full resize-none p-4 bg-transparent text-pm-text
                       text-xs font-mono placeholder:text-pm-muted/50
                       focus:outline-none leading-relaxed"
          />
        )}

        {(tab.bodyType === "form-data" || tab.bodyType === "urlencoded") && (
          <KeyValueTable
            rows={safeParseKV(tab.bodyContent)}
            onChange={setKVPairs}
            keyPlaceholder="Key"
            valuePlaceholder="Value"
          />
        )}
      </div>
    </div>
  );
}
