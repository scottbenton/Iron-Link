import {
  CollectionReference,
  DocumentReference,
  collection,
  doc,
} from "firebase/firestore";

import { HomebrewOracleCollectionDocument } from "api-calls/homebrew/oracles/collections/_homebrewOracleCollection.type";

import { firestore } from "config/firebase.config";

export function constructHomebrewOracleCollectionCollectionPath() {
  return `homebrew/homebrew/oracle_collections`;
}

export function constructHomebrewOracleCollectionDocPath(collectionId: string) {
  return `${constructHomebrewOracleCollectionCollectionPath()}/${collectionId}`;
}

export function getHomebrewOracleCollectionCollection() {
  return collection(
    firestore,
    constructHomebrewOracleCollectionCollectionPath(),
  ) as CollectionReference<HomebrewOracleCollectionDocument>;
}

export function getHomebrewOracleCollectionDoc(collectionId: string) {
  return doc(
    firestore,
    constructHomebrewOracleCollectionDocPath(collectionId),
  ) as DocumentReference<HomebrewOracleCollectionDocument>;
}
