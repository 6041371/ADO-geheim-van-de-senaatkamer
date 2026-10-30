"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LEAK_CORRECT,
  MEMORY_SECONDS,
  PRESS_KEYWORDS,
  PRESS_QUESTIONS,
  PROTOCOL_CHOICES,
  PROTOCOL_CORRECT,
  buildMemoryDeck,
  type MemoryCard,
} from "@/lib/level3";
import { shuffle } from "@/lib/shuffle";
import { playCorrect, playDenied } from "./sounds";

type Task = 7 | 8 | 9;

export function DossierThree({
  onMenu,
  onComplete,
  startTask = 7,
}: {
  onMenu: () => void;
  onComplete: () => Promise<boolean>;
  startTask?: Task;
}) {
  const [task, setTask] = useState<Task>(startTask);

  if (task === 7) {
    return <PressTask onBack={onMenu} onNext={() => setTask(8)} />;
  }
  if (task === 8) {
    return <ProtocolTask onBack={onMenu} onNext={() => setTask(9)} />;
  }
  return (
    <LeakTask
      onBack={onMenu}
      onFinished={() => {
        void onComplete();
      }}
    />
  );
}

function Bar({
  kicker,
  title,
  step,
  onBack,
}: {
  kicker: string;
  title: string;
  step: number;
  onBack: () => void;
}) {
  return (
    <header className="mg-bar">
      <button className="mg-back" type="button" onClick={onBack} aria-label="Terug">
        ←
      </button>
      <div>
        <p className="mg-kicker">{kicker}</p>
        <h1>{title}</h1>
      </div>
      <div className="mg-step">
        <div className="mg-dots" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <i key={index} className={index <= step ? "is-on" : ""} />
          ))}
        </div>
        <span>
          {step + 1}/3
        </span>
      </div>
    </header>
  );
}

const PRESS_PUBLICATION_CHOICES = [
  { id: "algemeen", label: "Alleen de algemene toekomstplannen" },
  { id: "financieel", label: "De financiële ramingen" },
  { id: "technisch", label: "De technische details van het stadiondossier" },
] as const;

const PRESS_PUBLICATION_CORRECT = "algemeen";

type PressPhase = "briefing" | "qa" | "keywords" | "document";

