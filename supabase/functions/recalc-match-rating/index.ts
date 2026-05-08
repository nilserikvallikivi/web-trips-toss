// Edge Function: recalc-match-rating
// Recalculates Elo ratings + statistics for a single confirmed match.
// POST { match_id: string }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const K = 32;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function expected(a: number, b: number) {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { match_id } = await req.json();
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(url, key);

    const { data: m, error: mErr } = await sb.from("matches").select("*").eq("id", match_id).single();
    if (mErr || !m) throw new Error(mErr?.message || "Match not found");
    if (!m.confirmed) throw new Error("Match is not confirmed");
    if (!m.winner_side || !m.player1_id || !m.player2_id) throw new Error("Match missing required fields");

    // Determine discipline
    const isDoubles = !!m.player3_id && !!m.player4_id;
    const ratingCol = isDoubles ? "rating_doubles" : "rating_singles";
    const discipline = isDoubles ? "doubles" : "singles";

    const sideA = isDoubles ? [m.player1_id, m.player3_id] : [m.player1_id];
    const sideB = isDoubles ? [m.player2_id, m.player4_id] : [m.player2_id];
    const allIds = [...sideA, ...sideB];

    const { data: profiles } = await sb.from("profiles").select(`id, ${ratingCol}`).in("id", allIds);
    const ratings: Record<string, number> = {};
    for (const p of profiles ?? []) ratings[(p as any).id] = Number((p as any)[ratingCol]) || 1500;

    const avg = (ids: string[]) => ids.reduce((s, id) => s + (ratings[id] ?? 1500), 0) / ids.length;
    const ra = avg(sideA), rb = avg(sideB);
    const ea = expected(ra, rb), eb = expected(rb, ra);
    const aWon = m.winner_side === 1;
    const sa = aWon ? 1 : 0;
    const sb_ = aWon ? 0 : 1;

    const updates: { id: string; new: number; old: number }[] = [];
    for (const id of sideA) {
      const old = ratings[id]; const next = old + K * (sa - ea);
      updates.push({ id, old, new: next });
    }
    for (const id of sideB) {
      const old = ratings[id]; const next = old + K * (sb_ - eb);
      updates.push({ id, old, new: next });
    }

    for (const u of updates) {
      await sb.from("profiles").update({ [ratingCol]: u.new }).eq("id", u.id);
      await sb.from("rating_history").insert({
        user_id: u.id, discipline, scope: "global", match_id: m.id,
        old_rating: u.old, new_rating: u.new, delta: u.new - u.old, k_factor: K, reason: "match",
      });
    }

    return new Response(JSON.stringify({ ok: true, updates }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});