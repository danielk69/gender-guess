"use client";

import { useState } from "react";
import { LAST_SCORE_KEY } from "@/lib/game";

function readLastScoreText(): string | null {
  try {
    const raw = localStorage.getItem(LAST_SCORE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as { score: number; correct_count: number; rounds_played: number };
    return `Your last score: ${s.score} (${s.correct_count}/${s.rounds_played} correct)`;
  } catch {
    return null;
  }
}

export function LastScore() {
  const [text] = useState(readLastScoreText);

  if (!text) return null;
  return (
    <div className="mb-6 rounded-lg border border-brand/20 bg-brand/5 px-4 py-3 text-sm">
      {text}
    </div>
  );
}
