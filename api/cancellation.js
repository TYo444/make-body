// /api/cancellation.js
// 解約・退会フィードバック受信 → Supabase保存 → 運営者メール通知
//
// 必要な環境変数（Vercel Environment Variables に追加）:
//   SUPABASE_URL         = https://xxxxx.supabase.co
//   SUPABASE_SERVICE_KEY = eyJxxx (service_role key)
//   RESEND_API_KEY       = re_xxxxx
//   ADMIN_EMAIL          = makebody999@gmail.com

const SUPABASE_URL   = process.env.SUPABASE_URL || "https://potuhfeujqtytnfblaex.supabase.co";
const SB_KEY         = process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL || "makebody999@gmail.com";

function sbHeaders() {
  return {
    "Content-Type":  "application/json",
    "apikey":        SB_KEY,
    "Authorization": "Bearer " + SB_KEY,
  };
}

// ユーザー情報をSupabaseから取得
async function getUserInfo(userId) {
  if (!userId) return {};
  try {
    // プロフィール取得
    const profRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=email,is_pro,created_at,lang`,
      { headers: sbHeaders() }
    );
    const prof = await profRes.json();
    const p = Array.isArray(prof) ? prof[0] : null;

    // AI利用回数取得（当月）
    const monthKey = new Date().toISOString().slice(0, 7);
    const aiRes = await fetch(
      `${SUPABASE_URL}/rest/v1/ai_usage?user_id=eq.${userId}&month_key=eq.${monthKey}&select=month_count`,
      { headers: sbHeaders() }
    );
    const aiRows = await aiRes.json();
    const aiTotal = Array.isArray(aiRows)
      ? aiRows.reduce((s, r) => s + (r.month_count || 0), 0)
      : 0;

    // 利用日数計算
    const daysSince = p?.created_at
      ? Math.floor((Date.now() - new Date(p.created_at)) / (1000 * 60 * 60 * 24))
      : null;

    return {
      email:          p?.email || null,
      is_pro:         p?.is_pro || false,
      app_language:   p?.lang  || "en",
      days_since_signup: daysSince,
      total_ai_usage: aiTotal,
    };
  } catch(e) {
    console.warn("getUserInfo failed:", e);
    return {};
  }
}

// Supabaseにフィードバックを保存
async function saveFeedback(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/cancellation_feedback`, {
    method:  "POST",
    headers: { ...sbHeaders(), "Prefer": "return=minimal" },
    body:    JSON.stringify(data),
  });
  return res.ok;
}

