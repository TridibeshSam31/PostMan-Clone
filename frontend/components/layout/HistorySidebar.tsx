"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Clock } from "lucide-react";
import { historyApi } from "@/lib/api";
import { useTabStore } from "@/store/tabStore";
import { useAppStore } from "@/store/appStore";
import { cn, METHOD_BG, statusColor } from "@/lib/utils";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import type { HistoryEntry } from "@/types";

interface Props {
  searchQuery?: string;
}

// ── Relative timestamp ────────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ── Status pill ───────────────────────────────────────────────────────────
function StatusPill({ code }: { code: number | null }) {
  if (code === null) {
    return <span className="text-[10px] text-method-delete font-medium">ERR</span>;
  }
  return (
    <span className={cn("text-[10px] font-semibold tabular-nums", statusColor(code))}>
      {code}
    </span>
  );
}

// ── Single history row ────────────────────────────────────────────────────
interface RowProps {
  entry: HistoryEntry;
  onOpen: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
}

function HistoryRow({ entry, onOpen, onDelete }: RowProps) {
  const shortUrl = (() => {
    try {
      const u = new URL(entry.url);
      return u.host + (u.pathname === "/" ? "" : u.pathname);
    } catch {
      return entry.url;
    }
  })();

  return (
    <div
      className="group flex items-start gap-2 px-3 py-2 cursor-pointer
                 hover:bg-pm-hover transition-colors relative"
      onClick={() => onOpen(entry)}
    >
      {/* Method badge */}
      <span className={cn(
        "flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold",
        METHOD_BG[entry.method]
      )}>
        {entry.method}
      </span>

      {/* URL + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-pm-text truncate leading-snug">{shortUrl}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <StatusPill code={entry.status_code} />
          <span className="text-[10px] text-pm-muted tabular-nums">
            {relativeTime(entry.sent_at)}
          </span>
        </div>
      </div>

      {/* Per-entry delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
        className="opacity-0 group-hover:opacity-100 shrink-0 mt-1
                   text-pm-muted hover:text-method-delete transition-all"
        aria-label="Delete history entry"
      >
        <X size={11} strokeWidth={2} />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function HistorySidebar({ searchQuery = "" }: Props) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const queryClient = useQueryClient();
  const openTab = useTabStore((s) => s.openTab);
  const { selectedWorkspaceId } = useAppStore();

  const { data: history = [], isLoading, isError, error } = useQuery({
    queryKey: ["history", selectedWorkspaceId],
    queryFn: () => historyApi.list(selectedWorkspaceId),
    refetchInterval: 5000, // poll every 5s as a fallback
  });

  // Filter by search query (matches method or URL)
  const filtered = searchQuery.trim()
    ? history.filter((e) =>
        e.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.url.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : history;

  // Group by date (Today, Yesterday, Older)
  function dateGroup(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return "Older";
  }

  const groups: Map<string, HistoryEntry[]> = new Map();
  for (const entry of filtered) {
    const group = dateGroup(entry.sent_at);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(entry);
  }
  const groupOrder = ["Today", "Yesterday", "Older"];

  // ── Open from history ─────────────────────────────────────
  async function handleOpen(entry: HistoryEntry) {
    // Fetch full entry (already have fields from list, but fetch to be safe)
    try {
      const full = await historyApi.get(entry.id);
      openTab({
        name:        `${full.method} ${(full.raw_url || full.url || "").split("?")[0].split("/").pop() || "request"}`,
        method:      full.method,
        url:         full.raw_url || full.url,
        params:      full.params ?? [],
        headers:     full.headers ?? [],
        bodyType:    full.body_type,
        bodyContent: full.body_content ?? "",
        authType:    full.auth_type,
        authConfig:  full.auth_config ?? {},
      });
    } catch {
      toast.error("Failed to open history entry");
    }
  }

  // ── Per-entry delete ──────────────────────────────────────
  async function handleDelete(id: string) {
    try {
      await historyApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ["history", selectedWorkspaceId] });
      toast.success("Entry removed");
    } catch {
      toast.error("Failed to delete entry");
    }
  }

  // ── Clear all ─────────────────────────────────────────────
  async function handleClearAll() {
    try {
      await historyApi.clear(selectedWorkspaceId);
      queryClient.invalidateQueries({ queryKey: ["history", selectedWorkspaceId] });
      toast.success("History cleared");
    } catch {
      toast.error("Failed to clear history");
    }
    setShowClearConfirm(false);
  }

  // ── Loading skeleton ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-2 px-3 py-2 animate-pulse">
            <div className="w-10 h-4 rounded bg-pm-border flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 rounded bg-pm-border w-3/4" />
              <div className="h-2.5 rounded bg-pm-border w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <Clock size={40} strokeWidth={1.2} className="text-method-delete" />
        <div>
          <p className="text-pm-text text-xs font-medium mb-1">Could not load history</p>
          <p className="text-pm-muted text-xs leading-relaxed">
            {error instanceof Error ? error.message : "Check the backend URL and CORS settings."}
          </p>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <Clock size={40} strokeWidth={1.2} className="text-pm-border" />
        <p className="text-pm-muted text-xs leading-relaxed">
          Requests you send will appear<br />here
        </p>
      </div>
    );
  }

  // ── No search results ─────────────────────────────────────
  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-pm-muted text-xs">No results for "{searchQuery}"</p>
      </div>
    );
  }

  // ── Main list ─────────────────────────────────────────────
  return (
    <>
      {/* Clear all button */}
      <div className="flex items-center justify-end px-3 py-1.5 border-b border-pm-border flex-shrink-0">
        <button
          onClick={() => setShowClearConfirm(true)}
          className="text-[11px] text-pm-muted hover:text-method-delete transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Grouped entries */}
      <div className="flex-1 overflow-y-auto">
        {groupOrder.map((groupLabel) => {
          const entries = groups.get(groupLabel);
          if (!entries?.length) return null;
          return (
            <div key={groupLabel}>
              <div className="px-3 py-1 text-[10px] font-semibold text-pm-muted uppercase tracking-wider
                              bg-pm-sidebar sticky top-0 border-b border-pm-border/50">
                {groupLabel}
              </div>
              {entries.map((entry) => (
                <HistoryRow
                  key={entry.id}
                  entry={entry}
                  onOpen={handleOpen}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Confirm clear all modal */}
      {showClearConfirm && (
        <ConfirmDeleteModal
          title="Clear History"
          message="This will permanently delete all request history. This cannot be undone."
          onConfirm={handleClearAll}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </>
  );
}
