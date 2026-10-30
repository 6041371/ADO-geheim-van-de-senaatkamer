"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { DOSSIERS, EVIDENCE, HINTS, LOCKED_MESSAGE, completedTasks, type HintSet } from "@/lib/level1";
import { DOSSIER2_EVIDENCE, DOSSIER2_HINTS, dossier1Complete, dossier2Complete, dossier2DoneCount } from "@/lib/level2";
import type { Phase } from "@/lib/events/types";
import { firstWalkStepForLevel, type GameScreen } from "@/lib/walkthrough-jumps";
import { Logo } from "@/components/Logo";
import { Walkthrough } from "@/components/Walkthrough";
import { DossierThree } from "./DossierThree";
import { DossierTwo } from "./DossierTwo";
import { IntroFilm } from "./IntroFilm";
import { AttendanceTask, MinutesTask, RoomBriefing, TimeTask } from "./Tasks";

type Screen = GameScreen;

type StoredView = {
  screen: Screen;
  taskIndex: number;
  dossierTask: 4 | 5 | 6;
  forcedDossierTask: 4 | 5 | 6 | null;
  walkStep: number;
  embargoTask: 7 | 8 | 9;
};

const TASK_HINTS: HintSet[] = [HINTS.attendance, HINTS.minutes, HINTS.time];

