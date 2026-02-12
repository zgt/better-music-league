Implement email notifications using Resend (free tier: 3000 emails/month, perfect for this).

1. Install resend: `pnpm add resend`

2. Add to `src/env.js`: RESEND_API_KEY (server variable)

3. Create `src/server/email/client.ts`:
   - Initialize Resend client
   - Export `sendEmail({to, subject, html})` helper function
   - Use a "from" address like "Better Music League <noreply@yourdomain.com>" (or use Resend's testing domain for development)

4. Create email templates in `src/server/email/templates/`:
   - `round-started.ts` - "A new round has started! Theme: {themeName}. Submit your songs before {deadline}." Include a link to the round page.
   - `submission-reminder.ts` - "Reminder: Submit your songs for '{themeName}' before {deadline}. {X} of {Y} members have submitted."
   - `voting-open.ts` - "Voting is now open for '{themeName}'! Listen to the playlist and cast your votes before {deadline}."
   - `results-available.ts` - "Results are in for '{themeName}'! {winnerName} won with '{trackName}'. See the full results."
   - Each template should return {subject: string, html: string}. Keep HTML simple with inline styles (no complex templating needed). Dark theme styling matching the app.

5. Create `src/server/email/notifications.ts`:
   - `notifyRoundStarted(roundId)` - Send to all league members who have this notification enabled
   - `notifyVotingOpen(roundId)` - Send to all league members
   - `notifyResultsAvailable(roundId)` - Send to all league members
   - `sendSubmissionReminder(roundId)` - Send to members who haven't submitted yet
   - Each function queries the relevant users and their notification preferences, then batch-sends emails

6. Integrate notifications into the round phase advancement:
   - When a round is created -> send round-started notification
   - When advancing to VOTING -> send voting-open notification
   - When advancing to RESULTS -> send results-available notification
   - In the cron job, send submission reminders 24 hours before submission deadline (for members who haven't submitted)

7. Update `.env.example` with RESEND_API_KEY

Run `pnpm check` to verify.
