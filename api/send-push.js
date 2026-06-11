// /api/send-push.js
// Vercel Cronから毎朝呼ばれて、全購読者にコーチの朝通知を送る
// vercel.json: { "path": "/api/send-push", "schedule": "0 23 * * *" } ← UTC23時 = 日本時間 朝8時
// 必要な環境変数: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, CRON_SECRET

import webpush from "web-push";

const SUPABASE_URL         = process.env.SUPABASE_URL || "https://potuhfeujtqytnfblaex.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const CRON_SECRET          = process.env.CRON_SECRET;

function sbHeaders() {
  return {
    "Content-Type":  "application/json",
    "apikey":        SUPABASE_SERVICE_KEY,
    "Authorization": "Bearer " + SUPABASE_SERVICE_KEY,
  };
}

// コーチ人格別の朝メッセージ（曜日でローテーション）
const MORNING_MSGS = {
  bro: [
    "おはよう！今日のプラン、もう出来てるぞ。",
    "起きたな。今日の分、サクッと終わらせよう。",
    "今日もやる日だ。1種目だけでもいい、来い！",
    "おはよう。昨日の自分を超える日だ。",
    "プラン準備済み。あとはお前が動くだけ。",
    "おはよう！継続してる奴が最後に勝つ。",
    "今週もやり切るぞ。まず今日の1歩から。",
  ],
  sister: [
    "おはよう！今日のメニュー、用意して待ってるね。",
    "おはよう。今日も無理のない範囲で一緒にやろ。",
    "今日のプランできてるよ。気が向いたら覗いてみて。",
    "おはよう！小さくでも続けてるの、ほんとにえらいよ。",
    "今日の分、準備しておいたよ。待ってるね。",
    "おはよう。今日も自分のペースでいこうね。",
    "今週もおつかれさま。今日も少しだけ動いてみよ。",
  ],
  kpop: [
    "おはよう。今日のメニューで、また一段シルエットを磨こう。",
    "姿勢から1日が変わる。今日のプランへ。",
    "おはよう。鏡の中の変化、気づいてる？",
    "今日のプラン準備済み。美しいフォームでいこう。",
    "雑な10回より美しい1回。今日も丁寧に。",
    "おはよう。継続が見た目を作る。",
    "今週の積み重ねがラインに出る。今日の分へ。",
  ],
  drill: [
    "起きたか。今日の分は逃がさないぞ。",
    "おはよう。やると決めたのはお前だ。プランへ。",
    "今日のメニュー、準備済みだ。言い訳は聞かない。",
    "基準はもっと上だ。今日も来い。",
    "おはよう。サボった分は体に出る。やるぞ。",
    "今日の1歩を落とすな。プランは出来てる。",
    "今週もやり切れ。まず今日からだ。",
  ],
  gyaru: [
    "おっはよ〜！今日のメニューできてるよ、いえーい！",
    "おはよ！今日もゆるっと楽しくいこ〜！",
    "今日の分サクッとやったらまじ最強じゃん？",
    "おはよう！1種目だけでも天才だから！",
    "今日のプラン待ってるよ〜！アゲていこ！",
    "おはよ！続けてる時点でまじ神！",
    "今週もラストスパート！今日も楽しくね！",
  ],
  science: [
    "おはようございます。本日のメニューは最適化済みです。",
    "起床後の運動は代謝向上に有効です。今日のプランへ。",
    "習慣形成には同時刻の実行が有効です。今がその時間です。",
    "本日の漸進性過負荷、設定済みです。",
    "回復は完了しているはずです。次の刺激を入れましょう。",
    "継続率がそのまま結果に直結します。本日も実行を。",
    "今週の総負荷を確保しましょう。本日のプランへ。",
  ],
};

export default async function handler(req, res) {
  // Cron以外からの実行を防止
  const auth = req.headers["authorization"] || "";
  if (CRON_SECRET && auth !== "Bearer " + CRON_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return res.status(500).json({ error: "VAPID keys not configured" });

  webpush.setVapidDetails("mailto:makebody999@gmail.com", pub, priv);

  try {
    // 全購読者を取得
    const r = await fetch(SUPABASE_URL + "/rest/v1/push_subscriptions?select=*", {
      headers: sbHeaders(),
    });
    if (!r.ok) return res.status(500).json({ error: "fetch subscriptions failed" });
    const subs = await r.json();

    const dayIdx = new Date().getDay(); // 0-6 曜日ローテーション
    let sent = 0, removed = 0, failed = 0;

    // 直列だと多人数で遅いので10並列ずつ処理
    const chunks = [];
    for (let i = 0; i < subs.length; i += 10) chunks.push(subs.slice(i, i + 10));

    for (const chunk of chunks) {
      await Promise.all(chunk.map(async (row) => {
        const pool = MORNING_MSGS[row.coach_id] || MORNING_MSGS.bro;
        const body = pool[dayIdx % pool.length];
        const title = row.nickname ? `${row.nickname}、コーチから` : "Make Body — コーチから";
        try {
          await webpush.sendNotification(
            row.subscription,
            JSON.stringify({ title, body, url: "/" })
          );
          sent++;
        } catch (err) {
          // 410 Gone / 404 = 購読が無効（アンインストール等）→ レコード削除
          if (err.statusCode === 410 || err.statusCode === 404) {
            await fetch(SUPABASE_URL + "/rest/v1/push_subscriptions?user_id=eq." + encodeURIComponent(row.user_id), {
              method: "DELETE", headers: sbHeaders(),
            }).catch(() => {});
            removed++;
          } else {
            failed++;
          }
        }
      }));
    }

    return res.status(200).json({ ok: true, sent, removed, failed, total: subs.length });
  } catch (e) {
    console.error("send-push error:", e.message);
    return res.status(500).json({ error: "API error" });
  }
}
