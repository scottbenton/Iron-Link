import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

import { supabase } from "lib/supabase.lib";

export interface SubscriptionOptions {
  // Also read the snapshot as soon as the subscription is created, so data
  // shows without waiting for the channel to join. The post-join read still
  // happens, and the early result is dropped if it has not arrived by then.
  loadBeforeJoin?: boolean;
}

// Realtime never replays changes missed while a channel was not joined. Each
// time the channel (re)joins, the snapshot is read after the join, so every
// change is either in that snapshot or arrives as an event. Supabase rejoins
// on its own after a dropped socket, which is when this matters most.
//
// `startInitialLoad` receives `isCurrent`, which is false once the
// subscription is disposed or a newer read has started. A caller that checks
// it before applying a result never lets an older snapshot overwrite a newer
// one, or overwrite events that arrived after the newer read began.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSubscription<T extends { [key: string]: any }>(
  channelName: string,
  table: string,
  filter: string | string[],
  startInitialLoad: (isCurrent: () => boolean) => void,
  onPayload: (payload: RealtimePostgresChangesPayload<T>) => void,
  options: SubscriptionOptions = {},
) {
  let subscription: RealtimeChannel;
  let disposed = false;
  let latestLoad = 0;

  const load = () => {
    const thisLoad = ++latestLoad;
    startInitialLoad(() => !disposed && thisLoad === latestLoad);
  };

  // `loadedBeforeJoin` stops a failed first join from reading a second time
  // while the early read is still the newest data.
  const createSubscription = (loadedBeforeJoin = false) => {
    let channel = supabase.channel(channelName);
    let loaded = loadedBeforeJoin;

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
        load();
      } else if (
        !loaded &&
        (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
      ) {
        // Show data even when realtime is unavailable. Supabase keeps
        // retrying the join, and a later SUBSCRIBED reads again.
        loaded = true;
        load();
      }
    });
  };

  subscription = createSubscription(!!options.loadBeforeJoin);
  if (options.loadBeforeJoin) load();

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
