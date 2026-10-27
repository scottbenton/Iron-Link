import { byteaToUint8Array, uint8ArrayToBytea } from "lib/bytea.lib";

import { RepositoryError } from "repositories/errors/RepositoryErrors";
import {
  RichTextSecretsRepository,
  SecretSurface,
  SecretsMentionDTO,
  SecretsValues,
  getGuideImageFolder,
} from "repositories/richTextSecrets.repository";
import { StorageRepository } from "repositories/storage.repository";

import { RichTextContentStore } from "./richTextContent.service";

export type { SecretSurface };

// The version a store reports while a surface has no secrets row yet. The
// first save creates the row instead of updating it.
export const NO_SECRETS_VERSION = "";

export type SecretsMention =
  | { noteId: string }
  | { worldEntryId: string }
  | { worldId: string };

function toMention(dto: SecretsMentionDTO): SecretsMention | null {
  if (dto.note_id) return { noteId: dto.note_id };
  if (dto.world_entry_id) return { worldEntryId: dto.world_entry_id };
  if (dto.world_id) return { worldId: dto.world_id };
  return null;
}

export class RichTextSecretsService {
  // Where a surface's companion document of Guide-only secrets is read and
  // written, for `saveMergedRichText`. Nothing is stored until the first save,
  // so opening a note never creates a row.
  public static createStore(
    surface: SecretSurface,
    getToken: () => string | undefined,
    // What the blocks mention, written beside the content for backlinks.
    getMentions: () => Pick<
      SecretsValues,
      "mentioned_note_ids" | "mentioned_entry_ids"
    > = () => ({}),
  ): RichTextContentStore {
    const getValues = (content: Uint8Array, text: string): SecretsValues => ({
      ...getMentions(),
      content_bytes: uint8ArrayToBytea(content),
      content_text: text,
    });
    return {
      read: async (knownUpdatedAt) => {
        const stored = await RichTextSecretsRepository.read(
          surface,
          knownUpdatedAt || undefined,
        );
        if (!stored) return { updatedAt: NO_SECRETS_VERSION };
        if ("unchanged" in stored || !stored.content) {
          return { updatedAt: stored.updatedAt };
        }
        return {
          updatedAt: stored.updatedAt,
          content: byteaToUint8Array(stored.content),
        };
      },
      write: (content, text, expectedUpdatedAt) =>
        expectedUpdatedAt === NO_SECRETS_VERSION
          ? RichTextSecretsRepository.create(surface, getValues(content, text))
          : RichTextSecretsRepository.writeIfUnchanged(
              surface,
              getValues(content, text),
              expectedUpdatedAt,
            ),
      writeBeacon: (content, text, expectedUpdatedAt) => {
        const token = getToken();
        // A row can't be created on unload; the edits stay on this device
        // and are saved when the surface next opens.
        if (!token || expectedUpdatedAt === NO_SECRETS_VERSION) return;
        RichTextSecretsRepository.writeIfUnchangedBeacon(
          token,
          surface,
          getValues(content, text),
          expectedUpdatedAt,
        );
      },
    };
  }

  public static listenToVersion(
    surface: SecretSurface,
    onVersion: (updatedAt: string | null) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return RichTextSecretsRepository.listenToVersion(
      surface,
      onVersion,
      onError,
    );
  }

  // The surfaces whose secrets mention a note or entry, for Guide backlinks.
  public static async listMentioning(
    target: { noteId: string } | { entryId: string },
  ): Promise<SecretsMention[]> {
    const rows = await RichTextSecretsRepository.listMentioning(target);
    return rows.map(toMention).filter((m): m is SecretsMention => !!m);
  }

  // Images inside secrets live in the private guide_images bucket. A secret
  // stores the returned path and shows the image through a signed URL.
  public static storeImage(surface: SecretSurface, image: File) {
    return StorageRepository.storeGuideImage(
      getGuideImageFolder(surface),
      image,
    );
  }

  // The folder of a surface's images in the private bucket.
  public static getImageFolder(surface: SecretSurface) {
    return getGuideImageFolder(surface);
  }

  public static isPublicImageUrl(url: string) {
    return StorageRepository.isPublicImageUrl(url);
  }

  public static getImageUrl(path: string, expiresInSeconds = 60 * 60) {
    return StorageRepository.getSignedGuideImageUrl(path, expiresInSeconds);
  }
}
