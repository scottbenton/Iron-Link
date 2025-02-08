// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const { gameId } = await req.json();
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get the session or user object
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader?.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    if (!data.user) {
      return new Response("User not found", {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = data.user.id;

    // Check if the user is in the game
    const existingPlayerResponse = await supabaseClient
      .from("game_players")
      .select()
      .eq("game_id", gameId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingPlayerResponse.data) {
      return new Response("Player not found in game", {
        status: 403,
        headers: corsHeaders,
      });
    }

    const getGameInviteKeysResponse = await supabaseClient
      .from("game_invite_keys")
      .select()
      .eq("game_id", gameId)
      .eq("is_active", true)
      .maybeSingle();

    if (!getGameInviteKeysResponse.data) {
      const insertResponse = await supabaseClient
        .from("game_invite_keys")
        .insert({
          game_id: gameId,
        })
        .select()
        .single();

      if (insertResponse.error) {
        return new Response("Failed to create invite key", {
          status: 500,
          headers: corsHeaders,
        });
      }

      return new Response(
        JSON.stringify({ invite_key: insertResponse.data.url_key }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    return new Response(
      JSON.stringify({ invite_key: getGameInviteKeysResponse.data.url_key }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error(error);
    return new Response("Failed to invalidate invite keys", {
      status: 500,
      headers: corsHeaders,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-game-invite-key' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
