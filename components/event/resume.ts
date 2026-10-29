const RESUME_KEY = "ado-team-resume";
const CLIENT_KEY = "ado-client-id";

export type TeamResume = {
  code: string;
  clientId: string;
};

export function browserClientId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(CLIENT_KEY) ?? window.sessionStorage.getItem(CLIENT_KEY);
  if (existing) {
    window.localStorage.setItem(CLIENT_KEY, existing);
    window.sessionStorage.setItem(CLIENT_KEY, existing);
    return existing;
  }
  const created = crypto.randomUUID();
  window.localStorage.setItem(CLIENT_KEY, created);
  window.sessionStorage.setItem(CLIENT_KEY, created);
  return created;
}

export function saveTeamResume(code: string, clientId = browserClientId()) {
  const payload: TeamResume = { code: code.trim().toUpperCase(), clientId };
  window.localStorage.setItem(RESUME_KEY, JSON.stringify(payload));
  return payload;
}

export function readTeamResume(): TeamResume | null {
  try {
    const raw = window.localStorage.getItem(RESUME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TeamResume>;
    if (!parsed.code || !parsed.clientId) return null;
    return { code: String(parsed.code).trim().toUpperCase(), clientId: String(parsed.clientId) };
  } catch {
    return null;
  }
}

export function clearTeamResume() {
  window.localStorage.removeItem(RESUME_KEY);
}
