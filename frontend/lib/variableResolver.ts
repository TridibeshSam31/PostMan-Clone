import type { EnvironmentVariable, KeyValuePair } from "@/types";

/**
 * Replace all {{key}} occurrences in `text` with matching variable values.
 * Unresolved variables are left as-is.
 */
export function resolveVariables(
  text: string,
  variables: EnvironmentVariable[]
): string {
  if (!text || variables.length === 0) return text;

  const enabledVars = variables.filter((v) => v.enabled);

  return text.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
    const found = enabledVars.find((v) => v.key === key.trim());
    return found ? found.value : match;
  });
}

/**
 * Apply variable resolution to all fields of a request before sending.
 * Returns new arrays/strings — does not mutate the originals.
 */
export function resolveRequest(
  url: string,
  headers: KeyValuePair[],
  params: KeyValuePair[],
  bodyContent: string,
  variables: EnvironmentVariable[]
) {
  const resolve = (s: string) => resolveVariables(s, variables);

  return {
    url: resolve(url),
    headers: headers.map((h) => ({ ...h, value: resolve(h.value) })),
    params: params.map((p) => ({ ...p, value: resolve(p.value) })),
    bodyContent: resolve(bodyContent),
  };
}
