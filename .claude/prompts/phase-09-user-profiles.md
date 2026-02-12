Implement user profiles and account settings.

**Backend - `src/server/api/routers/user.ts`:**

Procedures:
- `getProfile` - Protected. Get current user's profile with stats: leagues joined, total points earned, rounds won, rounds participated, favorite submission (most points ever received on a single track)
- `getPublicProfile` - Public. Get another user's display name, image, and stats (only from shared leagues with the viewer)
- `updateProfile` - Protected. Update display name and image URL

Register in root router.

**Frontend:**

1. `src/app/profile/page.tsx` - Current user's profile:
   - Avatar (from Discord), display name, email
   - Stats cards: Total Points, Rounds Won, Leagues Active, Submissions Made
   - Recent activity: last 5 round results the user participated in
   - "Edit Profile" button

2. `src/app/settings/page.tsx` - Account settings:
   - Display name edit
   - Email notification preferences (toggles for: round start, submission deadline reminder, voting open, results available) - store as JSON on User model or separate UserPreferences model
   - "Delete Account" button with confirmation modal (soft delete or actual deletion based on your preference)

3. Add a notification preferences model if needed - add `notificationPreferences` JSON field to User model or create a UserSettings model in Prisma schema with boolean fields for each notification type. Run db:push after schema changes.

4. Update the header to link to /profile and /settings from a user dropdown menu.

Run `pnpm check` to verify.
