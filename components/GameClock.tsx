"use client";

import { useEffect, useState } from "react";
import { GAME_MINUTES } from "@/lib/game";

function formatTime(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function eventStartedAtMs(startedAt: string | null | undefined) {
  if (!startedAt) return null;
  const ms = Date.parse(startedAt);
  return Number.isFinite(ms) ? ms : null;
}

export function GameClock({
  startedAt,
  onOvertime,
  compact = false,
}: {
  startedAt: number | null;
  onOvertime?: (overtime: boolean) => void;
  compact?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const tick = () => {
      const current = Date.now();
      setNow(current);
      onOvertime?.(current - startedAt >= GAME_MINUTES * 60 * 1000);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt, onOvertime]);

  if (!startedAt) return null;

  const remaining = GAME_MINUTES * 60 * 1000 - (now - startedAt);
  const overtime = remaining <= 0;

  return (
    <div className={`timer${compact ? " is-compact" : ""}${overtime ? " over" : ""}`} aria-live="polite">
      <span>{overtime ? "Tijd voorbij" : "Resterend"}</span>
      <strong>{formatTime(remaining)}</strong>
    </div>
  );
}
