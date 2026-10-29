"use client";

import { useEffect, useRef, useState } from "react";
import {
  FOLDERS,
  STAFF,
  STRIPS,
  dossier2DoneCount,
  folderIsConfidential,
  isHiddenConclusion,
  personIsTechnical,
  stripsAreConfidential,
} from "@/lib/level2";
import type { Phase } from "@/lib/events/types";
import { playCorrect, playDenied, playUnlocked } from "./sounds";

type Stage = "intro" | "task" | "ending";

export function DossierTwo({
  phase,
  stepIndex,
  onProgress,
  onMenu,
  onTask,
  startTask,
}: {
  phase: Phase;
  stepIndex: number;
  onProgress: (stepIndex: number, phase: Phase) => Promise<boolean>;
  onMenu: () => void;
  onTask: (task: 4 | 5 | 6) => void;
  startTask?: 4 | 5 | 6;
}) {
  const saved = dossier2DoneCount(phase, stepIndex);
  const [stage, setStage] = useState<Stage>(() => {
    if (saved >= 3) return "ending";
    if (startTask) return "task";
    return saved === 0 ? "intro" : "task";
  });
  const [task, setTask] = useState<4 | 5 | 6>(() => {
    if (startTask) return startTask;
    if (saved >= 2) return 6;
    if (saved === 1) return 5;
    return 4;
  });

  useEffect(() => {
    onTask(task);
  }, [onTask, task]);

  if (stage === "intro") {
    return (
      <section className="mg-screen d2-screen d2-intro">
        <div className="d2-desk" aria-hidden="true">
          <span className="d2-closed" />
        </div>
        <p className="mg-kicker">Dossier 02</p>
        <h1>Het geheime dossier</h1>
        <p>
          Tijdens de bestuursvergadering werden verschillende stadionplannen besproken. Niet alle documenten waren voor iedereen bestemd. Sommige informatie was openbaar, maar andere gegevens moesten strikt vertrouwelijk blijven.
        </p>
        <p>Jullie taak is om te ontdekken welk dossier geheim was, wie toegang had en welke informatie verborgen moest blijven.</p>
        <button
          className="mg-yellow mg-cta"
          type="button"
          onClick={() => {
            setTask(4);
            setStage("task");
          }}
        >
          Start onderzoek
        </button>
      </section>
    );
  }

  if (stage === "ending") {
    return <DossierEnding onMenu={onMenu} />;
  }

  if (task === 4) {
    return (
      <FolderTask
        onBack={() => (saved === 0 ? setStage("intro") : onMenu())}
        onSolved={async () => {
          const ok = await onProgress(3, "playing");
          if (!ok) return false;
          playCorrect();
          return true;
        }}
        onNext={() => setTask(5)}
      />
    );
  }

  if (task === 5) {
    return (
      <AccessTask
        onBack={onMenu}
        onSolved={async () => {
          const ok = await onProgress(4, "playing");
          if (!ok) return false;
          playUnlocked();
          return true;
        }}
        onNext={() => setTask(6)}
      />
    );
  }

  return (
    <CompareTask
      onBack={onMenu}
      onSolved={async () => {
        const ok = await onProgress(5, "done");
        if (!ok) return false;
        playCorrect();
        return true;
      }}
      onFinished={() => setStage("ending")}
    />
  );
}

function Bar({ kicker, title, step, onBack }: { kicker: string; title: string; step: number; onBack: () => void }) {
  return (
    <header className="mg-bar">
      <button className="mg-back" type="button" onClick={onBack} aria-label="Terug">
        ‹
      </button>
      <div>
        <p className="mg-kicker">{kicker}</p>
        <h1>{title}</h1>
      </div>
      <div className="mg-step">
        <span className="mg-dots" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <i key={index} className={index <= step ? "is-on" : ""} />
          ))}
        </span>
        <small>{step + 1}/3</small>
      </div>
    </header>
  );
}

