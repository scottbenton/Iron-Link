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

// An account counts as new when its first sign-in comes within this long of
// its creation. An emailed code creates the account when it is sent, so the
// window leaves time to find and type it.
export const NEW_ACCOUNT_WINDOW_MS = 30 * 60 * 1000;

const ACCOUNT_CREATE_SENT_KEY = "analytics-account-create-sent";

export function isNewAccount(
  accountCreatedAt: string,
  now: number = Date.now(),
): boolean {
  const createdAt = Date.parse(accountCreatedAt);
  if (Number.isNaN(createdAt)) return false;
  const age = now - createdAt;
  return age >= 0 && age <= NEW_ACCOUNT_WINDOW_MS;
}

export class AnalyticsService {
  public static setIdentity(uid: string | null, accountCreatedAt?: string) {
    if (uid) {
      // Set once, so a person's account_created_at never moves and PostHog
      // can tell new accounts from returning ones.
      posthog.identify(
        uid,
        undefined,
        accountCreatedAt ? { account_created_at: accountCreatedAt } : undefined,
      );
    } else {
      posthog.reset();
    }
  }

  // Sends app:account_create the first time a new account signs in on this
  // device. Call after setIdentity, so the event lands on the account and
  // joins the visitor's earlier anonymous events.
  public static logAccountCreatedIfNew(uid: string, accountCreatedAt: string) {
    if (!isNewAccount(accountCreatedAt)) return;
    try {
      const sent = localStorage.getItem(ACCOUNT_CREATE_SENT_KEY);
      if (sent === uid) return;
      localStorage.setItem(ACCOUNT_CREATE_SENT_KEY, uid);
    } catch {
      // Storage can be unavailable; sending twice is better than never.
    }
    this.logEvent(LoggerCategory.App, "account", LoggerVerb.Create);
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
