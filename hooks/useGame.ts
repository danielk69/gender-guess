"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LABELS,
  LAST_SCORE_KEY,
  SESSION_SECONDS,
  score,
  shuffle,
  toAnswer,
} from "@/lib/game";
import type {
  GameImage,
  GamePhase,
  Guess,
  RoundResult,
  SessionStats,
} from "@/lib/types";

const EMPTY: SessionStats = {
  rounds: 0,
  correct: 0,
  wrong: 0,
  streak: 0,
  maxStreak: 0,
  score: 0,
};

export function useGame() {
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [image, setImage] = useState<GameImage | null>(null);
  const [stats, setStats] = useState<SessionStats>(EMPTY);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(SESSION_SECONDS);
  const [warning, setWarning] = useState<string | null>(null);

  const deckRef = useRef<GameImage[]>([]);
  const deckIndexRef = useRef(0);
  const endingRef = useRef(false);

  const nextFromDeck = useCallback(() => {
    if (deckIndexRef.current >= deckRef.current.length) {
      deckRef.current = shuffle(deckRef.current);
      deckIndexRef.current = 0;
    }
    const img = deckRef.current[deckIndexRef.current++];
    setImage(img);
    return img;
  }, []);

  const finish = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
    setPhase("results");
  }, []);

  const start = useCallback(async () => {
    endingRef.current = false;
    deckIndexRef.current = 0;
    setStats(EMPTY);
    setHistory([]);
    setSecondsLeft(SESSION_SECONDS);
    setPhase("loading");

    try {
      const imgRes = await fetch("/api/images");
      const { images, warning: imgWarn } = await imgRes.json();
      setWarning(imgWarn ?? null);

      if (!images?.length) {
        setPhase("empty");
        return;
      }

      deckRef.current = shuffle(images);
      nextFromDeck();
      setPhase("playing");
    } catch {
      setWarning("Could not load images.");
      setPhase("empty");
    }
  }, [nextFromDeck]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          finish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, finish]);

  const submitGuess = useCallback(
    (guess: Guess) => {
      if (phase !== "playing" || !image) return;

      const answer = toAnswer(image.is_transgender);
      const correct = guess === answer;
      setHistory((h) => [...h, { image, guess, answer, correct }]);
      setStats((prev) => {
        const streak = correct ? prev.streak + 1 : 0;
        const maxStreak = Math.max(prev.maxStreak, streak);
        const correctCount = prev.correct + (correct ? 1 : 0);
        return {
          rounds: prev.rounds + 1,
          correct: correctCount,
          wrong: prev.wrong + (correct ? 0 : 1),
          streak,
          maxStreak,
          score: score(correctCount, maxStreak),
        };
      });
      nextFromDeck();
    },
    [phase, image, nextFromDeck]
  );

  const submitToLeaderboard = useCallback(
    async (playerName: string) => {
      if (stats.rounds === 0) return { ok: false, error: "No rounds played" };
      setPhase("submitting");
      const payload = {
        player_name: playerName.trim(),
        score: stats.score,
        correct_count: stats.correct,
        wrong_count: stats.wrong,
        max_streak: stats.maxStreak,
        rounds_played: stats.rounds,
      };
      localStorage.setItem(LAST_SCORE_KEY, JSON.stringify(payload));

      try {
        const res = await fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = await res.json();
        setPhase("results");
        if (!res.ok) {
          return {
            ok: false,
            offline: Boolean(body.offline),
            message:
              body.error ??
              "Could not save to leaderboard. Your score is kept in this browser only.",
          };
        }
        return { ok: true, message: "Score saved to leaderboard!" };
      } catch {
        setPhase("results");
        return {
          ok: false,
          offline: true,
          message: "Network error — score saved in this browser only.",
        };
      }
    },
    [stats]
  );

  return { phase, image, stats, history, secondsLeft, warning, submitGuess, submitToLeaderboard, start };
}
