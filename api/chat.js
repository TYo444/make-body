// /api/chat.js
// 環境変数: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, ALLOWED_ORIGIN

const SUPABASE_URL         = process.env.SUPABASE_URL || "https://potuhfeujtqytnfblaex.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
// 本番ドメインのみ許可（.vercel.appワイルドカードは使わない）
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || "https://make-body-pbg3.vercel.app")
  .split(",").map(s => s.trim());

const FREE_DAY1_LIMIT   = 10;
const FREE_DAILY_LIMIT  = 3;
const PRO_MONTHLY_LIMIT = 300;

// モデルとmax_tokensはサーバー側で固定（フロントから変更不可）
const MODEL_FREE_TRIAL = "claude-haiku-4-5-20251001";
const MODEL_PRO        = "claude-haiku-4-5-20251001";
const MAX_TOKENS_FREE  = 500;
const MAX_TOKENS_PRO   = 1000; // Haikuなので1000でOK

function sbHeaders() {
  return {
    "Content-Type":  "application/json",
    "apikey":        SUPABASE_SERVICE_KEY,
    "Authorization": "Bearer " + SUPABASE_SERVICE_KEY,
  };
}

// アクセストークンをSupabaseで検証し、サーバー側でuser_idを取得
async function verifyToken(accessToken) {
  if (!accessToken || !SUPABASE_SERVICE_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "apikey":        SUPABASE_SERVICE_KEY,
        "Authorization": "Bearer " + accessToken,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.id || null;
  } catch { return null; }
}

async function getAppSettings() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/app_settings?id=eq.1&select=maintenance_mode,free_signup_enabled,free_ai_enabled,trial_enabled,pro_enabled&limit=1`,
      { headers: sbHeaders() }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    const row  = rows?.[0];
    if (!row) return null;
    return {
      maintenance_mode:    row.maintenance_mode    ?? false,
      free_signup_enabled: row.free_signup_enabled ?? true,
      free_ai_enabled:     row.free_ai_enabled     ?? true,
      trial_enabled:       row.trial_enabled        ?? true,
      pro_enabled:         row.pro_enabled          ?? true,
    };
  } catch { return null; }
}

async function getUsage(userId) {
  const dayKey   = new Date().toISOString().slice(0, 10);
  const monthKey = new Date().toISOString().slice(0, 7);
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/ai_usage?user_id=eq.${userId}&select=day_key,month_key,day_count,month_count&order=updated_at.desc&limit=1`,
      { headers: sbHeaders() }
    );
    const rows = await res.json();
    const row  = rows?.[0] || {};
    return {
      dayKey, monthKey,
      dayCount:   row.day_key   === dayKey   ? (row.day_count   || 0) : 0,
      monthCount: row.month_key === monthKey ? (row.month_count || 0) : 0,
    };
  } catch { return { dayKey, monthKey, dayCount: 0, monthCount: 0 }; }
}

async function incrementUsage(userId, dayKey, monthKey, currentDay, currentMonth) {
  try {
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/ai_usage?user_id=eq.${userId}&day_key=eq.${dayKey}&select=id`,
      { headers: sbHeaders() }
    );
    const existing = await checkRes.json();
    if (existing?.length > 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/ai_usage?user_id=eq.${userId}&day_key=eq.${dayKey}`, {
        method: "PATCH",
        headers: { ...sbHeaders(), "Prefer": "return=minimal" },
        body: JSON.stringify({
          day_count:   currentDay   + 1,
          month_count: currentMonth + 1,
          month_key:   monthKey,
          updated_at:  new Date().toISOString(),
        }),
      });
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/ai_usage`, {
        method: "POST",
        headers: { ...sbHeaders(), "Prefer": "return=minimal" },
        body: JSON.stringify({
          user_id:     userId,
          day_key:     dayKey,
          month_key:   monthKey,
          day_count:   1,
          month_count: currentMonth + 1,
          updated_at:  new Date().toISOString(),
        }),
      });
    }
  } catch (e) { console.error("incrementUsage error:", e); }
}

async function getProfile(userId) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=is_pro,created_at,plan_type,trial_started_at&limit=1`,
      { headers: sbHeaders() }
    );
    const rows = await res.json();
    return rows?.[0] || null;
  } catch { return null; }
}

