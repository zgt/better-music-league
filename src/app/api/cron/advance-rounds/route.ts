import { type NextRequest, NextResponse } from "next/server";

import { env } from "~/env";
import { db } from "~/server/db";
import {
  notifyVotingOpen,
  notifyResultsAvailable,
  sendSubmissionReminders,
} from "~/server/email/notifications";

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
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
  // Find rounds that are now LISTENING so we can notify
  const listeningRounds = await db.round.findMany({
    where: { status: "LISTENING" },
    select: { id: true },
  });

  const listeningAdvanced = await db.round.updateMany({
    where: { status: "LISTENING" },
    data: { status: "VOTING" },
  });

  // Send voting-open notifications
  for (const round of listeningRounds) {
    void notifyVotingOpen(round.id);
  }

  // Find rounds about to advance to RESULTS so we can notify
  const votingRounds = await db.round.findMany({
    where: {
      status: "VOTING",
      votingDeadline: { lte: now },
    },
    select: { id: true },
  });

  // Advance VOTING -> RESULTS when votingDeadline passes
  const votingAdvanced = await db.round.updateMany({
    where: {
      status: "VOTING",
      votingDeadline: { lte: now },
    },
    data: { status: "RESULTS" },
  });

  // Send results-available notifications
  for (const round of votingRounds) {
    void notifyResultsAvailable(round.id);
  }

  // Send submission reminders for rounds with deadlines within 24 hours
  void sendSubmissionReminders();

  return NextResponse.json({
    advanced: {
      submissionToListening: submissionAdvanced.count,
      listeningToVoting: listeningAdvanced.count,
      votingToResults: votingAdvanced.count,
    },
    timestamp: now.toISOString(),
  });
}
