"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Check,
  Dices,
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
      <Hud stats={game.stats} secondsLeft={game.secondsLeft} mode="play" />
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
  mode,
  onClose,
}: {
  stats: SessionStats;
  secondsLeft: number;
  mode: "play" | "results";
  onClose?: () => void;
}) {
  const urgent = mode === "play" && secondsLeft <= 10;
  return (
    <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-4">
      {onClose ? (
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">✕</button>
      ) : (
        <span className="w-5" />
      )}
      <div className="flex gap-5 text-sm text-muted">
        {mode === "play" ? (
          <span className={urgent ? "font-semibold text-red-500" : ""}>
            <Hourglass className="mr-1 inline h-4 w-4" />
            {secondsLeft}
          </span>
        ) : (
          <span><Dices className="mr-1 inline h-4 w-4" />{stats.rounds}</span>
        )}
        <span><Check className="mr-1 inline h-4 w-4" />{stats.correct}</span>
        <span><Skull className="mr-1 inline h-4 w-4" />{stats.wrong}</span>
        <span><Flame className="mr-1 inline h-4 w-4" />{stats.streak}</span>
      </div>
      <span className="w-5" />
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
      <Hud stats={stats} secondsLeft={0} mode="results" onClose={onPlayAgain} />
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 px-4 sm:grid-cols-3">
        {history.map((r, i) => (
          <div key={`${r.image.id}-${i}`} className="overflow-hidden rounded-xl ring-1 ring-border">
            <div className="relative aspect-square select-none">
              <Image src={r.image.public_url} alt="" fill className="pointer-events-none object-cover" sizes="200px" draggable={false} />
            </div>
            <div className={`py-2 text-center text-xs text-white ${r.correct ? "bg-emerald-500" : "bg-red-500"}`}>
              <p>Guess: {LABELS[r.guess]}</p>
              <p>Answer: {LABELS[r.answer]}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-sm px-4 text-center">
        <p className="text-3xl font-bold">{stats.score}</p>
        <p className="text-sm text-muted">{stats.correct}/{stats.rounds} correct</p>
        {!done && stats.rounds > 0 && (
          <div className="mt-6 space-y-3">
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
              className="w-full rounded-xl bg-brand py-3 text-sm font-medium text-white disabled:opacity-40"
            >
              {phase === "submitting" ? "Submitting…" : "Submit to leaderboard"}
            </button>
          </div>
        )}
        {msg && (
          <p className={`mt-3 text-sm ${msgOk ? "text-emerald-600" : "text-amber-700"}`}>{msg}</p>
        )}
        <button type="button" onClick={onPlayAgain} className="mt-4 text-sm text-brand hover:underline">
          Play again
        </button>
        <Link href="/leaderboard" className="mt-2 block text-sm text-muted hover:text-brand">
          View leaderboard →
        </Link>
      </div>
    </div>
  );
}