function PressTask({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [phase, setPhase] = useState<PressPhase>("briefing");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [collected, setCollected] = useState<string[]>([]);
  const [docChoice, setDocChoice] = useState<string | null>(null);
  const [docWrong, setDocWrong] = useState(false);
  const [docCorrect, setDocCorrect] = useState(false);
  const [opened, setOpened] = useState(false);
  const question = PRESS_QUESTIONS[questionIndex];
  const options = useMemo(() => shuffle([...question.choices]), [question.id]);
  const docOptions = useMemo(() => shuffle(PRESS_PUBLICATION_CHOICES), []);

  function checkQuestion() {
    if (!choice || !question) return;
    if (choice === question.correctId) {
      setWrong(false);
      setRevealed(true);
      if (question.keywordId && !collected.includes(question.keywordId)) {
        setCollected((current) => [...current, question.keywordId!]);
      }
      playCorrect();
      return;
    }
    setWrong(true);
    playDenied();
  }

  function nextQuestion() {
    if (questionIndex >= PRESS_QUESTIONS.length - 1) {
      setPhase("keywords");
      return;
    }
    setQuestionIndex((value) => value + 1);
    setChoice(null);
    setWrong(false);
    setRevealed(false);
  }

  function checkDocument() {
    if (!docChoice) return;
    if (docChoice === PRESS_PUBLICATION_CORRECT) {
      setDocWrong(false);
      setDocCorrect(true);
      playCorrect();
      return;
    }
    setDocWrong(true);
    playDenied();
  }

  if (phase === "briefing") {
    return (
      <section className="mg-screen d3-screen">
        <Bar kicker="Dossier 03 · Opdracht 7" title="Persconferentie" step={0} onBack={onBack} />
        <img className="mg-hero d3-press-hero" src="/ado/senaatskamer.jpg" alt="De Senaatskamer vóór de persconferentie" />
        <section className="mg-block">
          <p className="mg-kicker">Officiële persconferentie</p>
          <p>
            Jullie staan voor de microfoons. Zes journalisten stellen vragen. Antwoord volgens het embargo: alleen
            wat openbaar mag. Drie sleutelwoorden worden vastgelegd voor de conceptpersverklaring.
          </p>
        </section>
        <button className="mg-yellow mg-cta" type="button" onClick={() => setPhase("qa")}>
          Start persconferentie
        </button>
      </section>
    );
  }

  if (phase === "qa" && question) {
    return (
      <section className="mg-screen d3-screen">
        <Bar
          kicker={`Dossier 03 · Opdracht 7 · Vraag ${questionIndex + 1}/${PRESS_QUESTIONS.length}`}
          title="Persconferentie"
          step={0}
          onBack={onBack}
        />
        <div className="d3-press-live">
          <span className="d3-live-dot" aria-hidden="true" />
          <strong>Live</strong>
          <span>{question.journalist}</span>
        </div>
        <div className="d3-keyword-track" aria-label="Verzamelde sleutelwoorden">
          {PRESS_KEYWORDS.map((item) => (
            <span key={item.id} className={collected.includes(item.id) ? "is-on" : ""}>
              {item.label}
            </span>
          ))}
        </div>
        <article className="d3-press-card">
          <p className="mg-kicker">Vraag van {question.journalist}</p>
          <h2>{question.prompt}</h2>
          <div className="d3-choices">
            {options.map((item) => (
              <button
                key={item.id}
                type="button"
                className={choice === item.id ? "is-on" : ""}
                disabled={revealed}
                onClick={() => {
                  setChoice(item.id);
                  setWrong(false);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          {wrong ? <p className="mg-bad">Blijf bij de goedgekeurde boodschap. Wat mocht openbaar?</p> : null}
          {revealed ? <p className="mg-success-inline">{question.reveal}</p> : null}
          {!revealed ? (
            <button className="mg-yellow mg-cta" type="button" disabled={!choice} onClick={checkQuestion}>
              Beantwoord
            </button>
          ) : (
            <button className="mg-yellow mg-cta" type="button" onClick={nextQuestion}>
              {questionIndex >= PRESS_QUESTIONS.length - 1 ? "Rond persconferentie af" : "Volgende journalist"}
            </button>
          )}
        </article>
      </section>
    );
  }

  if (phase === "keywords") {
    return (
      <section className="mg-screen d3-screen">
        <Bar kicker="Dossier 03 · Opdracht 7" title="Persconferentie afgerond" step={0} onBack={onBack} />
        <article className="d3-press-done">
          <img src="/ado/logo.svg" alt="" />
          <p className="mg-kicker">Conceptpersverklaring</p>
          <strong>Concept</strong>
          <div className="d3-note-chips">
            {PRESS_KEYWORDS.map((item) => (
              <span key={item.id}>{item.label}</span>
            ))}
          </div>
        </article>
        <p className="mg-note">
          Jullie hebben alle zes de vragen beantwoord. Tijdens de persconferentie zijn drie sleutelwoorden
          verzameld. Maar er ontbreekt nog iets in de conceptpersverklaring. Onderzoek de zwartgelakte passages.
        </p>
        <button className="mg-yellow mg-cta" type="button" onClick={() => setPhase("document")}>
          Open conceptpersverklaring
        </button>
      </section>
    );
  }

  return (
    <section className="mg-screen d3-screen">
      <Bar kicker="Dossier 03 · Opdracht 7" title="Conceptpersverklaring" step={0} onBack={onBack} />
      <p className="mg-note">
        Bekijk de conceptpersverklaring. De zwartgelakte stukken bleven intern. Open daarna de sleutelwoorden van de
        persconferentie en beantwoord de publicatiecheck.
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
        <p className="d3-doc-ref">COM-2023-10 · bestemd voor officiële vrijgave na bestuursbesluit</p>
        <h2>Conceptpersverklaring</h2>
        <p className="d3-doc-body">
          ADO Den Haag werkt aan de toekomst van de club. Het bestuur bereidt plannen voor rondom de ontwikkeling van
          het stadion en de clubfaciliteiten.
        </p>
        <p className="d3-doc-body">
          In deze fase worden alleen algemene toekomstplannen gedeeld. Financiële ramingen en technische details van
          het stadiondossier blijven intern totdat een definitief besluit is genomen.
        </p>
        <div className="d3-redact-block" aria-label="Zwartgelakte interne passages">
          <span>Zwartgelakt · niet voor publicatie</span>
          <i />
          <i />
          <i />
        </div>
        <footer className="d3-doc-foot">
          <span>Pagina 1 van 1</span>
          <span>Alleen voor intern gebruik tot vrijgave</span>
        </footer>
      </article>

      <button className="d3-reveal" type="button" onClick={() => setOpened((value) => !value)}>
        {opened ? "Verberg sleutelwoorden" : "Toon sleutelwoorden van de persconferentie"}
      </button>

      {opened ? (
        <div className="d3-notes" role="list">
          <header>
            <p className="mg-kicker">Persconferentie · vastgelegd</p>
            <span>Notitieblok communicatie</span>
          </header>
          <div className="d3-note-chips">
            {PRESS_KEYWORDS.map((item) => (
              <span key={item.id} role="listitem">
                {item.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="d3-ask">
        <p className="mg-kicker">Publicatiecheck</p>
        <p>Wat mocht volgens de afspraken openbaar worden gemaakt?</p>
        <div className="d3-choices">
          {docOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              className={docChoice === item.id ? "is-on" : ""}
              onClick={() => {
                setDocChoice(item.id);
                setDocWrong(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        {docWrong ? (
          <p className="mg-bad">Klopt niet. Kijk opnieuw wat in de conceptverklaring openbaar mocht en wat zwartgelakt bleef.</p>
        ) : null}
        {!docCorrect ? (
          <button className="mg-yellow mg-cta" type="button" disabled={!docChoice} onClick={checkDocument}>
            Controleer antwoord
          </button>
        ) : null}
      </div>

      {docCorrect ? (
        <div className="mg-success">
          <p className="mg-kicker">Persconferentie afgerond</p>
          <p>
            Alleen de algemene toekomstplannen mochten openbaar. De zwarte passages in de conceptverklaring horen bij
            informatie die nog intern bleef.
          </p>
          <button className="mg-yellow mg-cta" type="button" onClick={onNext}>
            Volgende opdracht
          </button>
        </div>
      ) : null}
    </section>
  );
}

function ProtocolTask({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [zoom, setZoom] = useState<"memo" | "paper" | null>(null);
  const options = useMemo(() => shuffle(PROTOCOL_CHOICES), []);

  function check() {
    if (!choice) return;
    if (choice === PROTOCOL_CORRECT) {
      setWrong(false);
      setCorrect(true);
      playCorrect();
      return;
    }
    setWrong(true);
    playDenied();
  }

  return (
    <section className="mg-screen d3-screen">
      <Bar kicker="Dossier 03 · Opdracht 8" title="Communicatieprotocol" step={1} onBack={onBack} />
      <p className="mg-note">
        Vergelijk de interne memo met het nieuwsbericht. Welke communicatieregel is mogelijk overtreden?
      </p>

      <div className="d3-split">
        <article className="d3-doc d3-doc-memo">
          <div className="d3-memo-top">
            <span>ADO Den Haag · Bestuurssecretariaat</span>
            <b className="d3-stamp-ink">Vertrouwelijk</b>
          </div>
          <h3>Interne memo</h3>
          <p className="d3-doc-ref">Communicatieprotocol · 10 oktober 2023</p>
          <ol className="d3-memo-list">
            <li>
              <strong>01 · Aanleiding</strong>
              <span>Stadionplannen staan op de agenda van de bestuursvergadering.</span>
            </li>
            <li>
              <strong>02 · Besluitvorming</strong>
              <span className="d3-line-blackout" aria-hidden="true" />
            </li>
            <li>
              <strong>03 · Communicatie</strong>
              <span className="d3-line-blackout" aria-hidden="true" />
            </li>
            <li>
              <strong>04 · Vertrouwelijkheid</strong>
              <span>Alleen voor bestuursleden. Niet kopiëren of delen vóór een definitief besluit.</span>
            </li>
          </ol>
          <button className="d3-doc-link" type="button" onClick={() => setZoom("memo")}>
            Lees memo volledig
          </button>
        </article>

        <article className="d3-doc d3-doc-news">
          <header className="d3-news-mast">
            <strong>Haags Dagblad</strong>
            <span>Ochtendeditie · vóór officiële vrijgave</span>
          </header>
          <b className="d3-stamp-ink is-warn">Embargo?</b>
          <h3>ADO Den Haag zet grote stap richting nieuw stadion</h3>
          <p className="d3-news-lead">
            Bronnen melden concrete locatieopties en technische keuzes die nog niet officieel zijn gedeeld.
          </p>
          <p className="d3-doc-body">
            Het bericht bevat details die niet in de goedgekeurde persverklaring stonden. Clubwoordvoerders wilden nog
            niet reageren.
          </p>
          <button className="d3-doc-link" type="button" onClick={() => setZoom("paper")}>
            Lees artikel volledig
          </button>
        </article>
      </div>

      <div className="d3-ask">
        <p className="mg-kicker">Welke communicatieregel is mogelijk overtreden?</p>
        <p>Bekijk de fysieke interne memo. Welke afspraak was gemaakt over het delen van informatie?</p>
        <div className="d3-choices">
          {options.map((item) => (
            <button
              key={item.id}
              type="button"
              className={choice === item.id ? "is-on" : ""}
              onClick={() => {
                setChoice(item.id);
                setWrong(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        {wrong ? <p className="mg-bad">Klopt niet. Vergelijk de memo met wat al in de krant stond.</p> : null}
        {!correct ? (
          <button className="mg-yellow mg-cta" type="button" disabled={!choice} onClick={check}>
            Controleer antwoord
          </button>
        ) : null}
      </div>

      {correct ? (
        <div className="mg-success">
          <p className="mg-kicker">Vertrouwelijke communicatieregel gevonden</p>
          <p>
            Informatie moest intern blijven tot een definitief besluit. Het nieuwsbericht roept vragen op: om te
            bewijzen dat het embargo is geschonden, is meer nodig.
          </p>
          <button className="mg-yellow mg-cta" type="button" onClick={onNext}>
            Volgende opdracht
          </button>
        </div>
      ) : null}

      {zoom ? (
        <div className="d3-zoom" role="dialog" aria-modal="true">
          <div className={`d3-zoom-sheet${zoom === "paper" ? " is-news" : ""}`}>
            {zoom === "memo" ? (
              <>
                <p className="mg-kicker">Interne memo · volledig</p>
                <h3>Communicatieprotocol</h3>
                <p>
                  Vertrouwelijke informatie mag niet extern worden gedeeld voordat een definitief besluit is genomen.
                  Externe vragen lopen via de woordvoerder.
                </p>
                <p>
                  Tot die tijd blijft het stadiondossier uitsluitend beschikbaar voor bestuursleden en de aangewezen
                  communicatiecoördinator.
                </p>
              </>
            ) : (
              <>
                <p className="d3-news-mast">
                  <strong>Haags Dagblad</strong>
                </p>
                <h3>ADO Den Haag zet grote stap richting nieuw stadion</h3>
                <p>
                  Het artikel verscheen vóór de officiële vrijgave en bevat details uit het vertrouwelijke dossier:
                  locatieopties, technische keuzes en passages die in de conceptpersverklaring nog zwartgelakt stonden.
                </p>
              </>
            )}
            <button className="mg-yellow mg-cta" type="button" onClick={() => setZoom(null)}>
              Sluiten
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function LeakTask({ onBack, onFinished }: { onBack: () => void; onFinished: () => void }) {
  const [deck, setDeck] = useState<MemoryCard[]>(() => buildMemoryDeck());
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [lock, setLock] = useState(false);
  const [seconds, setSeconds] = useState(MEMORY_SECONDS);
  const [running, setRunning] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [won, setWon] = useState(false);

  const done = matched.length === deck.length;

  useEffect(() => {
    if (!running || won || timedOut) return;
    if (seconds <= 0) {
      setTimedOut(true);
      setRunning(false);
      playDenied();
      return;
    }
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [running, seconds, won, timedOut]);

  useEffect(() => {
    if (!done || won) return;
    setWon(true);
    setRunning(false);
    playCorrect();
  }, [done, won]);

  function restart() {
    setDeck(buildMemoryDeck());
    setFlipped([]);
    setMatched([]);
    setLock(false);
    setSeconds(MEMORY_SECONDS);
    setTimedOut(false);
    setWon(false);
    setRunning(true);
  }

  function flip(card: MemoryCard) {
    if (!running || lock || timedOut || won) return;
    if (flipped.includes(card.id) || matched.includes(card.id)) return;
    if (flipped.length >= 2) return;

    const next = [...flipped, card.id];
    setFlipped(next);
    if (next.length < 2) return;

    const [firstId, secondId] = next;
    const first = deck.find((item) => item.id === firstId);
    const second = deck.find((item) => item.id === secondId);
    if (!first || !second) return;

    setLock(true);
    if (first.pairId === second.pairId) {
      window.setTimeout(() => {
        setMatched((current) => [...current, firstId, secondId]);
        setFlipped([]);
        setLock(false);
        playCorrect();
      }, 320);
      return;
    }

    window.setTimeout(() => {
      setFlipped([]);
      setLock(false);
      playDenied();
    }, 700);
  }

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <section className="mg-screen d3-screen">
      <Bar kicker="Dossier 03 · Opdracht 9" title="Wat werd er gelekt?" step={2} onBack={onBack} />
      <p className="mg-note">
        Memory: koppel elk gelekt detail aan de juiste bron. Zo bewijs je dat de informatie uit het vertrouwelijke
        stadiondossier kwam — niet uit de goedgekeurde persverklaring.
      </p>

      <div className={`d3-timer ${seconds <= 10 && running ? "is-low" : ""} ${timedOut ? "is-out" : ""}`}>
        <span>Countdown</span>
        <strong>{timedOut ? "00:00" : clock}</strong>
      </div>

      {!running && !won && !timedOut ? (
        <button className="mg-yellow mg-cta" type="button" onClick={() => setRunning(true)}>
          Start memory (60 seconden)
        </button>
      ) : null}

      <div className="d3-memory" aria-label="Memorykaarten">
        {deck.map((card) => {
          const open = flipped.includes(card.id) || matched.includes(card.id);
          return (
            <button
              key={card.id}
              type="button"
              className={`d3-mem-card ${open ? "is-open" : ""} ${matched.includes(card.id) ? "is-matched" : ""}`}
              onClick={() => flip(card)}
              disabled={!running || timedOut || won || lock}
            >
              <span className="d3-mem-back">ADO</span>
              <span className="d3-mem-front">{card.label}</span>
            </button>
          );
        })}
      </div>

      {timedOut && !won ? (
        <div className="mg-bad">
          <strong>Tijd voorbij</strong>
          <p>De 60 seconden zijn om. Probeer opnieuw om de gelekte details te koppelen.</p>
          <button className="mg-yellow mg-cta" type="button" onClick={restart}>
            Opnieuw (60s)
          </button>
        </div>
      ) : null}

      {won ? (
        <div className="mg-success">
          <p className="mg-kicker">
            Lek bewezen · bron: {LEAK_CORRECT === "dossier" ? "vertrouwelijk dossier" : LEAK_CORRECT}
          </p>
          <p>
            De gelekte details horen bij het vertrouwelijke stadiondossier en stonden niet in de goedgekeurde
            persverklaring. Het embargo is geschonden. Open dossier 04: Het lek.
          </p>
          <button className="mg-yellow mg-cta" type="button" onClick={onFinished}>
            Terug naar dossiers
          </button>
        </div>
      ) : null}
    </section>
  );
}
