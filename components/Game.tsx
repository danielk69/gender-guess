"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Check,
  Flame,
  Hourglass,
  Skull,
} from "lucide-react";
import { useGame } from "@/hooks/useGame";
import { LABELS } from "@/lib/game";
import type { RoundResult, SessionStats } from "@/lib/types";

export function Game() {
  const game = useGame();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (game.phase !== "playing") return;
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT") return;
      if (e.key.toLowerCase() === "t") game.submitGuess("trans");
      if (e.key.toLowerCase() === "c") game.submitGuess("cis");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game.phase, game.submitGuess]);

  if (game.phase === "loading") {
    return (
      <div className="py-16 text-center text-muted">Loading…</div>
    );
  }

  if (game.phase === "empty") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h2 className="text-xl font-semibold">No images available</h2>
        <p className="mt-2 text-sm text-muted">
          Run `npm run db:migrate:local` to set up the Cloudflare D1 database.
        </p>
        {game.warning && <Warning msg={game.warning} />}
      </div>
    );
  }

  if (game.phase === "results" || game.phase === "submitting") {
    return (
      <Results
        stats={game.stats}
        history={game.history}
        phase={game.phase}
        onSubmit={game.submitToLeaderboard}
        onPlayAgain={game.start}
      />
    );
  }

  return (
    <div className="pb-12">
      {game.warning && <Warning msg={game.warning} />}
      <Hud stats={game.stats} secondsLeft={game.secondsLeft} />
      {game.image && (
        <div className="mx-auto max-w-md px-4">
          <div className="relative mx-auto aspect-square max-w-xs overflow-hidden rounded-2xl shadow-md ring-1 ring-border">
            <Image
              src={game.image.public_url}
              alt="Portrait"
              fill
              className="object-cover"
              sizes="320px"
              priority
            />
          </div>
          <p className="my-8 text-center">Is this person transgender?</p>
          <div className="grid grid-cols-2 gap-3">
            <GuessBtn label="Transgender" keyHint="T" onClick={() => game.submitGuess("trans")} />
            <GuessBtn label="Cisgender" keyHint="C" onClick={() => game.submitGuess("cis")} />
          </div>
        </div>
      )}
    </div>
  );
}

function Warning({ msg }: { msg: string }) {
  return (
    <div className="mx-auto mb-4 max-w-lg rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
      {msg}
    </div>
  );
}

function Hud({
  stats,
  secondsLeft,
}: {
  stats: SessionStats;
  secondsLeft: number;
}) {
  const urgent = secondsLeft <= 10;
  return (
    <div className="mx-auto flex max-w-xl items-center justify-center gap-5 px-4 py-4 text-sm text-muted">
      <span className={urgent ? "font-semibold text-red-500" : ""}>
        <Hourglass className="mr-1 inline h-4 w-4" />
        {secondsLeft}
      </span>
      <span><Check className="mr-1 inline h-4 w-4" />{stats.correct}</span>
      <span><Skull className="mr-1 inline h-4 w-4" />{stats.wrong}</span>
      <span><Flame className="mr-1 inline h-4 w-4" />{stats.streak}</span>
    </div>
  );
}

function GuessBtn({ label, keyHint, onClick }: { label: string; keyHint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-brand/40 bg-white px-4 py-4 text-sm shadow-sm transition hover:border-brand hover:bg-brand hover:text-white"
    >
      <strong>{keyHint}</strong> = {label}
    </button>
  );
}

function Results({
  stats,
  history,
  phase,
  onSubmit,
  onPlayAgain,
}: {
  stats: SessionStats;
  history: RoundResult[];
  phase: string;
  onSubmit: (name: string) => Promise<{ ok: boolean; message?: string; error?: string; offline?: boolean }>;
  onPlayAgain: () => void;
}) {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [msgOk, setMsgOk] = useState(true);
  const [done, setDone] = useState(false);

  return (
    <div className="pb-16">
      <div className="mx-auto max-w-sm px-4 pt-10 text-center">
        <p className="text-sm font-medium text-muted">Your score</p>
        <p className="mt-1 text-5xl font-bold tabular-nums tracking-tight">{stats.score}</p>
        <p className="mt-2 text-sm text-muted">
          {stats.correct}/{stats.rounds} correct
          {stats.maxStreak > 1 && (
            <span> · best streak {stats.maxStreak}</span>
          )}
        </p>

        {!done && stats.rounds > 0 && (
          <div className="mt-8 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={24}
              className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-brand"
            />
            <button
              type="button"
              disabled={name.trim().length < 2 || phase === "submitting"}
              onClick={async () => {
                const r = await onSubmit(name);
                setDone(true);
                setMsgOk(r.ok);
                setMsg(r.message ?? r.error ?? "");
              }}
              className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90 disabled:opacity-40"
            >
              {phase === "submitting" ? "Submitting…" : "Submit to leaderboard"}
            </button>
          </div>
        )}
        {msg && (
          <p className={`mt-3 text-sm ${msgOk ? "text-emerald-600" : "text-amber-700"}`}>{msg}</p>
        )}

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full rounded-xl border border-border bg-white py-3 text-sm font-medium shadow-sm transition hover:border-brand hover:text-brand"
          >
            Play again
          </button>
          <Link href="/leaderboard" className="text-sm text-muted transition hover:text-brand">
            View leaderboard →
          </Link>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mx-auto mt-10 w-full max-w-5xl px-4 sm:px-6">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-muted">
            Round history
          </p>
          <div className="max-h-80 overflow-y-auto rounded-2xl border border-border bg-gray-50/50 p-4 sm:max-h-[28rem]">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {history.map((r, i) => (
                <div
                  key={`${r.image.id}-${i}`}
                  className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border"
                >
                  <div className="relative aspect-square select-none">
                    <Image
                      src={r.image.public_url}
                      alt=""
                      fill
                      className="pointer-events-none object-cover"
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 280px"
                      draggable={false}
                    />
                  </div>
                  <div
                    className={`px-2 py-2 text-center text-xs leading-snug text-white ${
                      r.correct ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  >
                    <p className="truncate">Guess: {LABELS[r.guess]}</p>
                    <p className="truncate opacity-90">Answer: {LABELS[r.answer]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
