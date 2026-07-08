"use client";

import { create } from "zustand";

interface AppStore {
  selectedWorkspaceId: string | null;
  selectedOrganizationId: string | null;
  selectedEnvironmentId: string | null;
  sidebarTab: "collections" | "history";

  setSelectedWorkspace: (id: string | null) => void;
  setSelectedOrganization: (id: string | null) => void;
  setSelectedEnvironment: (id: string | null) => void;
  setSidebarTab: (tab: "collections" | "history") => void;
}

export const useAppStore = create<AppStore>()((set) => ({
  selectedWorkspaceId: null,
  selectedOrganizationId: null,
  selectedEnvironmentId: null,
  sidebarTab: "collections",

  setSelectedWorkspace: (id) => set({ selectedWorkspaceId: id }),
  setSelectedOrganization: (id) => set({ selectedOrganizationId: id }),
  setSelectedEnvironment: (id) => set({ selectedEnvironmentId: id }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
}));
