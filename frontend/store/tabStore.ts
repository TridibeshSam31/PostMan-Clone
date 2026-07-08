"use client";

import { create } from "zustand";
import type { RequestTab, HttpMethod, BodyType, RawLanguage, AuthType, AuthConfig } from "@/types";

function createBlankTab(overrides?: Partial<RequestTab>): RequestTab {
  return {
    id: crypto.randomUUID(),
    savedRequestId: null,
    name: "New Request",
    method: "GET" as HttpMethod,
    url: "",
    params: [],
    headers: [],
    bodyType: "none" as BodyType,
    bodyContent: "",
    rawLanguage: "text" as RawLanguage,
    authType: "none" as AuthType,
    authConfig: {} as AuthConfig,
    isDirty: false,
    isLoading: false,
    response: null,
    ...overrides,
  };
}

interface TabStore {
  tabs: RequestTab[];
  activeTabId: string | null;

  openTab: (overrides?: Partial<RequestTab>) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<RequestTab>) => void;
  markTabDirty: (id: string) => void;
  markTabSaved: (id: string, savedRequestId: string, name: string) => void;
  getActiveTab: () => RequestTab | undefined;
}

export const useTabStore = create<TabStore>()((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab: (overrides) => {
    const tab = createBlankTab(overrides);
    set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
  },

  closeTab: (id) => {
    set((s) => {
      const remaining = s.tabs.filter((t) => t.id !== id);
      let nextActive = s.activeTabId;
      if (s.activeTabId === id) {
        const idx = s.tabs.findIndex((t) => t.id === id);
        nextActive =
          remaining[Math.min(idx, remaining.length - 1)]?.id ?? null;
      }
      return { tabs: remaining, activeTabId: nextActive };
    });
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTab: (id, updates) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  markTabDirty: (id) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, isDirty: true } : t)),
    }));
  },

  markTabSaved: (id, savedRequestId, name) => {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id ? { ...t, isDirty: false, savedRequestId, name } : t
      ),
    }));
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find((t) => t.id === activeTabId);
  },
}));
