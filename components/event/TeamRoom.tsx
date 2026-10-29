"use client";

import { useCallback, useEffect, useState } from "react";
import type { SealedLiveQuery } from "@neon/realtime/client";
import { useLiveQuery } from "@neon/realtime-react";
import type { Phase, TeamRow } from "@/lib/events/types";
import { Logo } from "@/components/Logo";
import { PhaseOne } from "@/components/phase1/PhaseOne";
import { getJson, postJson } from "./api";
import { asTeamRow } from "./rows";
import { browserClientId, clearTeamResume, saveTeamResume } from "./resume";

type LivePayload = { sealedQuery: SealedLiveQuery<TeamRow> | null; row: TeamRow };

export function JoinRoom({ onHome, onJoined }: { onHome: () => void; onJoined: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function join() {
    setPending(true);
    setError(null);
    const clientId = browserClientId();
    const normalized = code.trim().toUpperCase();
    const result = await postJson<LivePayload & { token?: string }>("/api/join", { code: normalized, clientId });
    setPending(false);
    if (!result.ok) {
      setError(result.data.error ?? "Deze code werkt niet.");
      return;
    }
    saveTeamResume(normalized, clientId, result.data.token);
    onJoined();
  }

  return (
    <main className="app">
      <section className="paper">
        <p className="kicker">Deelnemen</p>
        <h1>Evenementcode</h1>
        <label className="field">
          <span className="prompt">Code van de instructeur</span>
          <input
            className="code-input"
            value={code}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === "Enter") void join();
            }}
          />
        </label>
        {error ? <p className="feedback">{error}</p> : null}
        <div className="actions">
          <button className="primary" type="button" disabled={pending || code.trim().length === 0} onClick={() => void join()}>
            Ga verder
          </button>
          <button className="ghost" type="button" onClick={onHome}>
            Beginscherm
          </button>
        </div>
      </section>
    </main>
  );
}

export function TeamRoom({ onHome }: { onHome: () => void }) {
  const [live, setLive] = useState<LivePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      const live = await postJson<LivePayload>("/api/live/team");
      if (ignore) return;
      if (live.ok && live.data.sealedQuery) {
        setLive({ sealedQuery: live.data.sealedQuery, row: asTeamRow(live.data.row) });
        return;
      }
      const snapshot = await getJson<{ row: TeamRow }>("/api/snapshot/team");
      if (ignore) return;
      if (snapshot.ok) setLive({ sealedQuery: null, row: asTeamRow(snapshot.data.row) });
      else setError(live.ok ? "De live verbinding ontbreekt." : (snapshot.data.error ?? live.data.error ?? "Dit team is niet aangemeld."));
    })();
    return () => {
      ignore = true;
    };
  }, []);

  if (error) {
    return (
      <main className="app">
        <section className="paper">
          <p className="feedback">{error}</p>
          <button className="primary" type="button" onClick={onHome}>
            Beginscherm
          </button>
        </section>
      </main>
    );
  }
  if (!live) return <p className="boot">Jullie plek in het evenement wordt gezocht.</p>;
  return <TeamLive initial={live} onHome={onHome} />;
}

function TeamLive({ initial, onHome }: { initial: LivePayload; onHome: () => void }) {
  if (!initial.sealedQuery) return <PollingTeam row={initial.row} onHome={onHome} />;
  return <RealtimeTeam sealedQuery={initial.sealedQuery} initialRow={initial.row} onHome={onHome} />;
}

function PollingTeam({ row, onHome }: { row: TeamRow; onHome: () => void }) {
  const [current, setCurrent] = useState(row);
  useEffect(() => {
    let ignore = false;
    const tick = async () => {
      const response = await getJson<{ row: TeamRow }>("/api/snapshot/team");
      if (!ignore && response.ok) setCurrent(asTeamRow(response.data.row));
    };
    const timer = window.setInterval(() => void tick(), 1500);
    return () => {
      ignore = true;
      window.clearInterval(timer);
    };
  }, []);
  return <TeamStage row={current} degraded onHome={onHome} />;
}

