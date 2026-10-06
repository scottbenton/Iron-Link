import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

import { supabase } from "lib/supabase.lib";

// Realtime never replays changes missed while a channel was not joined. Each
// time the channel (re)joins, the snapshot is read after the join, so every
// change is either in that snapshot or arrives as an event. Supabase rejoins
// on its own after a dropped socket, which is when this matters most.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSubscription<T extends { [key: string]: any }>(
  channelName: string,
  table: string,
  filter: string | string[],
  startInitialLoad: () => void,
  onPayload: (payload: RealtimePostgresChangesPayload<T>) => void,
) {
  let subscription: RealtimeChannel;
  let disposed = false;

  const createSubscription = () => {
    let channel = supabase.channel(channelName);
    let loaded = false;

    (Array.isArray(filter) ? filter : [filter]).forEach((f) => {
      channel = channel.on<T>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: f,
        },
        (payload) => {
          onPayload(payload);
        },
      );
    });

    return channel.subscribe((status) => {
      if (disposed || channel !== subscription) return;
      if (status === "SUBSCRIBED") {
        loaded = true;
        startInitialLoad();
      } else if (
        !loaded &&
        (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
      ) {
        // Show data even when realtime is unavailable. Supabase keeps
        // retrying the join, and a later SUBSCRIBED reads again.
        loaded = true;
        startInitialLoad();
      }
    });
  };

  subscription = createSubscription();

  const startListening = async () => {
    if (!document.hidden) {
      await subscription.unsubscribe();
      subscription = createSubscription();
    }
  };

  window.addEventListener("visibilitychange", startListening);
  window.addEventListener("online", startListening);

  return () => {
    disposed = true;
    subscription.unsubscribe();
    window.removeEventListener("visibilitychange", startListening);
    window.removeEventListener("online", startListening);
  };
}
