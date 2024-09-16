import { firestore } from "config/firebase.config";
import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  Timestamp,
} from "firebase/firestore";
import { Lore } from "types/Lore.type";
import { GMLoreDocument, LoreNotesDocument, LoreDocument } from "./_lore.type";

export function constructLoresPath(worldId: string) {
  return `/worlds/${worldId}/lore`;
}

export function constructLoreDocPath(worldId: string, loreId: string) {
  return `/worlds/${worldId}/lore/${loreId}`;
}

export function constructPrivateDetailsLoreDocPath(
  worldId: string,
  loreId: string
) {
  return constructLoreDocPath(worldId, loreId) + `/private/details`;
}

export function constructPublicNotesLoreDocPath(
  worldId: string,
  loreId: string
) {
  return constructLoreDocPath(worldId, loreId) + `/public/notes`;
}

export function constructLoreImagesPath(worldId: string, loreId: string) {
  return `/worlds/${worldId}/lore/${loreId}`;
}

export function constructLoreImagePath(
  worldId: string,
  loreId: string,
  filename: string
) {
  return `/worlds/${worldId}/lore/${loreId}/${filename}`;
}

export function getLoreCollection(worldId: string) {
  return collection(
    firestore,
    constructLoresPath(worldId)
  ) as CollectionReference<LoreDocument>;
}

export function getLoreDoc(worldId: string, loreId: string) {
  return doc(
    firestore,
    constructLoreDocPath(worldId, loreId)
  ) as DocumentReference<LoreDocument>;
}

export function getPrivateDetailsLoreDoc(worldId: string, loreId: string) {
  return doc(
    firestore,
    constructPrivateDetailsLoreDocPath(worldId, loreId)
  ) as DocumentReference<GMLoreDocument>;
}

export function getPublicNotesLoreDoc(worldId: string, loreId: string) {
  return doc(
    firestore,
    constructPublicNotesLoreDocPath(worldId, loreId)
  ) as DocumentReference<LoreNotesDocument>;
}

export function convertToDatabase(lore: Partial<Lore>): Partial<LoreDocument> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { updatedDate, createdDate, ...restLore } = lore;
  const newLore: Partial<LoreDocument> = {
    updatedTimestamp: Timestamp.now(),
    ...restLore,
  };

  if (createdDate) {
    newLore.createdTimestamp = Timestamp.fromDate(createdDate);
  }

  return newLore;
}

export function convertFromDatabase(lore: LoreDocument): Lore {
  const { updatedTimestamp, createdTimestamp, ...restLore } = lore;
  return {
    updatedDate: updatedTimestamp.toDate(),
    createdDate: createdTimestamp.toDate(),
    ...restLore,
  };
}
