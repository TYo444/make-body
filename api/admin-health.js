// /api/admin-health.js
// 管理者向け本番環境ヘルスチェックAPI
// アクセス方法: GET /api/admin-health?secret=YOUR_CRON_SECRET
// 一般ユーザーには公開しない

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const STRIPE_SECRET_KEY    = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET= process.env.STRIPE_WEBHOOK_SECRET;
const RESEND_API_KEY       = process.env.RESEND_API_KEY;
const ADMIN_EMAIL          = process.env.ADMIN_EMAIL;
const CRON_SECRET          = process.env.CRON_SECRET;

export default async function handler(req, res) {
  // 認証チェック（CRON_SECRETで保護）
  const secret = req.query.secret || req.headers["x-admin-secret"];
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const checks = {};

  // 1. 環境変数チェック
  checks.env = {
    SUPABASE_URL:          !!SUPABASE_URL         ? "✅ set" : "❌ missing",
    SUPABASE_SERVICE_KEY:  !!SUPABASE_SERVICE_KEY  ? "✅ set" : "❌ missing",
    STRIPE_SECRET_KEY:     !!STRIPE_SECRET_KEY     ? "✅ set" : "❌ missing",
    STRIPE_WEBHOOK_SECRET: !!STRIPE_WEBHOOK_SECRET ? "✅ set" : "❌ missing",
    RESEND_API_KEY:        !!RESEND_API_KEY         ? "✅ set" : "❌ missing",
    ADMIN_EMAIL:           !!ADMIN_EMAIL            ? "✅ " + ADMIN_EMAIL : "❌ missing",
    CRON_SECRET:           !!CRON_SECRET            ? "✅ set" : "❌ missing",
  };

  // 2. 環境変数 STRIPE_PORTAL_URL チェック
  const stripePortalUrl = process.env.STRIPE_PORTAL_URL;
  checks.stripe_portal_url = stripePortalUrl
    ? (stripePortalUrl.includes("test_placeholder")
        ? "⚠️ still test_placeholder — replace with real Stripe Customer Portal URL"
        : "✅ configured: " + stripePortalUrl.slice(0, 40) + "...")
    : "⚠️ STRIPE_PORTAL_URL not set in env (hardcoded in MakeBodyPreview.jsx — set env var for production)";

  // 3. Supabase接続チェック
  try {
    const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?limit=1`, {
      headers: {
        "apikey":        SUPABASE_SERVICE_KEY,
        "Authorization": "Bearer " + SUPABASE_SERVICE_KEY,
      },
    });
    checks.supabase = sbRes.ok
      ? "✅ connected (status " + sbRes.status + ")"
      : "❌ error (status " + sbRes.status + ")";
  } catch (e) {
    checks.supabase = "❌ connection failed: " + e.message;
  }

  // 4. Resend接続チェック（APIキーが有効か）
  if (RESEND_API_KEY) {
    try {
      const resendRes = await fetch("https://api.resend.com/domains", {
        headers: { "Authorization": "Bearer " + RESEND_API_KEY },
      });
      checks.resend = resendRes.ok
        ? "✅ API key valid"
        : "❌ API key invalid (status " + resendRes.status + ")";
    } catch (e) {
      checks.resend = "❌ connection failed: " + e.message;
    }
  } else {
    checks.resend = "❌ RESEND_API_KEY not set — email notifications disabled";
  }

  // 5. Stripe接続チェック
  if (STRIPE_SECRET_KEY) {
    try {
      const stripeRes = await fetch("https://api.stripe.com/v1/balance", {
        headers: { "Authorization": "Bearer " + STRIPE_SECRET_KEY },
      });
      checks.stripe = stripeRes.ok
        ? "✅ Stripe connected"
        : "❌ Stripe error (status " + stripeRes.status + ")";
    } catch (e) {
      checks.stripe = "❌ Stripe connection failed: " + e.message;
    }
  } else {
    checks.stripe = "❌ STRIPE_SECRET_KEY not set";
  }

  // 6. 全体判定
  const allOk = Object.values(checks.env).every(v => v.startsWith("✅"))
    && checks.supabase.startsWith("✅")
    && (checks.resend?.startsWith("✅") ?? false)
    && (checks.stripe?.startsWith("✅") ?? false);

  return res.status(200).json({
    status:    allOk ? "✅ ALL OK — ready for production" : "⚠️ issues found — check details",
    timestamp: new Date().toISOString(),
    checks,
  });
}
