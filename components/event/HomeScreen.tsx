"use client";

import { FormEvent, useState } from "react";
import { Logo } from "@/components/Logo";
import { postJson } from "./api";
import { browserClientId, saveTeamResume } from "./resume";

export function HomeScreen({
  teamName,
  hostCode,
  onInstructor,
  onJoined,
  onContinueTeam,
  onContinueHost,
}: {
  teamName?: string | null;
  hostCode?: string | null;
  onInstructor: () => void;
  onJoined: (code?: string) => void;
  onContinueTeam?: () => void;
  onContinueHost?: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const clientId = browserClientId();
    const normalized = code.trim().toUpperCase();
    const result = await postJson<{ token?: string }>("/api/join", { code: normalized, clientId });
    if (!result.ok) {
      setError(result.data.error ?? "Deze code klopt niet.");
      setBusy(false);
      return;
    }
    saveTeamResume(normalized, clientId, result.data.token);
    onJoined(normalized);
  }

  return (
    <main className="app hero">
      <div className="brand-row">
        <Logo />
        <div>
          <p className="kicker on-dark">ADO Den Haag</p>
          <strong>Het Geheim van de Senaatskamer</strong>
        </div>
      </div>
      <p className="kicker on-dark">Vertrouwelijk dossier</p>
      <h1 className="display">
        Het geheim
        <br />
        van de Senaatskamer
      </h1>
      <p className="lead">Een vertrouwelijk onderzoek in de Senaatskamer van ADO Den Haag.</p>
      <article className="paper ticket">
        <div className="spread">
          <span className="stamp">Verzegeld</span>
          <span className="stamp gold">Spelverhaal</span>
        </div>
        <p>
          Jullie zitten in de Senaatskamer. Jaren geleden besprak het bestuur hier in het geheim de plannen voor het stadion. Later lekte dat geheim, en de supporters waren boos. Vul de evenementcode van de instructeur in. Daarna alleen jullie teamnaam.
        </p>
        <div className="stats">
          <div>
            <b>5</b>
            <span>dossiers</span>
          </div>
          <div>
            <b>60</b>
            <span>minuten</span>
          </div>
        </div>
      </article>
      <form className="paper stack" onSubmit={(event) => void submit(event)}>
        <label className="field">
          <span>Evenementcode</span>
          <input
            value={code}
            onChange={(input) => setCode(input.target.value.toUpperCase())}
            placeholder="Code van de instructeur"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
            inputMode="text"
          />
        </label>
        {error ? <p className="feedback">{error}</p> : null}
        <button className="primary full" type="submit" disabled={busy || code.trim().length < 3}>
          Ga verder
        </button>
        <p className="small">De code staat groot op het scherm van de instructeur.</p>
      </form>
      <button className="ghost light full" type="button" onClick={onInstructor}>
        Instructeur
      </button>
      {onContinueHost || onContinueTeam ? (
        <div className="resume">
          {onContinueHost ? (
            <button type="button" onClick={onContinueHost}>
              Verder als instructeur{hostCode ? ` · ${hostCode}` : ""}
            </button>
          ) : null}
          {onContinueTeam ? (
            <button type="button" onClick={onContinueTeam}>
              Verder{teamName ? ` als ${teamName}` : " met dit team"}
            </button>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
