"use client";

import { useCallback, useEffect, useState } from "react";
import type { SealedLiveQuery } from "@neon/realtime/client";
import { useLiveQuery } from "@neon/realtime-react";
import { progressLabel } from "@/lib/events/labels";
import { startBlockers } from "@/lib/events/rules";
import type { HostRow } from "@/lib/events/types";
import { Logo } from "@/components/Logo";
import { deleteJson, getJson, postJson } from "./api";
import { asHostRows, eventFrom, teamsFrom } from "./rows";

type LivePayload = { sealedQuery: SealedLiveQuery<HostRow> | null; rows: HostRow[] };

const PRACTICE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function practiceCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (value) => PRACTICE_ALPHABET[value % PRACTICE_ALPHABET.length]).join("");
}

export function InstructorDesk({ fresh = false, onHome }: { fresh?: boolean; onHome: () => void }) {
  const [live, setLive] = useState<LivePayload | null>(null);
  const [accessOnce, setAccessOnce] = useState<string | null>(null);
  const [checking, setChecking] = useState(!fresh);

  useEffect(() => {
    if (fresh) return;
    let ignore = false;
    void (async () => {
      const live = await postJson<LivePayload>("/api/live/host");
      if (ignore) return;
      if (live.ok) {
        setLive({ sealedQuery: live.data.sealedQuery, rows: asHostRows(live.data.rows) });
      } else if (live.data.code !== "unauthorized") {
        const snapshot = await getJson<{ rows: HostRow[] }>("/api/snapshot/host");
        if (!ignore && snapshot.ok) setLive({ sealedQuery: null, rows: asHostRows(snapshot.data.rows) });
      }
      if (!ignore) setChecking(false);
    })();
    return () => {
      ignore = true;
    };
  }, [fresh]);

  if (checking) return <p className="boot">Het instructeursblad wordt geopend.</p>;
  if (!live) {
    return (
      <InstructorLogin
        onHome={onHome}
        onReady={(next, code) => {
          setAccessOnce(code);
          setLive(next);
        }}
      />
    );
  }
  return (
    <HostLive
      initial={live}
      accessOnce={accessOnce}
      onNoted={() => setAccessOnce(null)}
      onHome={onHome}
      onReplace={(next) => {
        if (!next) setAccessOnce(null);
        setLive(next);
      }}
    />
  );
}

function InstructorLogin({
  onHome,
  onReady,
}: {
  onHome: () => void;
  onReady: (live: LivePayload, accessCode: string | null) => void;
}) {
  const [mode, setMode] = useState<"create" | "reopen">("create");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(url: "/api/events" | "/api/events/claim") {
    if (url === "/api/events" && pin.trim() !== confirm.trim()) {
      setError("De instructeurscodes komen niet overeen.");
      return;
    }
    setPending(true);
    setError(null);
    const created = await postJson<{ code: string; rows: HostRow[] }>(url, {
      pin,
      confirm: url === "/api/events" ? confirm : undefined,
      code: url === "/api/events/claim" ? code : undefined,
    });
    if (!created.ok) {
      setPending(false);
      setError(created.data.error ?? "Het evenement kon niet worden geopend.");
      return;
    }
    const sealed = await postJson<LivePayload>("/api/live/host");
    setPending(false);
    onReady(
      {
        sealedQuery: sealed.ok ? sealed.data.sealedQuery : null,
        rows: asHostRows(sealed.ok ? sealed.data.rows : created.data.rows),
      },
      url === "/api/events" ? pin.trim() : null,
    );
  }

  return (
    <main className="app">
      <button className="back-link" type="button" onClick={onHome}>
        <Logo alt="" />
        <span>Terug</span>
      </button>
      <p className="kicker on-dark">Instructeur</p>
      <h1 className="display">Evenement openen</h1>
      <div className="chips">
        <button type="button" className={mode === "create" ? "on" : ""} onClick={() => setMode("create")}>
          Nieuw evenement
        </button>
        <button type="button" className={mode === "reopen" ? "on" : ""} onClick={() => setMode("reopen")}>
          Ik heb al een code
        </button>
      </div>
      <section className="paper stack">
        <label className="field">
          <span className="prompt">{mode === "create" ? "Instructeurscode, minstens 6 tekens" : "Instructeurscode"}</span>
          <input
            value={pin}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(event) => setPin(event.target.value)}
          />
        </label>
        {mode === "create" ? (
          <label className="field">
            <span className="prompt">Herhaal de instructeurscode</span>
            <input
              value={confirm}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </label>
        ) : (
          <label className="field">
            <span className="prompt">Evenementcode</span>
            <input
              value={code}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
            />
          </label>
        )}
        <p className="small">
          {mode === "create"
            ? "Jij kiest deze code. Er staat geen vast wachtwoord in de app. Noteer hem, want hij kan niet worden teruggehaald."
            : "Dit is de code die je bij het maken van dit evenement hebt gekozen."}
        </p>
        {error ? <p className="feedback">{error}</p> : null}
        <button
          className="primary full"
          type="button"
          disabled={pending || pin.trim().length < (mode === "create" ? 6 : 1) || (mode === "reopen" && code.trim().length === 0)}
          onClick={() => void submit(mode === "create" ? "/api/events" : "/api/events/claim")}
        >
          {mode === "create" ? "Maak het evenement" : "Open het evenement"}
        </button>
        {mode === "create" ? (
          <button
            className="ghost full"
            type="button"
            disabled={pending}
            onClick={() => {
              const generated = practiceCode();
              setPin(generated);
              setConfirm(generated);
              setError(null);
            }}
          >
            Vul een oefencode in
          </button>
        ) : null}
      </section>
    </main>
  );
}

