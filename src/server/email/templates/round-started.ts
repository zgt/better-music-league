import { emailButton, emailLayout } from "./layout";

export function roundStartedEmail({
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
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#fafafa;">A new round has started!</h2>
    <p style="margin:0 0 4px;font-size:14px;color:#a3a3a3;">${leagueName}</p>
    <p style="margin:16px 0 0;font-size:16px;color:#e5e5e5;">
      Theme: <strong style="color:#a78bfa;">${themeName}</strong>
    </p>
    <p style="margin:8px 0 0;font-size:14px;color:#a3a3a3;">
      Submit your songs before <strong style="color:#e5e5e5;">${deadline}</strong>.
    </p>
    ${emailButton("Submit Your Song", roundUrl)}
  `);

  return {
    subject: `New round: "${themeName}" — ${leagueName}`,
    html,
  };
}
