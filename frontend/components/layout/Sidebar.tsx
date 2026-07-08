"use client";

import { useState } from "react";
import { LayoutGrid, History, Search, X } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";
import CollectionsSidebar from "./CollectionsSidebar";
import HistorySidebar from "./HistorySidebar";

const TABS = [
  { key: "collections" as const, label: "Collections", Icon: LayoutGrid },
  { key: "history"     as const, label: "History",     Icon: History },
];

export default function Sidebar() {
  const { sidebarTab, setSidebarTab } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");

  function handleTabSwitch(key: "collections" | "history") {
    setSidebarTab(key);
    setSearchQuery("");
  }

  return (
    <div className="flex flex-col h-full bg-pm-sidebar overflow-hidden">
      {/* ── Tab switcher ─────────────────────────────────── */}
      <div className="flex border-b border-pm-border shrink-0">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => handleTabSwitch(key)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
              sidebarTab === key
                ? "text-pm-orange border-b-2 border-pm-orange -mb-px"
                : "text-pm-muted hover:text-pm-text"
            )}
          >
            <Icon size={15} strokeWidth={1.4} className={sidebarTab === key ? "text-pm-orange" : "text-pm-muted"} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Search bar ───────────────────────────────────── */}
      <div className="px-3 py-2 shrink-0">
        <div className="relative">
          <Search
            size={13}
            strokeWidth={1.5}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pm-muted pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={sidebarTab === "collections" ? "Search collections" : "Search history"}
            className="w-full pl-7 pr-7 h-7 rounded text-xs bg-pm-input
                       border border-pm-border text-pm-text placeholder:text-pm-muted
                       focus:outline-none focus:border-pm-orange transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-pm-muted hover:text-pm-text"
              aria-label="Clear search"
            >
              <X size={10} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {sidebarTab === "collections" ? (
          <CollectionsSidebar searchQuery={searchQuery} />
        ) : (
          <HistorySidebar searchQuery={searchQuery} />
        )}
      </div>
    </div>
  );
}
