import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

import { supabase } from "lib/supabase.lib";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSubscription<T extends { [key: string]: any }>(
  channelName: string,
  table: string,
  filter: string | string[],
  startInitialLoad: () => void,
  onPayload: (payload: RealtimePostgresChangesPayload<T>) => void,
  options: { refreshOnSubscribe?: boolean } = {},
) {
  let disposed = false;
  let restarting = false;
  let subscription: RealtimeChannel | undefined;
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
            if (!disposed && subscription === channel) onPayload(payload);
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
          if (!disposed && subscription === channel) onPayload(payload);
        },
      );
    }
    subscription = channel;
    channel.subscribe((status) => {
      if (
        options.refreshOnSubscribe &&
        status === "SUBSCRIBED" &&
        !disposed &&
        subscription === channel
      ) {
        startInitialLoad();
      }
    });
  };

  createSubscription();

  const startListening = async () => {
    if (document.hidden || disposed || restarting) return;
    restarting = true;
    const previousSubscription = subscription;
    subscription = undefined;
    try {
      try {
        await previousSubscription?.unsubscribe();
      } catch (error) {
        console.error(error);
      }
      if (disposed) return;
      startInitialLoad();
      if (!disposed) createSubscription();
    } finally {
      restarting = false;
    }
  };

  window.addEventListener("visibilitychange", startListening);
  window.addEventListener("online", startListening);

  return () => {
    disposed = true;
    subscription?.unsubscribe();
    subscription = undefined;
    window.removeEventListener("visibilitychange", startListening);
    window.removeEventListener("online", startListening);
  };
}
