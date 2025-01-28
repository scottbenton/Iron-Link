import posthog from "posthog-js";

const rawApiKey = import.meta.env.VITE_POSTHOG_KEY;
const rawApiHost = import.meta.env.VITE_POSTHOG_HOST;

const apiKey = typeof rawApiKey === "string" ? rawApiKey : undefined;
const apiHost = typeof rawApiHost === "string" ? rawApiHost : undefined;

let hasInitialized = false;
if (apiKey && apiHost && !hasInitialized) {
  hasInitialized = true;
  posthog.init(apiKey, {
    api_host: apiHost,
    autocapture: false,
    capture_pageview: false,
  });
}

export enum LoggerVerb {
  Click = "click",
  Cancel = "cancel",
  Create = "create",
  Delete = "delete",
  View = "view",
}

export enum LoggerCategory {
  Character = "character",
  Game = "game",
  Notes = "notes",
  App = "app",
  World = "world",
  Homebrew = "homebrew",
}

export class AnalyticsService {
  public static setIdentity(uid: string | null) {
    if (uid) {
      posthog.identify(uid);
    } else {
      posthog.reset();
    }
  }

  public static logEvent(
    category: LoggerCategory,
    object: string,
    verb: LoggerVerb,
  ) {
    posthog.capture(`${category}:${object}_${verb}`);
  }
  public static logError(error: Error) {
    posthog.captureException(error);
  }
}