// 運営者へメール通知（Resend）
async function notifyAdmin(data, userInfo) {
  if (!RESEND_API_KEY) return;

  const reasonLabels = {
    price:      "料金が高い",
    hard:       "使い方がわかりにくい",
    ai:         "AIコーチの回答が期待と違った",
    meal:       "食事アドバイスが合わなかった",
    training:   "トレーニングメニューが合わなかった",
    motivation: "継続するモチベーションが保てなかった",
    time:       "使う時間がなかった",
    free:       "無料機能で十分だった",
    other_app:  "他のアプリを使う",
    goal:       "目標を達成した",
    other:      "その他",
  };

  const reasons = (data.reasons || []).map(r => reasonLabels[r] || r).join("、");
  const planLabel = userInfo.is_pro ? "PRO" : "Free";

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f9f9f9;">
  <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e5e7eb;">

    <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
      <span style="font-size:22px;">👋</span>
      <h1 style="margin:0;font-size:18px;color:#111;">Make Body 解約フィードバック</h1>
    </div>
    <p style="color:#6b7280;font-size:12px;margin-top:0;">送信日時: ${new Date().toLocaleString("ja-JP")}</p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0;">

    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="background:#f9fafb;">
        <td style="padding:8px 12px;font-weight:600;width:40%;">ユーザーemail</td>
        <td style="padding:8px 12px;">${userInfo.email || "不明"}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:600;">プラン</td>
        <td style="padding:8px 12px;font-weight:700;color:${userInfo.is_pro?"#7c3aed":"#6b7280"};">${planLabel}</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:8px 12px;font-weight:600;">利用日数</td>
        <td style="padding:8px 12px;">${userInfo.days_since_signup != null ? userInfo.days_since_signup + " 日" : "不明"}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:600;">当月AI利用回数</td>
        <td style="padding:8px 12px;">${userInfo.total_ai_usage || 0} 回</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:8px 12px;font-weight:600;">登録言語</td>
        <td style="padding:8px 12px;">${userInfo.app_language || "不明"}</td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0;">

    <div style="margin-bottom:12px;">
      <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;">解約理由</div>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 12px;font-size:13px;color:#dc2626;">
        ${reasons || "（未選択）"}
      </div>
    </div>

    ${data.comment ? `
    <div style="margin-bottom:12px;">
      <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;">自由記述</div>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;font-size:13px;color:#374151;white-space:pre-wrap;">${data.comment.replace(/</g,"&lt;")}</div>
    </div>` : ""}

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0;">
    <p style="font-size:11px;color:#9ca3af;text-align:center;margin:0;">Make Body 自動通知 ・ 解約フィードバックシステム</p>
  </div>
</body>
</html>`;

  await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": "Bearer " + RESEND_API_KEY,
    },
    body: JSON.stringify({
      from:    "Make Body <onboarding@resend.dev>",
      to:      [ADMIN_EMAIL],
      subject: `[Make Body] 解約フィードバック（${planLabel}・${reasons || "理由未選択"}）`,
      html,
    }),
  }).catch(e => console.warn("email send failed:", e));
}

// ── アカウント削除申請をSupabaseに保存 ──────────────────────────────
async function saveDeleteRequest(userId, email, isPro, reason, comment) {
  const requestedAt = new Date().toISOString();
  const deleteBy    = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return fetch(`${SUPABASE_URL}/rest/v1/account_deletion_requests`, {
    method:  "POST",
    headers: { ...sbHeaders(), "Prefer": "return=minimal" },
    body: JSON.stringify({
      user_id:      userId      || null,
      email:        email       || null,
      is_pro:       isPro       || false,
      reason:       reason      || null,
      comment:      comment     || null,
      requested_at: requestedAt,
      status:       "pending",
      delete_by:    deleteBy,
    }),
  }).then(r => r.ok).catch(() => false);
}

// ── メインハンドラー ──────────────────────────────────────────────
export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  if ((process.env.ALLOWED_ORIGIN || "https://makebody.app").split(",").map(s=>s.trim()).includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-user-id, x-access-token");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).end();

  // 認証：x-access-tokenで検証（x-user-idは参考のみ）
  const accessToken = req.headers["x-access-token"] || null;
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
  const body   = req.body || {};

  const reasons      = Array.isArray(body.reasons)       ? body.reasons.slice(0, 11) : [];
  const comment      = typeof body.comment === "string"  ? body.comment.slice(0, 1000) : "";
  const lang         = typeof body.lang    === "string"  ? body.lang    : "en";
  const isPro        = Boolean(body.isPro);
  const emailFront   = typeof body.email    === "string" ? body.email    : null;
  const nickname     = typeof body.nickname === "string" ? body.nickname : null;
  const fitnessLevel = typeof body.fitnessLevel === "string" ? body.fitnessLevel : null;
  const coachId      = typeof body.coachId  === "string" ? body.coachId  : null;
  const bodyGoalId   = typeof body.bodyGoalId  === "string" ? body.bodyGoalId  : null;

  // ユーザー情報を取得
  const userInfo = await getUserInfo(userId);

  // Supabaseに保存
  const feedbackData = {
    user_id:           userId                          || null,
    email:             userInfo.email || emailFront    || null,
    is_pro:            userInfo.is_pro ?? isPro,
    reason:            reasons.join(","),
    comment:           comment                         || null,
    plan_type:         isPro ? "pro" : "free",
    app_language:      userInfo.app_language || lang,
    days_since_signup: userInfo.days_since_signup      || null,
    total_ai_usage:    userInfo.total_ai_usage         || 0,
    last_login_at:     new Date().toISOString(),
    created_at:        new Date().toISOString(),
    // 分析用追加データ
    nickname:          nickname                        || null,
    fitness_level:     fitnessLevel                    || null,
    coach_id:          coachId                         || null,
    body_goal_id:      bodyGoalId                      || null,
  };

  // 保存失敗でも通知・レスポンスは続ける
  const saved = await saveFeedback(feedbackData).catch(() => false);

  // 退会（withdraw）の場合は削除申請もDBに保存
  const isWithdraw = body.mode === "withdraw";
  if (isWithdraw) {
    await saveDeleteRequest(userId, feedbackData.email, isPro, reasons.join(","), comment);
  }

  // 運営者へメール通知
  await notifyAdmin({ reasons, comment }, { ...userInfo, is_pro: isPro });

  return res.status(200).json({ ok: true, saved, type: body.mode || 'feedback' });
}
