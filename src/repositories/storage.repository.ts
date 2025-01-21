import { supabase } from "lib/supabase.lib";

import { FileFailedToUploadError, UnknownError } from "./errors/storageErrors";

type BucketNames = "characters" | "note_images";

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
            reject(response.error);
          } else {
            resolve(this.getImageUrl(bucket, path, image.name));
          }
        })
        .catch((e) => {
          console.error(e);
          if (e instanceof Error) {
            reject(
              new FileFailedToUploadError(
                `Failed to upload ${image.name}.`,
                e.message,
              ),
            );
          } else {
            reject(
              new FileFailedToUploadError(`Failed to upload ${image.name}.`),
            );
          }
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
        .then(() => {
          res();
        })
        .catch((e) => {
          console.error(e);
          reject(new UnknownError(`Failed to delete ${filename}.`));
        });
    });
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
