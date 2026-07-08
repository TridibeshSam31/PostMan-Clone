"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronRight, Folder as FolderIcon, MoreHorizontal, Plus, LayoutGrid,
} from "lucide-react";
import { collectionsApi, requestsApi, foldersApi } from "@/lib/api";
import { useTabStore } from "@/store/tabStore";
import { useAppStore } from "@/store/appStore";
import { cn, METHOD_COLORS } from "@/lib/utils";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import type { Collection, SavedRequest, HttpMethod, Folder } from "@/types";

// ── Context menu ─────────────────────────────────────────────
interface MenuProps {
  items: { label: string; danger?: boolean; onClick: () => void }[];
  onClose: () => void;
}

function ContextMenu({ items, onClose }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-0.5 min-w-[150px]
                 bg-pm-sidebar border border-pm-border rounded shadow-xl overflow-hidden"
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => { item.onClick(); onClose(); }}
          className={cn(
            "flex w-full items-center px-3 py-2 text-xs transition-colors hover:bg-pm-hover",
            item.danger ? "text-method-delete" : "text-pm-text"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ── Collection row ───────────────────────────────────────────
interface CollectionRowProps {
  collection: Collection;
  isExpanded: boolean;
  onToggle: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onAddRequest: () => void;
  onAddFolder: () => void;
}

function CollectionRow({
  collection, isExpanded, onToggle, onRename, onDelete, onAddRequest, onAddFolder,
}: CollectionRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(collection.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commitRename() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== collection.name) onRename(trimmed);
    setEditing(false);
  }

  return (
    <div className="relative group/col">
      <div
        onClick={onToggle}
        className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer
                   hover:bg-pm-hover transition-colors select-none"
      >
        <ChevronRight
          size={11}
          strokeWidth={2}
          className={cn("shrink-0 text-pm-muted transition-transform", isExpanded && "rotate-90")}
        />
        <FolderIcon size={13} strokeWidth={1.3} className="shrink-0 text-pm-muted" />

        {editing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") { setEditName(collection.name); setEditing(false); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 px-1 py-0.5 bg-pm-input border border-pm-orange
                       rounded text-xs text-pm-text focus:outline-none"
          />
        ) : (
          <span className="flex-1 min-w-0 truncate text-xs text-pm-text font-medium">
            {collection.name}
          </span>
        )}

        <div className="relative shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            className="opacity-0 group-hover/col:opacity-100 w-5 h-5 flex items-center
                       justify-center rounded text-pm-muted hover:text-pm-text hover:bg-pm-active
                       transition-all"
            aria-label="Collection options"
          >
            <MoreHorizontal size={13} strokeWidth={1.8} />
          </button>
          {menuOpen && (
            <ContextMenu
              onClose={() => setMenuOpen(false)}
              items={[
                { label: "Add Request", onClick: onAddRequest },
                { label: "Add Folder", onClick: onAddFolder },
                { label: "Rename", onClick: () => setEditing(true) },
                { label: "Delete", danger: true, onClick: onDelete },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Folder row ───────────────────────────────────────────────
interface FolderRowProps {
  folder: Folder;
  isExpanded: boolean;
  onToggle: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onAddRequest: () => void;
}

function FolderRow({
  folder, isExpanded, onToggle, onRename, onDelete, onAddRequest,
}: FolderRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commitRename() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== folder.name) onRename(trimmed);
    setEditing(false);
  }

  return (
    <div className="relative group/fold pl-3">
      <div
        onClick={onToggle}
        className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer
                   hover:bg-pm-hover transition-colors select-none"
      >
        <ChevronRight
          size={11}
          strokeWidth={2}
          className={cn("shrink-0 text-pm-muted transition-transform", isExpanded && "rotate-90")}
        />
        <FolderIcon size={13} strokeWidth={1.3} className="shrink-0 text-pm-muted text-pm-orange" />

        {editing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") { setEditName(folder.name); setEditing(false); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 px-1 py-0.5 bg-pm-input border border-pm-orange
                       rounded text-xs text-pm-text focus:outline-none"
          />
        ) : (
          <span className="flex-1 min-w-0 truncate text-xs text-pm-text">
            {folder.name}
          </span>
        )}

        <div className="relative shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            className="opacity-0 group-hover/fold:opacity-100 w-5 h-5 flex items-center
                       justify-center rounded text-pm-muted hover:text-pm-text hover:bg-pm-active
                       transition-all"
            aria-label="Folder options"
          >
            <MoreHorizontal size={13} strokeWidth={1.8} />
          </button>
          {menuOpen && (
            <ContextMenu
              onClose={() => setMenuOpen(false)}
              items={[
                { label: "Add Request", onClick: onAddRequest },
                { label: "Rename", onClick: () => setEditing(true) },
                { label: "Delete", danger: true, onClick: onDelete },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Request row ──────────────────────────────────────────────
interface RequestRowProps {
  request: SavedRequest;
  onOpen: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  isNested?: boolean;
}

function RequestRow({ request, onOpen, onRename, onDelete, isNested = false }: RequestRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(request.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commitRename() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== request.name) onRename(trimmed);
    setEditing(false);
  }

  return (
    <div className="relative group/req">
      <div
        onClick={onOpen}
        className={cn(
          "flex items-center gap-2 pr-2 py-1.5 cursor-pointer hover:bg-pm-hover transition-colors select-none",
          isNested ? "pl-10" : "pl-7"
        )}
      >
        <span className={cn("text-[10px] font-bold shrink-0 w-10",
          METHOD_COLORS[request.method as HttpMethod] ?? "text-pm-muted")}>
          {request.method}
        </span>

        {editing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") { setEditName(request.name); setEditing(false); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 px-1 py-0.5 bg-pm-input border border-pm-orange
                       rounded text-xs text-pm-text focus:outline-none"
          />
        ) : (
          <span className="flex-1 min-w-0 truncate text-xs text-pm-muted">
            {request.name}
          </span>
        )}

        <div className="relative shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            className="opacity-0 group-hover/req:opacity-100 w-5 h-5 flex items-center
                       justify-center rounded text-pm-muted hover:text-pm-text hover:bg-pm-active
                       transition-all"
            aria-label="Request options"
          >
            <MoreHorizontal size={13} strokeWidth={1.8} />
          </button>
          {menuOpen && (
            <ContextMenu
              onClose={() => setMenuOpen(false)}
              items={[
                { label: "Rename", onClick: () => setEditing(true) },
                { label: "Delete", danger: true, onClick: onDelete },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main CollectionsSidebar ──────────────────────────────────
interface SidebarProps {
  searchQuery?: string;
}

export default function CollectionsSidebar({ searchQuery = "" }: SidebarProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  const [isCreating, setIsCreating] = useState(false);
  const [newColName, setNewColName] = useState("");
  const newColRef = useRef<HTMLInputElement>(null);

  const [creatingFolderForCol, setCreatingFolderForCol] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const newFolderRef = useRef<HTMLInputElement>(null);

  const [confirmDelete, setConfirmDelete] = useState<{
    title: string; message: string; onConfirm: () => void;
  } | null>(null);

  const queryClient = useQueryClient();
  const openTab = useTabStore((s) => s.openTab);
  const { selectedWorkspaceId } = useAppStore();

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["collections", selectedWorkspaceId],
    queryFn: () => collectionsApi.list(selectedWorkspaceId),
    enabled: !!selectedWorkspaceId,
  });

  useEffect(() => {
    if (isCreating) newColRef.current?.focus();
  }, [isCreating]);

  useEffect(() => {
    if (creatingFolderForCol) newFolderRef.current?.focus();
  }, [creatingFolderForCol]);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleFolderExpanded(id: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function createCollection() {
    const name = newColName.trim();
    if (!name) { setIsCreating(false); return; }
    try {
      await collectionsApi.create({ name }, selectedWorkspaceId);
      queryClient.invalidateQueries({ queryKey: ["collections", selectedWorkspaceId] });
      toast.success(`Collection "${name}" created`);
    } catch {
      toast.error("Failed to create collection");
    }
    setNewColName("");
    setIsCreating(false);
  }

  const renameCollection = useCallback(async (id: string, name: string) => {
    try {
      await collectionsApi.rename(id, { name });
      queryClient.invalidateQueries({ queryKey: ["collections", selectedWorkspaceId] });
      toast.success("Collection renamed");
    } catch {
      toast.error("Failed to rename collection");
    }
  }, [queryClient, selectedWorkspaceId]);

  const deleteCollection = useCallback(async (id: string, name: string) => {
    setConfirmDelete({
      title: "Delete Collection",
      message: `Delete "${name}" and all its requests? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await collectionsApi.delete(id);
          queryClient.invalidateQueries({ queryKey: ["collections", selectedWorkspaceId] });
          toast.success("Collection deleted");
        } catch {
          toast.error("Failed to delete collection");
        }
        setConfirmDelete(null);
      },
    });
  }, [queryClient, selectedWorkspaceId]);

  async function createFolder(collectionId: string) {
    const name = newFolderName.trim();
    if (!name) { setCreatingFolderForCol(null); return; }
    try {
      await foldersApi.create(collectionId, name);
      queryClient.invalidateQueries({ queryKey: ["collections", selectedWorkspaceId] });
      setExpanded((prev) => new Set(prev).add(collectionId)); // auto-expand collection
      toast.success(`Folder "${name}" created`);
    } catch {
      toast.error("Failed to create folder");
    }
    setNewFolderName("");
    setCreatingFolderForCol(null);
  }

  const renameFolder = useCallback(async (id: string, name: string) => {
    try {
      await foldersApi.rename(id, name);
      queryClient.invalidateQueries({ queryKey: ["collections", selectedWorkspaceId] });
      toast.success("Folder renamed");
    } catch {
      toast.error("Failed to rename folder");
    }
  }, [queryClient, selectedWorkspaceId]);

  const deleteFolder = useCallback(async (id: string, name: string) => {
    setConfirmDelete({
      title: "Delete Folder",
      message: `Delete folder "${name}" and all its nested requests? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await foldersApi.delete(id);
          queryClient.invalidateQueries({ queryKey: ["collections", selectedWorkspaceId] });
          toast.success("Folder deleted");
        } catch {
          toast.error("Failed to delete folder");
        }
        setConfirmDelete(null);
      },
    });
  }, [queryClient, selectedWorkspaceId]);

  const renameRequest = useCallback(async (id: string, name: string) => {
    try {
      await requestsApi.update(id, { name });
      queryClient.invalidateQueries({ queryKey: ["collections", selectedWorkspaceId] });
      toast.success("Request renamed");
    } catch {
      toast.error("Failed to rename request");
    }
  }, [queryClient, selectedWorkspaceId]);

  const deleteRequest = useCallback(async (id: string, name: string) => {
    setConfirmDelete({
      title: "Delete Request",
      message: `Delete "${name}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await requestsApi.delete(id);
          queryClient.invalidateQueries({ queryKey: ["collections", selectedWorkspaceId] });
          toast.success("Request deleted");
        } catch {
          toast.error("Failed to delete request");
        }
        setConfirmDelete(null);
      },
    });
  }, [queryClient, selectedWorkspaceId]);

  function openSavedRequest(req: SavedRequest) {
    openTab({
      savedRequestId: req.id,
      name: req.name,
      method: req.method as HttpMethod,
      url: req.url,
      headers: req.headers,
      params: req.params,
      bodyType: req.body_type as "none" | "raw" | "form-data" | "urlencoded",
      bodyContent: req.body_content ?? "",
      authType: req.auth_type as "none" | "bearer" | "basic",
      authConfig: req.auth_config as Record<string, string>,
      isDirty: false,
    });
  }

  // ── Filter collections + requests by search query ──────────
  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? collections
        .map((col) => {
          const colMatch = col.name.toLowerCase().includes(q);
          const matchingFolders = col.folders
            ? col.folders
                .map((folder) => {
                  const folderMatch = folder.name.toLowerCase().includes(q);
                  const matchingFolderRequests = folder.requests
                    ? folder.requests.filter((r) =>
                        r.name.toLowerCase().includes(q) ||
                        r.method.toLowerCase().includes(q) ||
                        r.url.toLowerCase().includes(q)
                      )
                    : [];
                  if (!folderMatch && matchingFolderRequests.length === 0) return null;
                  return { ...folder, requests: folderMatch ? (folder.requests ?? []) : matchingFolderRequests };
                })
                .filter(Boolean) as Folder[]
            : [];

          const matchingRootRequests = col.requests
            ? col.requests.filter((r) =>
                !r.folder_id && (
                  r.name.toLowerCase().includes(q) ||
                  r.method.toLowerCase().includes(q) ||
                  r.url.toLowerCase().includes(q)
                )
              )
            : [];

          if (!colMatch && matchingFolders.length === 0 && matchingRootRequests.length === 0) return null;
          return {
            ...col,
            folders: colMatch ? (col.folders ?? []) : matchingFolders,
            requests: colMatch ? (col.requests ?? []) : matchingRootRequests
          };
        })
        .filter(Boolean) as Collection[]
    : collections;

  // Auto-expand collections and folders that have matches when searching
  const expandedSet = q
    ? new Set([
        ...Array.from(expanded),
        ...filtered
          .filter((col) => (col.requests && col.requests.length > 0) || (col.folders && col.folders.length > 0))
          .map((col) => col.id),
      ])
    : expanded;

  const expandedFolderSet = q
    ? new Set([
        ...Array.from(expandedFolders),
        ...filtered
          .flatMap((col) => col.folders ?? [])
          .filter((f) => f.requests && f.requests.length > 0)
          .map((f) => f.id),
      ])
    : expandedFolders;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-7 rounded bg-pm-hover animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 shrink-0">
        <span className="text-[11px] text-pm-muted font-medium uppercase tracking-wide">
          Collections
        </span>
        <button
          onClick={() => setIsCreating(true)}
          title="New Collection"
          className="w-6 h-6 flex items-center justify-center rounded text-pm-muted
                     hover:text-pm-text hover:bg-pm-hover transition-colors"
          aria-label="New Collection"
        >
          <Plus size={13} strokeWidth={2} />
        </button>
      </div>

      {/* Inline new-collection input */}
      {isCreating && (
        <div className="px-3 pb-1.5 shrink-0">
          <input
            ref={newColRef}
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            onBlur={createCollection}
            onKeyDown={(e) => {
              if (e.key === "Enter") createCollection();
              if (e.key === "Escape") { setIsCreating(false); setNewColName(""); }
            }}
            placeholder="Collection name…"
            className="w-full px-2 py-1 rounded bg-pm-input border border-pm-orange
                       text-xs text-pm-text placeholder:text-pm-muted focus:outline-none"
          />
        </div>
      )}

      {/* Empty state — no collections at all */}
      {collections.length === 0 && !isCreating && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 px-6 text-center">
          <LayoutGrid size={36} strokeWidth={1.2} className="text-pm-border" />
          <p className="text-pm-muted text-xs leading-relaxed">
            Create your first collection<br />to organise your requests
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 h-7 rounded text-xs font-medium border border-pm-border
                       text-pm-text hover:bg-pm-hover transition-colors"
          >
            + New Collection
          </button>
        </div>
      )}

      {/* No search results */}
      {collections.length > 0 && filtered.length === 0 && q && (
        <div className="flex items-center justify-center flex-1">
          <p className="text-pm-muted text-xs">No results for &ldquo;{searchQuery}&rdquo;</p>
        </div>
      )}

      {/* Collection tree */}
      <div className="overflow-y-auto flex-1">
        {filtered.map((col) => (
          <div key={col.id}>
            <CollectionRow
              collection={col}
              isExpanded={expandedSet.has(col.id)}
              onToggle={() => toggleExpanded(col.id)}
              onRename={(name) => renameCollection(col.id, name)}
              onDelete={() => deleteCollection(col.id, col.name)}
              onAddRequest={() => {
                openTab({ collectionId: col.id });
                toast.info(`Save the request to save it inside "${col.name}"`);
              }}
              onAddFolder={() => setCreatingFolderForCol(col.id)}
            />
            
            {expandedSet.has(col.id) && (
              <>
                {/* Nested Folders */}
                {col.folders?.map((folder) => (
                  <div key={folder.id}>
                    <FolderRow
                      folder={folder}
                      isExpanded={expandedFolderSet.has(folder.id)}
                      onToggle={() => toggleFolderExpanded(folder.id)}
                      onRename={(name) => renameFolder(folder.id, name)}
                      onDelete={() => deleteFolder(folder.id, folder.name)}
                      onAddRequest={() => {
                        openTab({ collectionId: col.id, folderId: folder.id });
                        toast.info(`Save the request to save it inside "${folder.name}"`);
                      }}
                    />
                    
                    {/* Nested Folder Requests */}
                    {expandedFolderSet.has(folder.id) && 
                      (folder.requests ?? []).map((req) => (
                        <RequestRow
                          key={req.id}
                          request={req}
                          isNested={true}
                          onOpen={() => openSavedRequest(req)}
                          onRename={(name) => renameRequest(req.id, name)}
                          onDelete={() => deleteRequest(req.id, req.name)}
                        />
                      ))}
                  </div>
                ))}

                {/* Inline Folder Creation Input */}
                {creatingFolderForCol === col.id && (
                  <div className="pl-6 pr-3 py-1 shrink-0">
                    <input
                      ref={newFolderRef}
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onBlur={() => createFolder(col.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") createFolder(col.id);
                        if (e.key === "Escape") { setCreatingFolderForCol(null); setNewFolderName(""); }
                      }}
                      placeholder="Folder name…"
                      className="w-full px-2 py-0.5 rounded bg-pm-input border border-pm-orange
                                 text-xs text-pm-text placeholder:text-pm-muted focus:outline-none"
                    />
                  </div>
                )}

                {/* Root Requests of Collection */}
                {(col.requests ?? [])
                  .filter((req) => !req.folder_id)
                  .map((req) => (
                    <RequestRow
                      key={req.id}
                      request={req}
                      isNested={false}
                      onOpen={() => openSavedRequest(req)}
                      onRename={(name) => renameRequest(req.id, name)}
                      onDelete={() => deleteRequest(req.id, req.name)}
                    />
                  ))}
              </>
            )}
          </div>
        ))}
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
