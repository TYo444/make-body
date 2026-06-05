// /api/stripe-webhook.js
// Vercel環境変数に追加:
//   STRIPE_SECRET_KEY     = sk_live_xxxxx
//   STRIPE_WEBHOOK_SECRET = whsec_xxxxx
//   SUPABASE_URL          = https://xxxxx.supabase.co
//   SUPABASE_SERVICE_KEY  = eyJxxx (service_role key)
//
// ⚠️ トライアルは単発決済（$1.99）で実装。サブスクではない。
// ⚠️ トライアル → PRO は自動移行しない。ユーザーが明示的にPRO購入した場合のみ。

import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const SUPABASE_URL_RT   = process.env.SUPABASE_URL;
  const SUPABASE_KEY_RT   = process.env.SUPABASE_SERVICE_KEY;

  async function updatePlan(email, isPro, planType) {
    const body = { is_pro: isPro, plan_type: planType };
    if (planType === 'trial') {
      // トライアル開始時刻を記録
      body.trial_started_at = new Date().toISOString();
    }
    if (planType === 'free') {
      // FREE戻り時はtrial情報をリセット
      body.trial_started_at = null;
    }
    await fetch(`${SUPABASE_URL_RT}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_KEY_RT,
        'Authorization': `Bearer ${SUPABASE_KEY_RT}`,
      },
      body: JSON.stringify(body),
    });
  }

  // 決済完了時のメールアドレスを取得するヘルパー
  function getEmail(obj) {
    return obj.customer_email
      || obj.customer_details?.email
      || null;
  }

  // Stripe Price IDでプランを判定
  // 環境変数に設定しておく（未設定時はfallback）
  const TRIAL_PRICE_ID = process.env.STRIPE_TRIAL_PRICE_ID || 'price_trial_placeholder';
  const PRO_M_PRICE_ID = process.env.STRIPE_PRO_M_PRICE_ID || 'price_pro_m_placeholder';
  const PRO_Y_PRICE_ID = process.env.STRIPE_PRO_Y_PRICE_ID || 'price_pro_y_placeholder';

  switch (event.type) {

    // ── 単発決済完了（トライアル $1.99）────────────────────────
    case 'checkout.session.completed': {
      const obj   = event.data.object;
      const email = getEmail(obj);
      if (!email) break;

      // line_itemsがevent内に含まれない場合、APIで取得
      let priceId = obj.line_items?.data?.[0]?.price?.id
        || obj.metadata?.price_id
        || null;

      if (!priceId && obj.id) {
        try {
          const items = await stripe.checkout.sessions.listLineItems(obj.id, { limit: 1 });
          priceId = items?.data?.[0]?.price?.id || null;
        } catch (e) {
          console.error("listLineItems error:", e.message);
        }
      }

      // price_idが取得できない場合は保留（自動付与しない）
      if (!priceId) {
        console.error("checkout.session.completed: price_id not found. Manual review required. session_id:", obj.id, "email:", email);
        // planは変更しない（保留）
        break;
      }

      if (priceId === TRIAL_PRICE_ID) {
        await updatePlan(email, false, 'trial');
      } else if (priceId === PRO_M_PRICE_ID || priceId === PRO_Y_PRICE_ID) {
        await updatePlan(email, true, 'pro');
      } else {
        // 既知のprice_idと一致しない場合も保留
        console.error("checkout.session.completed: unknown price_id:", priceId, "session_id:", obj.id, "email:", email);
      }
      break;
    }

    // ── サブスク請求成功（PRO月額・年額の継続）───────────────
    case 'invoice.payment_succeeded': {
      const obj   = event.data.object;
      const email = getEmail(obj);
      // billing_reason=subscription_create は初回 → checkout.session.completedで処理済み
      // 継続請求(subscription_cycle)のみ処理
      if (email && obj.billing_reason === 'subscription_cycle') {
        await updatePlan(email, true, 'pro');
      }
      break;
    }

    // ── サブスク作成（PRO）──────────────────────────────────
    case 'customer.subscription.created': {
      const sub   = event.data.object;
      const customer = await stripe.customers.retrieve(sub.customer).catch(()=>null);
      const email = customer?.email;
      if (email) {
        // サブスク作成 = PRO開始（トライアル単発決済とは別）
        await updatePlan(email, true, 'pro');
      }
      break;
    }

    // ── サブスク解約・停止（PRO → FREE）────────────────────
    case 'customer.subscription.deleted':
    case 'customer.subscription.paused': {
      const sub      = event.data.object;
      const customer = await stripe.customers.retrieve(sub.customer).catch(()=>null);
      const email    = customer?.email;
      if (email) await updatePlan(email, false, 'free');
      break;
    }

    // ── subscription.updated は処理しない ──────────────────
    // ⚠️ トライアルは単発決済のため、subscription.updatedでPRO自動移行しない
    // PRO移行はユーザーが明示的にPROリンクから購入した場合のみ

    default:
      break;
  }

  res.json({ received: true });
}
