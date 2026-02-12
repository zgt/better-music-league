import { db } from "~/server/db";
import { env } from "~/env";
import { sendEmail } from "./client";
import { roundStartedEmail } from "./templates/round-started";
import { submissionReminderEmail } from "./templates/submission-reminder";
import { votingOpenEmail } from "./templates/voting-open";
import { resultsAvailableEmail } from "./templates/results-available";
import type { NotificationPreferences } from "~/server/api/routers/user";

const DEFAULT_PREFS: NotificationPreferences = {
  roundStart: true,
  submissionDeadline: true,
  votingOpen: true,
  resultsAvailable: true,
};

function getUserPrefs(raw: unknown): NotificationPreferences {
  if (
    raw &&
    typeof raw === "object" &&
    "roundStart" in raw &&
    "submissionDeadline" in raw &&
    "votingOpen" in raw &&
    "resultsAvailable" in raw
  ) {
    return raw as NotificationPreferences;
  }
  return DEFAULT_PREFS;
}

function formatDeadline(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function roundUrl(leagueId: string, roundId: string): string {
  const base = env.BETTER_AUTH_BASE_URL;
  return `${base}/leagues/${leagueId}/rounds/${roundId}`;
}

async function getLeagueMembers(leagueId: string) {
  return db.leagueMember.findMany({
    where: { leagueId },
    include: {
      user: { select: { email: true, notificationPreferences: true } },
    },
  });
}

export async function notifyRoundStarted(roundId: string) {
  const round = await db.round.findUnique({
    where: { id: roundId },
    include: { league: { select: { id: true, name: true } } },
  });
  if (!round) return;

  const members = await getLeagueMembers(round.leagueId);
  const url = roundUrl(round.leagueId, round.id);

  const emails = members
    .filter((m) => getUserPrefs(m.user.notificationPreferences).roundStart)
    .map((m) => {
      const { subject, html } = roundStartedEmail({
        themeName: round.themeName,
        leagueName: round.league.name,
        deadline: formatDeadline(round.submissionDeadline),
        roundUrl: url,
      });
      return sendEmail({ to: m.user.email, subject, html });
    });

  await Promise.allSettled(emails);
}

export async function notifyVotingOpen(roundId: string) {
  const round = await db.round.findUnique({
    where: { id: roundId },
    include: { league: { select: { id: true, name: true } } },
  });
  if (!round) return;

  const members = await getLeagueMembers(round.leagueId);
  const url = roundUrl(round.leagueId, round.id);

  const emails = members
    .filter((m) => getUserPrefs(m.user.notificationPreferences).votingOpen)
    .map((m) => {
      const { subject, html } = votingOpenEmail({
        themeName: round.themeName,
        leagueName: round.league.name,
        deadline: formatDeadline(round.votingDeadline),
        roundUrl: url,
      });
      return sendEmail({ to: m.user.email, subject, html });
    });

  await Promise.allSettled(emails);
}

export async function notifyResultsAvailable(roundId: string) {
  const round = await db.round.findUnique({
    where: { id: roundId },
    include: {
      league: { select: { id: true, name: true } },
      submissions: {
        include: {
          user: { select: { name: true } },
          votes: { select: { points: true } },
        },
      },
    },
  });
  if (!round) return;

  // Find the winner
  let winnerName = "Unknown";
  let trackName = "Unknown";
  let maxPoints = 0;

  for (const sub of round.submissions) {
    const pts = sub.votes.reduce((sum, v) => sum + v.points, 0);
    if (pts > maxPoints) {
      maxPoints = pts;
      winnerName = sub.user.name;
      trackName = sub.trackName;
    }
  }

  const members = await getLeagueMembers(round.leagueId);
  const url = roundUrl(round.leagueId, round.id);

  const emails = members
    .filter(
      (m) => getUserPrefs(m.user.notificationPreferences).resultsAvailable,
    )
    .map((m) => {
      const { subject, html } = resultsAvailableEmail({
        themeName: round.themeName,
        leagueName: round.league.name,
        winnerName,
        trackName,
        roundUrl: url,
      });
      return sendEmail({ to: m.user.email, subject, html });
    });

  await Promise.allSettled(emails);
}

export async function sendSubmissionReminders() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Find rounds in SUBMISSION phase with deadline within the next 24 hours
  const rounds = await db.round.findMany({
    where: {
      status: "SUBMISSION",
      submissionDeadline: { gt: now, lte: in24h },
    },
    include: {
      league: {
        select: {
          id: true,
          name: true,
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  notificationPreferences: true,
                },
              },
            },
          },
        },
      },
      submissions: { select: { userId: true } },
    },
  });

  for (const round of rounds) {
    const submittedUserIds = new Set(round.submissions.map((s) => s.userId));
    const totalMembers = round.league.members.length;
    const url = roundUrl(round.leagueId, round.id);

    const emails = round.league.members
      .filter(
        (m) =>
          !submittedUserIds.has(m.user.id) &&
          getUserPrefs(m.user.notificationPreferences).submissionDeadline,
      )
      .map((m) => {
        const { subject, html } = submissionReminderEmail({
          themeName: round.themeName,
          leagueName: round.league.name,
          deadline: formatDeadline(round.submissionDeadline),
          submittedCount: submittedUserIds.size,
          totalMembers,
          roundUrl: url,
        });
        return sendEmail({ to: m.user.email, subject, html });
      });

    await Promise.allSettled(emails);
  }
}
