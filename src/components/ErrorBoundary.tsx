import React, { PropsWithChildren } from "react";

import { AnalyticsService } from "services/analytics.service";

import { ErrorMessage } from "./ErrorMessage";

export class ErrorBoundary extends React.Component<
  PropsWithChildren,
  { hasError: boolean; errorMessage?: string }
> {
  constructor(props: PropsWithChildren) {
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
      return <ErrorMessage message={this.state.errorMessage} />;
    }

    return this.props.children;
  }
}
