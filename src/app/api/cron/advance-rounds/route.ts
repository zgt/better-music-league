import { type NextRequest, NextResponse } from "next/server";

import { db } from "~/server/db";

export async function GET(req: NextRequest) {
  // Optionally verify a cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Advance SUBMISSION -> LISTENING when submissionDeadline passes
  const submissionAdvanced = await db.round.updateMany({
    where: {
      status: "SUBMISSION",
      submissionDeadline: { lte: now },
    },
    data: { status: "LISTENING" },
  });

  // Advance LISTENING -> VOTING immediately
  const listeningAdvanced = await db.round.updateMany({
    where: { status: "LISTENING" },
    data: { status: "VOTING" },
  });

  // Advance VOTING -> RESULTS when votingDeadline passes
  const votingAdvanced = await db.round.updateMany({
    where: {
      status: "VOTING",
      votingDeadline: { lte: now },
    },
    data: { status: "RESULTS" },
  });

  return NextResponse.json({
    advanced: {
      submissionToListening: submissionAdvanced.count,
      listeningToVoting: listeningAdvanced.count,
      votingToResults: votingAdvanced.count,
    },
    timestamp: now.toISOString(),
  });
}
