"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Menu, Music, User, Settings } from "lucide-react";
import { authClient, type Session } from "~/server/better-auth/client";

import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Separator } from "~/components/ui/separator";

function UserDropdown({ session }: { session: Session }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex cursor-pointer items-center gap-2 rounded-lg p-1 transition-colors hover:bg-accent">
          <Avatar className="h-7 w-7">
            <AvatarImage src={session.user.image ?? undefined} />
            <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
              {session.user.name?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {session.user.name}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void authClient.signOut()}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNav({ session: _session }: { session: Session }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="sm:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-64">
        <SheetHeader>
          <SheetTitle className="text-sm font-medium text-muted-foreground">
            Menu
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-4 flex flex-col gap-1">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/leagues"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Leagues
          </Link>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Profile
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Settings
          </Link>
          <Separator className="my-2" />
          <button
            onClick={() => {
              setOpen(false);
              void authClient.signOut();
            }}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function Header({ session }: { session: Session | null }) {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold tracking-tight"
          >
            <Music className="h-5 w-5 text-primary" />
            <span>Better Music League</span>
          </Link>

          {session && (
            <nav className="hidden items-center gap-4 sm:flex">
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/leagues"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
              <MobileNav session={session} />
            </>
          ) : (
            <Button asChild>
              <Link href="/">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
