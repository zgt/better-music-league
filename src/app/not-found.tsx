import Link from "next/link";
import { Music, Home } from "lucide-react";
import { Button } from "~/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20">
          <Music className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-6xl font-bold">404</h1>
          <p className="mt-2 text-lg text-muted-foreground">Page not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
