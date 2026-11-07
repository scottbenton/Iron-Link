import { useEffect, useState } from "react";
import { useRouteError } from "react-router";

import { ErrorMessage } from "components/ErrorMessage";

import { isStaleChunkReloadPending } from "lib/staleChunkReload.lib";

import { AnalyticsService } from "services/analytics.service";

export function ErrorRoute() {
  const error = useRouteError();
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    let errorMessage: string | undefined = undefined;
    let typedError: Error;

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
    // installStaleChunkReload), so show nothing and log nothing.
    if (isStaleChunkReloadPending()) return;

    setErrorMessage(errorMessage);
    console.error("Error Route Error: ", errorMessage, location.pathname);
    AnalyticsService.logError(typedError);
  }, [error]);

  if (isStaleChunkReloadPending()) return null;

  return <ErrorMessage message={errorMessage} />;
}
