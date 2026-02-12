Build the app shell and layout for the music league app. Use Tailwind CSS v4. The design should be modern and dark-themed (dark backgrounds with accent colors - think Spotify-meets-Discord aesthetic). No component library - build everything with Tailwind utility classes.

1. Create a shared layout structure:
   - `src/app/_components/layout/header.tsx` - Top navigation bar with:
     - App name "Better Music League" (left)
     - Nav links: Dashboard, Leagues (center, only when authenticated)
     - User avatar + name + sign out button (right, when authenticated)
     - Sign in button (right, when not authenticated)
   - Use the existing Better Auth client for auth state

2. Create `src/app/_components/ui/button.tsx` - Reusable button component with variants: primary, secondary, danger, ghost. Sizes: sm, md, lg. Support disabled state and loading spinner.

3. Create `src/app/_components/ui/card.tsx` - Reusable card component with optional header, body padding, hover effects.

4. Create `src/app/_components/ui/input.tsx` - Styled text input with label, error message support, and optional description text.

5. Create `src/app/_components/ui/badge.tsx` - Status badge component for round phases (Submission, Listening, Voting, Results) with appropriate colors.

6. Create `src/app/_components/ui/modal.tsx` - Modal/dialog component using HTML <dialog> element. Support title, body content, and action buttons.

7. Update `src/app/layout.tsx` to include the header on all pages. Set up dark theme defaults in globals.css (dark background, light text as base).

8. Update `src/app/page.tsx` to be a proper landing page:
   - Hero section with app name and tagline ("Compete with friends to find the best music")
   - Sign in with Discord button (when not authenticated)
   - Redirect to /dashboard when authenticated (use Next.js redirect)

9. Create `src/app/dashboard/page.tsx` as a protected page (redirect to / if not authenticated):
   - "Your Leagues" section (empty state for now: "No leagues yet. Create one or join with an invite link.")
   - "Create League" button
   - "Join League" input (for invite codes)

10. Define a color scheme in globals.css using CSS custom properties:
    - Background: dark grays (#0a0a0f, #12121a, #1a1a2e)
    - Primary accent: vibrant purple or blue
    - Success: green, Warning: amber, Danger: red
    - Text: white/gray hierarchy

Run `pnpm check` to verify.
