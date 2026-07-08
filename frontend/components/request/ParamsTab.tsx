"use client";

import { useTabStore } from "@/store/tabStore";
import KeyValueTable from "@/components/shared/KeyValueTable";
import type { KeyValuePair } from "@/types";

/** Rebuild the URL keeping the base and replacing query params from the table */
function applyParamsToUrl(url: string, params: KeyValuePair[]): string {
  const qi = url.indexOf("?");
  const base = qi >= 0 ? url.slice(0, qi) : url;
  const enabled = params.filter((p) => p.enabled && p.key);
  if (enabled.length === 0) return base;
  const qs = enabled
    .map((p) => {
      const k = encodeURIComponent(p.key);
      const v = encodeURIComponent(p.value)
        .replace(/%7B%7B/g, "{{")
        .replace(/%7D%7D/g, "}}");
      return `${k}=${v}`;
    })
    .join("&");
  return `${base}?${qs}`;
}

export default function ParamsTab() {
  const activeTabId = useTabStore((s) => s.activeTabId);
  const tab = useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const updateTab = useTabStore((s) => s.updateTab);

  if (!tab || !activeTabId) return null;

  function handleChange(newParams: KeyValuePair[]) {
    if (!activeTabId || !tab) return;
    updateTab(activeTabId, {
      params: newParams,
      url: applyParamsToUrl(tab.url, newParams),
      isDirty: true,
    });
  }

  return (
    <div className="overflow-auto">
      <KeyValueTable
        rows={tab.params}
        onChange={handleChange}
        keyPlaceholder="Key"
        valuePlaceholder="Value"
      />
    </div>
  );
}
