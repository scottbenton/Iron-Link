import { onSnapshot, query, where } from "firebase/firestore";
import { CampaignDocument } from "api-calls/campaign/_campaign.type";
import { getCampaignCollection } from "./_getRef";

export function listenToUsersCampaigns(
  uid: string,
  dataHandler: {
    onDocChange: (id: string, data: CampaignDocument) => void;
    onDocRemove: (id: string) => void;
    onLoaded: () => void;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError: (error: any) => void
) {
  const campaignsQuery = query(
    getCampaignCollection(),
    where("users", "array-contains", uid)
  );
  return onSnapshot(
    campaignsQuery,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "removed") {
          dataHandler.onDocRemove(change.doc.id);
        } else {
          dataHandler.onDocChange(change.doc.id, change.doc.data());
        }
      });
      if (snapshot.empty) {
        dataHandler.onLoaded();
      }
    },
    (error) => onError(error)
  );
}
