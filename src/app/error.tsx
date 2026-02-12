"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10">
          <AlertTriangle className="h-8 w-8 text-danger" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-text-muted">
            An unexpected error occurred. Please try again.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
