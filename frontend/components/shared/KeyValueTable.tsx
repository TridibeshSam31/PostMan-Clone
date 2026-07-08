"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import type { KeyValuePair } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  rows: KeyValuePair[];
  onChange: (rows: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  readOnly?: boolean;
}

export default function KeyValueTable({
  rows,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  readOnly = false,
}: Props) {
  const ghostRef = useRef<HTMLInputElement>(null);

  // display = actual rows + 1 blank ghost row
  const display: KeyValuePair[] = [
    ...rows,
    { key: "", value: "", enabled: true },
  ];

  function updateRow(
    index: number,
    field: keyof KeyValuePair,
    value: string | boolean
  ) {
    if (index < rows.length) {
      onChange(
        rows.map((r, i) => (i === index ? { ...r, [field]: value } : r))
      );
    } else {
      // ghost row — promote to real row only when user types something
      if (field !== "enabled" && !value) return;
      const newRow: KeyValuePair = {
        key: "",
        value: "",
        enabled: true,
        [field]: value,
      };
      onChange([...rows, newRow]);
    }
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  /** Tab on the last value cell of the ghost row → add a real row and focus its key input */
  function handleGhostValueKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      onChange([...rows, { key: "", value: "", enabled: true }]);
      // focus will land on the next ghost key input after re-render
      requestAnimationFrame(() => ghostRef.current?.focus());
    }
  }

  return (
    <table className="w-full border-collapse table-fixed text-xs">
      <colgroup>
        <col className="w-8" />
        <col className="w-1/2" />
        <col className="w-1/2" />
        <col className="w-8" />
      </colgroup>

      {/* ── Header ───────────────────────────────────────── */}
      <thead>
        <tr className="border-b border-pm-border text-pm-muted">
          <th className="py-1.5 text-center font-medium" />
          <th className="py-1.5 pl-3 text-left font-medium">{keyPlaceholder}</th>
          <th className="py-1.5 pl-3 text-left font-medium border-l border-pm-border">
            {valuePlaceholder}
          </th>
          <th className="py-1.5 text-center font-medium" />
        </tr>
      </thead>

      {/* ── Rows ─────────────────────────────────────────── */}
      <tbody>
        {display.map((row, i) => {
          const isGhost = i >= rows.length;
          return (
            <tr
              key={i}
              className={cn(
                "group border-b border-pm-border transition-colors",
                isGhost ? "opacity-40" : "hover:bg-pm-hover/30"
              )}
            >
              {/* enabled checkbox */}
              <td className="text-center py-1 px-1">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  disabled={readOnly || isGhost}
                  onChange={(e) => updateRow(i, "enabled", e.target.checked)}
                  className="w-3.5 h-3.5 accent-pm-orange cursor-pointer disabled:cursor-default"
                />
              </td>

              {/* key */}
              <td className="py-0.5">
                <input
                  ref={isGhost ? ghostRef : undefined}
                  type="text"
                  value={row.key}
                  placeholder={keyPlaceholder}
                  readOnly={readOnly}
                  onChange={(e) => updateRow(i, "key", e.target.value)}
                  className="w-full px-3 py-1.5 bg-transparent text-pm-text
                             placeholder:text-pm-muted/50 focus:outline-none
                             focus:bg-pm-hover/40 rounded-sm font-mono"
                />
              </td>

              {/* value */}
              <td className="py-0.5 border-l border-pm-border">
                <input
                  type="text"
                  value={row.value}
                  placeholder={valuePlaceholder}
                  readOnly={readOnly}
                  onChange={(e) => updateRow(i, "value", e.target.value)}
                  onKeyDown={isGhost ? handleGhostValueKeyDown : undefined}
                  className="w-full px-3 py-1.5 bg-transparent text-pm-text
                             placeholder:text-pm-muted/50 focus:outline-none
                             focus:bg-pm-hover/40 rounded-sm font-mono"
                />
              </td>

              {/* delete */}
              <td className="text-center py-1 px-1">
                {!isGhost && !readOnly && (
                  <button
                    onClick={() => removeRow(i)}
                    aria-label="Delete row"
                    className="opacity-0 group-hover:opacity-100 text-pm-muted
                               hover:text-method-delete transition-all"
                  >
                    <X size={10} strokeWidth={2} />
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
