import { cookies } from "next/headers";
import { FlowError } from "./types";

export const HOST_COOKIE = "ado_host";
export const TEAM_COOKIE = "ado_team";

export function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export function flowResponse(error: unknown) {
  if (error instanceof FlowError) {
    return json({ error: error.message, code: error.code, missing: error.missing ?? [] }, error.status);
  }
  console.error(error);
  return json({ error: "Er ging iets mis. Probeer het opnieuw.", code: "server" }, 500);
}

function options(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function readCookie(name: string) {
  return (await cookies()).get(name)?.value ?? null;
}

export async function writeCookie(name: string, value: string) {
  (await cookies()).set(name, value, options(60 * 60 * 12));
}

export async function clearCookie(name: string) {
  (await cookies()).set(name, "", options(0));
}
