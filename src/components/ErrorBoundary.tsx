import React, { PropsWithChildren, ReactNode } from "react";

import { isStaleChunkReloadPending } from "lib/staleChunkReload.lib";

import { AnalyticsService } from "services/analytics.service";

import { ErrorMessage } from "./ErrorMessage";

export type ErrorBoundaryProps = PropsWithChildren<{
  // Shown in place of the crash page, for a boundary around one part of a
  // page so the rest keeps working.
  fallback?: ReactNode;
}>;

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean; errorMessage?: string }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown) {
    let typedError: Error;
    let errorMessage: string | undefined = undefined;

    if (typeof error === "string") {
      errorMessage = error;
      typedError = new Error(error);
    } else if (error instanceof Error) {
      errorMessage = error.message;
      typedError = error;
    } else {
      typedError = new Error(`Unknown error. Type was ${typeof error}`);
    }

    // A stale chunk reload is already loading the new build (see
    // installStaleChunkReload), so this crash is expected and goes unlogged.
    if (!isStaleChunkReloadPending()) {
      AnalyticsService.logError(typedError);
    }

    return { hasError: true, errorMessage };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (isStaleChunkReloadPending()) return null;
      if (this.props.fallback !== undefined) return this.props.fallback;
      return <ErrorMessage message={this.state.errorMessage} />;
    }

    return this.props.children;
  }
}
