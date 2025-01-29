import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { supabase } from "lib/supabase.lib";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSubscription<T extends { [key: string]: any }>(
  channelName: string,
  table: string,
  filter: string | string[],
  startInitialLoad: () => void,
  onPayload: (payload: RealtimePostgresChangesPayload<T>) => void,
) {
  startInitialLoad();

  const createSubscription = () => {
    let channel = supabase.channel(channelName);

    if (Array.isArray(filter)) {
      filter.forEach((f) => {
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
    } else {
      channel = channel.on<T>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter,
        },
        (payload) => {
          onPayload(payload);
        },
      );
    }
    return channel.subscribe();
  };

  let subscription = createSubscription();

  const startListening = async () => {
    if (!document.hidden) {
      if (subscription) {
        await subscription.unsubscribe();
      }
      startInitialLoad();
      subscription = createSubscription();
    }
  };

  window.addEventListener("visibilitychange", startListening);
  window.addEventListener("online", startListening);

  return () => {
    subscription.unsubscribe();
    window.removeEventListener("visibilitychange", startListening);
    window.removeEventListener("online", startListening);
  };
}
