import { NextRequest, NextResponse } from "next/server";
import { getHealth, getImages, getLeaderboard, submitScore } from "@/backend/handlers";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.endsWith("/health")) {
    return NextResponse.json(await getHealth());
  }
  if (path.endsWith("/images")) {
    const result = await getImages();
    return NextResponse.json(result);
  }
  if (path.endsWith("/leaderboard")) {
    return NextResponse.json({ entries: await getLeaderboard() });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.endsWith("/leaderboard")) {
    const body = (await request.json()) as {
      player_name?: unknown;
      score?: unknown;
      correct_count?: unknown;
      wrong_count?: unknown;
      max_streak?: unknown;
      rounds_played?: unknown;
    };
    const result = await submitScore({
      player_name: String(body.player_name ?? "").trim(),
      score: Number(body.score),
      correct_count: Number(body.correct_count),
      wrong_count: Number(body.wrong_count),
      max_streak: Number(body.max_streak),
      rounds_played: Number(body.rounds_played),
    });
    if (result.ok) return NextResponse.json({ ok: true });
    return NextResponse.json(
      { error: result.error, offline: result.offline },
      { status: result.offline ? 503 : 400 }
    );
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
