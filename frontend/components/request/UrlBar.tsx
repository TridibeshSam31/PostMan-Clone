"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Loader2, Save as SaveIcon } from "lucide-react";
import { useTabStore } from "@/store/tabStore";
import { cn, METHOD_COLORS } from "@/lib/utils";
import type { HttpMethod, KeyValuePair } from "@/types";

const METHODS: HttpMethod[] = [
  "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS",
];

/** Parse query-string portion of a URL into KeyValuePairs */
function parseQueryParams(url: string): KeyValuePair[] {
  const qi = url.indexOf("?");
  if (qi === -1) return [];
  const qs = url.slice(qi + 1);
  return qs
    .split("&")
    .filter(Boolean)
    .map((pair) => {
      const eq = pair.indexOf("=");
      const key = eq >= 0 ? pair.slice(0, eq) : pair;
      const val = eq >= 0 ? pair.slice(eq + 1) : "";
      try {
        return { key: decodeURIComponent(key), value: decodeURIComponent(val), enabled: true };
      } catch {
        return { key, value: val, enabled: true };
      }
    });
}

interface Props {
  onSend: () => void;
  onSaveClick: () => void;
}

export default function UrlBar({ onSend, onSaveClick }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTabId = useTabStore((s) => s.activeTabId);
  const tab = useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const updateTab = useTabStore((s) => s.updateTab);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  if (!tab || !activeTabId) return null;

  function selectMethod(m: HttpMethod) {
    if (!activeTabId) return;
    updateTab(activeTabId, { method: m, isDirty: true });
    setDropdownOpen(false);
  }

  function handleUrlChange(raw: string) {
    if (!activeTabId) return;
    const newParams = parseQueryParams(raw);
    updateTab(activeTabId, {
      url: raw,
      params: newParams.length > 0 ? newParams : tab!.params,
      isDirty: true,
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") onSend();
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-pm-border bg-pm-bg flex-shrink-0">
      {/* ── Method selector ───────────────────────────────── */}
      <div className="relative flex-shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-1.5 px-2.5 h-9 rounded
                     bg-pm-input border border-pm-border
                     hover:border-pm-muted transition-colors min-w-[100px] justify-between"
        >
          <span className={cn("text-xs font-bold", METHOD_COLORS[tab.method])}>
            {tab.method}
          </span>
          <ChevronDown size={10} strokeWidth={1.8} className="text-pm-muted shrink-0" />
        </button>

        {dropdownOpen && (
          <div className="absolute z-50 top-full left-0 mt-1 w-36
                          bg-pm-sidebar border border-pm-border rounded shadow-xl overflow-hidden">
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => selectMethod(m)}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-xs hover:bg-pm-hover transition-colors",
                  tab.method === m && "bg-pm-active"
                )}
              >
                <span className={cn("font-bold w-16", METHOD_COLORS[m])}>{m}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── URL input ─────────────────────────────────────── */}
      <input
        type="text"
        value={tab.url}
        onChange={(e) => handleUrlChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter request URL"
        spellCheck={false}
        className="flex-1 h-9 px-3 rounded bg-pm-input border border-pm-border
                   text-pm-text text-sm placeholder:text-pm-muted font-mono
                   focus:outline-none focus:border-pm-orange transition-colors min-w-0"
      />

      {/* ── Send button ───────────────────────────────────── */}
      <button
        onClick={onSend}
        disabled={tab.isLoading}
        className="flex items-center gap-1.5 px-4 h-9 rounded text-sm font-medium
                   bg-[#0265D2] hover:bg-[#0256b5] text-white
                   disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex-shrink-0"
      >
        {tab.isLoading ? (
          <>
            <Loader2 size={13} strokeWidth={2} className="animate-spin" />
            Sending…
          </>
        ) : (
          "Send"
        )}
      </button>

      {/* ── Save button (split style) ──────────────────────── */}
      <div className="flex items-stretch shrink-0 rounded border border-pm-border
                      text-pm-text text-sm font-medium overflow-hidden
                      hover:border-pm-muted transition-colors">
        <button
          onClick={onSaveClick}
          className="flex items-center gap-1.5 px-3 h-9 hover:bg-pm-hover transition-colors"
        >
          <SaveIcon size={14} strokeWidth={1.8} />
          Save
        </button>
        <div className="w-px bg-pm-border shrink-0" />
        <button
          onClick={onSaveClick}
          className="flex items-center px-2 h-9 hover:bg-pm-hover transition-colors"
          aria-label="Save options"
        >
          <ChevronDown size={12} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
