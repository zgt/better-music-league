Clean up the T3 boilerplate in the project:

1. Delete the root-level `auth.ts` and `auth-client.ts` files (duplicates of src/server/better-auth/)
2. Remove the `Post` model from `prisma/schema.prisma`
3. Delete `src/server/api/routers/post.ts` and remove it from `src/server/api/root.ts`
4. Delete `src/app/_components/post.tsx`
5. Replace `src/app/page.tsx` with a minimal placeholder page that says "Better Music League" with a sign-in button using the existing Better Auth Discord OAuth. Keep the existing auth logic pattern but remove all T3 branding.
6. Fix `.env.example` to match actual Discord OAuth vars instead of GitHub
7. Run `pnpm check` to make sure everything compiles cleanly
