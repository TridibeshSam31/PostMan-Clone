"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import { environmentsApi } from "@/lib/api";
import { useAppStore } from "@/store/appStore";
import KeyValueTable from "@/components/shared/KeyValueTable";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import { cn } from "@/lib/utils";
import type { KeyValuePair } from "@/types";

interface Props {
  onClose: () => void;
}

export default function ManageEnvironmentsModal({ onClose }: Props) {
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [localVars, setLocalVars] = useState<KeyValuePair[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isAddingEnv, setIsAddingEnv] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");
  const newEnvRef = useRef<HTMLInputElement>(null);

  const [confirmDelete, setConfirmDelete] = useState<{
    title: string; message: string; onConfirm: () => void;
  } | null>(null);

  const queryClient = useQueryClient();
  const { selectedEnvironmentId, setSelectedEnvironment, selectedWorkspaceId } = useAppStore();

  // ── Fetch env list ────────────────────────────────────────
  const { data: environments = [] } = useQuery({
    queryKey: ["environments", selectedWorkspaceId],
    queryFn: () => environmentsApi.list(selectedWorkspaceId),
    enabled: !!selectedWorkspaceId,
  });

  // Auto-select first env when modal opens
  useEffect(() => {
    if (environments.length > 0 && !selectedEnvId) {
      setSelectedEnvId(environments[0].id);
    }
  }, [environments, selectedEnvId]);

  // ── Fetch variables for selected env ──────────────────────
  // No `= []` default — a new array reference every render would cause an
  // infinite loop in the effect below (setState → re-render → new [] → effect).
  const { data: serverVars } = useQuery({
    queryKey: ["env-vars", selectedEnvId],
    queryFn: () => environmentsApi.getVariables(selectedEnvId!),
    enabled: !!selectedEnvId,
  });

  // Sync local variable state when server data changes
  useEffect(() => {
    if (serverVars === undefined) return;
    setLocalVars(
      serverVars.map((v) => ({ key: v.key, value: v.value, enabled: v.enabled }))
    );
    setDirty(false);
  }, [serverVars]);

  // ── Escape to close ───────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  // ── Focus new-env input when shown ───────────────────────
  useEffect(() => {
    if (isAddingEnv) newEnvRef.current?.focus();
  }, [isAddingEnv]);

  // ── Handlers ─────────────────────────────────────────────
  async function createEnvironment() {
    const name = newEnvName.trim();
    if (!name) { setIsAddingEnv(false); return; }
    try {
      const env = await environmentsApi.create({ name }, selectedWorkspaceId);
      queryClient.invalidateQueries({ queryKey: ["environments", selectedWorkspaceId] });
      setSelectedEnvId(env.id);
      toast.success(`Environment "${name}" created`);
    } catch {
      toast.error("Failed to create environment");
    }
    setNewEnvName("");
    setIsAddingEnv(false);
  }

  function confirmDeleteEnv(id: string, name: string) {
    setConfirmDelete({
      title: "Delete Environment",
      message: `Delete "${name}" and all its variables? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await environmentsApi.delete(id);
          queryClient.invalidateQueries({ queryKey: ["environments", selectedWorkspaceId] });
          if (selectedEnvId === id) setSelectedEnvId(null);
          if (selectedEnvironmentId === id) setSelectedEnvironment(null);
          toast.success("Environment deleted");
        } catch {
          toast.error("Failed to delete environment");
        }
        setConfirmDelete(null);
      },
    });
  }

  async function saveVariables() {
    if (!selectedEnvId || saving) return;
    setSaving(true);
    try {
      await environmentsApi.setVariables(
        selectedEnvId,
        localVars.filter((v) => v.key.trim()).map((v) => ({
          key: v.key,
          value: v.value,
          enabled: v.enabled,
        }))
      );
      queryClient.invalidateQueries({ queryKey: ["env-vars", selectedEnvId] });
      setDirty(false);
      toast.success("Environment saved");
    } catch {
      toast.error("Failed to save environment");
    }
    setSaving(false);
  }

  function handleVarChange(rows: KeyValuePair[]) {
    setLocalVars(rows);
    setDirty(true);
  }

  const selectedEnv = environments.find((e) => e.id === selectedEnvId);

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-pm-sidebar border border-pm-border rounded-lg shadow-2xl
                        flex flex-col w-[760px] h-[520px] overflow-hidden">
          {/* ── Modal header ─────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-pm-border flex-shrink-0">
            <h2 className="text-sm font-semibold text-pm-text">Manage Environments</h2>
            <button
              onClick={onClose}
              className="text-pm-muted hover:text-pm-text transition-colors"
              aria-label="Close"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>

          {/* ── Body: left list + right editor ───────────── */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left: environment list */}
            <div className="w-52 border-r border-pm-border flex flex-col flex-shrink-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                {environments.length === 0 && !isAddingEnv && (
                  <p className="px-3 py-3 text-xs text-pm-muted italic">
                    No environments yet
                  </p>
                )}
                {environments.map((env) => (
                  <div
                    key={env.id}
                    onClick={() => setSelectedEnvId(env.id)}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2 cursor-pointer transition-colors",
                      selectedEnvId === env.id
                        ? "bg-pm-active text-pm-text"
                        : "text-pm-muted hover:bg-pm-hover hover:text-pm-text"
                    )}
                  >
                    <span className="truncate text-xs">{env.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDeleteEnv(env.id, env.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 shrink-0 ml-1
                                 text-pm-muted hover:text-method-delete transition-all"
                      aria-label="Delete environment"
                    >
                      <X size={11} strokeWidth={2} />
                    </button>
                  </div>
                ))}

                {/* Inline new-env input */}
                {isAddingEnv && (
                  <div className="px-3 py-1.5">
                    <input
                      ref={newEnvRef}
                      value={newEnvName}
                      onChange={(e) => setNewEnvName(e.target.value)}
                      onBlur={createEnvironment}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") createEnvironment();
                        if (e.key === "Escape") { setIsAddingEnv(false); setNewEnvName(""); }
                      }}
                      placeholder="Environment name…"
                      className="w-full px-2 py-1 rounded bg-pm-input border border-pm-orange
                                 text-xs text-pm-text placeholder:text-pm-muted focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Add environment button */}
              <div className="border-t border-pm-border p-2 flex-shrink-0">
                <button
                  onClick={() => setIsAddingEnv(true)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-xs
                             text-pm-muted hover:text-pm-text hover:bg-pm-hover transition-colors"
                >
                  <Plus size={11} strokeWidth={2} />
                  Add Environment
                </button>
              </div>
            </div>

            {/* Right: variable editor */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {!selectedEnvId ? (
                <div className="flex items-center justify-center h-full text-pm-muted text-xs">
                  Select an environment to edit its variables
                </div>
              ) : (
                <>
                  {/* Editor header */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-pm-border flex-shrink-0">
                    <span className="text-xs font-medium text-pm-text">
                      {selectedEnv?.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {dirty && (
                        <span className="text-[10px] text-pm-muted italic">Unsaved changes</span>
                      )}
                      <button
                        onClick={saveVariables}
                        disabled={saving || !dirty}
                        className="px-3 h-7 rounded text-xs font-medium bg-pm-orange text-white
                                   hover:bg-pm-orange-dim disabled:opacity-40 disabled:cursor-not-allowed
                                   transition-colors"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>

                  {/* Variable table */}
                  <div className="flex-1 overflow-auto">
                    <KeyValueTable
                      rows={localVars}
                      onChange={handleVarChange}
                      keyPlaceholder="Variable"
                      valuePlaceholder="Value"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDeleteModal
          title={confirmDelete.title}
          message={confirmDelete.message}
          onConfirm={confirmDelete.onConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
