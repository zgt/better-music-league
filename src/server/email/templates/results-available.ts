import { emailButton, emailLayout } from "./layout";

export function resultsAvailableEmail({
  themeName,
  leagueName,
  winnerName,
  trackName,
  roundUrl,
}: {
  themeName: string;
  leagueName: string;
  winnerName: string;
  trackName: string;
  roundUrl: string;
}) {
  const html = emailLayout(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#fafafa;">Results are in!</h2>
    <p style="margin:0 0 4px;font-size:14px;color:#a3a3a3;">${leagueName}</p>
    <p style="margin:16px 0 0;font-size:16px;color:#e5e5e5;">
      The results for "<strong style="color:#a78bfa;">${themeName}</strong>" are ready.
    </p>
    <p style="margin:8px 0 0;font-size:16px;color:#e5e5e5;">
      <strong style="color:#fafafa;">${winnerName}</strong> won with "<strong style="color:#a78bfa;">${trackName}</strong>"
    </p>
    ${emailButton("See Full Results", roundUrl)}
  `);

  return {
    subject: `Results: "${themeName}" — ${leagueName}`,
    html,
  };
}
