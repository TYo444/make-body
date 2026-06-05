// /api/app-settings.js
// アプリ設定をSupabaseから取得して返す（30秒キャッシュ）

const SUPABASE_URL         = process.env.SUPABASE_URL || "https://potuhfeujqtytnfblaex.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const DEFAULT_SETTINGS = {
  maintenance_mode:    false,
  free_signup_enabled: true,
  free_ai_enabled:     true,
  trial_enabled:       true,
  pro_enabled:         true,
};

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 1000;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=30");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    return res.status(200).json(cache);
  }

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/app_settings?id=eq.1&select=maintenance_mode,free_signup_enabled,free_ai_enabled,trial_enabled,pro_enabled&limit=1`,
      { headers: { "apikey": SUPABASE_SERVICE_KEY, "Authorization": "Bearer " + SUPABASE_SERVICE_KEY } }
    );
    if (!r.ok) throw new Error("fetch failed");
    const rows = await r.json();
    const row  = rows?.[0];
    if (!row) throw new Error("no row");
    cache = {
      maintenance_mode:    row.maintenance_mode    ?? false,
      free_signup_enabled: row.free_signup_enabled ?? true,
      free_ai_enabled:     row.free_ai_enabled     ?? true,
      trial_enabled:       row.trial_enabled        ?? true,
      pro_enabled:         row.pro_enabled          ?? true,
    };
    cacheTime = Date.now();
    return res.status(200).json(cache);
  } catch (e) {
    console.error("app-settings error:", e);
    return res.status(200).json(DEFAULT_SETTINGS);
  }
}
