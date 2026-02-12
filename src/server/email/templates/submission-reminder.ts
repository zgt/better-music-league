import { emailButton, emailLayout } from "./layout";

export function submissionReminderEmail({
  themeName,
  leagueName,
  deadline,
  submittedCount,
  totalMembers,
  roundUrl,
}: {
  themeName: string;
  leagueName: string;
  deadline: string;
  submittedCount: number;
  totalMembers: number;
  roundUrl: string;
}) {
  const html = emailLayout(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#fafafa;">Don't forget to submit!</h2>
    <p style="margin:0 0 4px;font-size:14px;color:#a3a3a3;">${leagueName}</p>
    <p style="margin:16px 0 0;font-size:16px;color:#e5e5e5;">
      Submit your songs for "<strong style="color:#a78bfa;">${themeName}</strong>" before <strong style="color:#e5e5e5;">${deadline}</strong>.
    </p>
    <p style="margin:8px 0 0;font-size:14px;color:#a3a3a3;">
      ${submittedCount} of ${totalMembers} members have submitted.
    </p>
    ${emailButton("Submit Now", roundUrl)}
  `);

  return {
    subject: `Reminder: Submit for "${themeName}" — ${leagueName}`,
    html,
  };
}