function RealtimeTeam({
  sealedQuery,
  initialRow,
  onHome,
}: {
  sealedQuery: SealedLiveQuery<TeamRow>;
  initialRow: TeamRow;
  onHome: () => void;
}) {
  const [query] = useState(sealedQuery);
  const refreshQuery = useCallback(async () => {
    const response = await postJson<LivePayload>("/api/live/team");
    if (!response.ok || !response.data.sealedQuery) {
      throw new Error(response.ok ? "Geen live query" : (response.data.error ?? "De live query kon niet worden vernieuwd."));
    }
    return response.data.sealedQuery;
  }, []);
  const live = useLiveQuery(query, { refreshQuery, initialData: [initialRow] });
  const [fallback, setFallback] = useState<TeamRow | null>(null);

  useEffect(() => {
    if (live.status !== "error") return;
    let ignore = false;
    const tick = async () => {
      const response = await getJson<{ row: TeamRow }>("/api/snapshot/team");
      if (!response.ok || ignore) return;
      setFallback(asTeamRow(response.data.row));
    };
    void tick();
    const timer = window.setInterval(() => void tick(), 2000);
    return () => {
      ignore = true;
      window.clearInterval(timer);
    };
  }, [live.status]);

  const fromLive = live.data?.[0] ? asTeamRow(live.data[0] as unknown as Record<string, unknown>) : null;
  const row = live.status === "error" ? (fallback ?? initialRow) : (fromLive ?? initialRow);
  return <TeamStage row={row} degraded={live.status === "error"} onHome={onHome} />;
}

function TeamStage({ row, degraded, onHome }: { row: TeamRow; degraded: boolean; onHome: () => void }) {
  const [override, setOverride] = useState<Partial<TeamRow> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [briefingSeen, setBriefingSeen] = useState(false);
  const current = override ? { ...row, ...override } : row;

  useEffect(() => {
    const key = `ado-briefing:${current.id}`;
    setBriefingSeen(window.localStorage.getItem(key) === "1" || window.sessionStorage.getItem(key) === "1");
  }, [current.id]);

  useEffect(() => {
    if (!override) return;
    if (row.phase === override.phase && row.step_index === (override.step_index ?? row.step_index) && row.team_name === (override.team_name ?? row.team_name)) {
      setOverride(null);
    }
  }, [override, row]);

  async function save(stepIndex: number, phase: Phase) {
    setOverride({ step_index: stepIndex, phase, team_name: current.team_name });
    const result = await postJson<{ row: TeamRow }>("/api/progress", { stepIndex, phase });
    if (!result.ok) {
      setOverride(null);
      setError(result.data.error ?? "De voortgang is niet opgeslagen.");
      return false;
    }
    return true;
  }

  async function replay() {
    setOverride({ step_index: 0, phase: "intro", team_name: current.team_name });
    const result = await postJson<{ row: TeamRow }>("/api/replay");
    if (!result.ok) {
      setOverride(null);
      setError(result.data.error ?? "De levels konden niet opnieuw worden geopend.");
      return false;
    }
    window.sessionStorage.removeItem(`ado-briefing:${current.id}`);
    window.localStorage.removeItem(`ado-briefing:${current.id}`);
    setBriefingSeen(false);
    return true;
  }

  async function leave() {
    await postJson("/api/leave");
    clearTeamResume();
    const nextId = crypto.randomUUID();
    window.localStorage.setItem("ado-client-id", nextId);
    window.sessionStorage.setItem("ado-client-id", nextId);
    onHome();
  }

  if (current.status === "ended") {
    return (
      <main className="app">
        <section className="paper">
          <p className="kicker">Evenement {current.code}</p>
          <h1>Het evenement is beëindigd</h1>
          <p>De instructeur heeft dit evenement gesloten. Jullie voortgang blijft bewaard voor dit team.</p>
          <button className="primary" type="button" onClick={onHome}>
            Beginscherm
          </button>
        </section>
      </main>
    );
  }

  if (!current.team_name) return <NameForm code={current.code} onHome={onHome} onNamed={(teamName) => setOverride({ team_name: teamName })} />;

  if (current.status === "lobby") {
    return (
      <main className="app dossier">
        <Brand />
        <article className="paper stack">
          <span className="stamp">Aangemeld</span>
          <h1 className="display">{current.team_name}</h1>
          <p>Jullie team is aangemeld.</p>
          <p>Wacht op de instructeur. Zodra het onderzoek begint, verschijnt hier jullie eerste briefing.</p>
          <p className="small">Evenement {current.code}</p>
          {degraded ? <p className="warn">De live verbinding is onderbroken. De status blijft via de database bij.</p> : null}
          {error ? <p className="feedback">{error}</p> : null}
          <button className="ghost" type="button" onClick={() => void leave()}>
            Verkeerde code
          </button>
        </article>
      </main>
    );
  }

  if (current.phase === "intro" && !briefingSeen) {
    return (
      <main className="app dossier">
        <Brand />
        <article className="paper stack briefing">
          <span className="stamp">Geheim dossier</span>
          <p className="kicker">Eerste briefing</p>
          <h1 className="display">De Senaatskamer</h1>
          <h2>Er is vertrouwelijke informatie gelekt...</h2>
          <p>Jaren geleden kwam het bestuur van ADO Den Haag bijeen in de Senaatskamer. Tijdens deze geheime vergadering werden plannen besproken over de toekomst van het stadion.</p>
          <p>De inhoud van deze vergadering was strikt vertrouwelijk. Toch verscheen belangrijke informatie later in de media. De supporters waren woedend en binnen de club ontstond grote onrust.</p>
          <p>Tot op de dag van vandaag is niet duidelijk wie verantwoordelijk was voor het lek.</p>
          <p><strong>Jullie gaan dit mysterie oplossen.</strong></p>
          <h2>Jullie missie</h2>
          <p>Jullie hebben 60 minuten om te ontdekken wat er precies is gebeurd, welke informatie is gelekt en wie daarvoor verantwoordelijk was.</p>
          <p>Tijdens het onderzoek openen jullie vijf geheime dossiers. Ieder dossier bevat verschillende opdrachten en interactieve minigames.</p>
          <h2>Hoe werkt het onderzoek?</h2>
          <ol>
            <li>Open het eerste dossier op jullie telefoon.</li>
            <li>Lees de opdrachten en onderzoek de fysieke bewijsstukken op tafel.</li>
            <li>Gebruik de documenten om de interactieve minigames op te lossen.</li>
            <li>Vul de juiste antwoorden in om nieuwe opdrachten te ontgrendelen.</li>
            <li>Verzamel aanwijzingen en ontdek uiteindelijk wie verantwoordelijk is voor het lek.</li>
          </ol>
          <h2>Belangrijk</h2>
          <p><strong>De bewijsstukken op tafel zijn essentieel.</strong></p>
          <p>Niet alle antwoorden staan in de app. Jullie moeten de fysieke documenten zorgvuldig lezen, vergelijken en combineren.</p>
          <p>Komen jullie er niet uit? Gebruik dan de hintknop.</p>
          <h2>Het onderzoek begint</h2>
          <p>Vijf dossiers. Eén geheim. Eén verantwoordelijke.</p>
          <p><strong>Kunnen jullie ontdekken wat er werkelijk in de Senaatskamer is gebeurd?</strong></p>
          {error ? <p className="feedback">{error}</p> : null}
          <button
            className="primary full"
            type="button"
            onClick={() => {
              window.sessionStorage.setItem(`ado-briefing:${current.id}`, "1");
              window.localStorage.setItem(`ado-briefing:${current.id}`, "1");
              setBriefingSeen(true);
            }}
          >
            Start mijn onderzoek
          </button>
        </article>
      </main>
    );
  }

  async function jump(stepIndex: number, phase: Phase) {
    setOverride({ step_index: stepIndex, phase, team_name: current.team_name });
    const result = await postJson<{ row: TeamRow }>("/api/jump", { stepIndex, phase });
    if (!result.ok) {
      setOverride(null);
      setError(result.data.error ?? "De test-sprong is mislukt.");
      return false;
    }
    setError(null);
    return true;
  }

  return (
    <PhaseOne
      teamId={current.id}
      stepIndex={current.step_index}
      phase={current.phase}
      notice={error ?? (degraded ? "De live verbinding is onderbroken. De voortgang blijft via de database bij." : null)}
      onProgress={save}
      onJump={jump}
      onReplay={replay}
    />
  );
}

