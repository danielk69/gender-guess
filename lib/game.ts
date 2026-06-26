export const SESSION_SECONDS = 60;
export const LAST_SCORE_KEY = "gender-guesser-last-score";

export const LABELS = { trans: "Transgender", cis: "Cisgender" } as const;

export function score(correct: number, maxStreak: number) {
  return correct * 100 + maxStreak * 25;
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
