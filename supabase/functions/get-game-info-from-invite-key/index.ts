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

  const { gameInviteKey } = await req.json();
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabase.auth.getUser(token);
    const user = data.user;

    if (!user) {
      return new Response("User not found", { status: 401 });
    }

    const gameInviteConfigResponse = await supabase
      .from("game_invite_keys")
      .select()
      .eq("url_key", gameInviteKey)
      .single();

    if (gameInviteConfigResponse.error) {
      throw gameInviteConfigResponse.error;
    }

    const gameId = gameInviteConfigResponse.data.game_id;
    const isActive = gameInviteConfigResponse.data.is_active;
    if (!isActive) {
      return new Response("Game invite is not active", { status: 404 });
    }

    const existingPlayerResponse = await supabase
      .from("game_players")
      .select()
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existingPlayerResponse.data) {
      return new Response(JSON.stringify({ gameId: gameId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const gameResponse = await supabase
      .from("games")
      .select()
      .eq("id", gameId)
      .single();
    if (gameResponse.error) {
      throw gameResponse.error;
    }
    const gameType = gameResponse.data.game_type;
    if (gameType === "solo") {
      return new Response("Cannot add player to solo game", { status: 400 });
    }

    return new Response(
      JSON.stringify({
        gameName: gameResponse.data.name,
        gameType: gameResponse.data.game_type,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error(err, gameInviteKey);
    return new Response("Failed to add player to game.", { status: 500 });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-game-info-from-invite-key' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
