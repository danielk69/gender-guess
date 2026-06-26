import { LastScore } from "@/components/LastScore";
import { LeaderboardTable } from "@/components/LeaderboardTable";

export default function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">Leaderboard</h1>
      <p className="mt-1 text-muted">Top 50 scores</p>
      <LastScore />
      <LeaderboardTable />
    </div>
  );
}