const FOLDER_BOX: Record<string, { l: string; t: string; w: string; h: string; wl: string; wt: string; ww: string; wh: string }> = {
  a: { l: "5.2%", t: "21%", w: "30.4%", h: "57.5%", wl: "0.052", wt: "0.21", ww: "0.304", wh: "0.575" },
  b: { l: "36.2%", t: "20.5%", w: "27.4%", h: "58%", wl: "0.362", wt: "0.205", ww: "0.274", wh: "0.58" },
  c: { l: "65.4%", t: "21%", w: "29.2%", h: "57.5%", wl: "0.654", wt: "0.21", ww: "0.292", wh: "0.575" },
};

function DeskArt({
  picked,
  badId,
  seen = [],
  onChoose,
}: {
  picked?: string | null;
  badId?: string | null;
  seen?: readonly string[];
  onChoose?: (id: string) => void;
}) {
  return (
    <div className="d2-scene d2-scene-art">
      <img src="/ado/bureau-drie.jpg" alt="" />
      <div className="d2-hotspots">
        {FOLDERS.map((item) => {
          const box = FOLDER_BOX[item.id];
          return (
            <button
              key={item.id}
              type="button"
              className={`d2-hot is-${item.id}${picked === item.id ? " is-picked" : ""}${badId === item.id ? " is-bad" : ""}`}
              style={{ left: box.l, top: box.t, width: box.w, height: box.h, ["--wl" as string]: box.wl, ["--wt" as string]: box.wt, ["--ww" as string]: box.ww, ["--wh" as string]: box.wh }}
              aria-label={`Map ${item.id.toUpperCase()}, ${item.title}${seen.includes(item.id) ? ", bekeken" : ""}`}
              onClick={onChoose ? () => onChoose(item.id) : undefined}
              disabled={!onChoose}
            >
              <span className="d2-lift" aria-hidden="true">
                <img src="/ado/bureau-drie.jpg" alt="" />
              </span>
              {seen.includes(item.id) ? <span className="d2-tick" aria-hidden="true">✓</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FolderTask({
  onBack,
  onSolved,
  onNext,
}: {
  onBack: () => void;
  onSolved: () => Promise<boolean>;
  onNext: () => void;
}) {
  const [mode, setMode] = useState<"investigate" | "answer">("investigate");
  const [review, setReview] = useState(false);
  const [viewed, setViewed] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [pending, setPending] = useState(false);
  const [arrived, setArrived] = useState(false);
  const folder = FOLDERS.find((item) => item.id === open);
  const reading = mode === "investigate" || review;

  useEffect(() => {
    if (!arrived) return;
    const timer = window.setTimeout(() => setArrived(false), 800);
    return () => window.clearTimeout(timer);
  }, [arrived]);

  function closeFolder() {
    if (!open) return;
    const next = viewed.includes(open) ? viewed : [...viewed, open];
    setViewed(next);
    setOpen(null);
    if (!review && next.length === 3) {
      setMode("answer");
      setArrived(true);
    }
  }

  async function check() {
    if (!picked || !folderIsConfidential(picked)) {
      setWrong(true);
      playDenied();
      return;
    }
    setPending(true);
    const saved = await onSolved();
    setPending(false);
    if (!saved) return;
    setWrong(false);
    setCorrect(true);
  }

  return (
    <section className="mg-screen d2-screen">
      <Bar kicker="Dossier 02" title="Opdracht 4" step={0} onBack={onBack} />
      {!open && !correct ? (
        <>
          <p className="d2-count">Dossiers onderzocht: {viewed.length}/3</p>
          {reading ? (
            <div className="d2-chip">
              <strong>Onderzoek de drie dossiers</strong>
              <p>Open alle drie de dossiermappen en lees de informatie. Vergelijk de gegevens met het fysieke stadiondossier op tafel.</p>
            </div>
          ) : (
            <div className={`d2-chip${arrived ? " d2-arrive" : ""}`}>
              <strong>Alle dossiers onderzocht</strong>
              <p>Jullie hebben alle drie de dossiers bekeken. Vergelijk de informatie met het fysieke stadiondossier en bepaal welke map overeenkomt met het vertrouwelijke document.</p>
              <p>Welke map bevat het vertrouwelijke stadiondossier?</p>
            </div>
          )}
          <DeskArt
            seen={viewed}
            picked={reading ? null : picked}
            badId={wrong ? picked : null}
            onChoose={(id) => {
              if (reading) {
                setOpen(id);
                return;
              }
              setPicked(id);
              setWrong(false);
            }}
          />
          {reading && review ? (
            <button className="mg-yellow mg-cta" type="button" onClick={() => setReview(false)}>
              Terug naar antwoord
            </button>
          ) : null}
          {!reading && wrong ? (
            <>
              <p className="mg-bad">Dit dossier komt niet volledig overeen met het fysieke stadiondossier. Vergelijk de inhoudsopgave, datum en versie opnieuw.</p>
              <button className="mg-yellow mg-cta" type="button" onClick={() => { setWrong(false); setPicked(null); }}>
                Opnieuw kiezen
              </button>
              <button className="d2-text" type="button" onClick={() => { setWrong(false); setReview(true); }}>
                Mappen opnieuw bekijken
              </button>
            </>
          ) : null}
          {!reading && !wrong ? (
            <>
              <button className="mg-yellow mg-cta" type="button" disabled={pending || viewed.length < 3 || !picked} onClick={() => void check()}>
                Controleer antwoord
              </button>
              <button className="d2-text" type="button" onClick={() => setReview(true)}>
                Mappen opnieuw bekijken
              </button>
            </>
          ) : null}
        </>
      ) : null}
      {folder && !correct ? (
        <article className={`d2-paper is-${folder.tone} d2-open`}>
          <p className="d2-map">Map {folder.id.toUpperCase()}</p>
          <h2>{folder.title}</h2>
          <span className="d2-clip is-on-paper" aria-hidden="true" />
          <img className="d2-sheet-logo" src="/ado/logo.svg" alt="" />
          <dl>
            <div><dt>Dossiernummer</dt><dd>{folder.number}</dd></div>
            <div><dt>Datum</dt><dd>{folder.date}</dd></div>
            {"version" in folder ? <div><dt>Versie</dt><dd>{folder.version}</dd></div> : null}
            <div><dt>Status</dt><dd>{folder.status}</dd></div>
            <div><dt>Opgesteld door</dt><dd>{folder.author}</dd></div>
          </dl>
          <h3>Inhoud</h3>
          <ul>
            {folder.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <p>{folder.note}</p>
          <button className="d2-close" type="button" onClick={closeFolder}>
            Sluit map
          </button>
        </article>
      ) : null}
      {correct ? (
        <div className="d2-result is-good">
          <p className="d2-mark" aria-hidden="true">✓</p>
          <img className="d2-reveal" src="/ado/map-vertrouwelijk.jpg" alt="De vertrouwelijke dossiermap" />
          <h2>Dossier geïdentificeerd</h2>
          <p>Jullie hebben het juiste stadiondossier gevonden. De documentgegevens en inhoud komen overeen met het fysieke bewijsstuk.</p>
          <button className="mg-yellow mg-cta" type="button" onClick={onNext}>
            Volgende opdracht
          </button>
        </div>
      ) : null}
    </section>
  );
}

const PASS_FILE: Record<string, string> = {
  marcel: "marcel-de-vries",
  karin: "karin-bos",
  tom: "tom-albers",
  sophie: "sophie-van-rijn",
};

function AccessTask({
  onBack,
  onSolved,
  onNext,
}: {
  onBack: () => void;
  onSolved: () => Promise<boolean>;
  onNext: () => void;
}) {
  const [choice, setChoice] = useState<string | null>(null);
  const [phase, setPhase] = useState<"pick" | "scan" | "bad" | "good">("pick");
  const solveRef = useRef(onSolved);
  solveRef.current = onSolved;
  const pass = STAFF.find((person) => person.id === choice);

  useEffect(() => {
    if (phase !== "scan" || !choice) return;
    let cancel = false;
    const timer = window.setTimeout(() => {
      if (!personIsTechnical(choice)) {
        setPhase("bad");
        playDenied();
        return;
      }
      void solveRef.current().then((saved) => {
        if (cancel) return;
        if (!saved) {
          setPhase("pick");
          return;
        }
        setPhase("good");
        playCorrect();
      });
    }, 2500);
    return () => {
      cancel = true;
      window.clearTimeout(timer);
    };
  }, [phase, choice]);

  return (
    <section className="mg-screen d2-screen">
      <Bar kicker="Dossier 02" title="Opdracht 5" step={1} onBack={onBack} />
      <p className="mg-kicker">ADO Den Haag · intern toegangssysteem</p>
      <h2>Toegangsarchief</h2>
      <p>Bekijk het stadiondossier en de transcriptie van het bestuursgesprek. Scan daarna de toegangspas van de medewerker die rechtstreeks betrokken was bij de technische stadioninformatie.</p>
      <div className="d2-passes">
        {STAFF.map((person) => (
          <button
            key={person.id}
            type="button"
            className={choice === person.id ? "is-on" : ""}
            disabled={phase === "scan" || phase === "good"}
            onClick={() => {
              setChoice(person.id);
              if (phase === "bad") setPhase("pick");
            }}
          >
            <img src={`/ado/passes/${PASS_FILE[person.id]}.png`} alt={`${person.name}, ${person.role}`} />
          </button>
        ))}
      </div>
      <div className={`d2-scanner${phase === "scan" ? " is-scanning" : ""}${phase === "good" ? " is-good" : ""}`}>
        <p className="mg-kicker">Technisch stadionarchief</p>
        {pass ? <img src={`/ado/passes/${PASS_FILE[pass.id]}.png`} alt="" /> : <p className="d2-scan-empty">Selecteer een toegangspas.</p>}
        {phase === "scan" ? (
          <>
            <span className="d2-corner is-tl" />
            <span className="d2-corner is-tr" />
            <span className="d2-corner is-bl" />
            <span className="d2-corner is-br" />
            <span className="d2-laser" />
            <p className="d2-scan-label">Identiteit controleren...</p>
          </>
        ) : null}
      </div>
      {phase === "bad" ? (
        <div className="mg-bad">
          <strong>Toegang niet aangetoond</strong>
          <p>Deze medewerker is niet rechtstreeks gekoppeld aan het technische stadionarchief. Onderzoek de documenten opnieuw.</p>
        </div>
      ) : null}
      {phase === "good" ? (
        <div className="mg-success">
          <p className="d2-mark" aria-hidden="true">✓</p>
          <h2>Toegang bevestigd</h2>
          <p>Tom Albers was als technisch adviseur rechtstreeks betrokken bij de technische stadionplannen. Dit bewijst nog niet dat hij verantwoordelijk is voor het informatielek.</p>
          <button className="mg-yellow mg-cta" type="button" onClick={onNext}>
            Verder met onderzoek
          </button>
        </div>
      ) : (
        <button className="mg-yellow mg-cta" type="button" disabled={!choice || phase === "scan"} onClick={() => setPhase("scan")}>
          Scan toegangspas
        </button>
      )}
    </section>
  );
}

function CompareTask({
  onBack,
  onSolved,
  onFinished,
}: {
  onBack: () => void;
  onSolved: () => Promise<boolean>;
  onFinished: () => void;
}) {
  const [chosen, setChosen] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState("");
  const [wrongStrips, setWrongStrips] = useState(false);
  const [wrongText, setWrongText] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [pending, setPending] = useState(false);

  function toggle(id: string) {
    setWrongStrips(false);
    setChecked(false);
    setChosen((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  }

  function checkStrips() {
    if (!stripsAreConfidential(chosen)) {
      setWrongStrips(true);
      playDenied();
      return;
    }
    setWrongStrips(false);
    setChecked(true);
    playCorrect();
  }

  async function checkText() {
    if (!isHiddenConclusion(answer)) {
      setWrongText(true);
      playDenied();
      return;
    }
    setPending(true);
    const saved = await onSolved();
    setPending(false);
    if (!saved) return;
    setWrongText(false);
    setCorrect(true);
  }

  return (
    <section className="mg-screen d2-screen">
      <Bar kicker="Dossier 02" title="Opdracht 6" step={2} onBack={onBack} />
      <h2>Het ontbrekende document</h2>
      <div className="d2-compare" aria-label="Vergelijk interne versie met persversie">
        <article className="d2-doc-card is-internal">
          <header>
            <span>Interne versie</span>
            <b className="d2-stamp">Vertrouwelijk</b>
          </header>
          <strong>Stadiondossier SD-2023-10</strong>
          <em>Volledig · alleen voor bestuur</em>
          <ul>
            <li>Locatieopties</li>
            <li>Financiële onderbouwing</li>
            <li>Risicoanalyse</li>
            <li>Technische specificaties</li>
          </ul>
        </article>
        <i className="d2-glass" aria-hidden="true" />
        <article className="d2-doc-card is-press">
          <header>
            <span>Persversie</span>
            <b className="d2-badge">Goedgekeurd</b>
          </header>
          <strong>Conceptpersverklaring</strong>
          <em>Beperkte openbare inhoud</em>
          <ul>
            <li>Algemene toekomstplannen</li>
            <li className="is-redacted">████████████</li>
            <li className="is-redacted">████████████</li>
            <li className="is-redacted">████████████</li>
          </ul>
        </article>
      </div>
      <p className="mg-note">De interne stadionplannen bevatten meer informatie dan de documenten die voor de pers bedoeld waren. Vergelijk de fysieke documenten en ontdek welke gegevens bewust niet openbaar mochten worden gemaakt.</p>
      {!checked ? (
        <>
          <div className="d2-strips">
            {STRIPS.map((strip) => (
              <button key={strip.id} type="button" className={chosen.includes(strip.id) ? "is-on" : ""} onClick={() => toggle(strip.id)}>
                {strip.label}
              </button>
            ))}
          </div>
          <p>{chosen.length} van 3 gekozen</p>
          {wrongStrips ? <p className="mg-bad">Vergelijking onvolledig. Controleer welke informatie in de interne documenten staat, maar niet in de goedgekeurde communicatie.</p> : null}
          <button className="mg-yellow mg-cta" type="button" disabled={chosen.length !== 3} onClick={checkStrips}>
            Controleer selectie
          </button>
        </>
      ) : null}
      {checked && !correct ? (
        <form
          className="mg-answer"
          onSubmit={(event) => {
            event.preventDefault();
            void checkText();
          }}
        >
          <p className="mg-kicker">Welke informatie mocht niet openbaar worden gemaakt?</p>
          <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Schrijf de conclusie in een korte zin..." />
          {wrongText ? <p className="mg-bad">Vergelijking onvolledig. Controleer welke informatie in de interne documenten staat, maar niet in de goedgekeurde communicatie.</p> : null}
          <button className="mg-yellow mg-cta" type="submit" disabled={pending || answer.trim().length < 12}>
            Controleer antwoord
          </button>
        </form>
      ) : null}
      {correct ? (
        <div className="mg-success">
          <p className="d2-stamp">Vertrouwelijk</p>
          <p className="mg-kicker">Vergelijking voltooid</p>
          <p>Jullie hebben vastgesteld dat de interne stadiondocumenten informatie bevatten die niet in de openbare communicatie mocht worden opgenomen.</p>
          <button className="mg-yellow mg-cta" type="button" onClick={onFinished}>
            Dossier afronden
          </button>
        </div>
      ) : null}
    </section>
  );
}

function DossierEnding({ onMenu }: { onMenu: () => void }) {
  return (
    <section className="mg-screen d2-screen d2-ending">
      <div className="d2-desk" aria-hidden="true">
        <span className="d2-closed is-shut" />
      </div>
      <p className="mg-kicker">Dossier 02 voltooid</p>
      <h1>Het geheime dossier is gesloten</h1>
      <ul>
        <li>Bewijs 04 · Het stadiondossier SD-2023-10 is vertrouwelijk.</li>
        <li>Bewijs 05 · Tom Albers was betrokken bij de technische plannen.</li>
        <li>Bewijs 06 · Interne informatie mocht niet zonder goedkeuring naar buiten.</li>
      </ul>
      <p>Jullie hebben ontdekt dat er meerdere versies van het stadiondossier bestonden. De vertrouwelijke versie bevatte informatie die nooit buiten de Senaatskamer mocht komen. Maar wanneer mocht de informatie eigenlijk openbaar worden?</p>
      <p className="mg-kicker">Volgend dossier: Het embargo</p>
      <button className="mg-yellow mg-cta" type="button" onClick={onMenu}>
        Terug naar dossiers
      </button>
    </section>
  );
}
