"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-bg-secondary px-6 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
            <AlertTriangle className="h-6 w-6 text-danger" />
          </div>
          <div>
            <p className="font-medium">Something went wrong</p>
            <p className="mt-1 text-sm text-text-muted">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
