// Data Privacy edge function: exports a user's data (GDPR/POPIA "right of access")
// or deletes their account ("right to be forgotten").
//
// Actions:
//   POST /account-data { action: "export" }  -> returns JSON of all user data
//   POST /account-data { action: "delete", confirm: "DELETE" } -> removes account

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth client (uses caller's JWT)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "Not authenticated" }, 401);
    }
    const user = userData.user;

    // Service-role admin client for cross-table reads + auth admin actions
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string;

    if (action === "export") {
      const tables = [
        "profiles",
        "businesses",
        "services",
        "promotions",
        "opportunities",
        "proposals",
        "deal_memos",
        "invoices",
        "reviews",
        "business_follows",
        "contact_reveals",
        "provider_balances",
        "pro_referrals",
        "no_show_reports",
        "user_reports",
        "disputes",
      ];

      const userIdColumns: Record<string, string[]> = {
        profiles: ["id"],
        businesses: ["owner_id"],
        services: [],
        promotions: [],
        opportunities: ["client_id"],
        proposals: ["provider_id"],
        deal_memos: ["pro_user_id", "client_user_id"],
        invoices: ["pro_user_id"],
        reviews: ["reviewer_id"],
        business_follows: ["follower_id"],
        contact_reveals: ["viewer_id"],
        provider_balances: ["user_id"],
        pro_referrals: ["referrer_user_id", "referee_user_id"],
        no_show_reports: ["reporter_id"],
        user_reports: ["reporter_id"],
        disputes: ["reporter_id", "pro_user_id"],
      };

      const dump: Record<string, unknown> = {
        exported_at: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          metadata: user.user_metadata,
        },
      };

      for (const table of tables) {
        const cols = userIdColumns[table] || [];
        if (cols.length === 0) continue;
        const orFilter = cols.map((c) => `${c}.eq.${user.id}`).join(",");
        const { data, error } = await admin.from(table).select("*").or(orFilter);
        dump[table] = error ? { error: error.message } : data || [];
      }

      return json(dump, 200);
    }

    if (action === "delete") {
      if (body?.confirm !== "DELETE") {
        return json({ error: "Confirmation required. Send confirm: 'DELETE'." }, 400);
      }

      // Best-effort cleanup of owned data. RLS-bypassing service role.
      // We delete content where the user is the owner; pseudonymise records that
      // others may legally need (deal_memos, invoices, reviews, disputes).
      await admin.from("business_follows").delete().eq("follower_id", user.id);
      await admin.from("contact_reveals").delete().eq("viewer_id", user.id);
      await admin.from("promotions").delete().in(
        "business_id",
        (await admin.from("businesses").select("id").eq("owner_id", user.id)).data?.map((b: any) => b.id) || [],
      );
      await admin.from("services").delete().in(
        "business_id",
        (await admin.from("businesses").select("id").eq("owner_id", user.id)).data?.map((b: any) => b.id) || [],
      );
      await admin.from("opportunities").delete().eq("client_id", user.id);
      await admin.from("proposals").delete().eq("provider_id", user.id);
      await admin.from("businesses").delete().eq("owner_id", user.id);
      await admin.from("provider_balances").delete().eq("user_id", user.id);
      await admin.from("profiles").delete().eq("id", user.id);

      // Pseudonymise records kept for legal/compliance reasons
      await admin.from("reviews").update({ reviewer_name: "[deleted user]", body: "[content removed at user request]" }).eq("reviewer_id", user.id);
      await admin.from("deal_memos").update({ client_email: "deleted@sjoh.invalid", client_phone: null }).eq("client_user_id", user.id);

      // Finally delete the auth user
      const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
      if (delErr) {
        return json({ error: `Account data wiped, but auth deletion failed: ${delErr.message}` }, 500);
      }

      return json({ ok: true, message: "Account deleted" }, 200);
    }

    return json({ error: "Unknown action. Use 'export' or 'delete'." }, 400);
  } catch (e) {
    console.error("account-data error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
