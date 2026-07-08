"use client";

import { cn } from "@/lib/utils";

export type RequestSubTab =
  | "params"
  | "auth"
  | "headers"
  | "body"
  | "pre-request"
  | "tests";

interface Props {
  active: RequestSubTab;
  onChange: (tab: RequestSubTab) => void;
  paramCount: number;
  headerCount: number;
}

const TABS: { key: RequestSubTab; label: string }[] = [
  { key: "params",      label: "Params" },
  { key: "auth",        label: "Authorization" },
  { key: "headers",     label: "Headers" },
  { key: "body",        label: "Body" },
  { key: "pre-request", label: "Pre-request Script" },
  { key: "tests",       label: "Tests" },
];

export default function RequestTabs({
  active,
  onChange,
  paramCount,
  headerCount,
}: Props) {
  function badge(key: RequestSubTab) {
    if (key === "params" && paramCount > 0)
      return (
        <span className="ml-1 px-1 py-0.5 rounded text-[10px] bg-pm-active text-pm-muted">
          {paramCount}
        </span>
      );
    if (key === "headers" && headerCount > 0)
      return (
        <span className="ml-1 px-1 py-0.5 rounded text-[10px] bg-pm-active text-pm-muted">
          {headerCount}
        </span>
      );
    return null;
  }

  return (
    <div className="flex items-end gap-0 px-4 border-b border-pm-border bg-pm-bg flex-shrink-0 overflow-x-auto">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            "flex items-center whitespace-nowrap px-3 py-2 text-xs transition-colors border-b-2",
            active === key
              ? "text-pm-orange border-pm-orange font-medium"
              : "text-pm-muted border-transparent hover:text-pm-text"
          )}
        >
          {label}
          {badge(key)}
        </button>
      ))}
    </div>
  );
}
