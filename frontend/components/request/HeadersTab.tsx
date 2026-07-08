"use client";

import { useTabStore } from "@/store/tabStore";
import KeyValueTable from "@/components/shared/KeyValueTable";
import type { KeyValuePair } from "@/types";

export default function HeadersTab() {
  const activeTabId = useTabStore((s) => s.activeTabId);
  const tab = useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const updateTab = useTabStore((s) => s.updateTab);

  if (!tab || !activeTabId) return null;

  function handleChange(newHeaders: KeyValuePair[]) {
    if (!activeTabId) return;
    updateTab(activeTabId, { headers: newHeaders, isDirty: true });
  }

  return (
    <div className="overflow-auto">
      <KeyValueTable
        rows={tab.headers}
        onChange={handleChange}
        keyPlaceholder="Header"
        valuePlaceholder="Value"
      />
    </div>
  );
}
