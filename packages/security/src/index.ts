// Reusable SECURE reference helpers. These mirror the hardened (secure-mode)
// behaviour used by the lab framework and are safe to reuse in trusted code.

/** HTML-escape untrusted text for safe HTML output (XSS defence). */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

/** Confine a user-supplied relative path to a base dir (path-traversal defence). */
export function safeResolve(base: string, userPath: string): string | null {
  const parts: string[] = [];
  for (const seg of `${base}/${userPath}`.replace(/\/+/g, '/').split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.' && seg !== '') parts.push(seg);
  }
  const resolved = parts.join('/');
  return resolved.startsWith(base.replace(/\/+$/, '')) ? resolved : null;
}

/** Only permit same-site relative redirect targets (open-redirect defence). */
export function safeRedirect(next: string, fallback = '/'): string {
  return /^\/(?!\/)/.test(next) ? next : fallback;
}

/** Pick only allowlisted fields from an object (mass-assignment defence). */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out;
}
