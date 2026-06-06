// /api/alert.js
// 運営者向け利用状況アラート
// Vercel Cron で毎日1回実行: vercel.json に設定
//
// 必要な環境変数（Vercel Environment Variables に追加）:
//   SUPABASE_URL        = https://xxxxx.supabase.co
//   SUPABASE_SERVICE_KEY= eyJxxx (service_role key)
//   RESEND_API_KEY      = re_xxxxx  ← Resend (https://resend.com) で取得
//   ADMIN_EMAIL         = makebody999@gmail.com
//   CRON_SECRET         = 任意の秘密文字列（不正実行防止）

// ── しきい値定数（ここを変更するだけで調整可能） ─────────────────
const THRESHOLDS = {
  pro_users:    [450, 900, 3000],       // PROユーザー数
  total_users:  [500, 1000, 5000],      // 全ユーザー数
  ai_monthly:   [10000, 50000, 100000], // 当月AI利用回数
};

// 移行目安（この値を超えたら総合アラート）
const UPGRADE_HINTS = {
  vercel_pro:   { users: 1000,  label: "Vercel Pro" },
  supabase_pro: { users: 500,   label: "Supabase Pro" },
  ai_cost:      { ai_calls: 50000, label: "AI APIコスト見直し" },
};

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || "makebody999@gmail.com";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL   = process.env.SUPABASE_URL   || "https://potuhfeujtqytnfblaex.supabase.co";
const SB_KEY         = process.env.SUPABASE_SERVICE_KEY;
const CRON_SECRET    = process.env.CRON_SECRET;

// ── Supabase helper ───────────────────────────────────────────────
function sbHeaders() {
  return {
    "Content-Type":  "application/json",
    "apikey":        SB_KEY,
    "Authorization": "Bearer " + SB_KEY,
  };
}

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: sbHeaders() });
  return res.json();
}

async function sbPost(path, body) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method:  "POST",
    headers: sbHeaders(),
    body:    JSON.stringify(body),
  });
}

// ── 集計 ──────────────────────────────────────────────────────────
async function getStats() {
  const monthKey = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  // 全ユーザー数
  const totalRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=count`,
    { headers: { ...sbHeaders(), "Prefer": "count=exact", "Range": "0-0" } }
  );
  const totalCount = parseInt(totalRes.headers.get("content-range")?.split("/")[1] || "0");

  // PROユーザー数
  const proRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?is_pro=eq.true&select=count`,
    { headers: { ...sbHeaders(), "Prefer": "count=exact", "Range": "0-0" } }
  );
  const proCount = parseInt(proRes.headers.get("content-range")?.split("/")[1] || "0");

  // 当月AI利用回数合計
  const aiRows = await sbGet(`ai_usage?month_key=eq.${monthKey}&select=month_count`);
  const aiMonthly = Array.isArray(aiRows)
    ? aiRows.reduce((sum, r) => sum + (r.month_count || 0), 0)
    : 0;

  return { totalCount, proCount, aiMonthly, monthKey };
}

// ── 送信済みアラートキーをチェック ────────────────────────────────
async function isAlreadySent(alertKey) {
  const rows = await sbGet(`admin_alerts?alert_key=eq.${encodeURIComponent(alertKey)}&select=id`);
  return Array.isArray(rows) && rows.length > 0;
}

async function markAsSent(alertKey, threshold) {
  await sbPost("admin_alerts", {
    alert_key:    alertKey,
    threshold:    threshold,
    triggered_at: new Date().toISOString(),
    sent_to:      ADMIN_EMAIL,
  });
}

// ── メール送信（Resend） ──────────────────────────────────────────
async function sendEmail(subject, html) {
  if (!RESEND_API_KEY) {
    console.warn("[MakeBody] RESEND_API_KEY is not set — email notification skipped. Set it in Vercel Environment Variables.");
    return false;  // アプリは落とさずスキップ
  }
  const res = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": "Bearer " + RESEND_API_KEY,
    },
    body: JSON.stringify({
      from:    "Make Body Alert <onboarding@resend.dev>",
      to:      [ADMIN_EMAIL],
      subject: subject,
      html:    html,
    }),
  });
  return res.ok;
}

// ── メール本文生成 ─────────────────────────────────────────────────
function buildEmailHtml(stats, triggeredAlerts, recommendations) {
  const { totalCount, proCount, aiMonthly, monthKey } = stats;
  const alertList = triggeredAlerts.map(a => `<li style="margin:4px 0;">🔔 ${a}</li>`).join("");
  const recList   = recommendations.map(r => `<li style="margin:4px 0;">👉 ${r}</li>`).join("");

  return `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;">
  <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e5e7eb;">

    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
      <span style="font-size:24px;">📊</span>
      <h1 style="margin:0;font-size:20px;color:#111;">Make Body 運営アラート</h1>
    </div>
    <p style="color:#6b7280;font-size:13px;margin-top:0;">${monthKey} / 送信日時: ${new Date().toLocaleString("ja-JP")}</p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">

    <h2 style="font-size:15px;color:#374151;margin-bottom:12px;">📈 現在の利用状況</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="background:#f3f4f6;">
        <td style="padding:10px 12px;font-weight:600;border-radius:6px 0 0 6px;">総ユーザー数</td>
        <td style="padding:10px 12px;text-align:right;font-size:18px;font-weight:700;color:#111;">${totalCount.toLocaleString()} 人</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;font-weight:600;">PROユーザー数</td>
        <td style="padding:10px 12px;text-align:right;font-size:18px;font-weight:700;color:#22c55e;">${proCount.toLocaleString()} 人</td>
      </tr>
      <tr style="background:#f3f4f6;">
        <td style="padding:10px 12px;font-weight:600;border-radius:6px 0 0 6px;">当月AI利用回数</td>
        <td style="padding:10px 12px;text-align:right;font-size:18px;font-weight:700;color:#3b82f6;">${aiMonthly.toLocaleString()} 回</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;font-weight:600;">月間予想収益（概算）</td>
        <td style="padding:10px 12px;text-align:right;font-size:18px;font-weight:700;color:#f59e0b;">$${(proCount * 8.99).toLocaleString(undefined,{maximumFractionDigits:0})}</td>
      </tr>
    </table>

    ${alertList ? `
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
    <h2 style="font-size:15px;color:#ef4444;margin-bottom:8px;">🚨 到達したしきい値</h2>
    <ul style="margin:0;padding-left:20px;color:#374151;font-size:13px;">${alertList}</ul>
    ` : ""}

    ${recList ? `
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
    <h2 style="font-size:15px;color:#f59e0b;margin-bottom:8px;">💡 推奨アクション</h2>
    <ul style="margin:0;padding-left:20px;color:#374151;font-size:13px;">${recList}</ul>
    ` : ""}

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
    <p style="font-size:11px;color:#9ca3af;text-align:center;margin:0;">
      Make Body 自動アラートシステム ・ このメールは自動送信されています
    </p>
  </div>
</body>
</html>`;
}