function NameForm({ code, onHome, onNamed }: { code: string; onHome: () => void; onNamed: (teamName: string) => void }) {
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setError(null);
    const result = await postJson<{ row: TeamRow }>("/api/join/name", { teamName });
    setPending(false);
    if (!result.ok) {
      setError(result.data.error ?? "De teamnaam kon niet worden opgeslagen.");
      return;
    }
    onNamed(result.data.row.team_name ?? teamName);
  }

  return (
    <main className="app dossier">
      <Brand />
      <form
        className="paper stack"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <h1 className="display">Welkom onderzoekers</h1>
        <p>Vul jullie teamnaam in en maak je klaar om te achterhalen wat er in de Senaatskamer is gelekt, en wie dat deed.</p>
        <p>Zodra de instructeur het onderzoek start, ontvangen jullie de eerste briefing.</p>
        <label className="field">
          <span>Teamnaam</span>
          <input value={teamName} onChange={(input) => setTeamName(input.target.value)} autoFocus maxLength={24} />
        </label>
        <p className="small">Evenement {code}</p>
        {error ? <p className="feedback">{error}</p> : null}
        <button className="primary full" type="submit" disabled={pending || teamName.trim().length < 2}>
          Team aanmelden
        </button>
        <button className="ghost" type="button" onClick={onHome}>
          Beginscherm
        </button>
      </form>
    </main>
  );
}

function Brand() {
  return (
    <div className="brand-row">
      <Logo />
      <div>
        <p className="kicker on-dark">ADO Den Haag</p>
        <strong>Het Geheim van de Senaatskamer</strong>
      </div>
    </div>
  );
}
