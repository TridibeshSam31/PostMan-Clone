"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { collectionsApi, requestsApi } from "@/lib/api";
import { useTabStore } from "@/store/tabStore";
import { useAppStore } from "@/store/appStore";
import type { RequestTab, SavedRequestCreate } from "@/types";

interface Props {
  tab: RequestTab;
  onClose: () => void;
}

function tabToPayload(tab: RequestTab, name: string, folderId?: string | null): SavedRequestCreate {
  return {
    name,
    method: tab.method,
    url: tab.url,
    headers: tab.headers,
    params: tab.params,
    body_type: tab.bodyType,
    body_content: tab.bodyContent || null,
    auth_type: tab.authType,
    auth_config: tab.authConfig as Record<string, string>,
    folder_id: folderId ?? null,
  };
}

export default function SaveRequestModal({ tab, onClose }: Props) {
  const [name, setName] = useState(tab.name === "New Request" ? "" : tab.name);
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [saving, setSaving] = useState(false);

  const markTabSaved = useTabStore((s) => s.markTabSaved);
  const queryClient = useQueryClient();
  const { selectedWorkspaceId } = useAppStore();

  const { data: collections = [] } = useQuery({
    queryKey: ["collections", selectedWorkspaceId],
    queryFn: () => collectionsApi.list(selectedWorkspaceId),
    enabled: !!selectedWorkspaceId,
  });

  // Pre-select first collection if available
  useEffect(() => {
    if (collections.length > 0 && !selectedCollectionId) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [collections, selectedCollectionId]);

  // Reset selected folder when collection changes
  useEffect(() => {
    setSelectedFolderId("");
  }, [selectedCollectionId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const isUpdate = !!tab.savedRequestId;
  const isValid = name.trim() && (isUpdate || selectedCollectionId);
  const selectedCollection = collections.find((c) => c.id === selectedCollectionId);
  const folders = selectedCollection?.folders ?? [];

  async function handleSave() {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      const payload = tabToPayload(tab, name.trim(), selectedFolderId || null);

      if (isUpdate && tab.savedRequestId) {
        await requestsApi.update(tab.savedRequestId, payload);
        markTabSaved(tab.id, tab.savedRequestId, name.trim());
        toast.success("Request updated");
      } else {
        const saved = await requestsApi.create(selectedCollectionId, payload);
        markTabSaved(tab.id, saved.id, name.trim());
        toast.success("Request saved");
      }

      queryClient.invalidateQueries({ queryKey: ["collections", selectedWorkspaceId] });
      onClose();
    } catch {
      toast.error("Failed to save request");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-pm-sidebar border border-pm-border rounded-lg shadow-2xl w-[420px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-pm-border">
          <h2 className="text-sm font-semibold text-pm-text">
            {isUpdate ? "Update Request" : "Save Request"}
          </h2>
          <button
            onClick={onClose}
            className="text-pm-muted hover:text-pm-text transition-colors"
            aria-label="Close"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Request name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-pm-muted font-medium">Request Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="e.g. Get All Users"
              className="h-9 px-3 rounded bg-pm-input border border-pm-border text-pm-text text-xs
                         placeholder:text-pm-muted focus:outline-none focus:border-pm-orange transition-colors"
            />
          </div>

          {/* Collection selector — only shown when creating */}
          {!isUpdate && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-pm-muted font-medium">Save to Collection</label>
              {collections.length === 0 ? (
                <p className="text-xs text-pm-muted italic">
                  No collections yet — create one first
                </p>
              ) : (
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="h-9 px-3 rounded bg-pm-input border border-pm-border text-pm-text text-xs
                             focus:outline-none focus:border-pm-orange transition-colors cursor-pointer"
                >
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Folder selector (Optional) — only shown when creating and collection has folders */}
          {!isUpdate && folders.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-pm-muted font-medium">Folder (Optional)</label>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="h-9 px-3 rounded bg-pm-input border border-pm-border text-pm-text text-xs
                           focus:outline-none focus:border-pm-orange transition-colors cursor-pointer"
              >
                <option value="">Root Level</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-pm-border">
          <button
            onClick={onClose}
            className="px-4 h-8 rounded text-xs text-pm-text border border-pm-border
                       hover:bg-pm-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="px-4 h-8 rounded text-xs text-white font-medium bg-pm-orange
                       hover:bg-pm-orange-dim disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving…" : isUpdate ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
