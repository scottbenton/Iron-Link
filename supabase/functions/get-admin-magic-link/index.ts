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

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response("User not found", {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Make sure the user is an admin
    const adminEntry = await supabase
      .from("admins")
      .select()
      .eq("user_id", user.id)
      .maybeSingle();
    if (!adminEntry.data || adminEntry.error) {
      return new Response("User is not an admin", {
        status: 403,
        headers: corsHeaders,
      });
    }

    const { uid, email } = await req.json();

    if (!uid && !email) {
      return new Response("Missing uid or email", {
        status: 400,
        headers: corsHeaders,
      });
    }

    let emailAddress = email;
    if (!emailAddress) {
      const {
        data: { user },
      } = await supabase.auth.admin.getUserById(uid);
      if (!user) {
        return new Response("User not found", {
          status: 401,
          headers: corsHeaders,
        });
      }
      emailAddress = user.email;
    }

    if (!emailAddress) {
      return new Response("Missing email address", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { data, error } = await supabase.auth.admin.generateLink({
      email: emailAddress,
      type: "magiclink",
    });

    if (error) {
      console.error(error);
      return new Response("Failed to generate magic link", {
        status: 500,
        headers: corsHeaders,
      });
    }
    const actionLink = data.properties.action_link;

    if (!actionLink) {
      return new Response("Failed to generate magic link", {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ actionLink }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response("Failed to get magic link", {
      status: 401,
      headers: corsHeaders,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-admin-magic-link' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
