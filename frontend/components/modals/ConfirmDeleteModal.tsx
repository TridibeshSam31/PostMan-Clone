"use client";

import { useEffect } from "react";

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-pm-sidebar border border-pm-border rounded-lg shadow-2xl w-96 p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-pm-text">{title}</h2>
        <p className="text-xs text-pm-muted leading-relaxed">{message}</p>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="px-4 h-8 rounded text-xs text-pm-text border border-pm-border
                       hover:bg-pm-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 h-8 rounded text-xs text-white font-medium
                       bg-method-delete hover:opacity-90 transition-opacity"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