export function PhaseOne({
  teamId,
  stepIndex,
  phase,
  notice,
  onProgress,
  onReplay,
  onLeave,
}: {
  teamId: string;
  stepIndex: number;
  phase: Phase;
  notice?: string | null;
  onProgress: (stepIndex: number, phase: Phase) => Promise<boolean>;
  onJump?: (stepIndex: number, phase: Phase) => Promise<boolean>;
  onReplay: () => Promise<boolean>;
  onLeave: () => void | Promise<void>;
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
  const [walkStep, setWalkStep] = useState(fallback.walkStep);
  const [embargoTask, setEmbargoTask] = useState<7 | 8 | 9>(fallback.embargoTask);
  const [startedAt] = useState(() => Date.now());
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
    setWalkStep(restored.walkStep);
    setEmbargoTask(restored.embargoTask);
    if (phase !== "intro") setIntroSeen(true);
    else setIntroSeen(window.localStorage.getItem(introKey(teamId)) === "1" || window.sessionStorage.getItem("ado-intro-seen") === "1");
    setReady(true);
    // Alleen bij (her)laden van dit team hervatten; niet bij elke voortgangs-update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  useEffect(() => {
    if (!ready) return;
    saveView(teamId, { screen, taskIndex, dossierTask, forcedDossierTask, walkStep, embargoTask });
  }, [ready, teamId, screen, taskIndex, dossierTask, forcedDossierTask, walkStep, embargoTask]);

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
    if (id === 3) {
      if (!dossier2Done) {
        setBanner(LOCKED_MESSAGE);
        return;
      }
      setBanner(null);
      setForcedDossierTask(null);
      setEmbargoTask(7);
      setScreen("dossier3");
      return;
    }
    if (id >= 4) {
      if (!dossier2Done) {
        setBanner(LOCKED_MESSAGE);
        return;
      }
      setBanner(null);
      setForcedDossierTask(null);
      setWalkStep(firstWalkStepForLevel(id));
      setScreen("walkthrough");
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

  function goHome() {
    setPanel(null);
    setBanner(null);
    setScreen("menu");
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
            <button
              className="mg-logo-exit"
              type="button"
              onClick={() => void onLeave()}
              aria-label="Terug naar beginscherm om een nieuwe room te starten"
              title="Nieuwe room"
            >
              <Logo className="mg-logo" />
            </button>
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
            <div className="mg-dossiers">
              {DOSSIERS.filter((dossier) => dossier.id > 1).map((dossier) => {
                const status = dossierStatus(dossier.id, dossier1Done, dossier2Done);
                return (
                  <button
                    key={dossier.id}
                    type="button"
                    className={status === "Vergrendeld" ? "is-locked" : "is-ready"}
                    onClick={() => void openDossier(dossier.id)}
                  >
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

        {screen === "briefing" ? <RoomBriefing onBack={goHome} onStart={() => setScreen("task")} /> : null}

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
            onBack={goHome}
            onSolved={() => solve(2, "playing")}
            onNext={() => {
              setTaskIndex(2);
            }}
          />
        ) : null}
        {screen === "task" && taskIndex === 2 ? (
          <TimeTask onBack={goHome} onSolved={() => solve(2, "done")} onFinished={() => setScreen("ending")} />
        ) : null}

        {screen === "dossier2" ? (
          <DossierTwo
            key={`d2-${stepIndex}-${forcedDossierTask ?? "flow"}`}
            phase={phase}
            stepIndex={stepIndex}
            onProgress={onProgress}
            onMenu={goHome}
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
            onMenu={goHome}
            onTask={rememberTask}
          />
        ) : null}

        {screen === "dossier3" ? (
          <DossierThree key={`d3-${embargoTask}`} startTask={embargoTask} onMenu={goHome} />
        ) : null}

        {screen === "walkthrough" ? (
          <section className="mg-walk">
            <Walkthrough startedAt={startedAt} stepIndex={walkStep} onStepIndex={setWalkStep} />
          </section>
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
          <button type="button" onClick={goHome}>
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
            ) : null}
            {panel === "hints" ? (
              <>
                <h2>Onderzoeksassistent</h2>
                {screen === "menu" || screen === "ending" || screen === "dossier2end" || screen === "dossier3" || screen === "walkthrough" ? (
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
            ) : null}
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
    return { screen: "dossier2end", taskIndex: 2, dossierTask: 6, forcedDossierTask: null, walkStep: 0, embargoTask: 7 };
  }
  if (phase === "playing" && stepIndex >= 3) {
    const dossierTask = (stepIndex >= 4 ? 6 : 5) as 4 | 5 | 6;
    return { screen: "dossier2", taskIndex: 2, dossierTask, forcedDossierTask: dossierTask, walkStep: 0, embargoTask: 7 };
  }
  if (phase === "done") {
    return { screen: "ending", taskIndex: 2, dossierTask: 4, forcedDossierTask: null, walkStep: 0, embargoTask: 7 };
  }
  if (phase === "intro") {
    return { screen: "menu", taskIndex: 0, dossierTask: 4, forcedDossierTask: null, walkStep: 0, embargoTask: 7 };
  }
  return {
    screen: "task",
    taskIndex: Math.min(completed, 2),
    dossierTask: 4,
    forcedDossierTask: null,
    walkStep: 0,
    embargoTask: 7,
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

    const walkStep = typeof stored.walkStep === "number" ? Math.max(0, stored.walkStep) : 0;
    const embargoTask = isEmbargoTask(stored.embargoTask) ? stored.embargoTask : 7;

    if (screen === "dossier3") {
      return { screen: "dossier3", taskIndex: 2, dossierTask: 6, forcedDossierTask: null, walkStep, embargoTask };
    }

    if (screen === "walkthrough") {
      return { screen: "walkthrough", taskIndex: 2, dossierTask: 6, forcedDossierTask: null, walkStep, embargoTask };
    }

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
        walkStep,
        embargoTask,
      };
    }

    if (screen === "ending") {
      if (!dossier1Complete(phase, stepIndex)) return fallback;
      return { screen: "ending", taskIndex: 2, dossierTask: 4, forcedDossierTask: null, walkStep, embargoTask };
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
        walkStep,
        embargoTask,
      };
    }

    if (screen === "menu") return { ...fallback, screen: "menu", forcedDossierTask: null, walkStep, embargoTask };
  } catch {
    return fallback;
  }
  return fallback;
}

function saveView(teamId: string, view: StoredView) {
  window.localStorage.setItem(viewKey(teamId), JSON.stringify(view));
}

function isScreen(value: string): value is Screen {
  return (
    value === "menu" ||
    value === "briefing" ||
    value === "task" ||
    value === "ending" ||
    value === "dossier2" ||
    value === "dossier2end" ||
    value === "dossier3" ||
    value === "walkthrough"
  );
}

function isDossierTask(value: unknown): value is 4 | 5 | 6 {
  return value === 4 || value === 5 || value === 6;
}

function isEmbargoTask(value: unknown): value is 7 | 8 | 9 {
  return value === 7 || value === 8 || value === 9;
}

function dossierStatus(id: number, dossier1Done: boolean, dossier2Done: boolean) {
  if (id === 2) {
    if (dossier2Done) return "Voltooid";
    if (dossier1Done) return "Ontgrendeld";
    return "Vergrendeld";
  }
  if (id === 3) {
    if (dossier2Done) return "Ontgrendeld";
    return "Vergrendeld";
  }
  if (id >= 4) {
    if (dossier2Done) return "Ontgrendeld";
    return "Vergrendeld";
  }
  return "Vergrendeld";
}
