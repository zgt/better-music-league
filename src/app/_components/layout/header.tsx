"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-lg p-1 transition-colors">
          <Avatar className="h-7 w-7">
            <AvatarImage src={session.user.image ?? undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {session.user.name?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground hidden text-sm sm:inline">
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
          onClick={handleSignOut}
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
  const router = useRouter();

  const handleSignOut = async () => {
    setOpen(false);
    await authClient.signOut();
    router.push("/");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="sm:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-64">
        <SheetHeader>
          <SheetTitle className="text-muted-foreground text-sm font-medium">
            Menu
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-4 flex flex-col gap-1">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/leagues"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          >
            Leagues
          </Link>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          >
            Profile
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          >
            Settings
          </Link>
          <Separator className="my-2" />
          <button
            onClick={handleSignOut}
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
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
    <header className="border-border bg-card/80 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold tracking-tight"
          >
            <Music className="text-primary h-5 w-5" />
            <span>Better Music League</span>
          </Link>

          {session && (
            <nav className="hidden items-center gap-4 sm:flex">
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Dashboard
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
