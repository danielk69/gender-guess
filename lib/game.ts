export const SESSION_SECONDS = 60;
export const LAST_SCORE_KEY = "gender-guesser-last-score";

export const LABELS = { trans: "Transgender", cis: "Cisgender" } as const;

/** Points earned on a correct guess: 1 + streak before the answer. */
export function pointsForCorrect(streakBefore: number) {
  return 1 + streakBefore;
}

/** Upper bound if every correct answer was consecutive. */
export function maxPossibleScore(correctCount: number) {
  return (correctCount * (correctCount + 1)) / 2;
}

/** Lower bound if every correct answer followed a wrong (streak always 0). */
export function minPossibleScore(correctCount: number) {
  return correctCount;
}

export function isValidScore(score: number, correctCount: number) {
  return (
    score >= minPossibleScore(correctCount) &&
    score <= maxPossibleScore(correctCount)
  );
}

export function toAnswer(isTransgender: boolean): "trans" | "cis" {
  return isTransgender ? "trans" : "cis";
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
