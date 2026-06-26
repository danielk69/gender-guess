"use client";

import { useEffect, useState } from "react";
import { LAST_SCORE_KEY } from "@/lib/game";

export function LastScore() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAST_SCORE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as { score: number; correct_count: number; rounds_played: number };
      setText(`Your last score: ${s.score} (${s.correct_count}/${s.rounds_played} correct)`);
    } catch {
      /* ignore */
    }
  }, []);

  if (!text) return null;
  return (
    <div className="mb-6 rounded-lg border border-brand/20 bg-brand/5 px-4 py-3 text-sm">
      {text}
    </div>
  );
}
