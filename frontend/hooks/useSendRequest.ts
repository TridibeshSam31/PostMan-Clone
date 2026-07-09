"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTabStore } from "@/store/tabStore";
import { useAppStore } from "@/store/appStore";
import { sendRequest } from "@/lib/api";

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("https:/") && !trimmed.startsWith("https://")) {
    return `https://${trimmed.slice("https:/".length).replace(/^\/+/, "")}`;
  }
  if (trimmed.startsWith("http:/") && !trimmed.startsWith("http://")) {
    return `http://${trimmed.slice("http:/".length).replace(/^\/+/, "")}`;
  }
  return trimmed;
}

export function useSendRequest() {
  const activeTabId = useTabStore((s) => s.activeTabId);
  const tab = useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const updateTab = useTabStore((s) => s.updateTab);
  const { selectedEnvironmentId, selectedWorkspaceId } = useAppStore();
  const queryClient = useQueryClient();

  const send = useCallback(async () => {
    if (!tab || !activeTabId) return;
    if (tab.isLoading) return;

    const normalizedUrl = normalizeUrl(tab.url);

    // 1. Set loading state
    updateTab(activeTabId, { url: normalizedUrl, isLoading: true, response: null });

    try {
      // 2. Call the runner proxy with unresolved fields
      const result = await sendRequest({
        method: tab.method,
        url: normalizedUrl,
        headers: tab.headers,
        params: tab.params,
        body_type: tab.bodyType,
        body_content:
          tab.bodyType === "none" ? null : tab.bodyContent || null,
        auth_type: tab.authType,
        auth_config: tab.authConfig as Record<string, string>,
        environment_id: selectedEnvironmentId,
        workspace_id: selectedWorkspaceId,
      });

      // 3. Store result in tab
      updateTab(activeTabId, { response: result, isLoading: false });

      // 4. Invalidate history so sidebar updates
      queryClient.invalidateQueries({ queryKey: ["history"] });

      if (result.error) {
        toast.error(`Request failed: ${result.error}`);
      }
    } catch (err) {
      updateTab(activeTabId, {
        isLoading: false,
        response: {
          status_code: null,
          response_time_ms: 0,
          response_size_bytes: 0,
          headers: {},
          body: null,
          error: err instanceof Error ? err.message : "Unknown error",
        },
      });
      toast.dismiss();
      toast.error("Failed to send request");
    }
  }, [tab, activeTabId, updateTab, selectedEnvironmentId, selectedWorkspaceId, queryClient]);

  return { send, isLoading: tab?.isLoading ?? false };
}