function HostLive({
  initial,
  accessOnce,
  onNoted,
  onHome,
  onReplace,
}: {
  initial: LivePayload;
  accessOnce: string | null;
  onNoted: () => void;
  onHome: () => void;
  onReplace: (live: LivePayload | null) => void;
}) {
  if (!initial.sealedQuery) {
    return <PollingHost initialRows={initial.rows} accessOnce={accessOnce} onNoted={onNoted} onHome={onHome} onReplace={onReplace} />;
  }
  return (
    <RealtimeHost
      sealedQuery={initial.sealedQuery}
      initialRows={initial.rows}
      accessOnce={accessOnce}
      onNoted={onNoted}
      onHome={onHome}
      onReplace={onReplace}
    />
  );
}

function PollingHost({
  initialRows,
  accessOnce,
  onNoted,
  onHome,
  onReplace,
}: {
  initialRows: HostRow[];
  accessOnce: string | null;
  onNoted: () => void;
  onHome: () => void;
  onReplace: (live: LivePayload | null) => void;
}) {
  const [rows, setRows] = useState(initialRows);
  useEffect(() => {
    let ignore = false;
    const tick = async () => {
      const response = await getJson<{ rows: HostRow[] }>("/api/snapshot/host");
      if (!ignore && response.ok) setRows(asHostRows(response.data.rows));
    };
    const timer = window.setInterval(() => void tick(), 1500);
    return () => {
      ignore = true;
      window.clearInterval(timer);
    };
  }, []);
  return <InstructorPanel rows={rows} degraded accessOnce={accessOnce} onNoted={onNoted} onHome={onHome} onReplace={onReplace} onRows={setRows} />;
}

function RealtimeHost({
  sealedQuery,
  initialRows,
  accessOnce,
  onNoted,
  onHome,
  onReplace,
}: {
  sealedQuery: SealedLiveQuery<HostRow>;
  initialRows: HostRow[];
  accessOnce: string | null;
  onNoted: () => void;
  onHome: () => void;
  onReplace: (live: LivePayload | null) => void;
}) {
  const [query] = useState(sealedQuery);
  const refreshQuery = useCallback(async () => {
    const response = await postJson<LivePayload>("/api/live/host");
    if (!response.ok || !response.data.sealedQuery) {
      throw new Error(response.ok ? "Geen live query" : (response.data.error ?? "De live query kon niet worden vernieuwd."));
    }
    return response.data.sealedQuery;
  }, []);
  const live = useLiveQuery(query, { refreshQuery, initialData: initialRows });
  const [rows, setRows] = useState(initialRows);

  useEffect(() => {
    if (live.status === "error" || !live.data) return;
    setRows(asHostRows(live.data as unknown as Record<string, unknown>[]));
  }, [live.data, live.status]);

  useEffect(() => {
    if (live.status !== "error") return;
    let ignore = false;
    const tick = async () => {
      const response = await getJson<{ rows: HostRow[] }>("/api/snapshot/host");
      if (!ignore && response.ok) setRows(asHostRows(response.data.rows));
    };
    void tick();
    const timer = window.setInterval(() => void tick(), 1500);
    return () => {
      ignore = true;
      window.clearInterval(timer);
    };
  }, [live.status]);

  return (
    <InstructorPanel
      rows={rows}
      degraded={live.status === "error"}
      accessOnce={accessOnce}
      onNoted={onNoted}
      onHome={onHome}
      onReplace={onReplace}
      onRows={setRows}
    />
  );
}

