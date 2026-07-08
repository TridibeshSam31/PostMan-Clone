import type { HttpMethod } from "@/types";

/** Lightweight classnames joiner — avoids an extra dependency. */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Tailwind text-colour class matching Postman's method badge colours. */
export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET:     "text-method-get",
  POST:    "text-method-post",
  PUT:     "text-method-put",
  PATCH:   "text-method-patch",
  DELETE:  "text-method-delete",
  HEAD:    "text-method-head",
  OPTIONS: "text-method-options",
};

/** Short-form background pill used in history / sidebar lists. */
export const METHOD_BG: Record<HttpMethod, string> = {
  GET:     "bg-method-get/10     text-method-get",
  POST:    "bg-method-post/10    text-method-post",
  PUT:     "bg-method-put/10     text-method-put",
  PATCH:   "bg-method-patch/10   text-method-patch",
  DELETE:  "bg-method-delete/10  text-method-delete",
  HEAD:    "bg-method-head/10    text-method-head",
  OPTIONS: "bg-method-options/10 text-method-options",
};

/** Format bytes to a human-readable string like "5.19 KB". */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Status-code colour class: green 2xx, orange 4xx, red 5xx. */
export function statusColor(code: number | null): string {
  if (code === null) return "text-pm-muted";
  if (code < 300) return "text-method-get";
  if (code < 400) return "text-method-put";
  if (code < 500) return "text-method-post";
  return "text-method-delete";
}
