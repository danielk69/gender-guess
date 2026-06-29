export type Guess = "trans" | "cis";

export type GameImage = {
  id: string;
  storage_path: string;
  public_url: string;
  is_transgender: boolean;
};

export type RoundResult = {
  image: GameImage;
  guess: Guess;
  answer: Guess;
  correct: boolean;
};

export type SessionStats = {
  rounds: number;
  correct: number;
  wrong: number;
  streak: number;
  maxStreak: number;
  score: number;
};

export type GamePhase =
  | "loading"
  | "playing"
  | "results"
  | "submitting"
  | "empty";

export type LeaderboardEntry = {
  id: string;
  player_name: string;
  score: number;
  correct_count: number;
  wrong_count: number;
  max_streak: number;
  rounds_played: number;
  created_at: string;
};
