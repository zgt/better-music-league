import { emailButton, emailLayout } from "./layout";

export function votingOpenEmail({
  themeName,
  leagueName,
  deadline,
  roundUrl,
}: {
  themeName: string;
  leagueName: string;
  deadline: string;
  roundUrl: string;
}) {
  const html = emailLayout(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#fafafa;">Voting is now open!</h2>
    <p style="margin:0 0 4px;font-size:14px;color:#a3a3a3;">${leagueName}</p>
    <p style="margin:16px 0 0;font-size:16px;color:#e5e5e5;">
      Listen to the playlist and cast your votes for "<strong style="color:#a78bfa;">${themeName}</strong>".
    </p>
    <p style="margin:8px 0 0;font-size:14px;color:#a3a3a3;">
      Vote before <strong style="color:#e5e5e5;">${deadline}</strong>.
    </p>
    ${emailButton("Vote Now", roundUrl)}
  `);

  return {
    subject: `Vote now: "${themeName}" — ${leagueName}`,
    html,
  };
}