function InstructorPanel({
  rows,
  degraded,
  accessOnce,
  onNoted,
  onHome,
  onReplace,
  onRows,
}: {
  rows: HostRow[];
  degraded: boolean;
  accessOnce: string | null;
  onNoted: () => void;
  onHome: () => void;
  onReplace: (live: LivePayload | null) => void;
  onRows: (rows: HostRow[]) => void;
}) {
  const event = eventFrom(rows);
  const teams = teamsFrom(rows);
  const named = teams.filter((team) => team.team_name).length;
  const blockers = event
    ? startBlockers(
        { status: event.status, expiresAt: event.expires_at },
        teams.map((team) => ({ teamName: team.team_name })),
        Date.now(),
      )
    : ["Het evenement is niet gevonden."];
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function start() {
    setPending(true);
    setError(null);
    const result = await postJson<{ rows?: HostRow[]; missing?: string[] }>("/api/events/start");
    setPending(false);
    if (!result.ok) {
      setError(result.data.missing?.join(" ") || result.data.error || "Starten is niet gelukt.");
      return;
    }
    if (result.data.rows) onRows(asHostRows(result.data.rows));
  }

  async function end() {
    setPending(true);
    setError(null);
    const result = await postJson<{ rows?: HostRow[] }>("/api/events/end");
    setPending(false);
    if (!result.ok) {
      setError(result.data.error ?? "Beëindigen is niet gelukt.");
      return;
    }
    if (result.data.rows) onRows(asHostRows(result.data.rows));
  }

  async function remove(id: string) {
    const result = await deleteJson(`/api/events/participants/${id}`);
    if (!result.ok) setError(result.data.error ?? "Dit team kon niet worden verwijderd.");
  }

  if (!event) return null;

  return (
    <main className="app">
      <section className="paper">
        {accessOnce ? (
          <p className="feedback">
            Bewaar deze instructeurscode. Hij wordt niet opnieuw getoond: {accessOnce}{" "}
            <button className="ghost" type="button" onClick={onNoted}>
              Genoteerd
            </button>
          </p>
        ) : null}
        <p className="kicker">Instructeur · {statusLabel(event.status)}</p>
        <h1>Evenementcode</h1>
        <p className="event-code">{event.code}</p>
        <p aria-live="polite">
          {teams.length} {teams.length === 1 ? "team" : "teams"} aangesloten, {named} met een naam.
        </p>
        {degraded ? <p className="warn">De live verbinding is onderbroken. De lijst blijft via de database bij.</p> : null}
        <ul className="roster">
          {teams.length === 0 ? <li>Nog niemand doet mee.</li> : null}
          {teams.map((team) => (
            <li key={team.id}>
              <div>
                <strong>{team.team_name ?? "Naam ontbreekt"}</strong>
                <span>{team.team_name ? progressLabel(team.phase, team.step_index) : "Wacht op een teamnaam"}</span>
              </div>
              {event.status === "lobby" ? (
                <button className="ghost" type="button" onClick={() => void remove(team.id)}>
                  Verwijder
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        {event.status === "lobby" && blockers.length > 0 ? (
          <div className="feedback">
            <p>Starten kan nog niet.</p>
            <ul>
              {blockers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {error ? <p className="feedback">{error}</p> : null}
        <div className="actions">
          {event.status === "lobby" ? (
            <button className="primary" type="button" disabled={pending || blockers.length > 0} onClick={() => void start()}>
              Start evenement
            </button>
          ) : null}
          {event.status !== "ended" ? (
            <button className="ghost" type="button" disabled={pending} onClick={() => void end()}>
              Beëindig evenement
            </button>
          ) : (
            <>
              <p>Dit evenement is beëindigd.</p>
              <button className="primary" type="button" onClick={() => onReplace(null)}>
                Nieuwe groep
              </button>
            </>
          )}
          <button className="ghost" type="button" onClick={onHome}>
            Beginscherm
          </button>
          <button className="ghost" type="button" onClick={() => onReplace(null)}>
            Ander evenement
          </button>
        </div>
      </section>
    </main>
  );
}

function statusLabel(status: HostRow["status"]) {
  if (status === "started") return "Gestart";
  if (status === "ended") return "Beëindigd";
  return "Wachtkamer";
}
