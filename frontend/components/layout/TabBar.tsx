"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { useTabStore } from "@/store/tabStore";
import { cn, METHOD_COLORS } from "@/lib/utils";
import SaveRequestModal from "@/components/modals/SaveRequestModal";
import type { HttpMethod, RequestTab } from "@/types";

// ── Unsaved-changes dialog ────────────────────────────────────────────────
interface UnsavedDialogProps {
  tab: RequestTab;
  onSave:    () => void;
  onDiscard: () => void;
  onCancel:  () => void;
}

function UnsavedDialog({ tab, onSave, onDiscard, onCancel }: UnsavedDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-pm-sidebar border border-pm-border rounded-lg shadow-2xl w-[380px] p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-pm-text mb-1">Unsaved Changes</h2>
          <p className="text-xs text-pm-muted leading-relaxed">
            <span className="font-medium text-pm-text">{tab.name}</span> has unsaved changes.
            Do you want to save them before closing?
          </p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onCancel}
            className="px-3 h-7 rounded text-xs text-pm-muted hover:text-pm-text
                       hover:bg-pm-hover transition-colors">
            Cancel
          </button>
          <button onClick={onDiscard}
            className="px-3 h-7 rounded text-xs border border-pm-border
                       text-pm-text hover:bg-pm-hover transition-colors">
            Discard
          </button>
          <button onClick={onSave}
            className="px-3 h-7 rounded text-xs font-medium bg-pm-orange text-white
                       hover:bg-pm-orange-dim transition-colors">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main TabBar ───────────────────────────────────────────────────────────
export default function TabBar() {
  const { tabs, activeTabId, openTab, closeTab, setActiveTab } = useTabStore();
  const [confirmCloseTab, setConfirmCloseTab] = useState<RequestTab | null>(null);
  const [showSaveForClose, setShowSaveForClose] = useState(false);

  function handleClose(tab: RequestTab) {
    if (tab.isDirty) {
      setConfirmCloseTab(tab);
    } else {
      closeTab(tab.id);
    }
  }

  function handleDialogDiscard() {
    if (confirmCloseTab) closeTab(confirmCloseTab.id);
    setConfirmCloseTab(null);
  }

  function handleSaveModalClose() {
    setShowSaveForClose(false);
    if (confirmCloseTab) {
      const latest = useTabStore.getState().tabs.find((t) => t.id === confirmCloseTab.id);
      if (!latest?.isDirty) {
        closeTab(confirmCloseTab.id);
        setConfirmCloseTab(null);
      }
    }
  }

  return (
    <>
      <div className="flex items-end h-9 bg-pm-surface border-b border-pm-border shrink-0 overflow-x-auto overflow-y-hidden">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "group relative flex items-center gap-1.5 h-full px-3 min-w-0 max-w-[180px]",
                "border-r border-pm-border cursor-pointer select-none shrink-0",
                "transition-colors text-xs",
                isActive
                  ? "bg-pm-bg text-pm-text"
                  : "bg-pm-surface text-pm-muted hover:bg-pm-hover hover:text-pm-text"
              )}
            >
              {isActive && (
                <span className="absolute inset-x-0 top-0 h-[2px] bg-pm-orange rounded-b-none" />
              )}
              <span className={cn(
                "text-[10px] font-bold shrink-0",
                METHOD_COLORS[tab.method as HttpMethod] ?? "text-pm-muted"
              )}>
                {tab.method}
              </span>
              {tab.isDirty && (
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-pm-orange" />
              )}
              <span className="truncate flex-1 min-w-0">{tab.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleClose(tab); }}
                className={cn(
                  "shrink-0 w-4 h-4 flex items-center justify-center rounded",
                  "text-pm-muted hover:text-pm-text hover:bg-pm-active transition-colors",
                  "opacity-0 group-hover:opacity-100",
                  isActive && "opacity-100"
                )}
                aria-label="Close tab"
              >
                <X size={8} strokeWidth={2} />
              </button>
            </div>
          );
        })}

        <button
          onClick={() => openTab()}
          className="flex items-center justify-center shrink-0 w-8 h-full
                     text-pm-muted hover:text-pm-text hover:bg-pm-hover transition-colors"
          aria-label="New request tab"
        >
          <Plus size={11} strokeWidth={2} />
        </button>
      </div>

      {confirmCloseTab && !showSaveForClose && (
        <UnsavedDialog
          tab={confirmCloseTab}
          onSave={() => setShowSaveForClose(true)}
          onDiscard={handleDialogDiscard}
          onCancel={() => setConfirmCloseTab(null)}
        />
      )}

      {confirmCloseTab && showSaveForClose && (
        <SaveRequestModal tab={confirmCloseTab} onClose={handleSaveModalClose} />
      )}
    </>
  );
}
