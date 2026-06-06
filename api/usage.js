// /api/usage.js
// 現在の利用回数をクライアントに返す（表示用キャッシュ更新のため）

const SUPABASE_URL         = process.env.SUPABASE_URL || "https://potuhfeujtqytnfblaex.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const FREE_DAY1_LIMIT   = 10;
const FREE_DAILY_LIMIT  = 3;
const PRO_MONTHLY_LIMIT = 300;

function sbHeaders() {
  return {
    "Content-Type":  "application/json",
    "apikey":        SUPABASE_SERVICE_KEY,
    "Authorization": "Bearer " + SUPABASE_SERVICE_KEY,
  };
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const ALLOWED_ORIGINS_U = (process.env.ALLOWED_ORIGIN || "https://make-body-pbg3.vercel.app").split(",").map(s=>s.trim());
  if (ALLOWED_ORIGINS_U.includes(origin) || origin.endsWith(".vercel.app")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-user-id, x-access-token");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).end();

  // 認証：x-access-tokenで検証（queryのuser_idは信用しない）
  const accessToken = req.headers["x-access-token"] || null;
  const guestFlag   = req.headers["x-user-id"] || null;
  let userId = null;

  if (accessToken && accessToken !== "guest") {
    try {
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { "apikey": SUPABASE_SERVICE_KEY, "Authorization": "Bearer " + accessToken },
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        userId = authData?.id || null;
      }
    } catch {}
  }

  // ゲストまたは未認証：デフォルト制限で返す
  if (!userId) {
    const isGuest = guestFlag?.startsWith("guest_");
    return res.status(200).json({ remaining: 3, limit: 3, used: 0, isPro: false, isGuest });
  }

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(200).json({ remaining: 3, limit: 3, used: 0, isPro: false });
  }

  try {
    const dayKey   = new Date().toISOString().slice(0, 10);
    const monthKey = new Date().toISOString().slice(0, 7);

    // プロフィールと使用量を並列取得
    const [profRes, usageRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=is_pro,created_at,plan_type,trial_started_at&limit=1`, { headers: sbHeaders() }),
      fetch(`${SUPABASE_URL}/rest/v1/ai_usage?user_id=eq.${userId}&day_key=eq.${dayKey}&select=day_count,month_count,month_key&limit=1`, { headers: sbHeaders() }),
    ]);

    const [profData, usageData] = await Promise.all([profRes.json(), usageRes.json()]);
    const prof  = profData?.[0]  || {};
    const usage = usageData?.[0] || {};

    const isPro       = prof.is_pro || false;
    const registeredAt = prof.created_at ? new Date(prof.created_at) : null;
    const isFirstDay  = registeredAt ? (new Date() - registeredAt) < 86400000 : false;

    const dayCount   = usage.day_key === dayKey     ? (usage.day_count   || 0) : 0;
    const monthCount = usage.month_key === monthKey ? (usage.month_count || 0) : 0;

    const isTrialPlan = prof.plan_type === 'trial';
    const trialStart  = prof.trial_started_at ? new Date(prof.trial_started_at) : null;
    const trial7Expired = trialStart ? (Date.now() - trialStart) >= 7 * 24 * 60 * 60 * 1000 : false;
    const trial50Reached = isTrialPlan && (monthCount >= 50);
    const isTrial        = isTrialPlan && !trial7Expired && !trial50Reached;

    // トライアル終了（7日 or 50回）→ FREEに更新（非同期）
    if (isTrialPlan && (trial7Expired || trial50Reached)) {
      fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
        method: "PATCH",
        headers: sbHeaders(),
        body: JSON.stringify({ plan_type: "free", is_pro: false }),
      }).catch(()=>{});
    }

    const TRIAL_MONTHLY_LIMIT = 50;
    const limit       = isTrial ? TRIAL_MONTHLY_LIMIT : isPro ? PRO_MONTHLY_LIMIT : isFirstDay ? FREE_DAY1_LIMIT : FREE_DAILY_LIMIT;
    const used      = (isPro || isTrial) ? monthCount : dayCount;
    const remaining = Math.max(0, limit - used);

    return res.status(200).json({
      isPro,
      isFirstDay,
      used,
      limit,
      remaining,
      dayKey,
      monthKey,
      dayCount,
      monthCount,
    });
  } catch (e) {
    console.error("usage.js error:", e);
    return res.status(200).json({ remaining: 3, limit: 3, used: 0, isPro: false });
  }
}
