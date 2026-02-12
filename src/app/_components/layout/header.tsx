"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut, Music } from "lucide-react";
import { authClient, type Session } from "~/server/better-auth/client";

export function Header({ session }: { session: Session | null }) {
  return (
    <header className="border-b border-border bg-bg-secondary/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold tracking-tight"
          >
            <Music className="h-5 w-5 text-accent" />
            <span>Better Music League</span>
          </Link>

          {session && (
            <nav className="hidden items-center gap-4 sm:flex">
              <Link
                href="/dashboard"
                className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                Dashboard
              </Link>
              <Link
                href="/leagues"
                className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                Leagues
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <div className="flex items-center gap-2">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold">
                    {session.user.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="hidden text-sm text-text-secondary sm:inline">
                  {session.user.name}
                </span>
              </div>
              <button
                onClick={() => authClient.signOut()}
                className="cursor-pointer rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              href="/"
              className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
