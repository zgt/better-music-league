Polish the app for production deployment on Vercel.

1. **Loading states**: Add loading skeletons/spinners for:
   - Dashboard league cards
   - League detail page
   - Round page content
   - Search results
   - Use React Suspense boundaries with fallback components where appropriate

2. **Error handling**:
   - Create `src/app/_components/ui/error-boundary.tsx` - client component error boundary with retry button
   - Create `src/app/not-found.tsx` - custom 404 page
   - Create `src/app/error.tsx` - custom error page
   - Add error states to all tRPC queries (show user-friendly messages, not raw errors)
   - Handle edge cases: league not found, round not found, not a member, etc.

3. **Empty states**: Design proper empty states for:
   - No leagues on dashboard
   - No rounds in a league
   - No submissions yet in a round
   - No votes yet
   - Each should have a descriptive message and CTA button

4. **Responsive design**: Ensure all pages work on mobile (min-width 320px):
   - Stack layouts vertically on small screens
   - Hamburger menu for mobile navigation
   - Touch-friendly vote interface (larger tap targets)
   - Responsive grid for league cards (1 col mobile, 2 col tablet, 3 col desktop)

5. **SEO & metadata**:
   - Add proper metadata to layout.tsx (title, description, og tags)
   - Add favicon (musical note or league trophy icon)

6. **Vercel deployment prep**:
   - Ensure `next.config.js` is production-ready
   - Verify all environment variables are documented
   - Create vercel.json with cron configuration:
     ```json
     { "crons": [{ "path": "/api/cron/advance-rounds", "schedule": "*/15 * * * *" }] }
     ```
   - Secure the cron endpoint with a CRON_SECRET env var (Vercel sends this automatically)
   - Add CRON_SECRET to env.js validation

7. **Performance**:
   - Add proper cache headers for static assets
   - Ensure images use next/image where applicable
   - Verify tRPC prefetching is set up for server components on key pages (dashboard, league detail)

Run `pnpm check` and `pnpm build` to verify everything compiles for production.
