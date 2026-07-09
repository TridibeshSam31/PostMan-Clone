export function normalizeRequestUrl(url: string): string {
  const trimmed = url.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const singleSlashMatch = trimmed.match(/^(https?):\/+(.+)$/i);
  if (singleSlashMatch) {
    return `${singleSlashMatch[1].toLowerCase()}://${singleSlashMatch[2].replace(/^\/+/, "")}`;
  }

  const missingSlashMatch = trimmed.match(/^(https?):(.+)$/i);
  if (missingSlashMatch) {
    return `${missingSlashMatch[1].toLowerCase()}://${missingSlashMatch[2].replace(/^\/+/, "")}`;
  }

  const missingColonMatch = trimmed.match(/^(https?)\/\/(.+)$/i);
  if (missingColonMatch) {
    return `${missingColonMatch[1].toLowerCase()}://${missingColonMatch[2].replace(/^\/+/, "")}`;
  }

  if (/^[^\s/]+\.[^\s]+/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}