// ── メインロジック ─────────────────────────────────────────────────
export default async function handler(req, res) {
  // Vercel Cron からの呼び出し認証
  // Vercel Cron: x-cron-secret ヘッダー または Authorization: Bearer または query.secret
  const authHeader = req.headers["authorization"] || "";
  const bearerSecret = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const secret = req.headers["x-cron-secret"] || bearerSecret || req.query.secret;
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).end();
  }
  if (!SB_KEY) {
    return res.status(500).json({ error: "SUPABASE_SERVICE_KEY not set" });
  }

  try {
    const stats = await getStats();
    const { totalCount, proCount, aiMonthly } = stats;

    const triggeredAlerts = [];
    const newAlerts       = [];

    // ── PROユーザー数しきい値チェック ──
    for (const t of THRESHOLDS.pro_users) {
      if (proCount >= t) {
        const key = `pro_users_${t}`;
        if (!(await isAlreadySent(key))) {
          triggeredAlerts.push(`PROユーザー ${t.toLocaleString()}人 到達（現在: ${proCount.toLocaleString()}人）`);
          newAlerts.push({ key, threshold: t });
        }
      }
    }

    // ── 全ユーザー数しきい値チェック ──
    for (const t of THRESHOLDS.total_users) {
      if (totalCount >= t) {
        const key = `total_users_${t}`;
        if (!(await isAlreadySent(key))) {
          triggeredAlerts.push(`総ユーザー ${t.toLocaleString()}人 到達（現在: ${totalCount.toLocaleString()}人）`);
          newAlerts.push({ key, threshold: t });
        }
      }
    }

    // ── 当月AI利用回数しきい値チェック ──
    const monthKey = stats.monthKey;
    for (const t of THRESHOLDS.ai_monthly) {
      if (aiMonthly >= t) {
        const key = `ai_monthly_${monthKey}_${t}`;
        if (!(await isAlreadySent(key))) {
          triggeredAlerts.push(`当月AI利用 ${t.toLocaleString()}回 到達（現在: ${aiMonthly.toLocaleString()}回）`);
          newAlerts.push({ key, threshold: t });
        }
      }
    }

    // ── 推奨アクション生成（重複防止付き） ──
    const REC_CHECKS = [
      { key:"recommendation_vercel_pro",   cond: totalCount >= UPGRADE_HINTS.vercel_pro.users,   msg:"Vercel Pro へのアップグレードを検討してください（無料枠の帯域・実行時間に注意）" },
      { key:"recommendation_supabase_pro", cond: totalCount >= UPGRADE_HINTS.supabase_pro.users, msg:"Supabase Pro へのアップグレードを検討してください（DB容量・接続数の上限確認）" },
      { key:"recommendation_ai_cost",      cond: aiMonthly  >= UPGRADE_HINTS.ai_cost.ai_calls,   msg:"AI APIコストを確認してください（月間利用回数が多くなっています）" },
      { key:"recommendation_stripe_450",   cond: proCount   >= 450,                               msg:"Stripe 売上・手数料を確認してください（PRO 450人到達）" },
      { key:"recommendation_support_900",  cond: proCount   >= 900,                               msg:"カスタマーサポート体制の強化を検討してください（PRO 900人到達）" },
    ];
    const recommendations = [];
    const newRecAlerts    = [];
    for (const r of REC_CHECKS) {
      if (r.cond) {
        recommendations.push(r.msg);
        if (!(await isAlreadySent(r.key))) {
          newRecAlerts.push({ key: r.key, threshold: 0 });
        }
      }
    }

    // ── 新規アラートがあればメール送信 ──
    let emailSent = false;
    if (newAlerts.length > 0 || newRecAlerts.length > 0) {
      const subjects = newAlerts.length > 0
        ? `[Make Body] アラート: ${triggeredAlerts[0]}`
        : `[Make Body] 定期レポート: 移行目安に近づいています`;

      const html = buildEmailHtml(stats, triggeredAlerts, recommendations);
      emailSent = await sendEmail(subjects, html);

      // 送信済みとしてDBに記録
      if (emailSent) {
        for (const a of [...newAlerts, ...newRecAlerts]) {
          await markAsSent(a.key, a.threshold);
        }
      }
    }

    return res.status(200).json({
      ok: true,
      stats:           { totalCount, proCount, aiMonthly },
      triggeredAlerts,
      recommendations,
      newAlertsCount:  newAlerts.length,
      emailSent,
    });

  } catch (err) {
    console.error("alert error:", err);
    return res.status(500).json({ error: err.message });
  }
}
