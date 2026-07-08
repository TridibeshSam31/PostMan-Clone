"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Globe, ChevronDown, Check, Sun, Moon, Settings, LayoutGrid,
} from "lucide-react";
import { useTabStore } from "@/store/tabStore";
import { useAppStore } from "@/store/appStore";
import { useTheme } from "@/hooks/useTheme";
import { environmentsApi, organizationsApi, workspacesApi } from "@/lib/api";
import ManageEnvironmentsModal from "@/components/modals/ManageEnvironmentsModal";
import { cn } from "@/lib/utils";

export default function TopBar() {
  const [envDropdownOpen, setEnvDropdownOpen] = useState(false);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceType, setNewWorkspaceType] = useState("personal");

  const openTab = useTabStore((s) => s.openTab);
  const {
    selectedEnvironmentId, setSelectedEnvironment,
    selectedWorkspaceId, setSelectedWorkspace,
    selectedOrganizationId, setSelectedOrganization,
  } = useAppStore();
  const { isDark, toggle: toggleTheme } = useTheme();

  const queryClient = useQueryClient();

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: organizationsApi.list,
  });

  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces", selectedOrganizationId],
    queryFn: () => workspacesApi.list(selectedOrganizationId),
    enabled: !!selectedOrganizationId,
  });

  const { data: environments = [] } = useQuery({
    queryKey: ["environments", selectedWorkspaceId],
    queryFn: () => environmentsApi.list(selectedWorkspaceId),
    enabled: !!selectedWorkspaceId,
  });

  // Sync active organization on load
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrganizationId) {
      setSelectedOrganization(organizations[0].id);
    }
  }, [organizations, selectedOrganizationId, setSelectedOrganization]);

  // Sync active workspace on load
  useEffect(() => {
    if (workspaces.length > 0 && !selectedWorkspaceId) {
      const personal = workspaces.find((w) => w.type === "personal") || workspaces[0];
      setSelectedWorkspace(personal.id);
    }
  }, [workspaces, selectedWorkspaceId, setSelectedWorkspace]);

  // Sync DB active environment on load
  useEffect(() => {
    if (environments.length > 0 && selectedEnvironmentId === null) {
      const active = environments.find((e) => e.is_active);
      if (active) {
        setSelectedEnvironment(active.id);
      }
    }
  }, [environments, selectedEnvironmentId, setSelectedEnvironment]);

  const selectedEnv = environments.find((e) => e.id === selectedEnvironmentId);
  const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId);

  async function handleSelectEnvironment(envId: string | null) {
    setSelectedEnvironment(envId);
    setEnvDropdownOpen(false);
    if (envId) {
      try {
        await environmentsApi.activate(envId);
        queryClient.invalidateQueries({ queryKey: ["environments", selectedWorkspaceId] });
      } catch {
        toast.error("Failed to activate environment");
      }
    }
  }

  async function handleCreateWorkspace() {
    const name = newWorkspaceName.trim();
    if (!name) return;
    try {
      const ws = await workspacesApi.create({
        name,
        type: newWorkspaceType,
      }, selectedOrganizationId);
      queryClient.invalidateQueries({ queryKey: ["workspaces", selectedOrganizationId] });
      setSelectedWorkspace(ws.id);
      setIsCreatingWorkspace(false);
      setNewWorkspaceName("");
      setWorkspaceDropdownOpen(false);
      toast.success(`Workspace "${name}" created`);
    } catch {
      toast.error("Failed to create workspace");
    }
  }

  // Close environments dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setEnvDropdownOpen(false);
      }
    }
    if (envDropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [envDropdownOpen]);

  // Close workspace dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(e.target as Node)) {
        setWorkspaceDropdownOpen(false);
      }
    }
    if (workspaceDropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [workspaceDropdownOpen]);

  return (
    <>
      <header className="flex items-center h-11 px-3 gap-3 bg-pm-navbar border-b border-pm-border shrink-0 select-none">

        {/* ── Left: logo + brand ─────────────────────────── */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Brand logo — custom shape, no Lucide equivalent */}
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden>
            <rect width="32" height="32" rx="6" fill="#EF5C33" />
            <path d="M22 10.5L16 7l-6 3.5v7L16 21l6-3.5v-7z"
              stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="16" cy="14" r="2" fill="white" />
          </svg>
          <span className="text-pm-text font-semibold text-sm tracking-tight">
            Postman Clone
          </span>
        </div>

        <div className="w-px h-5 bg-pm-border" />

        {/* ── Workspace switcher ─────────────────────────── */}
        <div className="relative" ref={workspaceDropdownRef}>
          <button
            onClick={() => setWorkspaceDropdownOpen((o) => !o)}
            className="flex items-center gap-1 px-3 h-7 rounded text-xs text-pm-text hover:bg-pm-hover transition-colors"
          >
            <LayoutGrid size={12} className="text-pm-muted mr-1" />
            <span className="font-medium">
              {selectedWorkspace?.name ?? "Select Workspace"}
            </span>
            <ChevronDown size={11} className="text-pm-muted ml-0.5" />
          </button>

          {workspaceDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 w-64 bg-pm-sidebar border border-pm-border rounded shadow-xl overflow-hidden text-pm-text">
              {/* Workspace list */}
              <div className="p-2 border-b border-pm-border">
                <span className="text-[10px] text-pm-muted uppercase font-semibold px-2">Workspaces</span>
                <div className="mt-1 space-y-0.5">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setSelectedWorkspace(ws.id);
                        setWorkspaceDropdownOpen(false);
                      }}
                      className={cn(
                        "flex items-center w-full px-2 py-1.5 rounded text-xs text-left transition-colors hover:bg-pm-hover",
                        selectedWorkspaceId === ws.id ? "text-pm-orange bg-pm-hover font-medium" : ""
                      )}
                    >
                      <LayoutGrid size={11} className="mr-2 opacity-70" />
                      <span className="flex-1 truncate">{ws.name}</span>
                      <span className="text-[9px] text-pm-muted bg-pm-hover px-1 rounded capitalize">{ws.type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Create workspace inline */}
              <div className="p-2 bg-pm-input">
                {isCreatingWorkspace ? (
                  <div className="space-y-2 p-1">
                    <input
                      type="text"
                      placeholder="Workspace name"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      className="w-full h-7 px-2 border border-pm-border rounded text-xs bg-pm-sidebar text-pm-text focus:outline-none focus:border-pm-orange"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateWorkspace();
                        if (e.key === "Escape") setIsCreatingWorkspace(false);
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <select
                        value={newWorkspaceType}
                        onChange={(e) => setNewWorkspaceType(e.target.value)}
                        className="flex-1 h-7 px-1 border border-pm-border rounded text-xs bg-pm-sidebar text-pm-text"
                      >
                        <option value="personal">Personal</option>
                        <option value="team">Team</option>
                      </select>
                      <button
                        onClick={handleCreateWorkspace}
                        className="px-2 h-7 rounded text-xs bg-pm-orange text-white hover:bg-pm-orange-dim"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreatingWorkspace(true)}
                    className="flex items-center justify-center w-full py-1 rounded text-xs border border-dashed border-pm-border text-pm-muted hover:text-pm-text hover:border-pm-muted transition-colors"
                  >
                    + Create Workspace
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-pm-border" />

        {/* ── New request ────────────────────────────────── */}
        <button
          onClick={() => openTab()}
          className="flex items-center gap-1.5 px-3 h-7 rounded text-xs font-medium
                     bg-pm-orange text-white hover:bg-pm-orange-dim transition-colors"
        >
          <Plus size={12} strokeWidth={2.2} />
          New
        </button>

        <div className="flex-1" />

        {/* ── Coming-soon nav links ──────────────────────── */}
        {(["Reports", "Explore"] as const).map((label) => (
          <button
            key={label}
            onClick={() => toast.info(`${label} — Coming Soon`, {
              description: "This feature is not yet available in this build.",
              duration: 2500,
            })}
            className="hidden sm:block px-2 h-7 rounded text-xs text-pm-muted
                       hover:text-pm-text hover:bg-pm-hover transition-colors"
          >
            {label}
          </button>
        ))}

        {/* ── Theme toggle ───────────────────────────────── */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="flex items-center justify-center w-7 h-7 rounded text-pm-muted
                     hover:text-pm-text hover:bg-pm-hover transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
        </button>

        <div className="w-px h-5 bg-pm-border" />

        {/* ── Environment selector (custom dropdown) ─────── */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setEnvDropdownOpen((o) => !o)}
            className={cn(
              "flex items-center gap-2 px-3 h-7 rounded text-xs transition-colors min-w-[140px] max-w-[200px]",
              "bg-pm-input border hover:border-pm-muted",
              envDropdownOpen ? "border-pm-orange" : "border-pm-border"
            )}
          >
            <Globe size={12} strokeWidth={1.4} className="shrink-0 text-pm-muted" />
            <span className="flex-1 truncate text-left text-pm-text">
              {selectedEnv?.name ?? "No Environment"}
            </span>
            <ChevronDown
              size={11}
              strokeWidth={1.6}
              className={cn("shrink-0 text-pm-muted transition-transform", envDropdownOpen && "rotate-180")}
            />
          </button>

          {/* Dropdown panel */}
          {envDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 w-56
                            bg-pm-sidebar border border-pm-border rounded shadow-xl overflow-hidden">
              {/* No environment */}
              <button
                onClick={() => handleSelectEnvironment(null)}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-xs transition-colors hover:bg-pm-hover",
                  !selectedEnvironmentId ? "text-pm-orange font-medium" : "text-pm-muted"
                )}
              >
                <span className="flex-1 text-left">No Environment</span>
                {!selectedEnvironmentId && <Check size={11} strokeWidth={2} />}
              </button>

              {environments.length > 0 && <div className="border-t border-pm-border" />}

              {/* Environment options */}
              {environments.map((env) => (
                <button
                  key={env.id}
                  onClick={() => handleSelectEnvironment(env.id)}
                  className={cn(
                    "flex items-center w-full px-3 py-2 text-xs transition-colors hover:bg-pm-hover",
                    selectedEnvironmentId === env.id ? "text-pm-orange font-medium" : "text-pm-text"
                  )}
                >
                  <span className="flex-1 truncate text-left">{env.name}</span>
                  {selectedEnvironmentId === env.id && <Check size={11} strokeWidth={2} />}
                </button>
              ))}

              {/* Manage Environments link */}
              <div className="border-t border-pm-border">
                <button
                  onClick={() => { setEnvDropdownOpen(false); setShowEnvModal(true); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs
                             text-pm-orange hover:bg-pm-hover transition-colors"
                >
                  <Settings size={11} strokeWidth={1.5} />
                  Manage Environments
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── User avatar ────────────────────────────────── */}
        <div
          title="Default User"
          className="flex items-center justify-center w-7 h-7 rounded-full
                     bg-pm-orange text-white text-xs font-bold cursor-default"
        >
          D
        </div>
      </header>

      {showEnvModal && (
        <ManageEnvironmentsModal onClose={() => setShowEnvModal(false)} />
      )}
    </>
  );
}
