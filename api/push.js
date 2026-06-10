// /api/push.js
// Push通知の購読管理
//   GET    → VAPID公開鍵を返す（フロントの購読登録に必要）
//   POST   → 購読情報をSupabaseに保存（body: { subscription, lang, coachId, nickname }）
//   DELETE → 購読解除
// 必要な環境変数: VAPID_PUBLIC_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY

const SUPABASE_URL         = process.env.SUPABASE_URL || "https://potuhfeujtqytnfblaex.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

function sbHeaders() {
  return {
    "Content-Type":  "application/json",
    "apikey":        SUPABASE_SERVICE_KEY,
    "Authorization": "Bearer " + SUPABASE_SERVICE_KEY,
  };
}

export default async function handler(req, res) {
  try {
    // ── 公開鍵の取得 ──
    if (req.method === "GET") {
      const key = process.env.VAPID_PUBLIC_KEY;
      if (!key) return res.status(500).json({ error: "VAPID key not configured" });
      return res.status(200).json({ key });
    }

    const userId = req.headers["x-user-id"];
    if (!userId || String(userId).startsWith("guest_")) {
      return res.status(401).json({ error: "auth required" });
    }

    // ── 購読保存（upsert）──
    if (req.method === "POST") {
      const { subscription, lang, coachId, nickname } = req.body || {};
      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: "invalid subscription" });
      }
      const r = await fetch(SUPABASE_URL + "/rest/v1/push_subscriptions", {
        method: "POST",
        headers: { ...sbHeaders(), "Prefer": "resolution=merge-duplicates" },
        body: JSON.stringify({
          user_id: userId,
          subscription,
          lang: lang || "ja",
          coach_id: coachId || "bro",
          nickname: (nickname || "").slice(0, 30),
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        console.error("push subscribe error:", t);
        return res.status(500).json({ error: "save failed" });
      }
      return res.status(200).json({ ok: true });
    }

    // ── 購読解除 ──
    if (req.method === "DELETE") {
      await fetch(SUPABASE_URL + "/rest/v1/push_subscriptions?user_id=eq." + encodeURIComponent(userId), {
        method: "DELETE",
        headers: sbHeaders(),
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (e) {
    console.error("push api error:", e.message);
    return res.status(500).json({ error: "API error" });
  }
}
