import { supabase } from "lib/supabase.lib";

import {
  ErrorNoun,
  ErrorVerb,
  getRepositoryError,
} from "./errors/RepositoryErrors";

type BucketNames =
  | "characters"
  | "note_images"
  | "world_entry_images"
  | "world_map_backgrounds";

// Images inside Guide-only secrets. The bucket is private: files are read
// through signed URLs, under the same rule as the secrets themselves.
const GUIDE_IMAGES_BUCKET = "guide_images";

export class StorageRepository {
  public static async storeImage(
    bucket: BucketNames,
    path: string,
    image: File,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      supabase.storage
        .from(bucket)
        .upload(`${path}/${image.name}`, image)
        .then((response) => {
          if (response.error) {
            console.error(response.error);
            reject(
              getRepositoryError(
                response.error,
                ErrorVerb.Upload,
                ErrorNoun.Image,
                false,
              ),
            );
          } else {
            resolve(this.getImageUrl(bucket, path, image.name));
          }
        })
        .catch((e) => {
          console.error(e);
          reject(
            getRepositoryError(e, ErrorVerb.Upload, ErrorNoun.Image, false),
          );
        });
    });
  }

  public static async deleteImage(
    bucket: BucketNames,
    path: string,
    filename: string,
  ): Promise<void> {
    return new Promise<void>((res, reject) => {
      supabase.storage
        .from(bucket)
        .remove([`${path}/${filename}`])
        .then((result) => {
          if (result.error) {
            console.error(result.error);
            reject(
              getRepositoryError(
                result.error,
                ErrorVerb.Delete,
                ErrorNoun.Image,
                false,
              ),
            );
          } else {
            res();
          }
        })
        .catch((e) => {
          console.error(e);
          reject(
            getRepositoryError(e, ErrorVerb.Delete, ErrorNoun.Image, false),
          );
        });
    });
  }

  // Removes every file directly inside a folder, such as an entry's images.
  public static async deleteFolder(
    bucket: BucketNames,
    path: string,
  ): Promise<void> {
    const listed = await supabase.storage
      .from(bucket)
      .list(path, { limit: 1000 });
    if (listed.error) {
      throw getRepositoryError(
        listed.error,
        ErrorVerb.Delete,
        ErrorNoun.Image,
        true,
      );
    }
    if (!listed.data.length) return;
    const removed = await supabase.storage
      .from(bucket)
      .remove(listed.data.map((file) => `${path}/${file.name}`));
    if (removed.error) {
      throw getRepositoryError(
        removed.error,
        ErrorVerb.Delete,
        ErrorNoun.Image,
        true,
      );
    }
  }

  // Uploads an image into a secret and resolves its path in the bucket,
  // which is what a secret stores: a signed URL expires.
  public static async storeGuideImage(
    folder: string,
    image: File,
  ): Promise<string> {
    const path = `${folder}/${image.name}`;
    const { error } = await supabase.storage
      .from(GUIDE_IMAGES_BUCKET)
      .upload(path, image);
    if (error) {
      console.error(error);
      throw getRepositoryError(error, ErrorVerb.Upload, ErrorNoun.Image, false);
    }
    return path;
  }

  public static async getSignedGuideImageUrl(
    path: string,
    expiresInSeconds: number,
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(GUIDE_IMAGES_BUCKET)
      .createSignedUrl(path, expiresInSeconds);
    if (error) {
      console.error(error);
      throw getRepositoryError(error, ErrorVerb.Read, ErrorNoun.Image, false);
    }
    return data.signedUrl;
  }

  public static getImageUrl(
    bucket: BucketNames,
    path: string,
    filename: string,
  ): string {
    return supabase.storage.from(bucket).getPublicUrl(`${path}/${filename}`)
      .data.publicUrl;
  }

  public static renameFile(file: File, newFileName: string): File {
    return new File([file], newFileName, { type: file.type });
  }
}

export const MAX_FILE_SIZE = 2 * 1024 * 1024;
export const MAX_FILE_SIZE_LABEL = "2 MB";
