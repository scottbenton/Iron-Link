import React, { PropsWithChildren, ReactNode } from "react";

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

    // The App has updated in the background, lets grab the new versions of the pages by refreshing
    if (
      errorMessage?.includes("Failed to fetch dynamically imported module") ||
      errorMessage?.includes(
        "'text/html' is not a valid JavaScript MIME type.",
      ) ||
      errorMessage?.includes("Importing a module script failed.") ||
      errorMessage
        ?.toLocaleLowerCase()
        .includes("error loading dynamically imported module")
    ) {
      // This is due to a new version of the app being deployed, so we need to refresh the page
      window.location.reload();
    } else {
      AnalyticsService.logError(typedError);
    }

    return { hasError: true, errorMessage };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      return <ErrorMessage message={this.state.errorMessage} />;
    }

    return this.props.children;
  }
}
