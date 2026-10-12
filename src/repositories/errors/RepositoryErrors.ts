import { StorageApiError } from "@supabase/storage-js";
import { isAuthError } from "@supabase/supabase-js";

import { parseRepositoryErrorAndCreateSnackbar } from "providers/SnackbarProvider";

export enum ErrorNoun {
  Asset = "asset",
  Character = "character",
  Game = "game",
  GameInviteKey = "game invite key",
  GameLog = "game log",
  GamePlayers = "game players",
  NoteFolders = "note folders",
  Note = "note",
  SecondScreen = "second screen settings",
  Tracks = "tracks",
  User = "user",
  Image = "image",
  World = "world",
  WorldPlayer = "world player",
  WorldCategory = "world category",
  WorldEntry = "world entry",
  WorldFieldDefinition = "world field definition",
  WorldEntryFieldValue = "world entry field value",
}

export enum ErrorVerb {
  Create = "create",
  Read = "read",
  Update = "update",
  Delete = "delete",
  Upload = "upload",
}

export enum ErrorReason {
  BadRequest = "BAD_REQUEST",
  NotAuthorized = "NOT_AUTHORIZED",
  Forbidden = "FORBIDDEN",
  NotFound = "NOT_FOUND",
  TimedOut = "TIMED_OUT",
  RateLimited = "RATE_LIMITED",
  ServerError = "SERVER_ERROR",
  // The database refused a world entry parent: another category, the entry
  // itself, one of its descendants, or a category without nesting.
  InvalidParent = "INVALID_PARENT",
  Unknown = "UNKNOWN",
}

export class RepositoryError extends Error {
  originalMessage?: string;
  reason: ErrorReason;
  verb: ErrorVerb;
  noun: ErrorNoun;
  plural: boolean;

  constructor(
    reason: ErrorReason,
    verb: ErrorVerb,
    noun: ErrorNoun,
    plural: boolean,
    originalMessage?: string,
  ) {
    super(`Failed to ${verb} ${noun}: ${reason}`);
    this.name = this.constructor.name;
    this.reason = reason;
    this.verb = verb;
    this.noun = noun;
    this.plural = plural;
    this.originalMessage = originalMessage;
  }
}

export function getRepositoryError(
  error: unknown,
  verb: ErrorVerb,
  noun: ErrorNoun,
  plural: boolean,
  status?: number,
): RepositoryError {
  let reason = ErrorReason.Unknown;
  let message: string | undefined;

  if (status) {
    reason = convertHttpStatusCodeToErrorReason(status);
  }

  if (isAuthError(error) || error instanceof StorageApiError) {
    if (error.status) {
      reason = convertHttpStatusCodeToErrorReason(error.status);
    }
  }

  if (error instanceof Error) {
    message = error.message;
  }
  if (typeof error === "string") {
    message = error;
  }
  if (Array.isArray(error)) {
    message = error.join(", ");
  }
  if (isInvalidParentError(error)) {
    reason = ErrorReason.InvalidParent;
  }

  return createRepositoryError(reason, verb, noun, plural, message);
}

// Reports a failure the same way as one returned by the server. Used when a
// request is refused locally before it is sent.
export function createRepositoryError(
  reason: ErrorReason,
  verb: ErrorVerb,
  noun: ErrorNoun,
  plural: boolean,
  message?: string,
): RepositoryError {
  const repositoryError = new RepositoryError(
    reason,
    verb,
    noun,
    plural,
    message,
  );

  parseRepositoryErrorAndCreateSnackbar(repositoryError);

  return repositoryError;
}

// Every refused parent raises check_violation with this hint; the message
// names the specific case and is not part of the contract.
function isInvalidParentError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "hint" in error &&
    error.code === "23514" &&
    error.hint === "invalid_parent"
  );
}

export function convertHttpStatusCodeToErrorReason(code: number): ErrorReason {
  if (code === 400) {
    return ErrorReason.BadRequest;
  } else if (code === 401) {
    return ErrorReason.NotAuthorized;
  } else if (code === 403) {
    return ErrorReason.Forbidden;
  } else if (code === 404) {
    return ErrorReason.NotFound;
  } else if (code === 408 || code === 504) {
    return ErrorReason.TimedOut;
  } else if (code === 429) {
    return ErrorReason.RateLimited;
  } else if (code === 500) {
    return ErrorReason.ServerError;
  } else {
    return ErrorReason.Unknown;
  }
}
