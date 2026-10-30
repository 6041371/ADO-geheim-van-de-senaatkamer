"use client";

import { useEffect, useState } from "react";
import { createRealtimeClient } from "@neon/realtime/client";
import { RealtimeProvider } from "@neon/realtime-react";
import type { HostRow, TeamRow } from "@/lib/events/types";
import { getJson, postJson } from "./api";
import { HomeScreen } from "./HomeScreen";
import { InstructorDesk } from "./InstructorDesk";
import { clearTeamResume, readTeamResume, saveTeamResume } from "./resume";
import { TeamRoom } from "./TeamRoom";

type Session = {
  host: { code: string; rows: HostRow[] } | null;
  team: { row: TeamRow } | null;
};

export function AppShell({ realtimeUrl }: { realtimeUrl: string }) {
  const [client] = useState(() => createRealtimeClient({ url: realtimeUrl }));
  return (
    <RealtimeProvider client={client}>
      <EventApp />
    </RealtimeProvider>
  );
}

function EventApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<"boot" | "home" | "instructor" | "team">("boot");
  const [freshEvent, setFreshEvent] = useState(true);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      const result = await getJson<Session>("/api/session");
      if (ignore) return;
      let next: Session = result.ok ? result.data : { host: null, team: null };

      if (!next.team) {
        const resume = readTeamResume();
        if (resume) {
          const rejoined = await postJson<{ row: TeamRow; token?: string }>("/api/join", {
            code: resume.code,
            clientId: resume.clientId,
          });
          if (!ignore && rejoined.ok) {
            saveTeamResume(resume.code, resume.clientId, rejoined.data.token);
            next = { ...next, team: { row: rejoined.data.row } };
          } else if (!ignore && !rejoined.ok) {
            clearTeamResume();
          }
        }
      }

      if (ignore) return;
      setSession(next);
      if (next.team && !next.host) setView("team");
      else setView("home");
    })();
    return () => {
      ignore = true;
    };
  }, []);

  if (view === "boot" || !session) return <p className="boot">De Senaatskamer wordt geopend.</p>;
  if (view === "instructor") return <InstructorDesk fresh={freshEvent} onHome={() => setView("home")} />;
  if (view === "team") {
    return (
      <TeamRoom
        onHome={() => {
          setSession((prev) => (prev ? { ...prev, team: null } : prev));
          setView("home");
        }}
      />
    );
  }

  return (
    <HomeScreen
      teamName={session.team?.row.team_name}
      hostCode={session.host?.code}
      onInstructor={() => {
        setFreshEvent(true);
        setView("instructor");
      }}
      onJoined={(code) => {
        if (code) saveTeamResume(code);
        setView("team");
      }}
      onContinueHost={
        session.host
          ? () => {
              setFreshEvent(false);
              setView("instructor");
            }
          : undefined
      }
      onContinueTeam={session.team ? () => setView("team") : undefined}
    />
  );
}
