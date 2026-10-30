import { readTeamToken } from "./resume";

export type ApiFailure = { error?: string; code?: string; missing?: string[] };

function withAuth(headers?: HeadersInit): HeadersInit {
  const next = new Headers(headers);
  const token = readTeamToken();
  if (token) next.set("x-ado-team", token);
  return next;
}

export async function postJson<T>(url: string, body?: unknown): Promise<{ ok: true; data: T } | { ok: false; data: ApiFailure }> {
  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
    headers: withAuth(body === undefined ? undefined : { "Content-Type": "application/json" }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return read<T>(response);
}

export async function getJson<T>(url: string) {
  return read<T>(
    await fetch(url, {
      cache: "no-store",
      credentials: "same-origin",
      headers: withAuth({ "Cache-Control": "no-cache", Pragma: "no-cache" }),
    }),
  );
}

export async function deleteJson<T>(url: string) {
  return read<T>(await fetch(url, { method: "DELETE", cache: "no-store", credentials: "same-origin", headers: withAuth() }));
}

async function read<T>(response: Response): Promise<{ ok: true; data: T } | { ok: false; data: ApiFailure }> {
  const data = (await response.json().catch(() => ({}))) as T & ApiFailure;
  if (!response.ok) return { ok: false, data };
  return { ok: true, data };
}
