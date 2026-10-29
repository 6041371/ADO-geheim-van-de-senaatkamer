"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { COMING_SOON, DOSSIERS, EVIDENCE, HINTS, LOCKED_MESSAGE, completedTasks, type HintSet } from "@/lib/level1";
import { DOSSIER2_EVIDENCE, DOSSIER2_HINTS, dossier1Complete, dossier2Complete, dossier2DoneCount } from "@/lib/level2";
import type { Phase } from "@/lib/events/types";
import { Logo } from "@/components/Logo";
import { DossierTwo } from "./DossierTwo";
import { IntroFilm } from "./IntroFilm";
import { AttendanceTask, MinutesTask, RoomBriefing, TimeTask } from "./Tasks";

type Screen = "menu" | "briefing" | "task" | "ending" | "dossier2" | "dossier2end";

type StoredView = {
  screen: Screen;
  taskIndex: number;
  dossierTask: 4 | 5 | 6;
  forcedDossierTask: 4 | 5 | 6 | null;
};

const TASK_HINTS: HintSet[] = [HINTS.attendance, HINTS.minutes, HINTS.time];

export function PhaseOne({
  teamId,
  stepIndex,
  phase,
  notice,
  onProgress,
  onReplay,
}: {
  teamId: string;
  stepIndex: number;
  phase: Phase;
  notice?: string | null;
  onProgress: (stepIndex: number, phase: Phase) => Promise<boolean>;
  onReplay: () => Promise<boolean>;
}) {
  const completed = completedTasks(phase, stepIndex);
  const dossier1Done = dossier1Complete(phase, stepIndex);
  const dossier2Done = dossier2Complete(phase, stepIndex);
  const fallback = defaultView(phase, stepIndex, completed);
  const [ready, setReady] = useState(false);
  const [introSeen, setIntroSeen] = useState(phase !== "intro");
  const [replay, setReplay] = useState(false);
  const [screen, setScreen] = useState<Screen>(fallback.screen);
  const [taskIndex, setTaskIndex] = useState(fallback.taskIndex);
  const [dossierTask, setDossierTask] = useState<4 | 5 | 6>(fallback.dossierTask);
  const [forcedDossierTask, setForcedDossierTask] = useState<4 | 5 | 6 | null>(fallback.forcedDossierTask);
  const [panel, setPanel] = useState<"hints" | "evidence" | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const rememberTask = useCallback((task: 4 | 5 | 6) => setDossierTask(task), []);

  useLayoutEffect(() => {
    const done = completedTasks(phase, stepIndex);
    const restored = restoreView(teamId, phase, stepIndex, done);
    setScreen(restored.screen);
    setTaskIndex(restored.taskIndex);
    setDossierTask(restored.dossierTask);
    setForcedDossierTask(restored.forcedDossierTask);
    if (phase !== "intro") setIntroSeen(true);
    else setIntroSeen(window.localStorage.getItem(introKey(teamId)) === "1" || window.sessionStorage.getItem("ado-intro-seen") === "1");
    setReady(true);
    // Alleen bij (her)laden van dit team hervatten; niet bij elke voortgangs-update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  useEffect(() => {
    if (!ready) return;
    saveView(teamId, { screen, taskIndex, dossierTask, forcedDossierTask });
  }, [ready, teamId, screen, taskIndex, dossierTask, forcedDossierTask]);

  const hintKey = screen === "dossier2" || screen === "dossier2end" ? `d2-${dossierTask}` : String(taskIndex);

  useEffect(() => {
    if (!ready) return;
    const stored = window.localStorage.getItem(`ado-hints:${teamId}:${hintKey}`);
    setHintLevel(stored ? Number(stored) : 0);
  }, [ready, teamId, hintKey]);

  function finishIntro() {
    window.localStorage.setItem(introKey(teamId), "1");
    window.sessionStorage.setItem("ado-intro-seen", "1");
    setIntroSeen(true);
    setReplay(false);
  }

  function openHintLevel(level: number) {
    setHintLevel(level);
    window.localStorage.setItem(`ado-hints:${teamId}:${hintKey}`, String(level));
  }

  async function openDossier(id: number) {
    if (id === 2) {
      if (!dossier1Done) {
        setBanner(LOCKED_MESSAGE);
        return;
      }
      setBanner(null);
      setForcedDossierTask(null);
      setScreen(dossier2Done ? "dossier2end" : "dossier2");
      return;
    }
    if (id === 3 && dossier2Done) {
      setBanner(COMING_SOON);
      return;
    }
    if (id !== 1) {
      setBanner(LOCKED_MESSAGE);
      return;
    }
    setBanner(null);
    if (dossier1Done) {
      setScreen("ending");
      return;
    }
    if (phase === "intro") {
      const saved = await onProgress(0, "playing");
      if (!saved) return;
    }
    if (completed === 0) setScreen("briefing");
    else {
      setTaskIndex(completed);
      setScreen("task");
    }
  }

  async function solve(nextStep: number, nextPhase: Phase) {
    return onProgress(nextStep, nextPhase);
  }

  async function replayLevels() {
    const saved = await onReplay();
    if (!saved) return;
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith(`ado-hints:${teamId}:`) || key === viewKey(teamId) || key === introKey(teamId)) {
        window.localStorage.removeItem(key);
      }
    }
    setForcedDossierTask(null);
    setTaskIndex(0);
    setDossierTask(4);
    setHintLevel(0);
    setPanel(null);
    setBanner(null);
    setScreen("menu");
  }

  async function jumpTo(target: JumpTarget) {
    setBanner(null);
    setPanel(null);
    setHintLevel(0);
    const saved = await onProgress(target.step, target.phase);
    if (!saved) return;
    setTaskIndex(target.taskIndex);
    setDossierTask(target.dossierTask);
    setForcedDossierTask(target.screen === "dossier2" ? target.dossierTask : null);
    setScreen(target.screen);
  }

  if (!ready) return <p className="boot">Jullie onderzoek wordt hervat.</p>;
  if (!introSeen || replay) return <IntroFilm onDone={finishIntro} />;

  const hint = screen === "dossier2" || screen === "dossier2end" ? DOSSIER2_HINTS[dossierTask] : (TASK_HINTS[taskIndex] ?? HINTS.attendance);
  const shownEvidence = [
    ...EVIDENCE.filter((item) => item.id <= (dossier1Done ? 3 : completed)),
    ...DOSSIER2_EVIDENCE.filter((item) => item.id - 3 <= dossier2DoneCount(phase, stepIndex)),
  ];

  return (
    <div className="mg">
      <div className="mg-phone">
        {screen === "menu" ? (
          <section className="mg-splash">
            <Logo className="mg-logo" />
            <h1>
              Het geheim
              <br />
              van de
              <br />
              Senaatskamer
            </h1>
            <p className="mg-sub">Een interactief onderzoek binnen ADO Den Haag</p>
            <span className="mg-badge">Vertrouwelijk</span>
            <figure className="mg-polaroid">
              <img src="/ado/senaatskamer-fac.jpg" alt="De Senaatskamer" />
            </figure>
            <button className="mg-yellow mg-cta" type="button" onClick={() => void openDossier(1)}>
              {dossier1Done ? "Dossier 01 bekijken" : "Start onderzoek"}
            </button>
            <button className="mg-ghost mg-cta" type="button" onClick={() => void replayLevels()}>
              Tijdelijk: levels opnieuw
            </button>
            <details className="mg-dev">
              <summary>Test: spring naar opdracht</summary>
              <div className="mg-dev-grid">
                {JUMPS.map((item) => (
                  <button key={item.id} type="button" onClick={() => void jumpTo(item)}>
                    <strong>{item.label}</strong>
                    {item.detail}
                  </button>
                ))}
              </div>
            </details>
            <div className="mg-dossiers">
              {DOSSIERS.filter((dossier) => dossier.id > 1).map((dossier) => {
                const status = dossierStatus(dossier.id, dossier1Done, dossier2Done);
                return (
                  <button key={dossier.id} type="button" className={status === "Vergrendeld" ? "is-locked" : "is-ready"} onClick={() => void openDossier(dossier.id)}>
                    <span>Dossier {dossier.code}</span>
                    <strong>{dossier.title}</strong>
                    <em>{status}</em>
                  </button>
                );
              })}
            </div>
            {banner ? <p className="mg-banner">{banner}</p> : null}
            <button className="mg-ghost" type="button" onClick={() => setReplay(true)}>
              Speel de intro opnieuw
            </button>
          </section>
        ) : null}

        {screen === "briefing" ? <RoomBriefing onBack={() => setScreen("menu")} onStart={() => setScreen("task")} /> : null}

        {screen === "task" && taskIndex === 0 ? (
          <AttendanceTask
            onBack={() => setScreen("briefing")}
            onSolved={() => solve(1, "playing")}
            onNext={() => {
              setTaskIndex(1);
            }}
          />
        ) : null}
        {screen === "task" && taskIndex === 1 ? (
          <MinutesTask
            onBack={() => setScreen("menu")}
            onSolved={() => solve(2, "playing")}
            onNext={() => {
              setTaskIndex(2);
            }}
          />
        ) : null}
        {screen === "task" && taskIndex === 2 ? (
          <TimeTask onBack={() => setScreen("menu")} onSolved={() => solve(2, "done")} onFinished={() => setScreen("ending")} />
        ) : null}

        {screen === "dossier2" ? (
          <DossierTwo
            key={`d2-${stepIndex}-${forcedDossierTask ?? "flow"}`}
            phase={phase}
            stepIndex={stepIndex}
            onProgress={onProgress}
            onMenu={() => setScreen("menu")}
            onTask={rememberTask}
            startTask={forcedDossierTask ?? undefined}
          />
        ) : null}
        {screen === "dossier2end" ? (
          <DossierTwo
            key={`d2-end-${stepIndex}`}
            phase={phase}
            stepIndex={stepIndex}
            onProgress={onProgress}
            onMenu={() => setScreen("menu")}
            onTask={rememberTask}
          />
        ) : null}

        {screen === "ending" ? (
          <section className="mg-screen mg-ending">
            <p className="mg-kicker">Dossier 01 afgerond</p>
            <h1>De eerste gebeurtenissen liggen vast</h1>
            <ul>
              {EVIDENCE.map((item, index) => (
                <li key={item.id} style={{ animationDelay: `${index * 0.35}s` }}>
                  <strong>Bewijs 0{item.id}</strong>
                  {item.text}
                </li>
              ))}
            </ul>
            <p>Jullie hebben de eerste gebeurtenissen van de geheime bestuursvergadering gereconstrueerd.</p>
            <p>Maar het onderzoek is nog lang niet voorbij...</p>
            <button className="is-ready" type="button" onClick={() => setScreen("dossier2")}>
              <span>Dossier 02</span>
              <strong>Het geheime dossier</strong>
              <em>Ontgrendeld</em>
            </button>
            {banner ? <p className="mg-banner">{banner}</p> : null}
          </section>
        ) : null}

        {notice ? <p className="mg-bad">{notice}</p> : null}

        <nav className="mg-nav">
          <button type="button" onClick={() => setScreen("menu")}>
            Home
          </button>
          <button type="button" onClick={() => setPanel("evidence")}>
            Bewijs
          </button>
          <button type="button" onClick={() => setPanel("hints")}>
            Hints
          </button>
        </nav>

        {panel ? (
          <div className="mg-sheet" role="dialog" aria-modal="true">
            {panel === "evidence" ? (
              <>
                <h2>Bewijsinventaris</h2>
                {shownEvidence.length === 0 ? <p>Nog geen bewijs opgeslagen.</p> : null}
                {shownEvidence.map((item) => (
                  <article key={item.id}>
                    <h3>
                      Bewijs 0{item.id} · {item.title}
                    </h3>
                    <p>{item.text}</p>
                  </article>
                ))}
              </>
            ) : (
              <>
                <h2>Onderzoeksassistent</h2>
                {screen === "menu" || screen === "ending" || screen === "dossier2end" ? (
                  <p>Open een opdracht. De assistent helpt alleen bij de puzzel die openstaat.</p>
                ) : (
                  <>
                    <p>{hint.props}</p>
                    {hintLevel >= 2 ? <p>{hint.hint1}</p> : null}
                    {hintLevel >= 3 ? <p>{hint.hint2}</p> : null}
                    {hintLevel >= 4 && hint.hint3 ? <p>{hint.hint3}</p> : null}
                    <div className="mg-actions">
                      {hintLevel < 2 ? (
                        <button className="mg-yellow" type="button" onClick={() => openHintLevel(2)}>
                          Kleine aanwijzing
                        </button>
                      ) : null}
                      {hintLevel >= 2 && hintLevel < 3 ? (
                        <button className="mg-ghost" type="button" onClick={() => openHintLevel(3)}>
                          Duidelijke aanwijzing
                        </button>
                      ) : null}
                      {hint.hint3 && hintLevel >= 3 && hintLevel < 4 ? (
                        <button className="mg-ghost" type="button" onClick={() => openHintLevel(4)}>
                          Laatste aanwijzing
                        </button>
                      ) : null}
                    </div>
                  </>
                )}
              </>
            )}
            <button className="mg-ghost" type="button" onClick={() => setPanel(null)}>
              Sluiten
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function viewKey(teamId: string) {
  return `ado-view:${teamId}`;
}

function introKey(teamId: string) {
  return `ado-intro-seen:${teamId}`;
}

function defaultView(phase: Phase, stepIndex: number, completed: number): StoredView {
  if (dossier2Complete(phase, stepIndex)) {
    return { screen: "dossier2end", taskIndex: 2, dossierTask: 6, forcedDossierTask: null };
  }
  if (phase === "playing" && stepIndex >= 3) {
    const dossierTask = (stepIndex >= 4 ? 6 : 5) as 4 | 5 | 6;
    return { screen: "dossier2", taskIndex: 2, dossierTask, forcedDossierTask: dossierTask };
  }
  if (phase === "done") {
    return { screen: "ending", taskIndex: 2, dossierTask: 4, forcedDossierTask: null };
  }
  if (phase === "intro") {
    return { screen: "menu", taskIndex: 0, dossierTask: 4, forcedDossierTask: null };
  }
  return {
    screen: "task",
    taskIndex: Math.min(completed, 2),
    dossierTask: 4,
    forcedDossierTask: null,
  };
}

function restoreView(teamId: string, phase: Phase, stepIndex: number, completed: number): StoredView {
  const fallback = defaultView(phase, stepIndex, completed);
  try {
    const raw = window.localStorage.getItem(viewKey(teamId));
    if (!raw) return fallback;
    const stored = JSON.parse(raw) as Partial<StoredView>;
    const screen = stored.screen;
    if (!screen || !isScreen(screen)) return fallback;

    if (screen === "dossier2" || screen === "dossier2end") {
      if (!dossier1Complete(phase, stepIndex)) return fallback;
      if (screen === "dossier2end" && !dossier2Complete(phase, stepIndex)) {
        return { ...fallback, screen: "dossier2", forcedDossierTask: fallback.dossierTask };
      }
      const dossierTask = isDossierTask(stored.dossierTask) ? stored.dossierTask : fallback.dossierTask;
      return {
        screen,
        taskIndex: 2,
        dossierTask,
        forcedDossierTask: screen === "dossier2" ? dossierTask : null,
      };
    }

    if (screen === "ending") {
      if (!dossier1Complete(phase, stepIndex)) return fallback;
      return { screen: "ending", taskIndex: 2, dossierTask: 4, forcedDossierTask: null };
    }

    if (screen === "task" || screen === "briefing") {
      if (phase === "intro") return fallback;
      if (dossier2Complete(phase, stepIndex) || (phase === "playing" && stepIndex >= 3)) return fallback;
      const maxTask = Math.min(Math.max(completed, 0), 2);
      const taskIndex = typeof stored.taskIndex === "number" ? Math.min(Math.max(stored.taskIndex, 0), maxTask) : maxTask;
      return {
        screen: screen === "briefing" && taskIndex === 0 ? "briefing" : "task",
        taskIndex,
        dossierTask: 4,
        forcedDossierTask: null,
      };
    }

    if (screen === "menu") return { ...fallback, screen: "menu", forcedDossierTask: null };
  } catch {
    return fallback;
  }
  return fallback;
}

function saveView(teamId: string, view: StoredView) {
  window.localStorage.setItem(viewKey(teamId), JSON.stringify(view));
}

function isScreen(value: string): value is Screen {
  return value === "menu" || value === "briefing" || value === "task" || value === "ending" || value === "dossier2" || value === "dossier2end";
}

function isDossierTask(value: unknown): value is 4 | 5 | 6 {
  return value === 4 || value === 5 || value === 6;
}

function dossierStatus(id: number, dossier1Done: boolean, dossier2Done: boolean) {
  if (id === 2) {
    if (dossier2Done) return "Voltooid";
    if (dossier1Done) return "Ontgrendeld";
  }
  if (id === 3 && dossier2Done) return "Ontgrendeld";
  return "Vergrendeld";
}

type JumpTarget = {
  id: string;
  label: string;
  detail: string;
  screen: Screen;
  taskIndex: number;
  dossierTask: 4 | 5 | 6;
  step: number;
  phase: Phase;
};

const JUMPS: JumpTarget[] = [
  { id: "d1-1", label: "Dossier 01 · 1", detail: "Wie was aanwezig?", screen: "task", taskIndex: 0, dossierTask: 4, step: 0, phase: "playing" },
  { id: "d1-2", label: "Dossier 01 · 2", detail: "Ontbrekende notulen", screen: "task", taskIndex: 1, dossierTask: 4, step: 1, phase: "playing" },
  { id: "d1-3", label: "Dossier 01 · 3", detail: "Verborgen tijdcode", screen: "task", taskIndex: 2, dossierTask: 4, step: 2, phase: "playing" },
  { id: "d1-end", label: "Dossier 01 · eind", detail: "Overzicht bewijs", screen: "ending", taskIndex: 2, dossierTask: 4, step: 2, phase: "done" },
  { id: "d2-4", label: "Dossier 02 · 4", detail: "Vergelijk documenten", screen: "dossier2", taskIndex: 2, dossierTask: 4, step: 2, phase: "done" },
  { id: "d2-5", label: "Dossier 02 · 5", detail: "Toegangsarchief", screen: "dossier2", taskIndex: 2, dossierTask: 5, step: 3, phase: "playing" },
  { id: "d2-6", label: "Dossier 02 · 6", detail: "Ontbrekende document", screen: "dossier2", taskIndex: 2, dossierTask: 6, step: 4, phase: "playing" },
  { id: "d2-end", label: "Dossier 02 · eind", detail: "Dossier gesloten", screen: "dossier2end", taskIndex: 2, dossierTask: 6, step: 5, phase: "done" },
];
