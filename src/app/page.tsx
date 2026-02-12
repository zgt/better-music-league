import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";

export default async function Home() {
  const session = await getSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-5xl font-bold tracking-tight">
          Better Music League
        </h1>

        {session ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg text-zinc-400">
              Signed in as {session.user.name}
            </p>
            <form>
              <button
                className="rounded-full bg-white/10 px-8 py-3 font-semibold transition hover:bg-white/20"
                formAction={async () => {
                  "use server";
                  await auth.api.signOut({
                    headers: await headers(),
                  });
                  redirect("/");
                }}
              >
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <form>
            <button
              className="rounded-full bg-indigo-600 px-8 py-3 font-semibold transition hover:bg-indigo-500"
              formAction={async () => {
                "use server";
                const res = await auth.api.signInSocial({
                  body: {
                    provider: "discord",
                    callbackURL: "/",
                  },
                });
                if (!res.url) {
                  throw new Error("No URL returned from signInSocial");
                }
                redirect(res.url);
              }}
            >
              Sign in with Discord
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
