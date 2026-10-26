import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { Tables } from "types/supabase-generated.type";

import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from "lib/supabase.lib";

import { createSubscription } from "./_subscriptionManager";
import {
  ErrorNoun,
  ErrorVerb,
  RepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";

// The rich text surface whose Guide-only secrets a row holds: a game note, an
// entry's Notes or a world's Notes. Each has at most one row, created by the
// first save; see 20261027000000_rich_text_secrets.sql.
export type SecretSurface =
  | { noteId: string }
  | { worldEntryId: string }
  | { worldId: string };

type SecretsDTO = Tables<"rich_text_secrets">;
type SecretsVersionDTO = Pick<SecretsDTO, "updated_at">;
export type SecretsMentionDTO = Pick<
  SecretsDTO,
  "note_id" | "world_entry_id" | "world_id"
>;

// The columns a save writes. Which surface a row is for is set once, when
// the row is created, and never changes.
export interface SecretsValues {
  content_bytes: string;
  content_text: string;
  mentioned_note_ids?: string[];
  mentioned_entry_ids?: string[];
}

export function getSecretSurfaceColumn(surface: SecretSurface) {
  if ("noteId" in surface) {
    return { column: "note_id", id: surface.noteId } as const;
  } else if ("worldEntryId" in surface) {
    return { column: "world_entry_id", id: surface.worldEntryId } as const;
  }
  return { column: "world_id", id: surface.worldId } as const;
}

// The guide_images folder for a surface's secrets.
export function getGuideImageFolder(surface: SecretSurface) {
  if ("noteId" in surface) return `notes/${surface.noteId}`;
  if ("worldEntryId" in surface) return `world_entries/${surface.worldEntryId}`;
  return `worlds/${surface.worldId}`;
}

export function getSecretSurfaceKey(surface: SecretSurface) {
  const { column, id } = getSecretSurfaceColumn(surface);
  return `${column}:${id}`;
}

const getError = (
  error: unknown,
  verb: ErrorVerb,
  status?: number,
): RepositoryError =>
  getRepositoryError(error, verb, ErrorNoun.Secrets, false, status);

export class RichTextSecretsRepository {
  private static secrets = () => supabase.from("rich_text_secrets");

  // The stored secrets and their version, or null when the surface has none
  // yet. Reads only the version when it is still `knownUpdatedAt`.
  public static async read(
    surface: SecretSurface,
    knownUpdatedAt: string | undefined,
  ): Promise<
    | { content: string | null; updatedAt: string }
    | { updatedAt: string; unchanged: true }
    | null
  > {
    const { column, id } = getSecretSurfaceColumn(surface);
    if (knownUpdatedAt) {
      const { data, error, status } = await this.secrets()
        .select("updated_at")
        .eq(column, id)
        .maybeSingle();
      if (error) {
        console.error(error);
        throw getError(error, ErrorVerb.Read, status);
      }
      if (!data) return null;
      if (data.updated_at === knownUpdatedAt) {
        return { updatedAt: data.updated_at, unchanged: true };
      }
    }
    const { data, error, status } = await this.secrets()
      .select("content_bytes, updated_at")
      .eq(column, id)
      .maybeSingle();
    if (error) {
      console.error(error);
      throw getError(error, ErrorVerb.Read, status);
    }
    if (!data) return null;
    return { content: data.content_bytes, updatedAt: data.updated_at };
  }

  // Creates the surface's row holding `values`. Resolves its version, or null
  // when another Guide created it first, in which case the caller merges with
  // theirs and saves again.
  public static async create(
    surface: SecretSurface,
    values: SecretsValues,
  ): Promise<string | null> {
    const { column, id } = getSecretSurfaceColumn(surface);
    const { data, error, status } = await this.secrets()
      .upsert(
        { ...values, [column]: id },
        { onConflict: column, ignoreDuplicates: true },
      )
      .select("updated_at");
    if (error) {
      console.error(error);
      throw getError(error, ErrorVerb.Create, status);
    }
    return data[0]?.updated_at ?? null;
  }

  // Writes only if the row is still at `expectedUpdatedAt`. Resolves the new
  // version, or null when someone else saved first (or the write was refused).
  public static async writeIfUnchanged(
    surface: SecretSurface,
    values: SecretsValues,
    expectedUpdatedAt: string,
  ): Promise<string | null> {
    const { column, id } = getSecretSurfaceColumn(surface);
    const { data, error, status } = await this.secrets()
      .update(values)
      .eq(column, id)
      .eq("updated_at", expectedUpdatedAt)
      .select("updated_at");
    if (error) {
      console.error(error);
      throw getError(error, ErrorVerb.Update, status);
    }
    return data[0]?.updated_at ?? null;
  }

  // The same guarded write as a keepalive request, which can outlive the page.
  // Its outcome is never read, so a clash leaves the edits unsaved.
  public static writeIfUnchangedBeacon(
    token: string,
    surface: SecretSurface,
    values: SecretsValues,
    expectedUpdatedAt: string,
  ): void {
    const { column, id } = getSecretSurfaceColumn(surface);
    fetch(
      `${SUPABASE_URL}/rest/v1/rich_text_secrets?${column}=eq.${id}` +
        `&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Prefer: "return=minimal",
          Apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(values),
        keepalive: true,
      },
    ).catch((e) => console.error(e));
  }

  // Reports the stored version, then each save, so an editor that is not in
  // the live room still picks up other Guides' saves. Players are never sent
  // these rows, and someone who can't read them hears null.
  public static listenToVersion(
    surface: SecretSurface,
    onVersion: (updatedAt: string | null) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    const { column, id } = getSecretSurfaceColumn(surface);

    const startInitialLoad = (isCurrent: () => boolean) => {
      this.secrets()
        .select("updated_at")
        .eq(column, id)
        .maybeSingle()
        .then(({ data, error, status }) => {
          if (!isCurrent()) return;
          if (error) {
            console.error(error);
            onError(getError(error, ErrorVerb.Read, status));
          } else {
            onVersion(data?.updated_at ?? null);
          }
        });
    };

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<SecretsVersionDTO>,
    ) => {
      if (payload.errors) {
        onError(getError(payload.errors, ErrorVerb.Read));
      } else if (
        payload.eventType === "INSERT" ||
        payload.eventType === "UPDATE"
      ) {
        onVersion(payload.new.updated_at);
      } else if (payload.eventType === "DELETE") {
        onVersion(null);
      }
    };

    return createSubscription(
      `rich_text_secrets:${column}=${id}`,
      "rich_text_secrets",
      `${column}=eq.${id}`,
      startInitialLoad,
      handlePayload,
      { loadBeforeJoin: true },
    );
  }

  // The surfaces whose secrets mention a note or an entry, for Guide
  // backlinks labelled Secret. Only surfaces the reader may see come back.
  public static async listMentioning(
    target: { noteId: string } | { entryId: string },
  ): Promise<SecretsMentionDTO[]> {
    const query = this.secrets().select("note_id, world_entry_id, world_id");
    const { data, error, status } = await ("noteId" in target
      ? query.contains("mentioned_note_ids", [target.noteId])
      : query.contains("mentioned_entry_ids", [target.entryId]));
    if (error) {
      console.error(error);
      throw getError(error, ErrorVerb.Read, status);
    }
    return data;
  }
}