export default async function handler(req, res) {
  // CORS: 本番ドメインのみ（.vercel.appワイルドカード不使用）
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-user-id, x-access-token");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).end();

  try {
    const accessToken = req.headers["x-access-token"] || null;

    // 認証: x-access-tokenをSupabaseで検証
    const guestId = req.headers["x-user-id"] || null;
    let userId = null;
    let isGuest = false;

    if (accessToken && accessToken !== "guest") {
      userId = await verifyToken(accessToken);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
    } else if (guestId && (guestId.startsWith("guest_") || guestId === "guest_anon")) {
      isGuest = true; // ゲスト：制限付きで許可（3回/日）
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // アプリ設定チェック（メンテナンス・機能停止）
    const settings = await getAppSettings();
    if (settings) {
      if (settings.maintenance_mode) {
        return res.status(503).json({ error: "maintenance", message: "現在メンテナンス中です。しばらくしてからお試しください。" });
      }
      const isPro2 = (await getProfile(userId))?.is_pro || false;
      if (!isPro2 && !settings.free_ai_enabled) {
        return res.status(200).json({ error: "feature_disabled", message: "現在無料プランの新規AI利用を一時停止しています。PROプランはご利用いただけます。" });
      }
    }

    // 利用制限チェック（ゲストはデフォルト3回/日）
    if (isGuest || !userId) {
      // ゲストはローカル制限のみ（サーバー側カウントなし）
      const payload = req.body;
      const { system, messages, tools } = payload;
      const model = MODEL_FREE_TRIAL;
      const maxTokens = MAX_TOKENS_FREE;
      const pload = { model, max_tokens: maxTokens, messages: messages || [] };
      if (system) pload.system = system;
      const ar = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify(pload),
      });
      const d = await ar.json();
      return res.status(ar.status).json(d);
    }

    const [prof, usage] = await Promise.all([getProfile(userId), getUsage(userId)]);
    const isPro          = prof?.is_pro || false;
    const isTrialPlan    = prof?.plan_type === "trial";
    const trialStartedAt = prof?.trial_started_at ? new Date(prof.trial_started_at) : null;
    const nowUTC         = new Date();
    const trial7Expired  = trialStartedAt
      ? (nowUTC - trialStartedAt) >= 7 * 24 * 60 * 60 * 1000 : false;
    const trialUsed50    = isTrialPlan && usage.monthCount >= 50;
    const trialExpired   = trial7Expired || trialUsed50;
    const isTrial        = isTrialPlan && !trialExpired;

    if (isTrialPlan && trialExpired) {
      fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
        method: "PATCH", headers: sbHeaders(),
        body: JSON.stringify({ plan_type: "free", is_pro: false }),
      }).catch(() => {});
    }

    const registeredAt = prof?.created_at ? new Date(prof.created_at) : null;
    const isFirstDay   = registeredAt ? (nowUTC - registeredAt) < 86400000 : false;
    const TRIAL_LIMIT  = 50;
    const limit = isTrial ? TRIAL_LIMIT : isPro ? PRO_MONTHLY_LIMIT
      : isFirstDay ? FREE_DAY1_LIMIT : FREE_DAILY_LIMIT;
    const used = (isPro || isTrial) ? usage.monthCount : usage.dayCount;

    if (used >= limit) {
      return res.status(200).json({
        error: "limit_reached", remaining: 0, limit, used,
        isPro, isTrial,
        message: isPro ? "Monthly limit reached"
          : isTrial ? "Trial limit reached" : "Daily limit reached",
      });
    }

    // モデルとmax_tokensはサーバー側で固定（フロントから変更不可）
    const model     = isPro ? MODEL_PRO : MODEL_FREE_TRIAL;
    const maxTokens = isPro ? MAX_TOKENS_PRO : MAX_TOKENS_FREE;

    const { system, messages, tools } = req.body;
    const payload = { model, max_tokens: maxTokens, messages: messages || [] };
    if (system) payload.system = system;
    if (tools)  payload.tools  = tools;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    const data = await anthropicRes.json();

    if (anthropicRes.ok) {
      await incrementUsage(userId, usage.dayKey, usage.monthKey,
        usage.dayCount, usage.monthCount);
    }

    return res.status(anthropicRes.status).json({
      ...data,
      usage_info: {
        remaining: Math.max(0, limit - used - 1),
        used: used + 1,
        limit, isPro, isTrial,
      },
    });

  } catch (e) {
    console.error("chat.js error:", e);
    return res.status(500).json({ error: "API error" });
  }
}
