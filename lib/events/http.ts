import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { FlowError } from "./types";

export const HOST_COOKIE = "ado_host";
export const TEAM_COOKIE = "ado_team";

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export function jsonWithCookie(body: unknown, name: string, value: string, status = 200) {
  const response = json(body, status);
  response.cookies.set(name, value, cookieOptions(60 * 60 * 12));
  return response;
}

export function jsonClearCookie(body: unknown, name: string, status = 200) {
  const response = json(body, status);
  response.cookies.set(name, "", cookieOptions(0));
  return response;
}

export function flowResponse(error: unknown) {
  if (error instanceof FlowError) {
    return json({ error: error.message, code: error.code, missing: error.missing ?? [] }, error.status);
  }
  console.error(error);
  return json({ error: "Er ging iets mis. Probeer het opnieuw.", code: "server" }, 500);
}

export async function readCookie(name: string) {
  return (await cookies()).get(name)?.value ?? null;
}

/** @deprecated Prefer jsonWithCookie on the response in route handlers. */
export async function writeCookie(name: string, value: string) {
  (await cookies()).set(name, value, cookieOptions(60 * 60 * 12));
}

/** @deprecated Prefer jsonClearCookie on the response in route handlers. */
export async function clearCookie(name: string) {
  (await cookies()).set(name, "", cookieOptions(0));
}
