"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Menu, Music, User, Settings, X } from "lucide-react";
import { authClient, type Session } from "~/server/better-auth/client";

function UserDropdown({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center gap-2 rounded-lg p-1 transition-colors hover:bg-bg-tertiary"
      >
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
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-border bg-bg-secondary py-1 shadow-lg">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <div className="my-1 border-t border-border" />
          <button
            onClick={() => {
              setOpen(false);
              void authClient.signOut();
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-64 border-l border-border bg-bg-secondary p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-medium text-text-muted">Menu</span>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            Dashboard
          </Link>
          <Link
            href="/leagues"
            onClick={onClose}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            Leagues
          </Link>
          <Link
            href="/profile"
            onClick={onClose}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            Profile
          </Link>
          <Link
            href="/settings"
            onClick={onClose}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            Settings
          </Link>
          <div className="my-2 border-t border-border" />
          <button
            onClick={() => {
              onClose();
              void authClient.signOut();
            }}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </nav>
      </div>
    </>
  );
}

export function Header({ session }: { session: Session | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
              <div className="hidden sm:block">
                <UserDropdown session={session} />
              </div>
              <button
                onClick={() => setMobileOpen(true)}
                className="flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-bg-tertiary sm:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <MobileNav
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
              />
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
