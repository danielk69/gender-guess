"use client";

import { useEffect, useState } from "react";
import type { LeaderboardEntry } from "@/lib/types";

export function LeaderboardTable() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/leaderboard")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((body: { entries: LeaderboardEntry[] }) => {
        if (!cancelled) setEntries(body.entries ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="mt-12 text-center text-muted">Could not load leaderboard.</p>;
  }

  if (!entries) {
    return (
      <div className="mt-8 space-y-2" aria-busy="true" aria-label="Loading leaderboard">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-border/40" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return <p className="mt-12 text-center text-muted">No scores yet.</p>;
  }

  return (
    <table className="mt-8 w-full text-left text-sm">
      <thead>
        <tr className="border-b text-muted">
          <th className="py-2">#</th>
          <th>Player</th>
          <th>Score</th>
          <th>Correct</th>
          <th>Rounds</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => (
          <tr key={e.id} className="border-b border-border/50">
            <td className="py-2 text-muted">{i + 1}</td>
            <td className="font-medium">{e.player_name}</td>
            <td>{e.score}</td>
            <td>{e.correct_count}</td>
            <td>{e.rounds_played}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
