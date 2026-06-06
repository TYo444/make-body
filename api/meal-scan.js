// /api/meal-scan.js
// 認証・利用回数制限・画像サイズ制限・回数加算付き
// 環境変数: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, ALLOWED_ORIGIN

const SUPABASE_URL         = process.env.SUPABASE_URL || "https://potuhfeujqtytnfblaex.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || "https://make-body-pbg3.vercel.app")
  .split(",").map(s => s.trim());
const MAX_IMAGE_SIZE_MB = 5;

function sbHeaders() {
  return {
    "Content-Type":  "application/json",
    "apikey":        SUPABASE_SERVICE_KEY,
    "Authorization": "Bearer " + SUPABASE_SERVICE_KEY,
  };
}

async function verifyToken(accessToken) {
  if (!accessToken || !SUPABASE_SERVICE_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { "apikey": SUPABASE_SERVICE_KEY, "Authorization": "Bearer " + accessToken },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.id || null;
  } catch { return null; }
}

async function checkAndGetLimit(userId) {
  const dayKey   = new Date().toISOString().slice(0, 10);
  const monthKey = new Date().toISOString().slice(0, 7);
  try {
    const [profRes, usageRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=is_pro,created_at,plan_type,trial_started_at&limit=1`, { headers: sbHeaders() }),
      fetch(`${SUPABASE_URL}/rest/v1/ai_usage?user_id=eq.${userId}&select=day_key,month_key,day_count,month_count&order=updated_at.desc&limit=1`, { headers: sbHeaders() }),
    ]);
    const [profData, usageData] = await Promise.all([profRes.json(), usageRes.json()]);
    const prof  = profData?.[0]  || {};
    const usage = usageData?.[0] || {};

    const isPro         = prof.is_pro || false;
    const isTrialPlan   = prof.plan_type === "trial";
    const trialStart    = prof.trial_started_at ? new Date(prof.trial_started_at) : null;
    const trial7Expired = trialStart ? (Date.now() - trialStart) >= 7 * 24 * 60 * 60 * 1000 : false;
    const dayCount      = usage.day_key   === dayKey   ? (usage.day_count   || 0) : 0;
    const monthCount    = usage.month_key === monthKey ? (usage.month_count || 0) : 0;
    const trial50       = isTrialPlan && monthCount >= 50;
    const isTrial       = isTrialPlan && !trial7Expired && !trial50;
    const isFirstDay    = prof.created_at ? (Date.now() - new Date(prof.created_at)) < 86400000 : false;
    const limit         = isTrial ? 50 : isPro ? 300 : isFirstDay ? 10 : 3;
    const used          = (isPro || isTrial) ? monthCount : dayCount;

    return { canChat: used < limit, isPro, isTrial, dayKey, monthKey, dayCount, monthCount };
  } catch { return { canChat: false }; }
}

async function getAppSettings() {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/app_settings?id=eq.1&select=maintenance_mode,free_ai_enabled&limit=1`,
      { headers: sbHeaders() }
    );
    if (!r.ok) return null;
    const rows = await r.json();
    const row  = rows?.[0];
    if (!row) return null;
    return {
      maintenance_mode: row.maintenance_mode ?? false,
      free_ai_enabled:  row.free_ai_enabled  ?? true,
    };
  } catch { return null; }
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
          day_count: currentDay + 1, month_count: currentMonth + 1,
          month_key: monthKey, updated_at: new Date().toISOString(),
        }),
      });
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/ai_usage`, {
        method: "POST",
        headers: { ...sbHeaders(), "Prefer": "return=minimal" },
        body: JSON.stringify({
          user_id: userId, day_key: dayKey, month_key: monthKey,
          day_count: 1, month_count: currentMonth + 1,
          updated_at: new Date().toISOString(),
        }),
      });
    }
  } catch (e) { console.error("meal-scan incrementUsage error:", e); }
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-access-token");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).end();

  try {
    // 認証必須（ゲスト不可）
    const accessToken = req.headers["x-access-token"] || null;
    if (!accessToken || accessToken === "guest") {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = await verifyToken(accessToken);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // app_settings確認（緊急停止）
    const settings = await getAppSettings();
    if (settings) {
      if (settings.maintenance_mode) {
        return res.status(503).json({ error: "maintenance", message: "現在メンテナンス中です。しばらくしてからお試しください。" });
      }
    }

    // 利用制限チェック
    const limit = await checkAndGetLimit(userId);
    if (!limit.canChat) {
      return res.status(200).json({ error: "limit_reached", message: "Chat limit reached" });
    }

    // free_ai_enabled確認（PRO除外）
    if (settings && !settings.free_ai_enabled && !limit.isPro) {
      return res.status(200).json({ error: "feature_disabled", message: "現在無料プランの新規AI利用を一時停止しています。" });
    }

    // 画像サイズチェック
    const body = req.body;
    if (body?.messages) {
      for (const msg of body.messages) {
        if (Array.isArray(msg.content)) {
          for (const block of msg.content) {
            if (block.type === "image" && block.source?.data) {
              const sizeBytes = (block.source.data.length * 3) / 4;
              if (sizeBytes > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
                return res.status(400).json({ error: "Image too large (max 5MB)" });
              }
            }
          }
        }
      }
    }

    // Anthropic API呼び出し（モデル固定）
    const payload = {
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages:   body.messages || [],
    };
    if (body.system) payload.system = body.system;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // 成功時に利用回数を加算
    if (response.ok) {
      await incrementUsage(userId, limit.dayKey, limit.monthKey,
        limit.dayCount, limit.monthCount);
    }

    return res.status(response.status).json(data);

  } catch (e) {
    console.error("meal-scan error:", e);
    return res.status(500).json({ error: "API error" });
  }
}
