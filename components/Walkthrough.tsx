"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FINDINGS,
  GAME_MINUTES,
  LEVELS,
  PEOPLE,
  STEPS,
  isDader,
  type ChoiceQuestion,
  type OrderQuestion,
} from "@/lib/game";
import { shuffle } from "@/lib/shuffle";

export function Walkthrough({
  startedAt,
  stepIndex,
  onStepIndex,
  onLevelComplete,
}: {
  startedAt: number | null;
  stepIndex: number;
  onStepIndex: (index: number) => void;
  onLevelComplete?: (level: number) => void | Promise<void>;
}) {
  const [overtime, setOvertime] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const step = STEPS[Math.min(stepIndex, STEPS.length - 1)];

  useEffect(() => {
    setSelected(null);
    setOrder([]);
    setWrong(null);
    setRevealed(false);
  }, [stepIndex]);

  function goNext() {
    const current = STEPS[Math.min(stepIndex, STEPS.length - 1)];
    const nextIndex = Math.min(stepIndex + 1, STEPS.length - 1);
    const next = STEPS[nextIndex];
    if (current && next && (current.level < next.level || current.kind === "finale")) {
      void onLevelComplete?.(current.level);
    }
    onStepIndex(nextIndex);
  }

  useEffect(() => {
    if (step.kind !== "finale") return;
    void onLevelComplete?.(step.level);
    // Markeer dossier 5 klaar zodra de finalescreen zichtbaar is.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.kind, step.level]);

  useEffect(() => {
    if (!startedAt) return;
    const tick = () => setOvertime(Date.now() - startedAt >= GAME_MINUTES * 60 * 1000);
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  return (
    <main className="app">
      <header className="top">
        <div className="brand">
          <small>ADO Den Haag · 1905</small>
          <strong>Het Geheim van de Senaatskamer</strong>
        </div>
      </header>

      <LevelTrack current={step.level} />
      {overtime && step.kind !== "finale" ? (
        <p className="notice">De zestig minuten zijn voorbij. Jullie kunnen het dossier nog afronden.</p>
      ) : null}

      {step.kind === "choice" ? (
        <ChoiceCard
          step={step}
          selected={selected}
          wrong={wrong}
          revealed={revealed}
          onSelect={(id) => {
            setSelected(id);
            setWrong(null);
          }}
          onCheck={() => {
            if (!selected) return;
            if (selected === step.correctId) {
              setWrong(null);
              setRevealed(true);
            } else {
              setWrong(step.wrong);
            }
          }}
          onNext={goNext}
        />
      ) : step.kind === "order" ? (
        <OrderCard
          step={step}
          order={order}
          wrong={wrong}
          revealed={revealed}
          onAdd={(id) => {
            setOrder((current) => (current.includes(id) ? current : [...current, id]));
            setWrong(null);
          }}
          onUndo={() => setOrder((current) => current.slice(0, -1))}
          onCheck={() => {
            const same =
              order.length === step.correctOrder.length &&
              order.every((id, index) => id === step.correctOrder[index]);
            if (same) {
              setWrong(null);
              setRevealed(true);
            } else {
              setWrong(step.wrong);
            }
          }}
          onNext={goNext}
        />
      ) : step.kind === "sheet" ? (
        <SheetCard onConfirm={goNext} />
      ) : step.kind === "dader" ? (
        <DaderCard
          selected={selected}
          wrong={wrong}
          onSelect={(name) => {
            setSelected(name);
            setWrong(null);
          }}
          onCheck={() => {
            if (!selected) return;
            if (isDader(selected)) {
              setWrong(null);
              goNext();
            } else {
              setWrong("Die aanklacht houdt geen stand. Kijk terug naar het werkstation en de digitale sporen.");
            }
          }}
        />
      ) : (
        <Finale />
      )}
    </main>
  );
}

function LevelTrack({ current }: { current: number }) {
  return (
    <ol className="levels">
      {LEVELS.map((level) => (
        <li
          key={level.id}
          className={`level-pill${level.id === current ? " active" : ""}${level.id < current ? " done" : ""}`}
        >
          {level.id}. {level.name}
        </li>
      ))}
    </ol>
  );
}

export function Briefing({
  onStart,
  actionLabel = "Begin de opdrachten",
}: {
  onStart: () => void;
  actionLabel?: string;
}) {
  return (
    <section className="paper">
      <p className="stamp">Vertrouwelijk</p>
      <h1>Het Geheim van de Senaatskamer</h1>
      <p className="story">
        Jullie zitten in de Senaatskamer. Jaren geleden, toen de senatoren hier nog sigaren rookten, besprak
        het bestuur in het geheim de plannen voor het stadion. Jaren later lekte dat geheim naar de pers.
        De supporters waren boos.
      </p>
      <p className="story">
        In zestig minuten reconstrueren jullie wat er gelekt is en wie dat deed. Het verhaal staat in deze
        app. De bewijsstukken blijven op tafel.
      </p>
      <div className="people people-passes">
        {PEOPLE.map((person) => (
          <div key={person.name}>
            <img src={person.pass} alt={`Toegangspas ${person.name}`} />
            <strong>{person.name}</strong>
            <span>{person.role}</span>
          </div>
        ))}
      </div>
      <p className="meta">Vijf dossiers · zestien opdrachten · zestig minuten</p>
      <div className="actions">
        <button className="primary" type="button" onClick={onStart}>
          {actionLabel}
        </button>
      </div>
    </section>
  );
}

function ChoiceCard({
  step,
  selected,
  wrong,
  revealed,
  onSelect,
  onCheck,
  onNext,
}: {
  step: ChoiceQuestion;
  selected: string | null;
  wrong: string | null;
  revealed: boolean;
  onSelect: (id: string) => void;
  onCheck: () => void;
  onNext: () => void;
}) {
  const options = useMemo(() => shuffle(step.choices), [step.id]);

  return (
    <article className="paper">
      <Story step={step} />
      <div className="choices" role="radiogroup" aria-label={step.prompt}>
        {options.map((choice) => (
          <button
            key={choice.id}
            className={`choice${selected === choice.id ? " is-on" : ""}`}
            type="button"
            role="radio"
            aria-checked={selected === choice.id}
            disabled={revealed}
            onClick={() => onSelect(choice.id)}
          >
            {choice.label}
          </button>
        ))}
      </div>
      <AnswerBar revealed={revealed} canCheck={selected !== null} wrong={wrong} onCheck={onCheck} onNext={onNext}>
        <Reveal step={step} />
      </AnswerBar>
    </article>
  );
}

function OrderCard({
  step,
  order,
  wrong,
  revealed,
  onAdd,
  onUndo,
  onCheck,
  onNext,
}: {
  step: OrderQuestion;
  order: string[];
  wrong: string | null;
  revealed: boolean;
  onAdd: (id: string) => void;
  onUndo: () => void;
  onCheck: () => void;
  onNext: () => void;
}) {
  const labels = useMemo(() => new Map(step.items.map((item) => [item.id, item.label])), [step.items]);
  const options = useMemo(() => shuffle(step.items), [step.id]);

  return (
    <article className="paper">
      <Story step={step} />
      <div className="choices">
        {options.map((item) => (
          <button
            key={item.id}
            className="choice"
            type="button"
            disabled={revealed || order.includes(item.id)}
            onClick={() => onAdd(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <ol className="order">
        {order.map((id, index) => (
          <li key={id} className="order-item">
            <span className="mark">{index + 1}</span>
            <span>{labels.get(id)}</span>
          </li>
        ))}
      </ol>
      <div className="actions">
        <button className="ghost" type="button" onClick={onUndo} disabled={revealed || order.length === 0}>
          Laatste weg
        </button>
      </div>
      <AnswerBar
        revealed={revealed}
        canCheck={order.length === step.correctOrder.length}
        wrong={wrong}
        onCheck={onCheck}
        onNext={onNext}
      >
        <Reveal step={step} />
      </AnswerBar>
    </article>
  );
}

function SheetCard({ onConfirm }: { onConfirm: () => void }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const ready = FINDINGS.every((_, index) => checked[index]);

  return (
    <article className="paper sheet">
      <p className="kicker">Dossier 5 · De Waarheid</p>
      <h2>Eindrapport afronden</h2>
      <p className="story">
        Pak het papieren eindrapport. Vink hier af wat jullie op het blad hebben vastgelegd — pas daarna volgt de
        aanklacht.
      </p>
      <ul className="finding-list">
        {FINDINGS.map((finding, index) => (
          <li key={finding}>
            <label>
              <input
                type="checkbox"
                checked={Boolean(checked[index])}
                onChange={(event) =>
                  setChecked((current) => ({ ...current, [index]: event.target.checked }))
                }
              />
              <span>{finding}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="meta">Alle vijf de bevindingen moeten kloppen voordat jullie iemand aanklagen.</p>
      <div className="actions">
        <button className="primary" type="button" onClick={onConfirm} disabled={!ready}>
          Rapport compleet — naar aanklacht
        </button>
      </div>
    </article>
  );
}

function DaderCard({
  selected,
  wrong,
  onSelect,
  onCheck,
}: {
  selected: string | null;
  wrong: string | null;
  onSelect: (name: string) => void;
  onCheck: () => void;
}) {
  return (
    <article className="paper dader-card">
      <p className="kicker">Dossier 5 · Officiële aanklacht</p>
      <h2>Wie lekte de informatie?</h2>
      <p className="story">
        Het eindrapport is compleet. Kies de verdachte op basis van de bewijsstukken — niet op gevoel. Daarna sluit
        jullie de zaak formeel.
      </p>
      <div className="suspect-grid" role="listbox" aria-label="Verdachten">
        {PEOPLE.map((person) => (
          <button
            key={person.name}
            type="button"
            role="option"
            aria-selected={selected === person.name}
            className={`suspect${selected === person.name ? " is-on" : ""}`}
            onClick={() => onSelect(person.name)}
          >
            <img src={person.pass} alt="" />
            <strong>{person.name}</strong>
            <span>{person.role}</span>
          </button>
        ))}
      </div>
      {wrong ? <p className="feedback">{wrong}</p> : null}
      <div className="actions">
        <button className="primary" type="button" onClick={onCheck} disabled={!selected}>
          Dien aanklacht in
        </button>
      </div>
    </article>
  );
}

function Finale() {
  const guilty = PEOPLE.find((person) => isDader(person.name)) ?? PEOPLE[2];

  return (
    <article className="paper finale">
      <img className="finale-hero" src="/ado/senaatskamer.jpg" alt="De Senaatskamer" />
      <p className="closed">DOSSIER GESLOTEN</p>
      <p className="stamp gold">Officiële uitslag</p>
      <div className="finale-verdict">
        <img src={guilty.pass} alt={`Toegangspas ${guilty.name}`} />
        <div>
          <p className="kicker">Verantwoordelijk voor het lek</p>
          <h2>{guilty.name}</h2>
          <p>{guilty.role} · toegang tot het vertrouwelijke stadiondossier</p>
        </div>
      </div>
      <p>Jarenlang bleef de waarheid verborgen achter de deuren van de Senaatskamer.</p>
      <p>
        Documenten verdwenen, verklaringen spraken elkaar tegen en het vertrouwen binnen de club werd op de proef
        gesteld.
      </p>
      <p>
        Jullie reconstrueerden de vergadering, het embargo, de persconferentie en het lek — en dienden een onderbouwde
        aanklacht in.
      </p>
      <p>Het Geheim van de Senaatskamer is eindelijk onthuld.</p>
      <p className="stamp">Missie voltooid</p>
    </article>
  );
}

function Story({ step }: { step: ChoiceQuestion | OrderQuestion }) {
  return (
    <>
      <p className="kicker">
        Dossier {step.level} · {step.levelName}
      </p>
      <p className="meta">{step.kicker}</p>
      {step.story.map((paragraph) => (
        <p className="story" key={paragraph}>
          {paragraph}
        </p>
      ))}
      <h2 className="prompt">{step.prompt}</h2>
    </>
  );
}

function Reveal({ step }: { step: ChoiceQuestion | OrderQuestion }) {
  return (
    <div className="reveal">
      <p>{step.reveal}</p>
      {step.hint ? <p className="hint">{step.hint}</p> : null}
    </div>
  );
}

function AnswerBar({
  revealed,
  canCheck,
  wrong,
  onCheck,
  onNext,
  children,
}: {
  revealed: boolean;
  canCheck: boolean;
  wrong: string | null;
  onCheck: () => void;
  onNext: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {wrong ? <p className="feedback">{wrong}</p> : null}
      {revealed ? children : null}
      <div className="actions">
        {revealed ? (
          <button className="primary" type="button" onClick={onNext}>
            Volgende opdracht
          </button>
        ) : (
          <button className="primary" type="button" onClick={onCheck} disabled={!canCheck}>
            Controleer
          </button>
        )}
      </div>
    </>
  );
}
