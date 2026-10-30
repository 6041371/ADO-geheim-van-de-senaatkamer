"use client";

import { useMemo, useState } from "react";
import {
  PRESS_GAPS,
  PRESS_IDLE_SRC,
  PRESS_JOURNALISTS,
  PRESS_KEYWORDS,
  PRESS_QUESTIONS,
  pressGapsRestored,
  type PressVerdict,
} from "@/lib/level3";
import { playCorrect, playDenied } from "./sounds";

type Phase = "briefing" | "live" | "restore" | "done";

export function PressConference({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [phase, setPhase] = useState<Phase>("briefing");
  const [answered, setAnswered] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [verdict, setVerdict] = useState<PressVerdict | null>(null);
  const [feedback, setFeedback] = useState<"ok" | "bad" | null>(null);
  const [collected, setCollected] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string | null>>({
    "gap-1": null,
    "gap-2": null,
    "gap-3": null,
  });
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);

  const remaining = useMemo(
    () => PRESS_QUESTIONS.filter((q) => !answered.includes(q.id)),
    [answered],
  );
  const activeQuestion = PRESS_QUESTIONS.find((q) => q.id === activeId) ?? null;
  const activeJournalist = activeQuestion
    ? PRESS_JOURNALISTS.find((j) => j.id === activeQuestion.journalistId)
    : null;

  const waitingIds = useMemo(() => {
    const ids = new Set(remaining.map((q) => q.journalistId));
    return PRESS_JOURNALISTS.filter((j) => ids.has(j.id)).map((j) => j.id);
  }, [remaining]);

  function callOn(journalistId: string) {
    if (phase !== "live" || speaking || feedback) return;
    const question = remaining.find((q) => q.journalistId === journalistId);
    if (!question) return;
    setActiveId(question.id);
    setSpeaking(true);
    setVerdict(null);
    setFeedback(null);
  }

  const sceneSrc = speaking && activeJournalist ? activeJournalist.speakSrc : PRESS_IDLE_SRC;

  function answer(choice: PressVerdict) {
    if (!activeQuestion || feedback) return;
    setVerdict(choice);
    if (choice === activeQuestion.correct) {
      setFeedback("ok");
      playCorrect();
      if (activeQuestion.keywordId && !collected.includes(activeQuestion.keywordId)) {
        setCollected((current) => [...current, activeQuestion.keywordId!]);
      }
      return;
    }
    setFeedback("bad");
    playDenied();
  }

  function continueAfterAnswer() {
    if (!activeQuestion || feedback !== "ok") return;
    const nextAnswered = [...answered, activeQuestion.id];
    setAnswered(nextAnswered);
    setActiveId(null);
    setSpeaking(false);
    setVerdict(null);
    setFeedback(null);
    if (nextAnswered.length >= PRESS_QUESTIONS.length) {
      setCollected(PRESS_KEYWORDS.map((item) => item.id));
      setPhase("restore");
    }
  }

  function placeWord(gapId: string) {
    if (!selectedWord) return;
    setPlaced((current) => {
      const next = { ...current };
      for (const key of Object.keys(next)) {
        if (next[key] === selectedWord) next[key] = null;
      }
      next[gapId] = selectedWord;
      return next;
    });
    setSelectedWord(null);
    setRestoreMsg(null);
  }

  function checkRestore() {
    if (!pressGapsRestored(placed)) {
      setRestoreMsg("De volgorde klopt nog niet. Gebruik de drie sleutelwoorden op de juiste plek.");
      playDenied();
      return;
    }
    setRestoreMsg(null);
    playCorrect();
    setPhase("done");
  }

  const unusedWords = PRESS_KEYWORDS.filter(
    (word) => !Object.values(placed).includes(word.id),
  );

  return (
    <section className="mg-screen d3-screen press-room">
      <header className="mg-bar">
        <button className="mg-back" type="button" onClick={onBack} aria-label="Terug">
          ←
        </button>
        <div>
          <p className="mg-kicker">Dossier 03 · Opdracht 7</p>
          <h1>De Publicatiecheck</h1>
        </div>
        <div className="mg-step">
          <div className="mg-dots" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <i key={index} className={index === 0 ? "is-on" : ""} />
            ))}
          </div>
          <span>1/3</span>
        </div>
      </header>

      {phase === "briefing" ? (
        <>
          <div className="press-scene is-preview">
            <img src={PRESS_IDLE_SRC} alt="Perszaal ADO Den Haag vanuit de woordvoerdersstoel" />
          </div>
          <p className="mg-note">
            Je zit achter de microfoons. Drie journalisten steken hun hand op — kies zelf wie eerst mag. Beoordeel
            publicatie of intern, en herstel daarna de conceptpersverklaring met AKKOORD, STABILITEIT en LOCATIE.
          </p>
          <button className="mg-yellow mg-cta" type="button" onClick={() => setPhase("live")}>
            Neem plaats achter de tafel
          </button>
        </>
      ) : null}

      {phase === "live" || phase === "restore" || phase === "done" ? (
        <>
          <div className="press-progress" aria-label="Voortgang persconferentie">
            <span>
              Vragen {answered.length}/{PRESS_QUESTIONS.length}
            </span>
            <div className="d3-keyword-track">
              {PRESS_KEYWORDS.map((item) => (
                <span key={item.id} className={collected.includes(item.id) ? "is-on" : ""}>
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className={`press-scene${speaking ? " is-speaking" : " is-idle"}`}>
            <img
              key={sceneSrc}
              className="press-scene-photo"
              src={sceneSrc}
              alt={
                speaking
                  ? "Journalist stelt een vraag; anderen schrijven mee"
                  : "Drie journalisten steken de hand op in de ADO-perszaal"
              }
            />

            {PRESS_JOURNALISTS.map((journalist) => {
              const pending = remaining.some((q) => q.journalistId === journalist.id);
              const done = !pending;
              const isWaiting = pending && phase === "live" && !speaking && !feedback;
              const isActive = speaking && activeJournalist?.id === journalist.id;
              return (
                <button
                  key={journalist.id}
                  type="button"
                  className={`press-hotspot${isWaiting ? " is-waiting" : ""}${isActive ? " is-active" : ""}${done ? " is-done" : ""}`}
                  style={{
                    left: `${journalist.x}%`,
                    top: `${journalist.y}%`,
                    width: `${journalist.w}%`,
                    height: `${journalist.h}%`,
                  }}
                  aria-label={`${journalist.name}, ${journalist.outlet}${isWaiting ? " — steekt hand op" : ""}`}
                  disabled={phase !== "live" || done || Boolean(feedback) || (speaking && !isActive)}
                  onClick={() => callOn(journalist.id)}
                >
                  {isWaiting || isActive ? (
                    <span className="press-hand" aria-hidden="true">
                      ✋
                    </span>
                  ) : null}
                  {done ? <span className="press-check" aria-hidden="true">✓</span> : null}
                </button>
              );
            })}

            {speaking && activeQuestion && activeJournalist ? (
              <div
                className={`press-bubble is-${activeJournalist.bubbleSide}`}
                style={{
                  left: `${activeJournalist.x + activeJournalist.w / 2}%`,
                  top: `${Math.max(4, activeJournalist.y - 2)}%`,
                }}
              >
                <p className="press-bubble-meta">
                  {activeJournalist.name} · {activeJournalist.outlet}
                </p>
                <p>{activeQuestion.prompt}</p>
              </div>
            ) : null}
          </div>

          {phase === "live" && !speaking ? (
            <p className="mg-note press-hint">
              {remaining.length === 0
                ? "Alle vragen zijn beantwoord."
                : `${waitingIds.length} journalist${waitingIds.length === 1 ? "" : "en"} met hand omhoog — kies wie je het woord geeft.`}
            </p>
          ) : null}

          {phase === "live" && speaking && activeQuestion && activeJournalist ? (
            <div className="press-desk">
              <p className="mg-kicker">
                {activeJournalist.name} · {activeJournalist.outlet}
              </p>
              <p className="press-question">{activeQuestion.prompt}</p>
              <p className="press-ask">Mag dit openbaar, of blijft het intern?</p>
              <div className="press-verdicts">
                <button
                  type="button"
                  className={`is-pub${verdict === "publicatie" ? " is-on" : ""}`}
                  disabled={Boolean(feedback)}
                  onClick={() => answer("publicatie")}
                >
                  Geschikt voor publicatie
                </button>
                <button
                  type="button"
                  className={`is-int${verdict === "intern" ? " is-on" : ""}`}
                  disabled={Boolean(feedback)}
                  onClick={() => answer("intern")}
                >
                  Alleen intern
                </button>
              </div>
              {feedback === "bad" ? (
                <div className="mg-bad">
                  <p>{activeQuestion.feedbackBad}</p>
                  <button
                    className="mg-ghost"
                    type="button"
                    onClick={() => {
                      setFeedback(null);
                      setVerdict(null);
                    }}
                  >
                    Opnieuw kiezen
                  </button>
                </div>
              ) : null}
              {feedback === "ok" ? (
                <div className="mg-success">
                  <p>{activeQuestion.feedbackOk}</p>
                  <button className="mg-yellow mg-cta" type="button" onClick={continueAfterAnswer}>
                    {answered.length + 1 >= PRESS_QUESTIONS.length
                      ? "Herstel de persverklaring"
                      : "Geef het woord door"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {phase === "restore" || phase === "done" ? (
            <div className="press-restore">
              <p className="mg-note">
                Vul de drie sleutelwoorden in de zwartgelakte passages van de conceptpersverklaring.
              </p>
              <article className="d3-doc d3-doc-letter">
                <div className="d3-doc-letterhead">
                  <img src="/ado/logo.svg" alt="" />
                  <div>
                    <strong>ADO Den Haag</strong>
                    <span>Afdeling Communicatie</span>
                    <em>Cars Jeukenslaan 2 · Den Haag</em>
                  </div>
                  <b className="d3-stamp-ink">Concept</b>
                </div>
                <h2>Conceptpersverklaring</h2>
                <p className="d3-doc-body">
                  ADO Den Haag werkt aan de toekomst van de club. Het bestuur zoekt{" "}
                  <GapSlot
                    gapId="gap-1"
                    placed={placed}
                    selectedWord={selectedWord}
                    disabled={phase === "done"}
                    onPlace={placeWord}
                    onClear={() =>
                      setPlaced((current) => ({ ...current, "gap-1": null }))
                    }
                  />{" "}
                  met partners over het proces.
                </p>
                <p className="d3-doc-body">
                  De club kiest voor{" "}
                  <GapSlot
                    gapId="gap-2"
                    placed={placed}
                    selectedWord={selectedWord}
                    disabled={phase === "done"}
                    onPlace={placeWord}
                    onClear={() =>
                      setPlaced((current) => ({ ...current, "gap-2": null }))
                    }
                  />{" "}
                  richting supporters en stad, en blijft transparant over de{" "}
                  <GapSlot
                    gapId="gap-3"
                    placed={placed}
                    selectedWord={selectedWord}
                    disabled={phase === "done"}
                    onPlace={placeWord}
                    onClear={() =>
                      setPlaced((current) => ({ ...current, "gap-3": null }))
                    }
                  />{" "}
                  van het stadion — zonder vertrouwelijke details te delen.
                </p>
              </article>

              {phase === "restore" ? (
                <>
                  <p className="mg-kicker">Sleutelwoorden</p>
                  <div className="press-words">
                    {unusedWords.map((word) => (
                      <button
                        key={word.id}
                        type="button"
                        className={selectedWord === word.id ? "is-on" : ""}
                        onClick={() => setSelectedWord(word.id)}
                      >
                        {word.label}
                      </button>
                    ))}
                  </div>
                  {restoreMsg ? <p className="mg-bad">{restoreMsg}</p> : null}
                  <button className="mg-yellow mg-cta" type="button" onClick={checkRestore}>
                    Controleer persverklaring
                  </button>
                </>
              ) : (
                <div className="mg-success">
                  <p className="mg-kicker">Persconferentie afgerond</p>
                  <p>
                    De openbare lijn staat: AKKOORD, STABILITEIT en LOCATIE. Vertrouwelijke details bleven intern.
                  </p>
                  <button className="mg-yellow mg-cta" type="button" onClick={onNext}>
                    Volgende opdracht
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function GapSlot({
  gapId,
  placed,
  selectedWord,
  disabled,
  onPlace,
  onClear,
}: {
  gapId: string;
  placed: Record<string, string | null>;
  selectedWord: string | null;
  disabled: boolean;
  onPlace: (gapId: string) => void;
  onClear: () => void;
}) {
  const value = placed[gapId];
  const label = PRESS_KEYWORDS.find((item) => item.id === value)?.label;
  if (value && label) {
    return (
      <button className="press-gap is-filled" type="button" disabled={disabled} onClick={onClear}>
        {label}
      </button>
    );
  }
  const gap = PRESS_GAPS.find((item) => item.id === gapId);
  return (
    <button
      className={`press-gap${selectedWord ? " is-ready" : ""}`}
      type="button"
      disabled={disabled || !selectedWord}
      onClick={() => onPlace(gapId)}
      title={gap?.hint}
    >
      ……
    </button>
  );
}
