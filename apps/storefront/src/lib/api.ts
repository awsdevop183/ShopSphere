// Minimal typed API client. The JWT is kept in memory + localStorage mirror.
let token: string | null = localStorage.getItem('ss_token');

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem('ss_token', t);
  else localStorage.removeItem('ss_token');
}
export function getToken() { return token; }

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: any) { super(message); }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, data?.error ?? res.statusText, data);
  return data as T;
}

export const api = {
  get: <T>(p: string) => req<T>('GET', p),
  post: <T>(p: string, b?: unknown) => req<T>('POST', p, b),
  patch: <T>(p: string, b?: unknown) => req<T>('PATCH', p, b),
  del: <T>(p: string) => req<T>('DELETE', p),
};
