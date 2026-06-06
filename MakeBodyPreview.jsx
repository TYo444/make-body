// React is loaded via CDN
const { useState, useRef, useEffect } = React;

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');`;

const SUPABASE_URL = "https://potuhfeujtqytnfblaex.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvdHVoZmV1anRxeXRuZmJsYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzgyNDEsImV4cCI6MjA5NTY1NDI0MX0.uuKAYelOUOggPu3mWE_XSYUWBalEXhts8l37ZqMk-gI";

const sb = {
  async signUp(email, password) {
    const r = await fetch(SUPABASE_URL+"/auth/v1/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  },
  async signIn(email, password) {
    const r = await fetch(SUPABASE_URL+"/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  },
  async signOut(accessToken) {
    await fetch(SUPABASE_URL+"/auth/v1/logout", {
      method: "POST",
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": "Bearer "+accessToken },
    });
  },
  async getProfile(userId, accessToken) {
    const r = await fetch(SUPABASE_URL+"/rest/v1/profiles?id=eq."+userId+"&select=*", {
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": "Bearer "+accessToken },
    });
    const data = await r.json();
    return data?.[0] || null;
  },
  async upsertProfile(userId, accessToken, data) {
    await fetch(SUPABASE_URL+"/rest/v1/profiles", {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer "+accessToken,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({ id: userId, ...data, updated_at: new Date().toISOString() }),
    });
  },
  // 個別フィールドのみ更新（Supabase PATCH）
  async patchProfile(userId, accessToken, fields) {
    try {
      await fetch(SUPABASE_URL+"/rest/v1/profiles?id=eq."+userId, {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": "Bearer "+accessToken,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ ...fields, updated_at: new Date().toISOString() }),
      });
    } catch(e) { /* silent fail */ }
  },
};

const C = {
  bg:"#f0faf4", surface:"#ffffff", card:"#ffffff",
  green:"#22c55e", greenDark:"#15803d", greenGlow:"rgba(34,197,94,0.12)",
  white:"#ffffff", off:"#f8fdf9", muted:"#6b7280", dim:"#e5e7eb",
  gold:"#d97706", goldBg:"rgba(217,119,6,0.10)",
  pro:"#7c3aed", proBg:"rgba(124,58,237,0.10)",
  border:"rgba(0,0,0,0.08)", shadow:"0 2px 12px rgba(34,197,94,0.10)", text:"#111827",
};

const PRICE_M     = "$8.99";
const PRICE_Y     = "$79.99";
const PRICE_TRIAL = "$1.99";  // 7日間お試し
const STRIPE_TRIAL   = "https://buy.stripe.com/9B6aEQ1XH63R5aucw52Fa04"; // $1.99
const STRIPE_MONTHLY = "https://buy.stripe.com/8x26oA7i1bob6ey8fP2Fa02"; // $8.99
const STRIPE_ANNUAL  = "https://buy.stripe.com/6oU5kw1XH8bZ0Uecw52Fa03"; // $79.99
// ================================================================
// ⚠️ BEFORE DEPLOY: STRIPE_PORTAL を本番URLに差し替えること
// Stripe Dashboard → Billing → Customer portal → ポータルリンクをコピーして下に貼る
// または Vercel環境変数 STRIPE_PORTAL_URL に設定（推奨）
// ================================================================
const STRIPE_PORTAL = "https://billing.stripe.com/p/login/14A14gaud1NB32m67H2Fa00";
const STRIPE_PORTAL_IS_PLACEHOLDER = false; // 本番URL設定済み

// デプロイ前チェックリスト:
// [ ] Vercel環境変数にStripe・Supabase・ResendのAPIキーを設定
// [ ] STRIPE_PORTAL を本番のStripe Customer Portal URLに差し替え
// [ ] Stripe Webhook URL を本番ドメインに設定
// [ ] /api/admin-health で全項目✅を確認
const CONTACT_EMAIL  = "makebody999@gmail.com";

const FREE_DAY1 = 10;
const FREE_DAILY = 3;
const PRO_MONTHLY = 300; // 300 chats per calendar month

const LANGS = [
  { code:"en", label:"English",  flag:"🇺🇸" },
  { code:"ja", label:"日本語",   flag:"🇯🇵" },
  { code:"zh", label:"中文",     flag:"🇨🇳" },
  { code:"ko", label:"한국어",   flag:"🇰🇷" },
  { code:"de", label:"Deutsch",  flag:"🇩🇪" },
  { code:"fr", label:"Français", flag:"🇫🇷" },
  { code:"es", label:"Español",  flag:"🇪🇸" },
];

const PERSONAS = [
  {
    id:"bro", emoji:"💪", name:"Rex",
    color:"#ff4444", glow:"rgba(255,68,68,0.2)", bg:"rgba(255,68,68,0.06)",
    intensity:"high",
    en:"Hype Coach", ja:"体育会系コーチ", zh:"热血教练", ko:"체육계 코치",
    tag:{ ja:"🔥 強度高め", en:"🔥 High intensity", ko:"🔥 강도 높음", zh:"🔥 高强度" },
    sub:{ ja:"熱血・体育会系（厳しめ）", en:"Loud & intense — tough love", ko:"열혈·체육계（엄격함）", zh:"热血·体育系（严格）" },
    desc:{ en:"Loud, intense, tough love. Won't let you quit.", ja:"熱血・体育会系。絶対諦めさせない。", zh:"热血激情，绝不让你放弃。", ko:"열혈, 강도 높은 사랑. 절대 포기 못하게." },
    style:"INTENSE hype coach. Loud, energetic, uses caps for emphasis. Tough love. Celebrates PRs hard. Never accepts excuses.",
    repsMulti:1.2, setsBonus:1,
  },
  {
    id:"sister", emoji:"🌸", name:"Mia",
    color:"#ff6b9d", glow:"rgba(255,107,157,0.2)", bg:"rgba(255,107,157,0.06)",
    intensity:"low",
    en:"Big Sister", ja:"優しい姉系コーチ", zh:"温柔姐姐", ko:"다정한 언니",
    tag:{ ja:"💆 優しめ", en:"💆 Gentle pace", ko:"💆 부드러움", zh:"💆 温和节奏" },
    sub:{ ja:"温かく寄り添う（優しめ）", en:"Warm & supportive — easy pace", ko:"따뜻한 응원（부드러움）", zh:"温暖支持（温和）" },
    desc:{ en:"Warm, supportive, always in your corner.", ja:"温かく寄り添う。親友のようなトレーナー。", zh:"温暖支持，像最好的朋友一样。", ko:"따뜻하고 든든한 지원." },
    style:"Warm nurturing big sister energy. Supportive and empathetic. Celebrates small wins. Never judges.",
    repsMulti:0.85, setsBonus:0,
  },
  {
    id:"kpop", emoji:"⭐", name:"Kai",
    color:"#a855f7", glow:"rgba(168,85,247,0.2)", bg:"rgba(168,85,247,0.06)",
    intensity:"mid",
    en:"K-pop Trainer", ja:"韓国アイドル系コーチ", zh:"韩系教练", ko:"K-POP 트레이너",
    tag:{ ja:"💅 スタイル重視", en:"💅 Aesthetic focus", ko:"💅 스타일 중심", zh:"💅 外形导向" },
    sub:{ ja:"細マッチョ・韓国アイドル系（標準）", en:"Lean physique — idol-style training", ko:"슬림핏·K-pop 아이돌계（표준）", zh:"精瘦体型·韩流偶像系（标准）" },
    desc:{ en:"Lean physique, aesthetics, trains like an idol.", ja:"細マッチョ重視。韓国アイドル式トレーニング。", zh:"精瘦体型，韩式偶像训练。", ko:"슬림한 체형. 한국 아이돌식 훈련." },
    style:"Clean aesthetic precise coach. Focused on lean physique, posture. Calm confident energy. References K-pop idol training.",
    repsMulti:1.0, setsBonus:0,
  },
  {
    id:"drill", emoji:"😤", name:"Drake",
    color:"#ff8c00", glow:"rgba(255,140,0,0.2)", bg:"rgba(255,140,0,0.06)",
    intensity:"high",
    en:"Drill Coach", ja:"スパルタコーチ", zh:"严格教练", ko:"스파르타 코치",
    tag:{ ja:"💢 スパルタ", en:"💢 Spartan mode", ko:"💢 스파르타", zh:"💢 斯巴达模式" },
    sub:{ ja:"スパルタ・言い訳NG（かなり厳しめ）", en:"No excuses — maximum output", ko:"스파르타·변명 없음（매우 엄격）", zh:"斯巴达·不接受借口（非常严格）" },
    desc:{ en:"No excuses. No BS. High standards.", ja:"言い訳NG。厳しく追い込む。", zh:"没有借口，严格要求。", ko:"변명 없음. 높은 기준." },
    style:"Strict no-nonsense drill coach. Will push hard and call out laziness. High standards. Demands commitment.",
    repsMulti:1.3, setsBonus:1,
  },
  {
    id:"gyaru", emoji:"✨", name:"Yuna",
    color:"#ff69b4", glow:"rgba(255,105,180,0.2)", bg:"rgba(255,105,180,0.06)",
    intensity:"low",
    en:"Hype Queen", ja:"ギャル系コーチ", zh:"辣妹教练", ko:"갸루 코치",
    tag:{ ja:"🎉 楽しく続ける", en:"🎉 Fun & hype", ko:"🎉 즐기면서", zh:"🎉 快乐健身" },
    sub:{ ja:"超ポジティブ・楽しくフィットネス（優しめ）", en:"Super positive — fitness is a party", ko:"초긍정·즐겁게 피트니스（부드러움）", zh:"超正能量·健身像派对（温和）" },
    desc:{ en:"Super hype, fun, makes fitness a party.", ja:"超ハイテンション。楽しくフィットネス！", zh:"超级活力，让健身像派对！", ko:"초고에너지. 운동을 파티처럼!" },
    style:"Super energetic gyaru-style. Trendy slang, lots of enthusiasm. Makes everything fun. Fitness is a vibe not a chore.",
    repsMulti:0.85, setsBonus:0,
  },
  {
    id:"science", emoji:"🧬", name:"Dr. Lee",
    color:"#00bfff", glow:"rgba(0,191,255,0.2)", bg:"rgba(0,191,255,0.06)",
    intensity:"mid",
    en:"Science Coach", ja:"理論派コーチ", zh:"科学教练", ko:"이론파 코치",
    tag:{ ja:"🔬 科学的根拠あり", en:"🔬 Evidence-based", ko:"🔬 과학적 근거", zh:"🔬 有科学依据" },
    sub:{ ja:"データ・根拠重視（標準）", en:"Data-driven — explains everything", ko:"데이터·근거 중심（표준）", zh:"数据驱动·解释一切（标准）" },
    desc:{ en:"Evidence-based. Explains the why behind everything.", ja:"全て科学的根拠あり。なぜかを説明。", zh:"一切基于科学，解释背后的原因。", ko:"근거 기반. 모든 것의 이유를 설명." },
    style:"Evidence-based analytical coach. Cites physiological reasons. Explains WHY behind every recommendation. Precise, methodical, loves data.",
    repsMulti:1.0, setsBonus:0,
  },
];

const BODY_GOALS = {
  male: [
    { id:"kpop",     title:"K-POP Idol",     ja:"K-POPアイドル系", ko:"K팝 아이돌형", zh:"K-POP偶像型",  bf:"8–13%",  targetBf:10, color:"#00bfff", ref:"韓国アイドル・K-POPスタイル" },
    { id:"korean",   title:"Korean Actor",   ja:"韓国俳優系",      ko:"한국 배우형",  zh:"韩国演员型",   bf:"10–15%", targetBf:12, color:"#22c55e", ref:"韓国俳優・ドラマ俳優スタイル" },
    { id:"lean",     title:"Lean & Toned",   ja:"細マッチョ",      ko:"슬림핏",      zh:"精实线条",    bf:"10–15%", targetBf:12, color:"#00bfff", ref:"細マッチョ・スリムフィット" },
    { id:"athletic", title:"Athletic",       ja:"アスリート体型",   ko:"운동선수형",   zh:"运动型",      bf:"8–12%",  targetBf:10, color:"#f59e0b", ref:"マラソン・サッカー選手スタイル" },
    { id:"muscular", title:"Muscular",       ja:"マッスル",        ko:"머슬형",      zh:"肌肉型",      bf:"6–10%",  targetBf:8,  color:"#ef4444", ref:"フィジーク・格闘家スタイル" },
  ],
  female: [
    { id:"kpop_girl", title:"K-POP Girl",    ja:"K-POP Girl系",   ko:"K팝 걸형",    zh:"K-POP女团型", bf:"15–20%", targetBf:17, color:"#ec4899", ref:"韓国ガールズグループスタイル" },
    { id:"slim",      title:"Slim & Fit",    ja:"スリム",          ko:"슬림핏",      zh:"苗条型",      bf:"18–23%", targetBf:20, color:"#8b5cf6", ref:"モデル・スリムフィット" },
    { id:"toned",     title:"Toned",         ja:"引き締め",        ko:"탄탄형",      zh:"紧致型",      bf:"18–23%", targetBf:19, color:"#22c55e", ref:"トーンアップ・引き締め" },
    { id:"curvy",     title:"Curvy & Fit",   ja:"グラマー",        ko:"글래머형",    zh:"曲线型",      bf:"22–27%", targetBf:23, color:"#f59e0b", ref:"ヘルシーグラマー" },
    { id:"strong",    title:"Strong",        ja:"強い体",          ko:"강한 체형",   zh:"强健型",      bf:"16–21%", targetBf:18, color:"#ef4444", ref:"クロスフィット・アスリート" },
  ],
};

const LIFE_GOALS = [
  { id:"confidence", emoji:"🦁", en:"Build unshakeable confidence", ja:"絶対的な自信をつけたい", ko:"흔들리지 않는 자신감 갖기", zh:"建立不可动摇的自信" },
  { id:"energy",     emoji:"⚡", en:"Have more energy every day",   ja:"毎日もっとエネルギーが欲しい", ko:"매일 더 많은 에너지 갖기", zh:"每天拥有更多活力" },
  { id:"appearance", emoji:"🔥", en:"Look my absolute best",        ja:"最高の見た目になりたい", ko:"최고의 외모 만들기", zh:"让自己看起来最好" },
  { id:"health",     emoji:"❤️", en:"Improve long-term health",     ja:"長期的な健康を手に入れたい", ko:"장기적인 건강 개선", zh:"改善长期健康" },
  { id:"strength",   emoji:"💪", en:"Get noticeably stronger",      ja:"明らかに強くなりたい", ko:"눈에 띄게 강해지기", zh:"变得明显更强壮" },
  { id:"habits",     emoji:"🧠", en:"Build consistent habits",      ja:"習慣を作りたい", ko:"꾸준한 습관 만들기", zh:"建立一致的习惯" },
];

const AGE_GROUPS = [
  { id:"teens",    en:"Under 20",  ja:"20歳未満",  ko:"20세 미만", zh:"20岁以下", range:"<20" },
  { id:"twenties", en:"20s",       ja:"20代",      ko:"20대",      zh:"20多岁",   range:"20-29" },
  { id:"thirties", en:"30s",       ja:"30代",      ko:"30대",      zh:"30多岁",   range:"30-39" },
  { id:"forties",  en:"40s",       ja:"40代",      ko:"40대",      zh:"40多岁",   range:"40-49" },
  { id:"fifty",    en:"50+",       ja:"50代以上",  ko:"50대 이상", zh:"50岁以上", range:"50+" },
];

const FITNESS_LEVELS = [
  { id:"beginner", en:"Beginner",     ja:"初心者（ほぼ運動なし）",   ko:"초보자（거의 운동 없음）", zh:"初学者（几乎不运动）" },
  { id:"some",     en:"Some exp.",    ja:"経験あり（週1-2回）",      ko:"경험 있음（주 1-2회）",    zh:"有经验（每周1-2次）" },
  { id:"regular",  en:"Regular",     ja:"定期的（週3-4回）",        ko:"규칙적（주 3-4회）",       zh:"定期运动（每周3-4次）" },
  { id:"advanced", en:"Advanced",    ja:"上級者（週5回以上）",      ko:"고급자（주 5회 이상）",    zh:"高级（每周5次以上）" },
];

function lsGet(k, fb) {
  try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fb; }
  catch(e) { return fb; }
}
function lsSet(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {}
}
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function toDateKey(d) {
  return d.toISOString().slice(0, 10);
}
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pct(v, m) { return Math.min(100, Math.round((v / m) * 100)); }
function idealWeight(h, gender, bf) {
  const lbm = gender === "male" ? (0.407 * h) - 10.3 : (0.252 * h) - 4.3;
  return Math.round(lbm / (1 - bf / 100));
}
function bmiCat(b) {
  if (b < 18.5) return { label:"Low", color:"#3b82f6" };
  if (b < 25)   return { label:"Standard", color:"#22c55e" };
  if (b < 30)   return { label:"Above standard", color:"#f97316" };
  return { label:"High", color:"#ef4444" };
}


function calcAdaptiveReps(profile, exerciseKey) {
  const level = profile?.fitnessLevel || "beginner";
  const gender = profile?.gender || "male";

  const base = {
    beginner: { sets:2, reps:8,  rest:90 },
    some:     { sets:3, reps:10, rest:75 },
    regular:  { sets:3, reps:12, rest:60 },
    advanced: { sets:4, reps:15, rest:45 },
  }[level] || { sets:2, reps:8, rest:90 };

  const heavy = ["deadlift","squat","good_morning","hip_thrust"];
  const pull  = ["pullup","row_dumbbell"];
  const iso   = ["crunch","plank","calf_raise","face_pull"];

  let { sets, reps, rest } = base;

  if (heavy.some(k => exerciseKey?.includes(k))) {
    reps = Math.max(5, reps - 3); rest += 30;
  } else if (pull.some(k => exerciseKey?.includes(k))) {
    const w = profile?.currentWeightKg || 70;
    if (w > 75) reps = Math.max(4, reps - 2);
    rest += 15;
  } else if (iso.some(k => exerciseKey?.includes(k))) {
    if (exerciseKey?.includes("plank")) {
      const secs = { beginner:20, some:30, regular:45, advanced:60 }[level] || 20;
      const label = {
        ja:sets+"セット × "+secs+"秒", en:sets+" sets × "+secs+"s",
        ko:sets+"세트 × "+secs+"초",  zh:sets+"组 × "+secs+"秒",
      };
      return { sets, reps:null, seconds:secs, rest, label };
    }
    reps = Math.min(20, reps + 3);
  }

  if (gender === "female" && ["pushup","dips","pullup","shoulder_press"].some(k => exerciseKey?.includes(k))) {
    reps = Math.max(5, reps - 2);
  }

  // Coach intensity modifier — each coach has unique characteristics
  const coachId = profile?.coachId || "bro";
  switch (coachId) {
    case "bro":   // Rex: 体育会系・高強度・短休憩・多セット
      reps  = Math.max(4, Math.round(reps * 1.2));
      sets  = Math.min(5, sets + 1);
      rest  = Math.max(30, rest - 15);
      break;
    case "drill": // Drake: スパルタ・最高強度・最短休憩・最多レップ
      reps  = Math.max(4, Math.round(reps * 1.3));
      sets  = Math.min(5, sets + 1);
      rest  = Math.max(20, rest - 20);
      break;
    case "kpop":  // Kai: 細マッチョ・高回数・軽め・中間休憩
      reps  = Math.min(20, Math.round(reps * 1.1));
      rest  = Math.max(45, rest - 5);
      break;
    case "science": // Dr.Lee: 科学的・適切な回数・十分な回復
      // reps/setsはそのまま、休憩を科学的に最適化
      rest  = Math.min(120, rest + 10);
      break;
    case "sister": // Mia: 優しめ・少なめレップ・長め休憩
      reps  = Math.max(3, Math.round(reps * 0.85));
      rest  = Math.min(120, rest + 20);
      break;
    case "gyaru":  // Yuna: 楽しく・少なめレップ・最長休憩（楽しむペース）
      reps  = Math.max(3, Math.round(reps * 0.85));
      rest  = Math.min(150, rest + 30);
      break;
    default:
      break;
  }

  return {
    sets, reps, rest,
    label: {
      ja:sets+"セット × "+reps+"回", en:sets+" sets × "+reps+" reps",
      ko:sets+"세트 × "+reps+"회",  zh:sets+"组 × "+reps+"次",
    },
  };
}

const EX_GUIDE = {
  pushup: {
    muscles:{ ja:["大胸筋（胸）","上腕三頭筋","肩前部"], en:["Chest","Triceps","Front Deltoid"], ko:["대흉근","상완삼두근","전면 삼각근"], zh:["胸大肌","肱三头肌","前三角肌"] },
    form:{ ja:["頭からかかとまで一直線をキープ","肩甲骨を寄せて、胸を張る","肘は体の約45度の角度で曲げる","息を吸いながら下ろし、吐きながら押し上げる","腰が反ったり、下がったりしないように"], en:["Keep head to heel in a straight line","Squeeze shoulder blades, chest up","Elbows at ~45° from body","Inhale down, exhale up","Don't let hips sag or pike"], ko:["머리부터 발뒤꿈치까지 일직선 유지","견갑골을 모아 가슴을 펴기","팔꿈치는 몸에서 약 45도 각도","내려갈 때 흡기, 올라올 때 호기","허리가 처지거나 올라가지 않도록"], zh:["从头到脚跟保持一条直线","收紧肩胛骨，挺胸","肘部与身体约45度角","下降时吸气，推起时呼气","不要让臀部下沉或抬高"] },
    effect:{ ja:{ m:"上半身全体の筋力向上。特に胸・腕・肩をバランスよく鍛えられる自重トレーニングの基本種目。", f:"上半身の引き締め・筋力向上。胸・腕・肩をバランスよく鍛えられる基本種目。" }, en:{ m:"Builds upper body strength — chest, arms and shoulders in one move.", f:"Tones and strengthens the upper body. Great for chest, arms and shoulders." }, ko:{ m:"상체 전체 근력 향상. 가슴·팔·어깨를 균형 있게 단련하는 맨몸 운동의 기본 종목.", f:"상체 引き締め 및 근력 향상. 가슴·팔·어깨를 균형 있게 단련하는 기본 종목." }, zh:{ m:"提升上身整体力量，均衡锻炼胸、臂、肩，是徒手训练的基础动作。", f:"紧实上身、提升力量，均衡锻炼胸、臂、肩的徒手训练基础动作。" } },
  },
  squat: {
    muscles:{ ja:["大腿四頭筋","ハムストリング","臀筋"], en:["Quadriceps","Hamstrings","Glutes"], ko:["대퇴사두근","햄스트링","둔근"], zh:["股四头肌","腘绳肌","臀肌"] },
    form:{ ja:["膝を張り、背筋をまっすぐに保つ","膝がつま先より前に出ないようにする","かかとで地面をしっかり踏む","息を吸いながら下ろし、吐きながら立つ","全身の安定性を意識する"], en:["Keep back straight, knees out","Knees should not pass toes","Drive through heels","Inhale down, exhale up","Engage your core throughout"], ko:["등을 펴고 무릎을 바깥으로 벌리기","무릎이 발끝보다 앞으로 나오지 않도록","발뒤꿈치로 땅을 밀기","내려갈 때 흡기, 올라올 때 호기","코어에 힘 유지"], zh:["保持背部挺直，膝盖向外","膝盖不要超过脚尖","用脚跟发力","下蹲时吸气，起身时呼气","全程收紧核心"] },
    effect:{ ja:{ m:"下半身の筋力向上。大腿四頭筋・臀筋・ハムストリングを一度に鍛え、基礎代謝アップ。", f:"下半身の引き締め・ヒップアップ効果。脚全体のラインを整え、基礎代謝アップ。" }, en:{ m:"Builds lower body strength. Hits quads, glutes and hamstrings at once. Boosts metabolism.", f:"Tones lower body, lifts the glutes. Shapes leg lines and boosts metabolism." }, ko:{ m:"하체 근력 강화. 대퇴사두근·둔근·햄스트링을 한번에 단련, 기초대사량 증가.", f:"하체 引き締め·힙업 효과. 다리 라인 정리 및 기초대사량 증가." }, zh:{ m:"增强下肢力量。同时锻炼股四头肌、臀肌和腘绳肌，提升基础代谢。", f:"紧实下身，提臀效果好。塑造腿部线条，提升基础代谢。" } },
  },
  pullup: {
    muscles:{ ja:["広背筋","上腕二頭筋","僧帽筋・菱形筋"], en:["Lats","Biceps","Traps & Rhomboids"], ko:["광배근","상완이두근","승모근·능형근"], zh:["背阔肌","肱二头肌","斜方肌·菱形肌"] },
    form:{ ja:["肩甲骨を寄せてから引き上げる","脇に向かって肘を引き下げるイメージ","ゆっくりコントロールして下ろす","胸をバーに近づけるように引く","反動を使わず、ゆっくりコントロール"], en:["Retract scapulae before pulling","Think: elbows to hips, not hands to chin","Lower slowly with control","Bring chest toward the bar","No kipping — full control"], ko:["견갑골을 먼저 모은 후 당기기","팔꿈치를 엉덩이 방향으로 내리는 느낌","천천히 컨트롤하며 내리기","가슴을 바에 가까이 당기기","반동 없이 천천히 컨트롤"], zh:["先收紧肩胛骨再上拉","想象把肘部向臀部拉","缓慢有控制地下降","将胸口拉向横杠","不要借力，全程控制"] },
    effect:{ ja:{ m:"背中の幅が広がり逆三角形のシルエットに。上半身の引く力が大幅に向上。", f:"背中の引き締め・姿勢改善。力・変形の改善にも効果的。" }, en:{ m:"Widens the back for a V-taper. Major upper body pulling strength builder.", f:"Tones the back, improves posture. Builds real pulling strength." }, ko:{ m:"등이 넓어져 역삼각형 실루엣. 상체 당기는 힘 대폭 향상.", f:"등 引き締め·자세 개선. 힘·변형 개선에도 효과적." }, zh:{ m:"拓宽背部，打造V形身材。大幅提升上肢拉力。", f:"紧实背部，改善姿势。有效提升拉力和体态。" } },
  },
  lunge: {
    muscles:{ ja:["大腿四頭筋","ハムストリング","臀筋"], en:["Quadriceps","Hamstrings","Glutes"], ko:["대퇴사두근","햄스트링","둔근"], zh:["股四头肌","腘绳肌","臀肌"] },
    form:{ ja:["上半身をまっすぐに保つ","前膝がつま先より前に出ないようにする","前足のかかとでしっかり踏み込む","均等に重心を配分する","膝を床につけすぎない"], en:["Keep torso upright","Front knee must not pass toes","Drive through the front heel","Distribute weight evenly","Don't let back knee slam down"], ko:["상체를 수직으로 유지","앞 무릎이 발끝을 넘지 않도록","앞발 뒤꿈치로 힘껏 밀기","체중을 균등하게 배분","뒷무릎이 바닥에 세게 닿지 않도록"], zh:["保持上半身直立","前膝不要超过脚尖","用前脚跟发力踩地","均匀分配重心","后膝不要猛地着地"] },
    effect:{ ja:{ m:"下半身のバランス強化。片脚ずつ鍛えることで左右差を改善し、ヒップアップ効果。", f:"下半身のバランス強化・ヒップアップ効果。左右差の改善に効果的。" }, en:{ m:"Improves lower body balance. Fixes imbalances. Great glute builder.", f:"Balances and tones the lower body. Lifts glutes and corrects left-right imbalances." }, ko:{ m:"하체 밸런스 강화. 좌우 차이 개선 및 힙업 효과.", f:"하체 밸런스 강화·힙업 효과. 좌우 차이 개선." }, zh:{ m:"增强下肢平衡感。单腿训练改善左右不平衡，提臀效果好。", f:"强化下身平衡·提臀效果。单腿训练改善左右差异。" } },
  },
  plank: {
    muscles:{ ja:["腹直筋","腹斜筋","体幹全体"], en:["Abs","Obliques","Full Core"], ko:["복직근","복사근","코어 전체"], zh:["腹直肌","腹斜肌","整个核心"] },
    form:{ ja:["頭からかかとまで一直線をキープ","お尻を上げすぎたり、下げすぎない","呼吸を止めず、自然に行う","肘は肩の真下に置く","首を前に出さない"], en:["Keep head to heel in a straight line","Don't let hips pike up or sag","Breathe naturally","Elbows directly under shoulders","Don't push head forward"], ko:["머리부터 발뒤꿈치까지 일직선","엉덩이가 너무 올라가거나 처지지 않도록","자연스럽게 호흡하기","팔꿈치는 어깨 바로 아래","머리를 앞으로 내밀지 않기"], zh:["从头到脚跟保持一条直线","臀部不要过高或下沉","自然呼吸，不要憋气","肘部在肩膀正下方","头部不要前伸"] },
    effect:{ ja:{ m:"体幹の安定性向上。姿勢改善・腰痛予防に効果的。全身の筋持久力アップ。", f:"体幹の安定性向上。姿勢改善・腰痛予防に効果的。全身の筋持久力アップ。" }, en:{ m:"Builds core stability and endurance. Improves posture and prevents lower back pain.", f:"Builds core stability and endurance. Improves posture and prevents lower back pain." }, ko:{ m:"코어 안정성 향상. 자세 개선·요통 예방. 전신 근지구력 향상.", f:"코어 안정성 향상. 자세 개선·요통 예방. 전신 근지구력 향상." }, zh:{ m:"提升核心稳定性。改善姿势，预防腰痛。提高全身肌肉耐力。", f:"提升核心稳定性。改善姿势，预防腰痛。提高全身肌肉耐力。" } },
  },
  dips: {
    muscles:{ ja:["大胸筋（下部）","上腕三頭筋","三角筋前部"], en:["Lower Chest","Triceps","Front Deltoid"], ko:["대흉근（하부）","상완삼두근","전면 삼각근"], zh:["胸大肌（下部）","肱三头肌","前三角肌"] },
    form:{ ja:["体をやや前傾させると胸に効かせやすい","肘を外に開きすぎない","肩をすくめず、胸を張る","二の腕の引き締めを意識する","反動を使わずゆっくりコントロール"], en:["Lean slightly forward to target chest more","Don't flare elbows too wide","Keep shoulders down, chest open","Focus on squeezing the tricep at top","Slow and controlled — no bouncing"], ko:["가슴에 효과주려면 앞으로 약간 기울이기","팔꿈치를 너무 바깥으로 벌리지 않기","어깨를 으쓱하지 말고 가슴을 펴기","이두 引き締め 의식하기","반동 없이 천천히 컨트롤"], zh:["身体略微前倾更能刺激胸部","肘部不要过度外展","肩膀下沉，挺胸","注意在顶部收紧肱三头肌","慢速控制，不要借力"] },
    effect:{ ja:{ m:"上半身の押す力を強化。特に三頭筋・胸下部の発達に効果的。", f:"上半身の引き締め・腕の後ろ側の筋力向上に効果的。" }, en:{ m:"Builds upper body pushing strength. Excellent for tricep and lower chest development.", f:"Tones the upper body, especially the back of the arms." }, ko:{ m:"상체 미는 힘 강화. 삼두근·하부 흉근 발달에 효과적.", f:"상체 引き締め·팔 뒤쪽 근력 향상에 효과적." }, zh:{ m:"增强上肢推力，对肱三头肌和下胸发展效果显著。", f:"紧实上身，有效增强手臂后侧力量。" } },
  },
  shoulder_press: {
    muscles:{ ja:["三角筋（中部・前部）","上腕三頭筋"], en:["Deltoid (Mid/Front)","Triceps"], ko:["삼각근（중부·전면）","상완삼두근"], zh:["三角肌（中部·前部）","肱三头肌"] },
    form:{ ja:["背筋をまっすぐに保つ","肩の真上にダンベルをそろえる","頭の真上で動作させる","肩の高さまで下げる","コアに力を入れる"], en:["Keep back straight","Align dumbbells directly over shoulders","Move directly overhead","Lower to shoulder height","Keep core braced"], ko:["등을 곧게 유지","덤벨을 어깨 바로 위에 정렬","정수리 위에서 동작","어깨 높이까지 내리기","코어 유지"], zh:["保持背部挺直","哑铃对齐肩膀正上方","在头顶正上方完成动作","下降至肩高","收紧核心"] },
    effect:{ ja:{ m:"肩幅アップ。逆三角形の体つくりに。肩の全方向の筋肉を同時に刺激。", f:"肩の丸みアップ。逆三角形の体つくり。姿勢の改善。" }, en:{ m:"Builds shoulder width for a V-taper. Hits all three deltoid heads.", f:"Rounds out the shoulders. Builds a V-shape and improves posture." }, ko:{ m:"어깨 넓히기. 역삼각형 체형 만들기. 삼각근 전체 자극.", f:"어깨 라운딩 업. 역삼각형 체형 및 자세 개선." }, zh:{ m:"拓宽肩膀，打造V形身材。全面刺激三角肌。", f:"打造圆润肩部，构建V形身材，改善姿势。" } },
  },
  row_dumbbell: {
    muscles:{ ja:["広背筋","僧帽筋","菱形筋","上腕二頭筋"], en:["Lats","Traps","Rhomboids","Biceps"], ko:["광배근","승모근","능형근","상완이두근"], zh:["背阔肌","斜方肌","菱形肌","肱二头肌"] },
    form:{ ja:["背中を平らにし、前屈みで体幹をキープ","肘を体側に引き上げる","肩甲骨を寄せることを意識する","腕ではなく背中で引く","肩を巻き込まないことを意識"], en:["Keep back flat, hinge at hips","Pull elbow back and up along the body","Focus on squeezing the shoulder blade","Row with your back, not your arm","Keep shoulder from rolling forward"], ko:["등을 평평하게 유지하고 상체를 앞으로 기울이기","팔꿈치를 몸 옆으로 끌어올리기","견갑골을 모으는 것을 의식하기","팔이 아닌 등으로 당기기","어깨가 앞으로 말리지 않도록"], zh:["保持背部平直，俯身固定核心","肘部沿身体侧面向上拉","专注于收紧肩胛骨","用背部发力而非手臂","防止肩膀前倾"] },
    effect:{ ja:{ m:"背中の厚みアップ。姿勢改善・巻き肩の改善に効果的。", f:"背中の引き締め・姿勢改善に効果的。" }, en:{ m:"Adds back thickness. Corrects rounded shoulders and improves posture.", f:"Tones the back. Effective for improving posture and shoulder alignment." }, ko:{ m:"등의 두께 향상. 자세 개선·굽은 어깨 교정에 효과적.", f:"등 引き締め·자세 개선에 효과적." }, zh:{ m:"增加背部厚度，改善圆肩和姿势。", f:"紧实背部，有效改善姿势和肩部对位。" } },
  },
  crunch: {
    muscles:{ ja:["腹直筋","腹斜筋"], en:["Rectus Abdominis","Obliques"], ko:["복직근","복사근"], zh:["腹直肌","腹斜肌"] },
    form:{ ja:["頭を上げるのではなく、肋骨を骨盤に近づける","首を引っ張らない","腰を浮かせすぎない","呼吸を止めない","小さい動きで腹筋に効かせる"], en:["Bring RIBS toward hips, not head up","Don't yank your neck","Don't lift your lower back off floor","Keep breathing","Small movement — all in the abs"], ko:["머리를 올리는 게 아니라 갈비뼈를 골반에 가까이","목을 당기지 않기","허리가 떠오르지 않도록","호흡을 멈추지 않기","작은 동작으로 복근에 집중"], zh:["将肋骨向骨盆靠近，而不是抬头","不要拉扯颈部","腰部不要离开地面","保持呼吸","动作幅度小，专注于腹部收缩"] },
    effect:{ ja:{ m:"腹直筋の強化。腹筋が割れてくると姿勢が変わり、自信が外に出てくる。", f:"腹直筋の引き締め・強化。ウエストラインの改善と体幹の安定性向上。" }, en:{ m:"Builds the abs. Defined abs transform posture and project confidence.", f:"Tones and strengthens the abs. Improves waist definition and core stability." }, ko:{ m:"복직근 강화. 복근이 갈라지면 자세가 변하고 자신감이 생긴다.", f:"복직근 引き締め·강화. 허리 라인 개선과 코어 안정성 향상." }, zh:{ m:"强化腹直肌。腹肌发达后，姿势改变，自信自然流露。", f:"紧实并强化腹直肌。改善腰部线条，提升核心稳定性。" } },
  },
  deadlift: {
    muscles:{ ja:["ハムストリング","臀筋","脊柱起立筋","大腿四頭筋"], en:["Hamstrings","Glutes","Erector Spinae","Quads"], ko:["햄스트링","둔근","척추기립근","대퇴사두근"], zh:["腘绳肌","臀肌","竖脊肌","股四头肌"] },
    form:{ ja:["背筋をまっすぐに保つ","膝を曲げながらお尻を落とす","バーは体に近づけて引き上げる","腰を丸めず、体幹を固定する","持ち上げる前にコアに力を入れる"], en:["Keep back straight throughout","Bend knees and hinge at hips","Keep bar close to body","Never round the lower back","Brace your core before lifting"], ko:["등을 곧게 유지하기","무릎을 굽히고 엉덩이를 낮추기","바를 몸 가까이에서 당기기","허리를 절대 둥글게 하지 않기","들기 전 코어에 힘주기"], zh:["全程保持背部挺直","弯曲膝盖，臀部下沉","杠铃贴近身体上拉","绝对不要弓背","举铁前收紧核心"] },
    effect:{ ja:{ m:"全身の筋力アップ。後側の筋肉を強化し、基礎代謝向上・基礎筋力強化。", f:"全身の筋力アップ。ヒップアップ・ハムストリングの引き締めに効果的。" }, en:{ m:"Full body strength builder. Strengthens the entire posterior chain. Boosts metabolism.", f:"Full body strength. Great for glute development and hamstring toning." }, ko:{ m:"전신 근력 향상. 후면 사슬 강화, 기초대사량 증가.", f:"전신 근력 향상. 힙업·햄스트링 引き締め에 효과적." }, zh:{ m:"全身力量提升，强化背链肌群，提高基础代谢。", f:"全身力量提升，臀部发展和大腿后侧紧实效果显著。" } },
  },
  hip_thrust: {
    muscles:{ ja:["臀筋","ハムストリング","大腿四頭筋"], en:["Glutes","Hamstrings","Quads"], ko:["둔근","햄스트링","대퇴사두근"], zh:["臀肌","腘绳肌","股四头肌"] },
    form:{ ja:["肩甲骨をベンチにつける","お尻をしっかりしぼってトップでキープ","腰を反らせすぎない","かかとで地面を踏む","トップで完全な股関節伸展"], en:["Rest shoulder blades on the bench","Squeeze glutes hard at the top and hold","Don't hyperextend the lower back","Drive through heels","Full hip extension at the top"], ko:["견갑골을 벤치에 고정","꼭대기에서 둔근을 강하게 조이고 유지","허리를 과도하게 젖히지 않기","발뒤꿈치로 힘주기","꼭대기에서 완전한 고관절 신전"], zh:["肩胛骨靠在凳子上","在顶部用力收紧臀肌并保持","不要过度伸展腰部","用脚跟发力","顶部完成完全的髋关节伸展"] },
    effect:{ ja:{ m:"臀筋の最大収縮種目。お尻の形・大きさを最も効率的に鍛える。", f:"ヒップアップの最重要種目。お尻の丸みと張りを作る最も効果的なトレーニング。" }, en:{ m:"Maximum glute activation. The most efficient exercise for glute shape and size.", f:"The #1 exercise for glute development. Builds roundness and firmness most effectively." }, ko:{ m:"둔근 최대 수축 종목. 엉덩이 형태·크기를 가장 효율적으로 단련.", f:"힙업의 핵심 종목. 엉덩이의 둥근 형태와 탄력을 만드는 가장 효과적인 트레이닝." }, zh:{ m:"臀肌最大收缩动作。最高效锻炼臀部形态和尺寸的运动。", f:"臀部发展最重要的动作。最有效地塑造臀部圆润感和紧实度。" } },
  },
  calf_raise: {
    muscles:{ ja:["腓腹筋","ヒラメ筋"], en:["Gastrocnemius","Soleus"], ko:["비복근","가자미근"], zh:["腓肠肌","比目鱼肌"] },
    form:{ ja:["つま先でできるだけ高く上げる","かかとをできるだけ下げる","反動を使わず、ゆっくり行う","トップで一瞬止める","コアを維持する"], en:["Rise as high as possible on toes","Lower heel as far as possible","Slow and controlled — no bouncing","Pause at the top for max contraction","Keep core engaged"], ko:["발끝으로 최대한 높이 올리기","발뒤꿈치를 최대한 아래로 내리기","반동 없이 천천히","꼭대기에서 잠시 멈추기","코어 유지"], zh:["踮脚尽量高","脚跟尽量下沉","缓慢控制，不要借力","顶部停顿以最大化收缩","保持核心收紧"] },
    effect:{ ja:{ m:"ふくらはぎの強化・引き締め。スポーツパフォーマンス向上・ケガ予防。", f:"ふくらはぎの引き締め・強化。足首の安定性向上・スポーツパフォーマンス向上。" }, en:{ m:"Strengthens and defines the calves. Boosts athletic performance and prevents injury.", f:"Tones and strengthens the calves. Improves ankle stability and athletic performance." }, ko:{ m:"종아리 강화·引き締め. 스포츠 퍼포먼스 향상·부상 예방.", f:"종아리 引き締め·강화. 발목 안정성 향상·스포츠 퍼포먼스 향상." }, zh:{ m:"强化紧实小腿。提升运动表现，预防运动伤害。", f:"紧实并强化小腿。提高踝关节稳定性和运动表现。" } },
  },
  good_morning: {
    muscles:{ ja:["ハムストリング","脊柱起立筋","臀筋"], en:["Hamstrings","Erector Spinae","Glutes"], ko:["햄스트링","척추기립근","둔근"], zh:["腘绳肌","竖脊肌","臀肌"] },
    form:{ ja:["背筋をまっすぐに保ち、上体を前傾させる","膝を曲げながらお尻を後ろに突き出す","腰を丸めずに上体を倒す","下でハムストリングのストレッチを感じる","動作をコントロールする"], en:["Keep back straight as you hinge forward","Push hips back as you lean","Never round the lower back","Feel the hamstrings stretch at the bottom","Control the movement"], ko:["등을 곧게 유지하며 앞으로 기울이기","엉덩이를 뒤로 밀면서 상체 기울이기","허리를 절대 둥글게 하지 않기","아래에서 햄스트링 스트레칭 느끼기","움직임을 컨트롤하기"], zh:["保持背部挺直向前倾","臀部向后推的同时俯身","绝对不要弓背","在底部感受腘绳肌的拉伸","控制动作"] },
    effect:{ ja:{ m:"ハムストリング・脊柱起立筋の強化。姿勢予防・体幹強化。", f:"ハムストリング・臀筋の引き締め。姿勢改善・体幹強化に効果的。" }, en:{ m:"Strengthens hamstrings and lower back. Builds posture and core stability.", f:"Tones hamstrings and glutes. Improves posture and core strength." }, ko:{ m:"햄스트링·척추기립근 강화. 자세 개선·코어 강화.", f:"햄스트링·둔근 引き締め. 자세 개선·코어 강화에 효과적." }, zh:{ m:"强化腘绳肌和竖脊肌，改善姿势，增强核心稳定性。", f:"紧实腘绳肌和臀肌，改善姿势，增强核心力量。" } },
  },
  face_pull: {
    muscles:{ ja:["三角筋後部","僧帽筋","菱形筋"], en:["Rear Deltoid","Traps","Rhomboids"], ko:["후면 삼각근","승모근","능형근"], zh:["后三角肌","斜方肌","菱形肌"] },
    form:{ ja:["肘を外側に広げてイメージ","ロープを顔に向かって引く","上腕を床と平行に維持する","最後に後部三角筋・僧帽筋を収縮させる","ゆっくりコントロール"], en:["Flare elbows out to the sides","Pull rope toward face, hands going outward","Keep upper arms parallel to floor","Squeeze rear delts and traps at the end","Slow controlled movement"], ko:["팔꿈치를 옆으로 벌리기","로프를 얼굴 쪽으로 당기며 손을 바깥으로","상완을 바닥과 평행하게 유지","마지막에 후면 삼각근·승모근 조이기","천천히 컨트롤"], zh:["肘部向外展开","将绳索拉向面部，双手向外","保持上臂与地面平行","在终点收紧后三角肌和斜方肌","缓慢控制"] },
    effect:{ ja:{ m:"肩の安定性向上。巻き肩改善・姿勢改善に非常に効果的。ケガ予防にも重要。", f:"肩の安定性向上。巻き肩改善・姿勢改善に効果的。" }, en:{ m:"Strengthens shoulder stability. Highly effective for fixing rounded shoulders. Key injury prevention.", f:"Improves shoulder stability. Effective for fixing rounded shoulders and improving posture." }, ko:{ m:"어깨 안정성 향상. 굽은 어깨 교정·자세 개선에 매우 효과적. 부상 예방에도 중요.", f:"어깨 안정성 향상. 굽은 어깨 교정·자세 개선에 효과적." }, zh:{ m:"提升肩部稳定性，对纠正圆肩和改善姿势非常有效，也是重要的伤害预防动作。", f:"提升肩部稳定性，有效纠正圆肩、改善姿势。" } },
  },
  hiit: {
    muscles:{ ja:["全身（心肺機能・体幹・下半身）"], en:["Full Body (Cardio · Core · Lower Body)"], ko:["전신（심폐기능·코어·하체）"], zh:["全身（心肺功能·核心·下肢）"] },
    form:{ ja:["無理のないペースから始める","休息時間はしっかり取る","フォームが崩れたら強度を下げる","水分補給を忘れずに","自分のペースで継続することが大切"], en:["Start at a manageable pace","Take full rest periods","If form breaks down, reduce intensity","Stay hydrated","Consistency matters more than intensity"], ko:["무리 없는 페이스로 시작","충분한 휴식 시간 갖기","폼이 무너지면 강도 낮추기","수분 보충 잊지 않기","자신의 페이스로 꾸준히 하는 것이 중요"], zh:["从适合自己的节奏开始","充分休息","动作变形时降低强度","保持补水","坚持比强度更重要"] },
    effect:{ ja:{ m:"心肺機能・持久力向上。全身の脂肪燃焼・代謝アップ。短時間で高い効果。", f:"心肺機能・持久力向上。全身の引き締め・脂肪燃焼。短時間で高い効果。" }, en:{ m:"Boosts cardio and endurance. Burns fat across the whole body and spikes metabolism.", f:"Boosts cardio and endurance. Full body toning and fat burning. High results in short time." }, ko:{ m:"심폐기능·지구력 향상. 전신 지방 연소·대사 증가. 짧은 시간에 높은 효과.", f:"심폐기능·지구력 향상. 전신 引き締め·지방 연소. 짧은 시간에 높은 효과." }, zh:{ m:"提升心肺功能和耐力。全身燃脂，提高代谢。短时间内获得显著效果。", f:"提升心肺功能和耐力。全身紧实燃脂。短时间内获得显著效果。" } },
  },
};

function getExGuide(exerciseName, lang, gender) {
  const l = exerciseName.toLowerCase();
  const aliases = {
    pushup:         ["push","腕立","푸시업"],
    squat:          ["squat","スクワット","스쿼트"],
    pullup:         ["pull","chin","懸垂","풀업"],
    lunge:          ["lunge","ランジ","런지"],
    plank:          ["plank","プランク","플랭크"],
    dips:           ["dip","ディップ","딥"],
    shoulder_press: ["shoulder","ショルダー","숄더"],
    row_dumbbell:   ["row","ロウ","로우","bent"],
    crunch:         ["crunch","クランチ","크런치","ab","腹筋"],
    deadlift:       ["dead","デッドリフト","데드리프트"],
    hip_thrust:     ["hip","ヒップ","힙"],
    calf_raise:     ["calf","カーフ","카프"],
    good_morning:   ["good morning","グッドモーニング","굿모닝"],
    face_pull:      ["face","フェイスプル","페이스풀"],
    hiit:           ["hiit","cardio","バーピー","マウンテン","ジャンプ"],
  };
  const key = Object.keys(aliases).find(k => aliases[k].some(a => l.includes(a)));
  if (!key) return null;
  const g = EX_GUIDE[key];
  const lng = lang || "en";
  return {
    key,
    muscles: g.muscles[lng] || g.muscles.en,
    form:    g.form[lng]    || g.form.en,
    effect:  g.effect[lng]?.[gender === "female" ? "f" : "m"] || g.effect.en?.[gender === "female" ? "f" : "m"] || "",
  };
}


const LEGAL = {
  privacy: {
    en: { title:"Privacy Policy", body:"Last updated: June 2026\n\n1. DATA COLLECTED\nWe collect: nickname, gender (optional), age group, height, weight, meal logs, workout history. We may request GPS location for weather-based nutrition advice. Location is used in real-time only and never stored on our servers.\n\n2. PURPOSE\nData is used solely for personalized fitness and nutrition recommendations. We never sell or share your data with third parties.\n\n3. LOCATION DATA\nLocation access is optional. Declining does not affect app functionality. Location data is processed only on your device.\n\n4. DATA STORAGE\nAll data is stored encrypted on Supabase and locally on your device. No card data is stored.\n\n5. AI DISCLOSURE\nThis app uses Anthropic's Claude API. Chat content is processed in accordance with Anthropic's data processing policy. Some illustrations are created using AI generation technology. Characters depicted are fictional and not intended to represent real persons.\n\n6. HEALTH & WELLNESS DISCLAIMER\nMake Body is a lifestyle and habit-building support app. It does NOT provide medical advice, diagnosis, treatment, or any form of medical or psychological therapy. The AI coach provides general fitness and nutrition suggestions for informational purposes only. BMI, calorie estimates, and other metrics shown are approximate reference values, not medical assessments. Users with health conditions should consult a qualified healthcare professional before starting any fitness or nutrition program.\n\n7. PAYMENTS\nAll payments are processed by Stripe, Inc. No card data is stored by us.\n\n8. MINORS\nThis app is not intended for users under 13. Users aged 13-17 require parental consent for paid features.\n\n9. YOUR RIGHTS\nYou may request access, correction, or deletion of your data at any time. Deletion requests will be processed within 30 days of receipt.\nEU users have additional rights under GDPR, including the right to data portability.\n\n10. CONTACT\n" + CONTACT_EMAIL },

    ja: { title:"プライバシーポリシー", body:"最終更新：2026年6月\n\n1. 収集するデータ\nニックネーム、性別（任意）、年代、身長、体重、食事記録、運動記録を収集します。天気に基づく栄養アドバイスのために、GPSの位置情報を要求することがあります。位置情報はリアルタイムのみ使用し、サーバーには一切保存しません。\n\n2. データの利用目的\n個人化されたフィットネス・栄養アドバイスのみに使用します。第三者への販売・提供は行いません。\n\n3. 位置情報\n位置情報へのアクセスは任意です。拒否してもアプリの機能に影響はありません。\n\n4. データ保管\nSupabaseで暗号化保管、およびデバイス上にローカル保存します。カード情報は保管しません。\n\n5. AI開示事項\n本アプリはAnthropicのClaude APIを使用しています。チャット内容はAnthropicのデータ処理ポリシーに従って処理されます。一部のイラストはAI生成技術を利用して制作されています。画像に登場する人物は実在人物を意図したものではありません。\n\n6. 健康・ウェルネス免責事項\n本アプリはライフスタイル習慣改善のサポートを目的としたアプリです。医療行為・診断・治療・心理療法を提供するものではありません。AIコーチが提供する情報はフィットネス・栄養に関する一般的な提案であり、参考情報として提供しています。BMIやカロリー等の数値は概算の参考値であり、医療的評価ではありません。健康上の懸念がある方は医療専門家にご相談ください。\n\n7. 決済\n全ての決済はStripe, Inc.が処理します。カード情報は弊社では保管しません。\n\n8. 未成年者\n本アプリは13歳未満を対象としていません。13〜17歳の方が有料機能を利用する場合は保護者の同意が必要です。\n\n9. お客様の権利\nデータへのアクセス・修正・削除はいつでも申請できます。削除依頼は受領後30日以内に対応します。EUユーザーはGDPRに基づく追加の権利を有します。\n\n10. お問い合わせ\n" + CONTACT_EMAIL },

    ko: { title:"개인정보처리방침", body:"최종 업데이트：2026년 6월\n\n1. 수집하는 정보\n닉네임, 성별(선택), 연령대, 신장, 체중, 식사 기록, 운동 기록을 수집합니다.\n\n2. 데이터 이용 목적\n개인화된 피트니스 및 영양 추천에만 사용됩니다. 제3자에게 판매하지 않습니다.\n\n3. 데이터 저장\nSupabase에 암호화 저장 및 기기 내 로컬 저장. 카드 정보는 저장되지 않습니다.\n\n4. AI 공개사항\nAnthropic Claude API를 사용합니다. 일부 일러스트는 AI 생성 기술로 제작되었으며 실존 인물을 의도하지 않습니다.\n\n5. 건강 면책\n본 앱은 의료 서비스가 아닙니다. AI 코치의 정보는 참고용 일반 제안입니다.\n\n6. 결제\nStripe, Inc.에서 처리. 카드 정보는 저장되지 않습니다.\n\n7. 귀하의 권리\n언제든지 데이터 접근, 수정, 삭제를 요청할 수 있습니다. 삭제 요청은 접수 후 30일 이내에 처리됩니다. EU 사용자는 GDPR에 따른 추가 권리를 보유합니다.\n\n8. 문의처\n" + CONTACT_EMAIL },

    zh: { title:"隐私政策", body:"最后更新：2026年6月\n\n我们收集：昵称、性别（可选）、年龄段、身高、体重、饮食和运动记录。数据仅用于个性化健身和营养建议，不对外销售。一些插图使用AI生成技术制作，图中人物为虚构角色，并非真实人物。\n\n您的权利：您可以随时请求访问、更正或删除您的数据。删除请求将在收到后30天内处理。EU用户享有GDPR下的额外权利。\n\n联系方式：" + CONTACT_EMAIL },

    de: { title: "Datenschutzerklarung", body: "Letzte Aktualisierung: Juni 2026\\n\\nDaten: E-Mail, Nickname, Korperdaten, KI-Chat. Kein Drittverkauf.\\nDienste: Supabase, Externer KI-Dienst, Stripe.\\nLoschung: makebody999@gmail.com" },
    fr: { title: "Politique de confidentialite", body: "Mise a jour: juin 2026\\n\\nDonnees: email, pseudo, donnees corporelles, chat IA. Pas de vente a des tiers.\\nServices: Supabase, Service IA externe, Stripe.\\nSuppression: makebody999@gmail.com" },
    es: { title: "Politica de privacidad", body: "Actualizacion: junio 2026\\n\\nDatos: email, apodo, datos corporales, chat IA. No se venden a terceros.\\nServicios: Supabase, Servicio IA externo, Stripe.\\nEliminacion: makebody999@gmail.com" },
  },

  terms: {
    en: { title:"Terms of Service", body:"Last updated: June 2026\n\n1. ACCEPTANCE\nBy using Make Body, you agree to these terms.\n\n2. SERVICE DESCRIPTION\nMake Body provides AI-powered fitness coaching and nutrition recommendations for informational purposes only. It is NOT a medical service.\n\n3. HEALTH & WELLNESS DISCLAIMER\nMake Body is a lifestyle and habit-support app. It does NOT provide medical advice, diagnosis, treatment, or any form of medical or psychological therapy. The AI coach provides general wellness suggestions based on user-provided information. These are NOT medical assessments. Calorie counts, BMI values, and nutrition estimates are approximations for reference only. Users should consult a qualified healthcare professional before starting any fitness or nutrition program, especially if they have pre-existing health conditions.\n\n4. AI-GENERATED CONTENT\nSome illustrations in this app are created using AI image generation technology. Characters depicted are fictional and not intended to represent real persons. This app uses Anthropic's Claude API for AI coaching features.\n\n5. SUBSCRIPTION & BILLING\n- Free plan: limited daily AI chats (3/day UTC, 10/day within first 24hrs)\n- Trial plan: $1.99 one-time. Valid 7 days OR 50 sessions (whichever first). No auto-charge. Returns to Free plan automatically.\n- PRO Monthly: $8.99/month\n- PRO Annual: $79.99/year (~26% savings)\n- Cancel anytime via Stripe customer portal\n- Cancellation effective at end of current billing period\n- No refunds after subscription activation (digital content, immediate access)\n- EU users: You may have a 14-day right of withdrawal. By accessing PRO features immediately upon payment, you expressly waive this right where applicable. EU users retain all mandatory statutory consumer protection rights.\n- Local taxes may apply\n\n6. AI USAGE LIMITS\n- Free plan: 3 chats per UTC calendar day (10 within first 24 hours of registration)\n- PRO plan: 300 chats per UTC calendar month\n- Monthly usage counts are tracked using UTC (Coordinated Universal Time), regardless of the user's local timezone or device clock settings.\n- Daily/monthly resets occur at UTC 00:00.\n\n6. MINORS\nUsers under 18 require parental consent for PRO subscription.\n\n7. INTELLECTUAL PROPERTY\nAll Make Body content, designs, and code are owned by the operator.\n\n8. LIMITATION OF LIABILITY\nTo the maximum extent permitted by law, Make Body is not liable for damages arising from app use.\n\n9. GOVERNING LAW\nJapanese law applies. EU users retain mandatory consumer protection rights.\n\n10. CONTACT\n" + CONTACT_EMAIL },

    ja: { title:"利用規約", body:"最終更新：2026年6月\n\n1. 同意\nMake Bodyをご利用いただくことで、本規約に同意したものとみなします。\n\n2. サービスの説明\n本アプリはAIを活用したフィットネスコーチング・栄養推奨を提供する情報提供サービスです。医療サービスではありません。\n\n3. 健康・ウェルネス免責事項\n本アプリは医療行為・診断・治療・心理療法を提供するものではありません。AIコーチが提供する情報はユーザーが入力した情報をもとにした一般的なライフスタイル・習慣改善の提案です。カロリー・BMI等の数値は参考値です。健康上の懸念がある方は、新しいプログラムを始める前に医療専門家にご相談ください。\n\n4. AI生成コンテンツ\n本アプリに含まれる一部イラスト・図解はAI画像生成技術を利用して制作されています。画像に登場する人物は実在人物を意図したものではありません。本アプリはAnthropicのClaude APIを使用しています。\n\n5. サブスクリプション・料金\n- 無料プラン：1日のAIチャット回数に制限あり\n- お試しプラン：$1.99（単発決済）。7日間または50回（いずれか早い方）有効。終了後の自動課金なし。自動的に無料プランへ戻ります。\n- PRO 月額：$8.99/月\n- PRO 年額：$79.99/年（約26%お得）\n- Stripeカスタマーポータルからいつでもキャンセル可能\n- キャンセルは現在の請求期間終了後に有効\n- 日割り返金なし\n- 現地税が適用される場合があります\n\n6. AI利用回数制限\n- 無料プラン：UTC日付ごとに1日3回（登録から24時間以内は10回）\n- PROプラン：UTCカレンダー月ごとに300回\n- 月間利用回数はUTC（協定世界時）基準で集計されます。端末の時刻設定に関わらず、サーバー側でUTCを基準に管理されます。\n- 回数のリセットはUTC 00:00（日次・月次）に行われます。\n\n6. 未成年者\n18歳未満の方がPROを利用する場合、保護者の同意が必要です。\n\n7. 知的財産\nMake Bodyの全コンテンツ・デザイン・コードは運営者に帰属します。\n\n8. 責任の制限\n適用法の許容する最大限において、運営者はアプリ利用に起因する損害について責任を負いません。\n\n9. 準拠法\n本規約は日本法を準拠法とします。EU居住ユーザーには強行規定の消費者保護法も適用されます。\n\n10. お問い合わせ\n" + CONTACT_EMAIL },

    ko: { title:"이용약관", body:"최종 업데이트：2026년 6월\n\nMake Body 이용 시 본 약관에 동의한 것으로 간주됩니다. 본 앱은 의료 서비스가 아닙니다. AI 코치의 정보는 참고용 일반 제안입니다. PRO 월간 $8.99, 연간 $79.99. 언제든지 Stripe 포털에서 취소 가능.\n\n문의：" + CONTACT_EMAIL },

    zh: { title:"服务条款", body:"最后更新：2026年6月\n\n使用Make Body即表示您同意本条款。本应用提供AI健身和营养建议，仅供参考，不构成医疗建议。PRO月付$8.99，年付$79.99。随时可通过Stripe门户取消。\n\n联系：" + CONTACT_EMAIL },

    de: { title: "Nutzungsbedingungen", body: "Letzte Aktualisierung: Juni 2026\\n\\nKein medizinischer Dienst. KI-Inhalte sind Referenzinformationen. Automatische Verlängerung - bis Vortag kündigen.\\nKontakt: makebody999@gmail.com" },
    fr: { title: "Conditions utilisation", body: "Mise a jour: juin 2026\\n\\nPas un service medical. Contenu IA indicatif. Renouvellement automatique - annuler avant.\\nContact: makebody999@gmail.com" },
    es: { title: "Terminos de servicio", body: "Actualizacion: junio 2026\\n\\nNo es un servicio medico. Contenido IA referencial. Renovacion automatica - cancelar antes.\\nContacto: makebody999@gmail.com" },
  },
    de: { title: "Datenschutzerklärung", body: "Letzte Aktualisierung: Juni 2026\n\nDaten: E-Mail, Nickname, Körperdaten, KI-Chat. Verwendung: personalisiertes Coaching. Kein Drittverkauf.\nDienste: Supabase, Externer KI-Dienst, Stripe.\nLöschung: makebody999@gmail.com" },
    fr: { title: "Politique de confidentialité", body: "Mise à jour: juin 2026\n\nDonnées: email, pseudo, données corporelles, chat IA. Utilisation: coaching personnalisé. Pas de vente à des tiers.\nServices: Supabase, Service IA externe, Stripe.\nSuppression: makebody999@gmail.com" },
    es: { title: "Política de privacidad", body: "Actualización: junio 2026\n\nDatos: email, apodo, datos corporales, chat IA. Uso: coaching personalizado. No se venden a terceros.\nServicios: Supabase, Servicio IA externo, Stripe.\nEliminación: makebody999@gmail.com" },

  sct: {
    en: { title:"Commercial Transactions (JP)", body:"Disclosure required under Japan's Act on Specified Commercial Transactions.\n\nSeller: Individual entrepreneur (Trade name: Make Body)\nAddress: Disclosed promptly upon request\nContact: " + CONTACT_EMAIL + `

Pricing
- PRO Monthly: $8.99/month (tax included)
- PRO Annual: $79.99/year (tax included)

Payment: Credit card via Stripe
Service provision: Immediately upon payment
Cancellation: At any time via Stripe portal. Effective from next renewal date. No refunds for partial periods.` },

    ja: { title:"特定商取引法に基づく表記", body:"特定商取引法に基づく表記事項です。\n\n販売者：個人事業主（商号：Make Body）\n住所：請求により遅滞なく開示\n連絡先：" + CONTACT_EMAIL + `

価格
- お試しプラン：$1.99（単発決済・7日間または50回・終了後の自動課金なし）
- PRO 月額：$8.99/月（税込）
- PRO 年額：$79.99/年（税込）

支払方法：Stripeによるクレジットカード決済
役務の提供時期：決済完了後、即時提供
キャンセル：Stripeカスタマーポータルよりいつでも可能。次回更新日より有効。日割り返金不可。` },

    ko: { title:"특정상거래법 기재사항", body:"일본 특정상거래법에 따른 표기입니다.\n\n판매자：개인사업자（상호：Make Body）\n주소：요청 시 지체 없이 공개\n연락처：" + CONTACT_EMAIL + `

가격
- PRO 월간：$8.99/월（세금 포함）
- PRO 연간：$79.99/년（세금 포함）

결제 방법：Stripe 신용카드
서비스 제공：결제 완료 후 즉시
취소：Stripe 포털에서 언제든지 가능. 다음 갱신일부터 유효. 일할 환불 없음.` },

    zh: { title:"商业交易信息（日本）", body:"依据日本特定商交易法的披露信息。\n\n销售方：个人经营者（商号：Make Body）\n地址：应要求立即披露\n联系：" + CONTACT_EMAIL + `

价格：PRO月付$8.99，年付$79.99（含税）
付款：通过Stripe信用卡
服务提供：付款完成后立即提供
取消：随时可通过Stripe门户取消。从下一个续费日起生效。不退还部分期间费用。` },

    de: { title: "Pflichtangaben", body: "Preis: $8.99/Monat oder $79.99/Jahr\\nZahlung: Stripe, sofort\\nAutomatische Verlangerung: bis Vortagkundigen\\nKein Ruckerstattung nach Kauf.\\nKontakt: makebody999@gmail.com" },
    fr: { title: "Mentions legales", body: "Prix: $8.99/mois ou $79.99/an\\nPaiement: Stripe, immediat\\nRenouvellement automatique: annuler avant\\nAucun remboursement apres achat.\\nContact: makebody999@gmail.com" },
    es: { title: "Avisos legales", body: "Precio: $8.99/mes o $79.99/anno\\nPago: Stripe, inmediato\\nRenovacion automatica: cancelar antes\\nSin reembolso tras compra.\\nContacto: makebody999@gmail.com" },
  },

  refund: {
    ja: { title: "返金ポリシー", body: `本サービスはデジタルコンテンツのため、原則として返金はお受けできません。
ただし、以下の場合に限り、返金対応を行う場合があります。

・重複請求が発生した場合
・決済エラーにより料金が誤って請求された場合
・技術的な問題によりサービスをご利用いただけない状態が継続した場合

上記に該当する場合は、下記連絡先までお問い合わせください。
お問い合わせ：` + CONTACT_EMAIL },

    en: { title: "Refund Policy", body: `Due to the digital nature of this service, all purchases are final and non-refundable.

Exceptions may apply only in the following cases:
- Duplicate charges
- Billing errors resulting in incorrect charges
- Technical failures preventing access to the service

If you believe your case qualifies, please contact us at:
` + CONTACT_EMAIL },

    ko: { title: "환불 정책", body: `본 서비스는 디지털 콘텐츠이므로 원칙적으로 환불은 불가합니다.
단, 아래 경우에 한하여 환불 대응을 할 수 있습니다.

・중복 결제가 발생한 경우
・결제 오류로 잘못 청구된 경우
・기술적 문제로 서비스 이용이 불가한 경우

해당되는 경우 아래로 문의해 주세요.
문의: ` + CONTACT_EMAIL },

    zh: { title: "退款政策", body: `由于本服务属于数字内容，原则上不予退款。
仅在以下情况下可能受理退款申请：

・发生重复扣款
・因支付错误导致错误收费
・因技术故障无法使用服务

如符合上述情况，请联系我们：
` + CONTACT_EMAIL },

    de: { title: "Rückerstattungsrichtlinie", body: `Da es sich um digitale Inhalte handelt, sind alle Käufe grundsätzlich nicht erstattungsfähig. Ausnahmen gelten nur bei Doppelabrechnung, Zahlungsfehlern oder technischen Ausfällen. Kontakt: ` + CONTACT_EMAIL },

    fr: { title: "Politique de remboursement", body: `En raison de la nature numérique du service, tous les achats sont non remboursables. Des exceptions s'appliquent uniquement en cas de double facturation, d'erreur de paiement ou de panne technique. Contact : ` + CONTACT_EMAIL },

    es: { title: "Política de reembolso", body: `Debido a la naturaleza digital del servicio, todas las compras son no reembolsables. Las excepciones se aplican solo en casos de cargos duplicados, errores de facturación o fallos técnicos. Contacto: ` + CONTACT_EMAIL },
  },
};


// Coach pace config (sec/rep): [set1-2, set3+]
const COACH_PACE = {
  bro:     [3.5, 4.5],
  drill:   [3.0, 4.0],
  kpop:    [4.0, 5.0],
  science: [4.5, 5.5],
  sister:  [5.0, 6.0],
  gyaru:   [5.0, 6.5],
};

function playCdBeep(num) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (num === 0) {
      [523,659,784].forEach((freq,i) => {
        const o=ctx.createOscillator(),g=ctx.createGain();
        o.connect(g);g.connect(ctx.destination);o.frequency.value=freq;
        const t=ctx.currentTime+i*0.12;
        g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.4,t+0.02);
        g.gain.exponentialRampToValueAtTime(0.001,t+0.5);
        o.start(t);o.stop(t+0.5);
      });
    } else {
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);o.frequency.value=392;
      g.gain.setValueAtTime(0.35,ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.12);
      o.start(ctx.currentTime);o.stop(ctx.currentTime+0.12);
    }
  } catch(e) {}
}

function playRepBeep(isLast=false) {
  try {
    const ctx=new (window.AudioContext||window.webkitAudioContext)();
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.connect(g);g.connect(ctx.destination);
    o.frequency.value=isLast?880:440;
    g.gain.setValueAtTime(0.3,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.15);
    o.start(ctx.currentTime);o.stop(ctx.currentTime+0.15);
  } catch(e) {}
}

function WorkoutCounter({ exercise, sets, reps, lang, coach, profile, onClose }) {
  const CD_START = 5;
  const guide   = getExGuide(exercise, lang, profile?.gender);
  const genderK = profile?.gender === "female" ? "female" : "male";
  const imgSrc  = null; // exerciseImages removed for preview compatibility
  const ar      = calcAdaptiveReps(profile, guide?.key);
  const tS      = ar.sets;
  const tR      = ar.reps;

  const [phase, setPhase]       = useState("ready");
  const [currentSet, setSet]    = useState(1);
  const [cdTimer, setCdTimer]   = useState(CD_START);
  const [restTimer, setRest]    = useState(ar.rest);
  const [repCount, setRepCount] = useState(0);
  const [repPhase, setRepPhase] = useState("down");
  const [cheer, setCheer]       = useState("");

  const repIr  = useRef(null);
  const restIr = useRef(null);
  const cdIr   = useRef(null);

  const CH_JA = {
    start: ["\u3088\u3057\uFF01\u4ECA\u65E5\u3082\u3064\u3051\u306B\u884C\u304F\u305E\uFF01\uD83D\uDCAA","\u6C17\u5408\u3044\u5165\u308C\u3066\u3044\u3051\uFF01\u4ECA\u65E5\u3082\u5168\u529B\u3060\uFF01","\u9650\u754C\u8D85\u3048\u3066\u3044\u304F\u305E\uFF01"],
    mid: ["\u307E\u3060\u3044\u3051\u308B\uFF01\u8AF8\u3081\u3093\u306A\u3088\uFF01","\u3053\u3053\u304B\u3089\u304C\u672C\u756A\u3060\uFF01\u3082\u3046\u5C11\u3057\uFF01","\u304D\u3064\u3044\u3051\u3069\u305D\u3053\u304C\u6210\u9577\u30DD\u30A4\u30F3\u30C8\uFF01"],
    ease: ["\u304D\u3064\u304B\u3063\u305F\u3089\u819D\u3064\u3044\u3066\u3082OK\uFF01\u7D9A\u3051\u308B\u3053\u3068\u304C\u5927\u4E8B\uFF01","\u30D5\u30A9\u30FC\u30E0\u5D29\u308C\u305F\u3089\u819D\u3064\u3051\uFF01\u3051\u304C\u9632\u6B62\u512A\u5148\uFF01"],
    done: ["\u3088\u304F\u3084\u3063\u305F\uFF01\u305D\u306E\u8ABF\u5B50\u3060\uFF01\uD83C\uDF89","\u6700\u9AD8\u3060\uFF01\u4ECA\u65E5\u306E\u52AA\u529B\u306F\u5FC5\u305A\u5831\u308F\u308C\u308B\uFF01","\u5B8C\u74A7\u3060\uFF01\u78BA\u5B9F\u306B\u5F37\u304F\u306A\u3063\u3066\u308B\uFF01"],
  };
  const CH_KO = {
    start: ["\uC790\uAC00\uC790\uFF01\uC624\uB298\uB3C4 \uC804\uB825\uC73C\uB85C\uFF01","\uC624\uB298 \uBAA8\uB2E4 \uBC14\uAFDB\uB2E4\uFF01"],
    mid: ["\uC544\uC9C1 \uD560 \uC218 \uC788\uC5B4\uFF01\uD3EC\uAE30\uD558\uC9C0 \uB9C8\uFF01","\uC774\uC81C\uBD80\uD130\uAC00 \uC9C4\uC9DC\uB2E4\uFF01"],
    ease: ["\uD799\uB4E4\uBA74 \uBB34\uB985 \uC9DA\uC544\uB3C4 OK\uFF01"],
    done: ["\uC798\uD588\uC5B4\uFF01 \uADF8 \uAE30\uC138\uB85C\uFF01\uD83C\uDF89","\uCD5C\uACE0\uC57C\uFF01 \uC624\uB298\uC758 \uB178\uB825\uC740 \uBC18\uB4DC\uC2DC \uBCF4\uC0C1\uBC1B\uC544\uFF01"],
  };
  const CH_EN = {
    start: ["Let's go! Full power today!","You got this! Let's crush it!"],
    mid: ["Keep going! Don't give up!","This is where gains are made!"],
    ease: ["Knees down if needed! Keep moving!","Modify if needed! Consistency is key!"],
    done: ["Great work! Keep it up!","Perfect! You're getting stronger!"],
  };
  const CH = lang==="ja"?CH_JA:lang==="ko"?CH_KO:CH_EN;

  const getPaceMs = set => {
    const p = COACH_PACE[coach?.id] || [4.0, 5.0];
    return (set >= 3 ? p[1] : p[0]) * 1000;
  };

  useEffect(() => { setCheer(rand(CH.start)); }, []);

  useEffect(() => {
    if (phase === "countdown") {
      playCdBeep(cdTimer);
      cdIr.current = setInterval(() => {
        setCdTimer(t => {
          const n = t - 1;
          if (n < 0) { clearInterval(cdIr.current); setRepCount(0); setRepPhase("down"); setPhase("counting"); return CD_START; }
          playCdBeep(n);
          return n;
        });
      }, 1000);
    }
    return () => clearInterval(cdIr.current);
  }, [phase]);

  useEffect(() => {
    if (phase === "counting") {
      const paceMs = getPaceMs(Math.min(currentSet, tS));
      const half = paceMs / 2;
      let step = 0;
      repIr.current = setInterval(() => {
        step = step === 0 ? 1 : 0;
        setRepPhase(step === 1 ? "up" : "down");
        if (step === 0) {
          setRepCount(prev => {
            const next = prev + 1;
            const isLast = next >= tR;
            playRepBeep(isLast);
            if (isLast) {
              clearInterval(repIr.current);
              setTimeout(() => { setCheer(rand(CH.done)); setSet(s=>s+1); setRest(ar.rest); setPhase("rest"); }, 400);
            } else {
              const h=Math.floor(tR/2),l=tR-3;
              if(next===h) setCheer(rand(CH.mid));
              else if(next===l&&l>0) setCheer(rand(CH.ease));
            }
            return next;
          });
        }
      }, half);
    }
    return () => clearInterval(repIr.current);
  }, [phase, currentSet]);

  useEffect(() => {
    if (phase === "rest") {
      restIr.current = setInterval(() => {
        setRest(t => {
          if (t <= 1) {
            clearInterval(restIr.current);
            if (currentSet > tS) { setPhase("done"); }
            else { setCheer(rand(CH.start)); setCdTimer(CD_START); setRepPhase("down"); setPhase("countdown"); }
            return ar.rest;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(restIr.current);
  }, [phase, currentSet]);

  const skipRest = () => {
    clearInterval(restIr.current);
    if (currentSet > tS) { setPhase("done"); }
    else { setCheer(rand(CH.start)); setCdTimer(CD_START); setRepPhase("down"); setPhase("countdown"); }
  };

  const repsDisplay = tR ? tS+"x"+tR : tS+"x"+ar.seconds+"s";
  const repsLabel   = ar.label?.[lang] || ar.label?.en;
  const paceNow     = COACH_PACE[coach?.id] || [4.0,5.0];
  const paceLabel   = (Math.min(currentSet,tS)>=3?paceNow[1]:paceNow[0])+"s/rep";
  const L = {
    start: lang==="ja"?"\u30B9\u30BF\u30FC\u30C8! \uD83D\uDD25":lang==="ko"?"\uC2DC\uC791! \uD83D\uDD25":"START! 🔥",
    ready: lang==="ja"?"\u6E96\u5099\u3057\u3066\uFF01":lang==="ko"?"\uC900\uBE44\uD558\uC138\uC694!":"Get ready!",
    set:   lang==="ja"?"\u30BB\u30C3\u30C8":lang==="ko"?"\uC138\uD2B8":"Set",
    reps:  lang==="ja"?"\u56DE":lang==="ko"?"\uD68C":"reps",
    down:  lang==="ja"?"\u4E0B\u3052\u3066...":lang==="ko"?"\uB0B4\uB9AC\uACE0...":"Lower...",
    up:    lang==="ja"?"\u4E0A\u3052\u3066!":lang==="ko"?"\uC62C\uB9AC\uACE0!":"Push up!",
    rest:  lang==="ja"?"\u4F11\u686C\u4E2D":lang==="ko"?"\uD734\uC2DD \uC911":"Resting",
    sec:   lang==="ja"?"\u79D2":lang==="ko"?"\uCD08":"sec",
    skip:  lang==="ja"?"\u30B9\u30AD\u30C3\u30D7":lang==="ko"?"\uAC74\uB108\uBFB0\uAE30":"Skip",
    done:  lang==="ja"?"\u304A\u75B2\u308C\u69D8!":lang==="ko"?"\uC218\uACE0\uD588\uC5B4\uC694!":"Great work!",
    comp:  lang==="ja"?"\u5B8C\u4E86":lang==="ko"?"\uC644\uB8CC":"Done",
    comped:lang==="ja"?"\u5B8C\u4E86!":lang==="ko"?"\uC644\uB8CC!":"Completed!",
    muscles:lang==="ja"?"🎯 鍛える部位":lang==="ko"?"\uD83C\uDFF9 \uB2E8\uB828\uD558\uB294 \uBD80\uC704":"🎯 Muscles",
    form:  lang==="ja"?"\uD83D\uDCCB \u30D5\u30A9\u30FC\u30E0\u306E\u30DD\u30A4\u30F3\u30C8":lang==="ko"?"\uD83D\uDCCB \uD3FC \uD3EC\uC778\uD2B8":"📋 Form tips",
    eff:   lang==="ja"?"\u2728 \u671F\u5F85\u3067\u304D\u308B\u52B9\u679C":lang==="ko"?"\u2728 \uAE30\uB300 \uD6A8\uACFC":"✨ Expected results",
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto",overflowX:"hidden",padding:"16px 16px 28px",scrollbarWidth:"thin",scrollbarColor:"#22c55e #e5e7eb"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontFamily:"Bebas Neue",fontSize:18,letterSpacing:1,color:C.text}}>{exercise}</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:18}}>{coach?.emoji}</span>
            <span style={{fontSize:10,color:C.muted}}>{coach?.name}</span>
            <button onClick={onClose} style={{width:28,height:28,background:C.dim,border:"none",borderRadius:"50%",color:C.muted,fontSize:12,cursor:"pointer"}}>X</button>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:12}}>
          {Array.from({length:tS}).map((_,i)=>(<div key={i} style={{width:28,height:5,borderRadius:99,background:coach?.color,opacity:i<currentSet-1?0.9:i===currentSet-1?1:0.2,transition:"opacity 0.3s"}}/>))}
        </div>
        {phase==="ready"&&(
          <div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <div style={{flex:2,background:coach?.color+"0f",borderRadius:12,padding:"12px 0",textAlign:"center",border:"1px solid "+coach?.color+"25"}}>
                <div style={{fontFamily:"Bebas Neue",fontSize:32,color:coach?.color,lineHeight:1}}>{repsDisplay}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:3}}>{repsLabel}</div>
              </div>
              <div style={{flex:1,background:"rgba(59,130,246,0.06)",borderRadius:12,padding:"12px 0",textAlign:"center",border:"1px solid rgba(59,130,246,0.2)"}}>
                <div style={{fontFamily:"Bebas Neue",fontSize:22,color:"#3b82f6",lineHeight:1}}>{ar.rest}s</div>
                <div style={{fontSize:10,color:C.muted,marginTop:3}}>{lang==="ja"?"\u4F11\u686C":lang==="ko"?"\uD734\uC2DD":"Rest"}</div>
              </div>
            </div>
            {imgSrc&&(<div style={{borderRadius:12,overflow:"hidden",marginBottom:10}}><img src={imgSrc} alt={exercise} style={{width:"100%",display:"block"}}/></div>)}
            {cheer&&(<div style={{background:"linear-gradient(135deg,"+coach?.color+"20,"+coach?.color+"08)",borderRadius:12,padding:"10px 13px",marginBottom:10,border:"1px solid "+coach?.color+"25"}}><div style={{fontSize:13,color:coach?.color,fontWeight:700}}>{coach?.emoji} {cheer}</div></div>)}
            {guide?.muscles&&(<div style={{marginBottom:10}}><div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:5}}>{L.muscles}</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{guide.muscles.map(m=>(<span key={m} style={{background:coach?.color+"12",border:"1px solid "+coach?.color+"30",borderRadius:99,padding:"3px 10px",fontSize:11,color:coach?.color,fontWeight:600}}>✨ {m}</span>))}</div></div>)}
            {guide?.form&&(<div style={{background:"rgba(124,58,237,0.05)",borderRadius:12,padding:"10px 13px",border:"1px solid rgba(124,58,237,0.15)",marginBottom:8}}><div style={{fontSize:10,color:"#7c3aed",fontWeight:700,marginBottom:6}}>{L.form}</div>{guide.form.map((f,i)=>(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:4}}><span style={{color:"#7c3aed",fontSize:11,flexShrink:0}}>✅</span><span style={{fontSize:11,color:C.text,lineHeight:1.5}}>{f}</span></div>))}</div>)}
            {guide?.effect&&(<div style={{background:"rgba(59,130,246,0.06)",borderRadius:12,padding:"10px 13px",border:"1px solid rgba(59,130,246,0.2)",marginBottom:14}}><div style={{fontSize:10,color:"#3b82f6",fontWeight:700,marginBottom:4}}>{L.eff}</div><div style={{fontSize:11,color:C.text,lineHeight:1.6}}>{guide.effect}</div></div>)}
            <button onClick={()=>{setCdTimer(CD_START);setPhase("countdown");}} style={{width:"100%",background:"linear-gradient(135deg,"+(coach?.color||C.green)+","+(coach?.color||C.green)+"cc)",border:"none",borderRadius:14,padding:"15px 0",color:"#fff",fontFamily:"Bebas Neue",fontSize:22,letterSpacing:3,cursor:"pointer",boxShadow:"0 4px 20px "+(coach?.color||C.green)+"40"}}>{L.start}</button>
          </div>
        )}
        {phase==="countdown"&&(
          <div style={{textAlign:"center",padding:"50px 0"}}>
            <div style={{fontFamily:"Bebas Neue",fontSize:110,color:coach?.color,lineHeight:1}}>{cdTimer===0?"GO!":cdTimer}</div>
            <div style={{fontSize:14,color:C.muted,marginTop:10}}>{L.ready}</div>
          </div>
        )}
        {phase==="counting"&&(
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:13,color:C.muted,marginBottom:4}}>{L.set} {Math.min(currentSet,tS)}/{tS}</div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:26,color:repPhase==="up"?coach?.color:C.dim,transition:"color 0.2s"}}>↑</span>
              <div style={{fontFamily:"Bebas Neue",fontSize:96,color:C.green,lineHeight:1,transition:"transform 0.2s",transform:repPhase==="down"?"translateY(6px)":"translateY(-6px)"}}>{repCount}</div>
              <span style={{fontSize:26,color:repPhase==="down"?coach?.color:C.dim,transition:"color 0.2s"}}>↓</span>
            </div>
            <div style={{fontSize:13,color:C.muted,marginBottom:4}}>/ {tR} {L.reps}</div>
            <div style={{fontSize:11,color:C.muted,marginBottom:10}}>{repPhase==="down"?"↓ "+L.down:"↑ "+L.up}<span style={{marginLeft:8,color:coach?.color,fontWeight:600}}>{paceLabel}</span></div>
            <div style={{background:C.dim,borderRadius:99,height:7,marginBottom:12,overflow:"hidden"}}><div style={{background:"linear-gradient(90deg,"+C.green+",#16a34a)",height:"100%",borderRadius:99,width:(repCount/tR*100)+"%",transition:"width 0.3s ease"}}/></div>
            {cheer&&(<div style={{background:"linear-gradient(135deg,"+coach?.color+"20,"+coach?.color+"08)",borderRadius:12,padding:"10px 13px",border:"1px solid "+coach?.color+"25"}}><div style={{fontSize:13,color:coach?.color,fontWeight:700}}>{coach?.emoji} {cheer}</div></div>)}
          </div>
        )}
        {phase==="rest"&&(
          <div style={{textAlign:"center",padding:"30px 0"}}>
            <div style={{fontSize:13,color:C.muted,marginBottom:8}}>{L.rest}</div>
            <div style={{fontFamily:"Bebas Neue",fontSize:72,color:"#3b82f6",lineHeight:1}}>{restTimer}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:6,marginBottom:14}}>{L.sec}</div>
            {cheer&&(<div style={{background:"linear-gradient(135deg,"+coach?.color+"20,"+coach?.color+"08)",borderRadius:12,padding:"10px 13px",marginBottom:18,border:"1px solid "+coach?.color+"25"}}><div style={{fontSize:13,color:coach?.color,fontWeight:700}}>{coach?.emoji} {cheer}</div></div>)}
            <button onClick={skipRest} style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:10,padding:"10px 24px",color:"#3b82f6",fontSize:12,fontWeight:600,cursor:"pointer"}}>{L.skip}</button>
          </div>
        )}
        {phase==="done"&&(
          <div style={{textAlign:"center",padding:"30px 0"}}>
            <div style={{fontSize:42,marginBottom:8}}>🎉</div>
            <div style={{fontFamily:"Bebas Neue",fontSize:28,color:C.green,marginBottom:8}}>{L.done}</div>
            {cheer&&(<div style={{background:"linear-gradient(135deg,"+coach?.color+"20,"+coach?.color+"08)",borderRadius:12,padding:"10px 13px",marginBottom:16,border:"1px solid "+coach?.color+"25"}}><div style={{fontSize:13,color:coach?.color,fontWeight:700}}>{coach?.emoji} {cheer}</div></div>)}
            <div style={{fontSize:12,color:C.muted,marginBottom:22}}>{tS} sets x {tR} {L.reps} {L.comped}</div>
            <button onClick={onClose} style={{background:C.green,border:"none",borderRadius:14,padding:"14px 40px",color:"#fff",fontFamily:"Bebas Neue",fontSize:18,letterSpacing:2,cursor:"pointer"}}>{L.comp}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Ring({ val, size=44, stroke=4, color=C.green }) {
  const r = (size - stroke) / 2;
  const c2 = 2 * Math.PI * r;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.dim} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c2} strokeDashoffset={c2*(1-val/100)}
          strokeLinecap="round" transform={"rotate(-90 "+size/2+" "+size/2+")"}
          style={{transition:"stroke-dashoffset .4s"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size/4,fontWeight:700,color}}>{val}%</div>
    </div>
  );
}


function CancellationFeedbackModal({ lang, isPro, userId, profile, mode, onClose, onProceed }) {
  // mode: "cancel"=PRO解約, "withdraw"=退会
  const [selected, setSelected] = useState([]);
  const [comment,  setComment]  = useState("");
  const [sending,  setSending]  = useState(false);

  const lbl = (ja,ko,en) => lang==="ja"?ja:lang==="ko"?ko:en;

  const CANCEL_REASONS = [
    { id:"price",      label: lbl("料金が高い","가격이 비싸다","Price is too high") },
    { id:"time",       label: lbl("使う時間がなかった","사용할 시간이 없었다","Didn't have time") },
    { id:"ai",         label: lbl("AIコーチが期待と違った","AI 코치가 기대와 달랐다","AI coach wasn't what I expected") },
    { id:"memory",     label: lbl("自分のことを覚えてくれている感じがしなかった","나를 기억해주는 느낌이 없었다","Didn't feel like the coach remembered me") },
    { id:"meal",       label: lbl("食事アドバイスが合わなかった","식사 어드바이스가 맞지 않았다","Meal advice didn't fit me") },
    { id:"training",   label: lbl("トレーニングメニューが合わなかった","트레이닝 메뉴가 맞지 않았다","Training plan didn't fit me") },
    { id:"goal",       label: lbl("目標を達成した","목표를 달성했다","I achieved my goal 🎉") },
    { id:"other_app",  label: lbl("他サービスへ移行する","다른 서비스로 이동","Switching to another service") },
    { id:"other",      label: lbl("その他","기타","Other") },
  ];

  const WITHDRAW_REASONS = [
    { id:"price",      label: lbl("料金が高い","가격이 비싸다","Price is too high") },
    { id:"hard",       label: lbl("使い方がわかりにくい","사용 방법이 어렵다","Hard to use") },
    { id:"ai",         label: lbl("AIコーチの回答が期待と違った","AI 코치 답변이 기대와 달랐다","AI coach wasn't what I expected") },
    { id:"meal",       label: lbl("食事アドバイスが合わなかった","식사 어드바이스가 맞지 않았다","Meal advice didn't fit me") },
    { id:"training",   label: lbl("トレーニングメニューが合わなかった","트레이닝 메뉴가 맞지 않았다","Training plan didn't fit me") },
    { id:"motivation", label: lbl("継続するモチベーションが保てなかった","동기 유지가 어려웠다","Couldn't stay motivated") },
    { id:"time",       label: lbl("使う時間がなかった","사용할 시간이 없었다","Didn't have time to use it") },
    { id:"free",       label: lbl("無料機能で十分だった","무료 기능으로 충분했다","Free features were enough") },
    { id:"other_app",  label: lbl("他のアプリを使う","다른 앱을 사용한다","Switching to another app") },
    { id:"goal",       label: lbl("目標を達成した","목표를 달성했다","I achieved my goal 🎉") },
    { id:"other",      label: lbl("その他","기타","Other") },
  ];

  const REASONS = mode === "cancel" ? CANCEL_REASONS : WITHDRAW_REASONS;

  function toggle(id) {
    setSelected(a => a.includes(id) ? a.filter(x=>x!==id) : [...a, id]);
  }

  async function handleSend(skip) {
    setSending(true);
    if (!skip && selected.length > 0) {
      try {
        await fetch("/api/cancellation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(userId ? { "x-user-id": userId } : {}),
          },
          body: JSON.stringify({
            reasons:          selected,
            comment:          comment.slice(0, 1000),
            isPro,
            lang,
            mode:             mode,          // "cancel" | "withdraw"
            // 分析用の追加データ
            email:            profile?.email    || null,
            nickname:         profile?.nickname || null,
            fitnessLevel:     profile?.fitnessLevel || null,
            daysPerWeek:      profile?.daysPerWeek  || null,
            bodyGoalId:       profile?.bodyGoal?.id || null,
            coachId:          profile?.coachId  || null,
          }),
        });
      } catch(e) {
        // 送信失敗でも解約へ進む
        console.warn("feedback send failed", e);
      }
    }
    setSending(false);
    onProceed();
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",padding:"20px 20px 40px"}}>

        {/* ヘッダー */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontFamily:"Bebas Neue",fontSize:18,letterSpacing:1,color:C.text}}>
              {mode==="cancel"
                ? lbl("PRO解約の前に","PRO 해지 전에","Before cancelling PRO")
                : lbl("退会の前に","탈퇴 전에","Before you leave")}
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>
              {lbl("理由を教えてもらえると改善に役立てます（任意）","이유를 알려주시면 개선에 도움이 됩니다（선택）","Your feedback helps us improve (optional)")}
            </div>
          </div>
          <button onClick={onClose} style={{background:C.dim,border:"none",borderRadius:"50%",width:28,height:28,color:C.muted,fontSize:12,cursor:"pointer",flexShrink:0}}>✕</button>
        </div>

        {/* 理由選択 */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:8}}>
            {lbl("やめる理由（複数選択可）","그만두는 이유（복수 선택 가능）","Reason for leaving (select all that apply)")}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {REASONS.map(r=>(
              <button key={r.id} onClick={()=>toggle(r.id)} style={{
                display:"flex",alignItems:"center",gap:10,
                padding:"10px 12px",borderRadius:10,
                border:"1.5px solid "+(selected.includes(r.id)?C.green:C.border),
                background:selected.includes(r.id)?C.greenGlow:"transparent",
                cursor:"pointer",textAlign:"left",
              }}>
                <div style={{
                  width:16,height:16,borderRadius:4,flexShrink:0,
                  border:"2px solid "+(selected.includes(r.id)?C.green:C.border),
                  background:selected.includes(r.id)?C.green:"transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  {selected.includes(r.id)&&<span style={{color:"#fff",fontSize:9,lineHeight:1}}>✓</span>}
                </div>
                <span style={{fontSize:12,color:C.text}}>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 自由記述 */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:6}}>
            {lbl("改善してほしいことがあれば教えてください","개선해 주셨으면 하는 점이 있으면 알려주세요","Anything you'd like us to improve?")}
            <span style={{color:C.muted,fontWeight:400,marginLeft:4}}>
              {lbl("（任意・最大1000文字）","（선택·최대 1000자）","(optional · max 1000 chars)")}
            </span>
          </div>
          <textarea
            value={comment}
            onChange={e=>setComment(e.target.value.slice(0,1000))}
            placeholder={lbl("自由に記入してください...","자유롭게 입력해주세요...","Feel free to write anything...")}
            rows={3}
            style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:12,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}}
          />
          <div style={{textAlign:"right",fontSize:10,color:C.muted,marginTop:2}}>{comment.length}/1000</div>
        </div>

        {/* CTAボタン */}
        <button
          onClick={()=>handleSend(false)}
          disabled={sending || selected.length===0}
          style={{width:"100%",background:selected.length>0?"#ef4444":"#9ca3af",border:"none",borderRadius:12,padding:"13px 0",color:"#fff",fontSize:14,fontWeight:700,cursor:selected.length>0?"pointer":"not-allowed",marginBottom:8,transition:"background 0.15s"}}
        >
          {sending?"...":(mode==="cancel"
            ? lbl("送信してStripe Portalへ進む →","전송하고 Stripe Portal로 이동 →","Submit & go to Stripe Portal →")
            : lbl("送信して退会手続きへ進む →","전송하고 탈퇴 절차로 이동 →","Submit & proceed to delete →"))}
        </button>
        <button
          onClick={()=>handleSend(true)}
          disabled={sending}
          style={{width:"100%",background:"none",border:"1px solid "+C.border,borderRadius:12,padding:"11px 0",color:C.muted,fontSize:13,cursor:"pointer"}}
        >
          {mode==="cancel"
            ? lbl("スキップしてStripe Portalへ進む","건너뛰고 Stripe Portal로 이동","Skip & go to Stripe Portal")
            : lbl("スキップして退会手続きへ進む","건너뛰고 탈퇴 절차로 이동","Skip & proceed to delete")}
        </button>
        <div style={{textAlign:"center",fontSize:10,color:C.muted,marginTop:10}}>
          {mode==="cancel"
            ? lbl("解約は必ずできます。フィードバックは任意です。","해지는 반드시 할 수 있습니다. 피드백은 선택입니다.","Cancellation is always available. Feedback is optional.")
            : lbl("退会は必ずできます。フィードバックは任意です。","탈퇴는 반드시 할 수 있습니다. 피드백은 선택입니다.","Account deletion is always available. Feedback is optional.")}
        </div>
      </div>
    </div>
  );
}

function TrialProgressBanner({ cl, lang, coach, profile, onUpgrade }) {
  const [dismissed, setDismissed] = useState(false);
  const lbl = (ja,ko,en) => lang==="ja"?ja:lang==="ko"?ko:en;
  if ((!cl.isTrial && !cl.trialExpired) || dismissed) return null;

  const rem  = cl.trialExpired ? 0 : (cl.trialRemaining ?? 0);
  const used = cl.trialUsed ?? 0;
  const pct  = Math.min(100, Math.round((used / 50) * 100));

  const coachMsg = () => {
    const n = profile?.nickname || "";
    const id = coach?.id || "sister";
    if (rem > 20) return null;
    const msgs = {
      bro: {
        low20: lbl("残り"+rem+"回だ。ここからが本番だぞ。","남은 "+rem+"회야. 여기서부터가 진짜야.",n+" — "+rem+" left. This is where it gets real."),
        low10: lbl("あと"+rem+"回。ここで止まるのはもったいない。体が変わり始めるのはこれからだ。",rem+"회 남았어. 여기서 멈추면 아까워.",rem+" left. Don't stop here — the change is just starting."),
        low3:  lbl("残り3回だ。最後まで使い切れ。","3회 남았어. 끝까지 써버려.","3 left. Use every last one."),
        zero:  lbl("50回使い切ったな。本気になったらPROで続けよう。","50회 다 썼네. 진심이라면 PRO로 계속하자.","Used all 50. If you're serious, let's keep going with PRO."),
      },
      sister: {
        low20: lbl("残り"+rem+"回だよ。ここまで続けられたのすごいよ。","남은 "+rem+"회야. 여기까지 이어온 거 대단해.","You've come so far — "+rem+" left."),
        low10: lbl("あと"+rem+"回。無理せず、続けたいと思ったらPROで一緒にやろうね。",rem+"회 남아. 무리하지 말고, 계속하고 싶으면 PRO로 같이 하자.",rem+" left. No pressure — if you want to keep going, PRO is here."),
        low3:  lbl("残り3回。ここまでよく頑張ったよ。続けたい気持ちがあれば、声かけてね。","3회 남아. 여기까지 정말 잘 했어.","3 left. You've done great — let me know if you want to continue."),
        zero:  lbl("トライアル終わったね。続けてくれたら嬉しいな。","트라이얼 끝났네. 계속해주면 기뻐.","Trial ended. I'd love to keep going with you."),
      },
      science: {
        low20: lbl("残り"+rem+"回。現在の相談履歴から提案精度は向上中です。継続するほど最適化されます。",rem+"회 남음. 현재 상담 기록으로 제안 정확도가 향상 중입니다.","Proposal accuracy improving with each session. "+rem+" left — the longer you continue, the better."),
        low10: lbl("あと"+rem+"回で蓄積データの活用フェーズが最大化されます。継続が最も効率的な選択です。",rem+"회 후 축적 데이터 최대 활용 단계에 진입합니다.",rem+" more until full data optimization. Continuing is the most efficient path."),
        low3:  lbl("残り3回。ここまでの"+used+"回のデータがPROで継続活用できます（推定）。","3회 남음. 지금까지 "+used+"회 데이터를 PRO에서 계속 활용할 수 있습니다.","3 left. Your "+used+" sessions of data can continue in PRO."),
        zero:  lbl("50回のデータが蓄積されました。PROで継続することで提案精度をさらに高められます（推定）。","50회 데이터 축적 완료. PRO로 계속하면 정확도를 더 높일 수 있습니다.","50 sessions of data ready. Continue with PRO for even better recommendations."),
      },
    };
    const m = msgs[id] || msgs.sister;
    if (rem === 0)  return m.zero;
    if (rem <= 3)   return m.low3;
    if (rem <= 10)  return m.low10;
    return m.low20;
  };

  const msg = coachMsg();
  if (rem > 20 && used < 5) return null;

  const col = rem === 0 ? "#ef4444" : rem <= 3 ? "#f97316" : rem <= 10 ? "#f59e0b" : "#8b5cf6";
  const rgba = rem === 0 ? "239,68,68" : rem <= 3 ? "249,115,22" : rem <= 10 ? "245,158,11" : "139,92,246";

  return (
    <div style={{background:"rgba("+rgba+",0.07)",border:"1px solid rgba("+rgba+",0.2)",borderRadius:14,padding:"12px 14px",marginBottom:10,position:"relative"}}>
      <button onClick={()=>setDismissed(true)} style={{position:"absolute",top:8,right:8,background:"none",border:"none",color:"#9ca3af",fontSize:12,cursor:"pointer"}}>✕</button>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <div style={{fontSize:10,fontWeight:700,color:col}}>
          {rem === 0 || cl.trialExpired
            ? lbl("トライアル終了","트라이얼 종료","Trial ended")
            : lbl("トライアル残り "+rem+"/50回","트라이얼 남은 "+rem+"/50회","Trial: "+rem+"/50 remaining")}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {!cl.trialExpired && rem > 0 && cl.trialDaysLeft != null && (
            <div style={{fontSize:9,color:cl.trialDaysLeft<=2?"#ef4444":"#9ca3af"}}>
              {lbl("残り"+cl.trialDaysLeft+"日","남은 "+cl.trialDaysLeft+"일",cl.trialDaysLeft+"d left")}
            </div>
          )}
          <div style={{fontSize:9,color:"#9ca3af"}}>{pct}%</div>
        </div>
      </div>
      <div style={{height:4,background:"rgba(0,0,0,0.08)",borderRadius:2,marginBottom:8}}>
        <div style={{height:4,background:col,borderRadius:2,width:pct+"%",transition:"width 0.5s"}}/>
      </div>
      {msg && <div style={{fontSize:11,color:"#374151",lineHeight:1.6,marginBottom:8}}><span style={{marginRight:6}}>{coach?.emoji}</span>{msg}</div>}
      {rem <= 20 && rem > 0 && (
        <div style={{fontSize:10,color:"#6b7280",marginBottom:8,lineHeight:1.5}}>
          {rem <= 10
            ? lbl("もうすぐトライアル終了です。今の記録・コーチの記憶を活かして、PROで継続できます。","트라이얼이 곧 종료됩니다. 지금의 기록과 코치 기억을 살려 PRO로 계속할 수 있습니다.","Trial ending soon. Your records and coach memory can continue in PRO.")
            : lbl("このまま専属コーチを継続しますか？PROなら月300回、あなたの記録を覚えたまま続けられます。","전속 코치를 계속하시겠어요? PRO라면 월 300회, 기록을 기억한 채로 계속됩니다.","Continue with your coach? PRO offers 300 sessions/month with your records intact.")}
        </div>
      )}
      {rem === 0 && (
        <div style={{fontSize:10,color:"#6b7280",marginBottom:8,lineHeight:1.5}}>
          {lbl("このままAIコーチとの伴走を続けるにはPROが必要です。トライアル中の記録・チャット履歴・コーチの記憶は引き継げます。","AI 코치와 계속하려면 PRO가 필요합니다. 트라이얼 중 기록은 이어받을 수 있습니다.","To continue with your AI coach, PRO is required. Your trial records, chat history and coach memory carry over.")}
        </div>
      )}
      <div style={{display:"flex",gap:8}}>
        <button onClick={onUpgrade} style={{flex:2,padding:"8px 0",background:col,border:"none",borderRadius:10,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>
          {rem === 0 ? lbl("PROで続ける →","PRO로 계속하기 →","Continue with PRO →") : lbl("PROで続ける →","PRO로 계속하기 →","Keep going with PRO →")}
        </button>
        <button onClick={()=>setDismissed(true)} style={{flex:1,padding:"8px 0",background:"none",border:"1px solid #e5e7eb",borderRadius:10,color:"#9ca3af",fontSize:10,cursor:"pointer"}}>
          {lbl("あとで","나중에","Later")}
        </button>
      </div>
      <div style={{textAlign:"center",fontSize:9,color:"#9ca3af",marginTop:6}}>
        {lbl("終了後は自動課金されません。PROはご自身で選択した場合のみ開始します。","종료 후 자동 결제 없음. PRO는 직접 선택한 경우에만 시작됩니다.","No automatic charges after trial. PRO starts only if you choose.")}
      </div>
    </div>
  );
}


// ── TrialEndPaywall ──────────────────────────────────────────────
function TrialEndPaywall({ lang, cl, coach, profile, onUpgrade, onFree, onClose }) {
  const [showCompare, setShowCompare] = useState(false);
  const lbl = (ja,ko,en) => lang==="ja"?ja:lang==="ko"?ko:en;
  const name = profile?.nickname || "";

  // 終了理由テキスト
  const endReason = cl.trialExpiredBy50
    ? lbl("50回の体験期間が終了しました","50회 체험이 종료되었습니다","Your 50-session trial has ended")
    : lbl("7日間の体験期間が終了しました","7일 체험 기간이 종료되었습니다","Your 7-day trial has ended");

  if (showCompare) {
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:600,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget){setShowCompare(false);}}}>
        <div style={{background:C.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,padding:"20px 20px 40px",maxHeight:"85vh",overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontFamily:"Bebas Neue",fontSize:18,letterSpacing:1,color:C.text}}>
              {lbl("プラン比較","플랜 비교","Plan Comparison")}
            </div>
            <button onClick={()=>setShowCompare(false)} style={{background:C.dim,border:"none",borderRadius:"50%",width:28,height:28,color:C.muted,fontSize:12,cursor:"pointer"}}>✕</button>
          </div>
          {/* 比較テーブル */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
            {/* FREE列 */}
            <div style={{background:C.card,borderRadius:14,padding:"14px 12px",border:"1px solid "+C.border}}>
              <div style={{fontFamily:"Bebas Neue",fontSize:16,color:C.muted,marginBottom:10}}>FREE</div>
              {[
                lbl("1日3回 AIチャット","하루 3회 AI 채팅","3 AI chats/day"),
                lbl("基本的な記録機能","기본 기록 기능","Basic logging"),
                lbl("今日の栄養確認","오늘의 영양 확인","Today's nutrition"),
              ].map((f,i)=>(
                <div key={i} style={{display:"flex",gap:6,marginBottom:6,alignItems:"flex-start"}}>
                  <span style={{color:C.muted,fontSize:11,flexShrink:0,marginTop:1}}>○</span>
                  <span style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{f}</span>
                </div>
              ))}
              {[
                lbl("コーチの記憶継続","코치 기억 유지","Coach memory"),
                lbl("未来体型予測","미래 체형 예측","Body prediction"),
                lbl("食事・トレーニング最適化","식사·트레이닝 최적화","Optimization"),
              ].map((f,i)=>(
                <div key={i} style={{display:"flex",gap:6,marginBottom:6,alignItems:"flex-start"}}>
                  <span style={{color:"#d1d5db",fontSize:11,flexShrink:0,marginTop:1}}>—</span>
                  <span style={{fontSize:11,color:"#d1d5db",lineHeight:1.4}}>{f}</span>
                </div>
              ))}
            </div>
            {/* PRO列 */}
            <div style={{background:"linear-gradient(135deg,rgba(34,197,94,0.08),rgba(34,197,94,0.03))",borderRadius:14,padding:"14px 12px",border:"2px solid "+C.green}}>
              <div style={{fontFamily:"Bebas Neue",fontSize:16,color:C.green,marginBottom:10}}>PRO</div>
              {[
                lbl("月300回 AIチャット","월 300회 AI 채팅","300 AI chats/month"),
                lbl("コーチの記憶を継続","코치 기억 유지","Coach memory continues"),
                lbl("30/60/90日未来体型予測","30/60/90일 미래 체형 예측","30/60/90-day prediction"),
                lbl("食事・トレーニング最適化","식사·트레이닝 최적화","Meal & training optimization"),
                lbl("体重・体脂肪推移分析","체중·체지방 추이 분석","Body trend analysis"),
                lbl("達成率サポート分析","달성률 지원 분석","Progress support analysis"),
              ].map((f,i)=>(
                <div key={i} style={{display:"flex",gap:6,marginBottom:6,alignItems:"flex-start"}}>
                  <span style={{color:C.green,fontSize:11,flexShrink:0,marginTop:1}}>✓</span>
                  <span style={{fontSize:11,color:C.text,lineHeight:1.4}}>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={onUpgrade} style={{width:"100%",background:"linear-gradient(135deg,#16a34a,#22c55e)",border:"none",borderRadius:14,padding:"14px 0",color:"#fff",fontFamily:"Bebas Neue",fontSize:18,letterSpacing:2,cursor:"pointer",marginBottom:8}}>
            {lbl("PROで続ける →","PRO로 계속하기 →","Continue with PRO →")}
          </button>
          <button onClick={onFree} style={{width:"100%",background:"none",border:"1px solid "+C.border,borderRadius:12,padding:"11px 0",color:C.muted,fontSize:13,cursor:"pointer"}}>
            {lbl("無料プランへ戻る","무료 플랜으로 돌아가기","Return to free plan")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:600,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:C.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,padding:"24px 20px 44px",maxHeight:"90vh",overflowY:"auto"}}>

        {/* アイコン */}
        <div style={{textAlign:"center",marginBottom:6}}>
          <div style={{fontSize:40,marginBottom:4}}>{coach?.emoji||"🏋️"}</div>
          <div style={{fontSize:11,color:C.muted}}>{endReason}</div>
        </div>

        {/* タイトル */}
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontFamily:"Bebas Neue",fontSize:26,letterSpacing:1.5,color:C.text,lineHeight:1.2,marginBottom:12}}>
            {lbl("トライアルが","트라이얼이","Your trial")}
            <br/>
            <span style={{color:"#ef4444"}}>{lbl("終了しました","종료되었습니다","has ended")}</span>
          </div>

          {/* 関係性売りの本文 */}
          <div style={{background:"linear-gradient(135deg,rgba(34,197,94,0.06),rgba(34,197,94,0.02))",border:"1px solid rgba(34,197,94,0.15)",borderRadius:14,padding:"14px 16px",textAlign:"left",marginBottom:16}}>
            <div style={{fontSize:12,color:C.text,lineHeight:1.8}}>
              {lbl(
                "この期間でコーチはあなたの目標・生活リズム・トレーニング傾向・食事の癖を学習しました。",
                "이 기간 동안 코치는 당신의 목표·생활 리듬·트레이닝 경향·식사 습관을 학습했습니다.",
                "During this period, your coach has learned your goals, daily rhythm, training patterns, and eating habits."
              )}
              <br/><br/>
              {lbl(
                "ここから先は、PROでさらにあなた専用の提案を続けられます。",
                "여기서부터는 PRO로 더욱 맞춤형 제안을 이어갈 수 있습니다.",
                "With PRO, even more personalized recommendations are possible from here."
              )}
              <br/><br/>
              <span style={{fontSize:10,color:"#9ca3af"}}>
                {lbl(
                  "なお、トライアル終了後に自動課金は発生しません。",
                  "또한, 트라이얼 종료 후 자동 결제는 발생하지 않습니다.",
                  "No automatic charges occur after the trial ends."
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 3ボタン */}
        <button onClick={onUpgrade}
          style={{width:"100%",background:"linear-gradient(135deg,#16a34a,#22c55e)",border:"none",borderRadius:14,padding:"16px 0",color:"#fff",fontFamily:"Bebas Neue",fontSize:20,letterSpacing:2,cursor:"pointer",marginBottom:8,boxShadow:"0 4px 20px rgba(34,197,94,0.3)"}}>
          {lbl("PROで続ける →","PRO로 계속하기 →","Continue with PRO →")}
        </button>
        <button onClick={onFree}
          style={{width:"100%",background:"none",border:"1px solid "+C.border,borderRadius:12,padding:"12px 0",color:C.muted,fontSize:13,cursor:"pointer",marginBottom:8}}>
          {lbl("無料プランへ戻る","무료 플랜으로 돌아가기","Return to free plan")}
        </button>
        <button onClick={()=>setShowCompare(true)}
          style={{width:"100%",background:"none",border:"none",padding:"8px 0",color:C.green,fontSize:12,cursor:"pointer",textDecoration:"underline"}}>
          {lbl("プラン比較を見る →","플랜 비교 보기 →","Compare plans →")}
        </button>
        <div style={{textAlign:"center",fontSize:9,color:C.muted,marginTop:10}}>
          {lbl("自動課金はありません。PROはユーザーが選択した場合のみ開始します。","자동 결제 없음. PRO는 사용자가 선택한 경우에만 시작됩니다.","No automatic charges. PRO starts only when you choose.")}
        </div>
      </div>
    </div>
  );
}

function UpgradeModal({ lang, onClose, profile, cl, coach, appSettings, sbUser }) {
  const [plan, setPlan] = useState("trial");
  const lbl = (ja,ko,en) => lang==="ja"?ja:lang==="ko"?ko:(en||ja);

  const proFeats = [
    { icon:"🤖", text: lbl("AIコーチ無制限（月300回）","AI 코치 무제한（월 300회）","AI Coach — 300 chats/month") },
    { icon:"🍽️", text: lbl("詳細栄養分析・食事スキャン","상세 영양 분석·식사 스캔","Detailed nutrition analysis & meal scan") },
    { icon:"💪", text: lbl("トレーニング最適化プラン","트레이닝 최적화 플랜","Optimized training plan") },
    { icon:"📈", text: lbl("体重・体脂肪推移分析","체중·체지방 추이 분석","Weight & body fat trend analysis") },
    { icon:"🔮", text: lbl("30/60/90日未来体型予測","30/60/90일 미래 체형 예측","30/60/90-day body prediction") },
    { icon:"🧠", text: lbl("コーチがあなたを覚える（記憶機能）","코치가 나를 기억하는 기능","Coach memory — truly personal") },
    { icon:"🎯", text: lbl("優先サポート対応","우선 지원 대응","Priority support") },
  ];

  const trialFeats = [
    lbl("あなた専用の初週メニュー作成","나만의 첫 주 메뉴 제작","Your personalized first-week plan"),
    lbl("毎日の食事アドバイス","매일 식사 어드바이스","Daily meal advice"),
    lbl("サボった日の復帰プラン","쉰 날 복귀 플랜","Comeback plan for missed days"),
    lbl("30/60/90日未来体型予測","30/60/90일 미래 체형 예측","30/60/90-day body prediction"),
    lbl("AIチャット 最大50回","AI 채팅 최대 50회","Up to 50 AI chats"),
  ];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto",padding:"20px 20px 40px"}}>

        {/* 閉じる */}
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:2}}>
          <button onClick={onClose} style={{background:C.dim,border:"none",borderRadius:"50%",width:28,height:28,color:C.muted,fontSize:12,cursor:"pointer"}}>✕</button>
        </div>

        {/* ヘッドライン */}
        <div style={{textAlign:"center",marginBottom:18}}>
          {cl?.isTrial && (cl?.trialRemaining||0) === 0 ? (
            <>
              <div style={{fontSize:10,color:"#8b5cf6",fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>
                {lbl("トライアル50回を使い切りました","트라이얼 50회를 모두 사용했습니다","You've used all 50 trial sessions")}
              </div>
              <div style={{fontFamily:"Bebas Neue",fontSize:22,letterSpacing:1.5,color:C.text,lineHeight:1.2,marginBottom:8}}>
                {lbl("コーチとの関係を、","코치와의 관계를,","Continue your journey")}
                <br/>
                <span style={{color:C.green}}>{lbl("このまま続けますか？","이대로 계속하시겠어요?","with your coach?")}</span>
              </div>
              <div style={{fontSize:11,color:C.muted,lineHeight:1.7,background:"rgba(139,92,246,0.06)",borderRadius:10,padding:"10px 12px",border:"1px solid rgba(139,92,246,0.15)"}}>
                <div style={{fontWeight:700,color:"#7c3aed",marginBottom:6,fontSize:12}}>
                  {lbl("この7日間でコーチがあなたを学習しました","이 7일 동안 코치가 당신을 학습했습니다","Your coach has been learning about you over these 7 days")}
                </div>
                {lbl(
                  "目標・悩み・食事傾向・トレーニング状況を少しずつ理解してきました。PROで継続すると、ここからさらに提案精度が上がります（推定）。",
                  "목표·고민·식사 경향·트레이닝 상황을 조금씩 이해해 왔습니다. PRO로 계속하면 여기서 더욱 제안 정확도가 높아집니다.",
                  "Goals, habits, and patterns — gradually understood. Continue with PRO, and the recommendations get even better from here."
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{fontSize:10,color:C.green,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>
                {lbl("あなた専用の90日ロードマップを作成しました","나만의 90일 로드맵이 완성됐습니다","Your personal 90-day roadmap is ready")}
              </div>
              <div style={{fontFamily:"Bebas Neue",fontSize:24,letterSpacing:1.5,color:C.text,lineHeight:1.15,marginBottom:6}}>
                {lbl("90日後の理想の体を作る","90일 후 이상적인 몸을 만드는","Build your ideal body in 90 days")}
                <br/>
                <span style={{color:C.green}}>{lbl("AIパーソナルトレーナー","AI 퍼스널 트레이너","AI Personal Trainer")}</span>
              </div>
              <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>
                {lbl(
                  (profile?.nickname||"あなた")+"の体型・生活・食事・継続状況をもとに、毎日やるべきことをAIが調整します。",
                  (profile?.nickname||"당신")+"의 체형·생활·식사·지속 상황을 바탕으로, 매일 AI가 조정합니다.",
                  "Based on your body, lifestyle & consistency — your AI adjusts your plan every day."
                )}
              </div>
            </>
          )}
        </div>

        {/* 今日の自分を変える最初の一歩 */}
        <div style={{background:"linear-gradient(135deg,rgba(34,197,94,0.08),rgba(34,197,94,0.03))",border:"1px solid rgba(34,197,94,0.2)",borderRadius:14,padding:"14px 16px",marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:C.green,marginBottom:10}}>
            {lbl("今日の自分を変える最初の一歩","오늘의 나를 바꾸는 첫 걸음","The first step to changing yourself today")}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {proFeats.map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:14,flexShrink:0}}>{f.icon}</span>
                <span style={{fontSize:11,color:C.text,lineHeight:1.4}}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* プラン選択 */}
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          {[
            {id:"trial",  price:PRICE_TRIAL, label:lbl("7日・50回お試し","7일·50회 체험","7-Day / 50 Sessions"), sub:lbl("自動課金なし","자동 결제 없음","No auto-charge"), badge:lbl("おすすめ","추천","Best")},
            {id:"monthly",price:PRICE_M,     label:lbl("月額","월간","Monthly"),        sub:lbl("いつでも解約","언제든 해지","Cancel anytime")},
            {id:"annual", price:PRICE_Y,     label:lbl("年額","연간","Annual"),         sub:lbl("26%お得","26% 절약","Save 26%")},
          ].map(p=>(
            <button key={p.id} onClick={()=>setPlan(p.id)} style={{flex:1,padding:"10px 4px",borderRadius:12,border:"2px solid "+(plan===p.id?C.green:C.border),background:plan===p.id?C.greenGlow:"transparent",cursor:"pointer",position:"relative",transition:"all 0.15s"}}>
              {p.badge&&<span style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",background:"#f59e0b",color:"#fff",fontSize:8,padding:"1px 6px",borderRadius:99,whiteSpace:"nowrap",fontWeight:700}}>{p.badge}</span>}
              <div style={{fontFamily:"Bebas Neue",fontSize:17,color:plan===p.id?C.green:C.text}}>{p.price}</div>
              <div style={{fontSize:9,color:plan===p.id?C.green:C.muted,fontWeight:600,marginTop:1}}>{p.label}</div>
              <div style={{fontSize:8,color:C.muted,marginTop:1}}>{p.sub}</div>
            </button>
          ))}
        </div>

        {/* 7日間でできること */}
        {plan==="trial" && (
          <div style={{background:C.card,borderRadius:12,padding:"11px 14px",marginBottom:12,border:"1px solid "+C.border}}>
            <div style={{fontSize:10,fontWeight:700,color:C.green,marginBottom:7}}>
              {lbl("7日間でできること","7일 동안 할 수 있는 것","What you get in 7 days")}
            </div>
            {trialFeats.map((f,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:5,alignItems:"center"}}>
                <span style={{color:C.green,fontSize:10}}>✓</span>
                <span style={{fontSize:11,color:C.text}}>{f}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <button onClick={()=>{
            if (plan==="trial" && appSettings && !appSettings.trial_enabled) return;
            if ((plan==="monthly"||plan==="annual") && appSettings && !appSettings.pro_enabled) return;
            const uid   = sbUser?.user?.id || "";
            const email = sbUser?.email || sbUser?.user?.email || "";
            const base  = plan==="trial"?STRIPE_TRIAL:plan==="annual"?STRIPE_ANNUAL:STRIPE_MONTHLY;
            const returnUrl = encodeURIComponent(window.location.origin + window.location.pathname);
            location.href = base + "?client_reference_id=" + uid + "&prefilled_email=" + encodeURIComponent(email) + "&return_url=" + returnUrl;
            onClose();
          }}
          style={{width:"100%",background:(plan==="trial"&&appSettings&&!appSettings.trial_enabled)||(plan!=="trial"&&appSettings&&!appSettings.pro_enabled)?"#9ca3af":"linear-gradient(135deg,#16a34a,#22c55e)",border:"none",borderRadius:14,padding:"16px 0",color:"#fff",fontFamily:"Bebas Neue",fontSize:20,letterSpacing:2,cursor:"pointer",marginBottom:6,boxShadow:"0 4px 20px rgba(34,197,94,0.3)"}}>
          {plan==="trial"
            ? lbl("7日間 "+PRICE_TRIAL+"で試す →","7일 "+PRICE_TRIAL+"로 체험 →","Try 7 Days for "+PRICE_TRIAL+" →")
            : plan==="annual"
            ? lbl("年額で始める →","연간으로 시작 →","Start Annual Plan →")
            : lbl("月額で始める →","월간으로 시작 →","Start Monthly Plan →")}
        </button>

        {/* サブコピー */}
        {/* 機能停止中の表示 */}
        {appSettings && ((plan==="trial" && !appSettings.trial_enabled) || (plan!=="trial" && !appSettings.pro_enabled)) && (
          <div style={{textAlign:"center",fontSize:11,color:"#ef4444",marginBottom:8,padding:"8px 12px",background:"rgba(239,68,68,0.06)",borderRadius:8}}>
            {lang==="ja"?"現在このプランの新規購入を一時停止しています。":lang==="ko"?"현재 이 플랜의 신규 구매를 일시 중단 중입니다.":"New purchases for this plan are temporarily paused."}
          </div>
        )}
        <div style={{textAlign:"center",fontSize:10,color:C.muted,marginBottom:4,lineHeight:1.6}}>
          {plan==="trial"
            ? lbl("7日間または50回までお試し。終了後は自動で無料プランに戻ります。","7일 또는 50회까지 체험. 종료 후 자동으로 무료 플랜으로 돌아갑니다.","7 days or 50 sessions — whichever comes first. No charges after trial ends.")
            : lbl("いつでもキャンセル可能。縛りなし。","언제든지 취소 가능. 구속 없음.","Cancel anytime. No strings attached.")}
        </div>

      </div>
    </div>
  );
}

function SettingsModal({ profile, setProfile, lang, setLang, isPro, onSignOut, onClose, setShowUpgrade, onSave, sbUser }) {
  const [pid, setPid]    = useState(profile?.coachId || "bro");
  const [gid, setGid]    = useState(profile?.bodyGoal?.id || "lean");
  const [wt,  setWt]     = useState(String(profile?.currentWeightKg || ""));
  const [ht,  setHt]     = useState(String(profile?.heightCm || ""));
  const [fl,  setFl]     = useState(profile?.fitnessLevel || "beginner");
  const [eq,  setEq]     = useState(profile?.equipment || "home");
  const [dp,  setDp]     = useState(profile?.daysPerWeek || 3);
  const [gdr, setGdr]    = useState(profile?.gender || "male");
  const [notif, setNotif]   = useState(profile?.notifications ?? true);
  const [legal, setLegal]   = useState(null);
  const [section, setSection] = useState("main"); // main | feedback | data | account
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(null);

  const goals = BODY_GOALS[profile?.gender || "male"];
  const lbl = (ja,ko,en) => lang==="ja"?ja:lang==="ko"?ko:en;

  function save() {
    const g = goals.find(gg=>gg.id===gid) || profile?.bodyGoal;
    const newProfile = { ...profile, coachId:pid, fitnessLevel:fl, equipment:eq, daysPerWeek:dp,
      currentWeightKg:parseFloat(wt)||profile?.currentWeightKg,
      heightCm:parseFloat(ht)||profile?.heightCm,
      bodyGoal:g, notifications:notif, gender:gdr };
    if (onSave) onSave(newProfile);
    else setProfile(newProfile);
    onClose();
  }

  if (legal) {
    const lData = LEGAL[legal]?.[lang] || LEGAL[legal]?.ja || LEGAL[legal]?.en || {};
    return (
      <div style={{position:"fixed",inset:0,background:C.bg,zIndex:400,overflowY:"auto",padding:20}}>
        <button onClick={()=>setLegal(null)} style={{background:C.dim,border:"none",borderRadius:"50%",width:32,height:32,color:C.text,fontSize:14,cursor:"pointer",marginBottom:16}}>←</button>
        <div style={{maxWidth:480,margin:"0 auto"}}>
          <div style={{fontFamily:"Bebas Neue",fontSize:24,letterSpacing:2,color:C.text,marginBottom:16}}>{lData.title}</div>
          <div style={{fontSize:13,color:C.text,lineHeight:1.9,whiteSpace:"pre-line"}}>{lData.body}</div>
        </div>
      </div>
    );
  }

  const SectionHeader = ({title}) => (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
      <button onClick={()=>setSection("main")} style={{background:C.dim,border:"none",borderRadius:"50%",width:28,height:28,color:C.muted,fontSize:12,cursor:"pointer"}}>←</button>
      <div style={{fontFamily:"Bebas Neue",fontSize:18,letterSpacing:1,color:C.text}}>{title}</div>
    </div>
  );

  if (section==="feedback") return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:C.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",padding:"20px 16px 32px"}}>
        <SectionHeader title={lbl("お問い合わせ・ご要望","문의·요청","Contact & Feedback")}/>
        {feedbackSent ? (
          <div style={{textAlign:"center",padding:"30px 0"}}>
            <div style={{fontSize:32,marginBottom:10}}>✅</div>
            <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:6}}>{lbl("送信しました！","전송했습니다！","Sent successfully!")}</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:20}}>{lbl("ご要望を受け付けました。個別返信はできない場合がありますが、改善の参考にします。","요청을 접수했습니다. 개별 답변이 어려울 수 있으나 개선에 참고하겠습니다.","Your feedback has been received. We may not reply individually, but we use it to improve.")}</div>
            <button onClick={()=>{setFeedbackSent(false);setFeedback("");setSection("main");}} style={{background:C.green,border:"none",borderRadius:12,padding:"12px 30px",color:"#fff",fontSize:14,cursor:"pointer"}}>{lbl("閉じる","닫기","Close")}</button>
          </div>
        ) : (
          <div>
            <div style={{fontSize:12,color:C.muted,marginBottom:14}}>
              {lbl("バグ報告・機能要望・ご意見をお聞かせください。個別返信はできませんが、サービス改善に活かします。","버그 보고, 기능 요청, 의견을 알려주세요. 개별 답변은 어렵지만 서비스 개선에 반영합니다.","Share bugs, requests, or feedback. We may not reply individually, but all feedback helps us improve.")}
            </div>
            {/* 種別 */}
            <div style={{fontSize:10,color:C.muted,fontWeight:700,marginBottom:8}}>{lbl("種別","종류","Category")}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
              {[[lbl("バグ報告","버그 보고","Bug report"),"🐛"],[lbl("機能要望","기능 요청","Feature request"),"💡"],[lbl("その他","기타","Other"),"💬"]].map(([t,e])=>(
                <button key={t} style={{padding:"7px 12px",borderRadius:20,border:"1px solid "+C.border,background:C.surface,color:C.muted,fontSize:12,cursor:"pointer"}}>{e} {t}</button>
              ))}
            </div>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,marginBottom:6}}>{lbl("内容","내용","Message")}</div>
            <textarea
              value={feedback}
              onChange={e=>setFeedback(e.target.value)}
              placeholder={lbl("ご意見・ご要望をご記入ください...","의견이나 요청 사항을 입력해주세요...","Please describe your issue or request...")}
              style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:13,lineHeight:1.6,minHeight:100,resize:"vertical",boxSizing:"border-box",marginBottom:14}}
            />
            <div style={{fontSize:10,color:C.muted,marginBottom:16}}>
              {lbl("直接メールでも受け付けています：","직접 이메일로도 연락 가능합니다：","You can also email us directly:")} <span style={{color:C.green}}>{CONTACT_EMAIL}</span>
            </div>
            <button
              onClick={()=>{ if(feedback.trim()) { window.open(`mailto:${CONTACT_EMAIL}?subject=Make Body Feedback&body=${encodeURIComponent(feedback)}`); setFeedbackSent(true); }}}
              disabled={!feedback.trim()}
              style={{width:"100%",background:feedback.trim()?C.green:"#e5e7eb",border:"none",borderRadius:12,padding:"14px 0",color:feedback.trim()?"#fff":"#9ca3af",fontFamily:"Bebas Neue",fontSize:18,letterSpacing:2,cursor:feedback.trim()?"pointer":"default"}}
            >{lbl("送信する","전송하기","Send")}</button>
          </div>
        )}
      </div>
    </div>
  );

  if (section==="data") return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:C.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",padding:"20px 16px 32px"}}>
        <SectionHeader title={lbl("データ管理","데이터 관리","Data Management")}/>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* データエクスポート */}
          <div style={{background:C.card,borderRadius:12,padding:"14px 16px",border:"1px solid "+C.border}}>
            <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:4}}>📤 {lbl("データをエクスポート","데이터 내보내기","Export My Data")}</div>
            <div style={{fontSize:11,color:C.muted,marginBottom:10}}>{lbl("チャット履歴・食事記録・運動記録をJSONでダウンロードします。","채팅 기록, 식사 기록, 운동 기록을 JSON으로 다운로드합니다.","Download your chat, meal, and workout history as JSON.")}</div>
            <button onClick={()=>{
              const data = {
                profile: JSON.parse(lsGet("mb_profile","{}")),
                chat:    lsGet("mb_chat","[]"),
                schedule:lsGet("mb_schedule","[]"),
                meals:   lsGet("mb_meals","{}"),
                weights: lsGet("mb_weight","{}"),
              };
              const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
              const url  = URL.createObjectURL(blob);
              const a    = document.createElement("a");
              a.href=url; a.download="makebody-data.json"; a.click();
              URL.revokeObjectURL(url);
            }} style={{background:C.green,border:"none",borderRadius:10,padding:"10px 0",color:"#fff",fontSize:13,width:"100%",cursor:"pointer",fontWeight:600}}>
              {lbl("ダウンロード","다운로드","Download")}
            </button>
          </div>
          {/* キャッシュ削除 */}
          <div style={{background:C.card,borderRadius:12,padding:"14px 16px",border:"1px solid "+C.border}}>
            <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:4}}>🗑️ {lbl("キャッシュを削除","캐시 삭제","Clear Cache")}</div>
            <div style={{fontSize:11,color:C.muted,marginBottom:10}}>{lbl("端末に保存された一時データを削除します。Supabaseのデータは保持されます。","기기에 저장된 임시 데이터를 삭제합니다. Supabase 데이터는 유지됩니다.","Clear locally cached data. Your Supabase data is preserved.")}</div>
            <button onClick={()=>{
              ["mb_profile","mb_chat","mb_schedule","mb_meals","mb_weight","mb_coach_memory","mb_usage_cache"].forEach(k=>localStorage.removeItem(k));
              alert(lbl("キャッシュを削除しました。再ログインしてください。","캐시를 삭제했습니다. 다시 로그인해주세요.","Cache cleared. Please sign in again."));
            }} style={{background:"#f3f4f6",border:"1px solid "+C.border,borderRadius:10,padding:"10px 0",color:C.text,fontSize:13,width:"100%",cursor:"pointer",fontWeight:600}}>
              {lbl("キャッシュを削除","캐시 삭제","Clear Cache")}
            </button>
          </div>
          {/* データ削除依頼 */}
          <div style={{background:"rgba(239,68,68,0.04)",borderRadius:12,padding:"14px 16px",border:"1px solid rgba(239,68,68,0.15)"}}>
            <div style={{fontWeight:700,fontSize:14,color:"#ef4444",marginBottom:4}}>⚠️ {lbl("アカウントデータの削除依頼","계정 데이터 삭제 요청","Request Data Deletion")}</div>
            <div style={{fontSize:11,color:C.muted,marginBottom:10}}>{lbl("全データの削除はメールにてご連絡ください。30日以内に対応します。","모든 데이터 삭제는 이메일로 연락해주세요. 30일 이내에 처리됩니다.","Contact us by email to delete all your data. Processed within 30 days.")}</div>
            <button onClick={()=>window.open(`mailto:${CONTACT_EMAIL}?subject=Data Deletion Request&body=Please delete all data for my account.`)} style={{background:"none",border:"1px solid rgba(239,68,68,0.4)",borderRadius:10,padding:"10px 0",color:"#ef4444",fontSize:13,width:"100%",cursor:"pointer"}}>
              {lbl("削除依頼メールを送る","삭제 요청 이메일 보내기","Send Deletion Request")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (section==="account") return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:C.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",padding:"20px 16px 32px"}}>
        <SectionHeader title={lbl("アカウント","계정","Account")}/>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* プラン情報 */}
          {/* ── プラン状態表示（FREE/TRIAL/PRO） ── */}
          {(()=>{
            const isTr = profile?.plan_type === "trial" && !isPro;
            const planColor = isPro ? C.pro : isTr ? "#8b5cf6" : C.muted;
            const planBg    = isPro ? C.proBg : isTr ? "rgba(139,92,246,0.06)" : "#f9fafb";
            const planBorder= isPro ? C.pro : isTr ? "rgba(139,92,246,0.25)" : C.border;
            return (
              <div style={{background:planBg,borderRadius:12,padding:"14px 16px",border:"1px solid "+planBorder}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{flex:1}}>
                    {/* プラン名 */}
                    <div style={{fontWeight:700,fontSize:14,color:planColor,marginBottom:3}}>
                      {isPro ? "✓ " + lbl("PROプラン","PRO 플랜","PRO Plan")
                             : isTr ? "🔮 " + lbl("お試し中","체험 중","Trial Active")
                             : lbl("無料プラン","무료 플랜","Free Plan")}
                    </div>
                    {/* プラン詳細 */}
                    {isPro && (
                      <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>
                        {lbl("AI相談：今月残り","AI 상담: 이번 달 남은","AI chats: ")}
                        <span style={{fontWeight:700,color:C.pro}}>{cl?.remaining ?? "—"}</span>
                        {lbl(" 回 / 300回"," 회 / 300회"," / 300")}
                      </div>
                    )}
                    {isTr && (
                      <div style={{fontSize:11,color:"#7c3aed",lineHeight:1.6}}>
                        <div>{lbl("残り","남은","Remaining: ")}
                          <span style={{fontWeight:700}}>{cl?.trialRemaining ?? "—"}</span>
                          {lbl(" 回 / 50回"," 회 / 50회"," / 50 sessions")}
                          {cl?.trialDaysLeft != null && (
                            <span style={{marginLeft:8,color:cl.trialDaysLeft<=2?"#ef4444":"#8b5cf6"}}>
                              · {lbl("残り"+cl.trialDaysLeft+"日","남은 "+cl.trialDaysLeft+"일",cl.trialDaysLeft+"d left")}
                            </span>
                          )}
                        </div>
                        <div style={{fontSize:10,color:"#9ca3af",marginTop:2}}>
                          {lbl("終了後は自動課金されません","종료 후 자동 결제 없음","No auto-charge after trial")}
                        </div>
                      </div>
                    )}
                    {!isPro && !isTr && (
                      <div style={{fontSize:11,color:C.muted}}>
                        {lbl("AI相談：1日3回（初日10回）","AI 상담: 하루 3회（첫날 10회）","3 AI chats/day (10 on first day)")}
                      </div>
                    )}
                  </div>
                  {/* 右側ボタン */}
                  <div style={{flexShrink:0}}>
                    {isPro
                      ? (STRIPE_PORTAL_IS_PLACEHOLDER
                          ? <div style={{fontSize:10,color:C.muted,lineHeight:1.5}}>
                              {lang==="ja"?"現在プラン管理ページを準備中です。解約希望の場合は makebody999@gmail.com までご連絡ください。"
                              :lang==="ko"?"플랜 관리 페이지 준비 중입니다. 해지 희망 시 makebody999@gmail.com 으로 문의해 주세요."
                              :"Plan management coming soon. To cancel, contact makebody999@gmail.com"}
                            </div>
                          : <button onClick={()=>window.open(STRIPE_PORTAL,"_blank")} style={{fontSize:11,color:C.pro,background:"none",border:"1px solid "+C.pro,borderRadius:8,padding:"5px 10px",cursor:"pointer",fontWeight:600}}>
                              {lbl("プランを管理","플랜 관리","Manage Plan")}
                            </button>)
                      : <button onClick={()=>{onClose();setTimeout(()=>setShowUpgrade&&setShowUpgrade(true),100);}} style={{fontSize:11,color:"#fff",background:isTr?"#8b5cf6":C.green,border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontWeight:700}}>
                          {isTr ? lbl("PROへ","PRO로","→ PRO") : lbl("PRO へ","PRO로","→ PRO")}
                        </button>}
                  </div>
                </div>
                {/* Stripe反映待ちメッセージ */}
                {(isPro===false && profile?.plan_type !== "trial") && (
                  <div style={{marginTop:10,fontSize:10,color:C.muted,background:C.surface,borderRadius:8,padding:"6px 10px",lineHeight:1.5}}>
                    {lbl(
                      "PROが反映されない場合は数分後に再読み込みしてください。それでも解決しない場合は makebody999@gmail.com までご連絡ください。",
                      "PRO가 반영되지 않으면 몇 분 후 새로고침해 주세요. 그래도 해결되지 않으면 makebody999@gmail.com 으로 문의해 주세요.",
                      "If PRO isn't showing, refresh in a few minutes. Still not working? Contact makebody999@gmail.com"
                    )}
                  </div>
                )}
              </div>
            );
          })()}
          {/* 通知設定 */}
          <div style={{background:C.card,borderRadius:12,padding:"14px 16px",border:"1px solid "+C.border}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:700,fontSize:14,color:C.text}}>🔔 {lbl("プッシュ通知","푸시 알림","Push Notifications")}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{lbl("トレーニングリマインダー・達成通知","트레이닝 리마인더·달성 알림","Workout reminders & achievements")}</div>
              </div>
              <button onClick={()=>setNotif(n=>!n)} style={{width:44,height:24,borderRadius:12,background:notif?C.green:"#e5e7eb",border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
                <div style={{position:"absolute",top:2,left:notif?22:2,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
              </button>
            </div>
          </div>
          {/* バージョン情報 */}
          <div style={{background:C.card,borderRadius:12,padding:"14px 16px",border:"1px solid "+C.border}}>
            <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:6}}>ℹ️ {lbl("アプリ情報","앱 정보","App Info")}</div>
            {[["Make Body","v1.0.0"],["Build","2026.06"],["AI Model","Claude (Anthropic)"],["Backend","Supabase + Vercel"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",paddingBottom:4,marginBottom:4,borderBottom:"1px solid "+C.dim}}>
                <span style={{fontSize:12,color:C.muted}}>{k}</span>
                <span style={{fontSize:12,color:C.text,fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
          {/* サインアウト */}
          <button onClick={onSignOut} style={{width:"100%",padding:"12px 0",background:"none",border:"1px solid rgba(239,68,68,0.3)",borderRadius:12,color:"#ef4444",fontSize:13,cursor:"pointer",fontWeight:600}}>
            {lbl("サインアウト","로그아웃","Sign Out")}
          </button>
          {/* ── 解約・退会ボタン ── */}
          <div style={{borderTop:"1px solid "+C.border,marginTop:16,paddingTop:14}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:10,lineHeight:1.5}}>
              {lbl(
                "「解約」はPRO課金の停止です。アカウントは残ります。\n「退会」はアカウント削除です。",
                "해지는 PRO 과금 중지입니다. 계정은 유지됩니다.\n탈퇴는 계정 삭제입니다.",
                "Cancel PRO stops billing. Your account remains.\nDelete Account permanently removes your data."
              ).split("\n").map((t,i)=><div key={i}>{t}</div>)}
            </div>
            <div style={{display:"flex",gap:8}}>
              {isPro && (
                <button onClick={()=>setShowCancelConfirm("cancel")}
                  style={{flex:1,padding:"10px 0",background:"none",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,color:"#ef4444",fontSize:11,cursor:"pointer",fontWeight:600}}>
                  {lbl("PROを解約する","PRO 해지하기","Cancel PRO")}
                </button>
              )}
              <button onClick={()=>setShowCancelConfirm("withdraw")}
                style={{flex:1,padding:"10px 0",background:"none",border:"1px solid rgba(156,163,175,0.25)",borderRadius:10,color:C.muted,fontSize:11,cursor:"pointer"}}>
                {lbl("アカウントを退会する","계정 탈퇴하기","Delete Account")}
              </button>
            </div>
          </div>

          {/* ── 解約確認モーダル ── */}
          {showCancelConfirm==="cancel" && (
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
              <div style={{background:C.surface,borderRadius:18,padding:24,maxWidth:360,width:"100%",border:"1px solid "+C.border}}>
                <div style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:10}}>
                  {lbl("PROを解約しますか？","PRO를 해지하시겠습니까?","Cancel your PRO plan?")}
                </div>
                <div style={{fontSize:13,color:C.text,lineHeight:1.7,marginBottom:8}}>
                  {lbl(
                    "解約すると、次回更新日以降は料金が発生しません。",
                    "해지하면 다음 갱신일 이후부터 요금이 발생하지 않습니다.",
                    "You won't be charged after your current billing period ends."
                  )}
                </div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.7,marginBottom:8}}>
                  {lbl(
                    "アカウント・体重記録・食事記録・AIコーチとのチャット履歴・コーチの記憶は保持されます。いつでも再開できます。",
                    "계정·체중 기록·식사 기록·AI 코치 채팅 기록·코치의 기억은 유지됩니다. 언제든지 재개할 수 있습니다.",
                    "Your account, weight logs, meal logs, chat history, and coach memory are all kept. You can restart anytime."
                  )}
                </div>
                <div style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:8,padding:"8px 12px",fontSize:11,color:C.green,marginBottom:16}}>
                  {lbl(
                    "現在の請求期間中はPRO機能を引き続きご利用いただけます。",
                    "현재 청구 기간 중에는 PRO 기능을 계속 이용하실 수 있습니다.",
                    "You can continue using PRO features until your current billing period ends."
                  )}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setShowCancelConfirm(null)}
                    style={{flex:1,padding:"11px 0",background:"none",border:"1px solid "+C.border,borderRadius:10,color:C.muted,fontSize:13,cursor:"pointer"}}>
                    {lbl("キャンセル","취소","Cancel")}
                  </button>
                  <button onClick={()=>{
                    setShowCancelConfirm(null);
                    setCancelFeedbackMode("cancel");
                    setShowCancelFeedback(true);
                  }} style={{flex:1,padding:"11px 0",background:"#ef4444",border:"none",borderRadius:10,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                    {lbl("解約へ進む →","해지로 이동 →","Proceed to cancel →")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── 退会確認モーダル ── */}
          {showCancelConfirm==="withdraw" && (
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
              <div style={{background:C.surface,borderRadius:18,padding:24,maxWidth:360,width:"100%",border:"1px solid "+C.border}}>
                <div style={{fontSize:18,fontWeight:700,color:"#ef4444",marginBottom:10}}>
                  {lbl("本当に退会しますか？","정말 탈퇴하시겠습니까?","Delete your account?")}
                </div>
                <div style={{fontSize:12,color:C.text,lineHeight:1.75,marginBottom:10}}>
                  {["退会すると以下のデータが削除されます。","・アカウント情報","・体重・食事・トレーニング記録","・AIコーチとのチャット履歴","・コーチの記憶","","この操作は取り消せません。"].map((t,i)=><div key={i} style={{minHeight:t===""?8:undefined,marginBottom:2}}>{t}</div>)}
                </div>
                {/* PRO契約中の警告 */}
                {isPro && (
                  <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:10,padding:"12px 14px",marginBottom:10}}>
                    <div style={{fontSize:11,color:"#b45309",lineHeight:1.6,marginBottom:10}}>
                      ⚠️ {lbl(
                        "PRO契約中の場合、退会だけではサブスクリプションが自動停止しない可能性があります。先にPROを解約してください。",
                        "PRO 구독 중인 경우, 탈퇴만으로는 구독이 자동 해지되지 않을 수 있습니다. 먼저 PRO를 해지해 주세요.",
                        "If you have an active PRO subscription, deleting your account may not automatically stop billing. Please cancel PRO first."
                      )}
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>{
                        setShowCancelConfirm(null);
                        setCancelFeedbackMode("cancel");
                        setShowCancelFeedback(true);
                      }} style={{flex:1,padding:"8px 0",background:"#f59e0b",border:"none",borderRadius:8,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                        {lbl("先にPROを解約する","먼저 PRO 해지하기","Cancel PRO first")}
                      </button>
                      <button onClick={()=>{
                        setShowCancelConfirm(null);
                        setCancelFeedbackMode("withdraw");
                        setShowCancelFeedback(true);
                      }} style={{flex:1,padding:"8px 0",background:"none",border:"1px solid rgba(245,158,11,0.4)",borderRadius:8,color:"#b45309",fontSize:11,cursor:"pointer"}}>
                        {lbl("退会申請を続ける","탈퇴 신청 계속","Continue with deletion")}
                      </button>
                    </div>
                  </div>
                )}
                <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:8,padding:"8px 12px",fontSize:11,color:"#dc2626",marginBottom:16}}>
                  {lbl(
                    "データの完全削除には最大30日かかる場合があります。",
                    "데이터 완전 삭제까지 최대 30일이 소요될 수 있습니다.",
                    "Complete data deletion may take up to 30 days."
                  )}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setShowCancelConfirm(null)}
                    style={{flex:1,padding:"11px 0",background:"none",border:"1px solid "+C.border,borderRadius:10,color:C.muted,fontSize:13,cursor:"pointer"}}>
                    {lbl("キャンセル","취소","Cancel")}
                  </button>
                  <button onClick={()=>{
                    setShowCancelConfirm(null);
                    setCancelFeedbackMode("withdraw");
                    setShowCancelFeedback(true);
                  }} style={{flex:1,padding:"11px 0",background:"#ef4444",border:"none",borderRadius:10,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    {lbl("退会手続きへ進む →","탈퇴 절차로 이동 →","Proceed to delete →")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 解約・退会フィードバックモーダル */}
          {showCancelFeedback && (
            <CancellationFeedbackModal
              lang={lang}
              isPro={isPro}
              userId={sbUser?.user?.id || null}
              profile={profile}
              mode={cancelFeedbackMode}
              onClose={()=>setShowCancelFeedback(false)}
              onProceed={()=>{
                setShowCancelFeedback(false);
                if (cancelFeedbackMode === "cancel") {
                  // PRO解約 → Stripe Portal
                  if (!STRIPE_PORTAL_IS_PLACEHOLDER) {
                    window.open(STRIPE_PORTAL, "_blank");
                  } else {
                    alert(lbl
                      ? lbl("Stripe Portal URLが未設定です。管理者にお問い合わせください。","Stripe Portal URL이 미설정입니다.","Stripe Portal URL not configured.")
                      : "Stripe Portal URL not configured."
                    );
                  }
                } else {
                  // 退会 → サインアウト + 完了画面
                  setShowWithdrawDone(true);
                  setTimeout(()=>{ onSignOut(); }, 3000);
                }
              }}
            />
          )}

          {/* 退会完了画面 */}
          {showWithdrawDone && (
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
              <div style={{background:C.surface,borderRadius:18,padding:28,maxWidth:360,width:"100%",textAlign:"center"}}>
                <div style={{fontSize:36,marginBottom:12}}>✅</div>
                <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:12}}>
                  {lbl("退会申請を受け付けました","탈퇴 신청을 접수했습니다","Deletion request received")}
                </div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.8}}>
                  {lbl(
                    "アカウント情報・体重記録・食事記録・トレーニング履歴・AIチャット履歴・コーチの記憶は30日以内に削除対象となります。",
                    "계정 정보·체중 기록·식사 기록·트레이닝 기록·AI 채팅 기록·코치의 기억은 30일 이내에 삭제 대상이 됩니다.",
                    "Your account info, weight logs, meal logs, training history, AI chat history, and coach memory will be deleted within 30 days."
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",padding:"20px 16px 32px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontFamily:"Bebas Neue",fontSize:20,letterSpacing:1,color:C.text}}>{lbl("設定","설정","Settings")}</div>
          <button onClick={onClose} style={{background:C.dim,border:"none",borderRadius:"50%",width:28,height:28,color:C.muted,fontSize:12,cursor:"pointer"}}>✕</button>
        </div>

        {/* 言語 */}
        <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>{lbl("言語","언어","Language")}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
          {LANGS.map(l=>(
            <button key={l.code} onClick={()=>setLang(l.code)} style={{padding:"6px 12px",borderRadius:20,border:"1.5px solid "+(lang===l.code?C.green:C.border),background:lang===l.code?C.greenGlow:"transparent",color:lang===l.code?C.green:C.muted,fontSize:12,cursor:"pointer"}}>{l.flag} {l.label}</button>
          ))}
        </div>

        {/* コーチ */}
        <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>{lbl("コーチ","코치","Coach")}</div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
          {PERSONAS.map(p=>(
            <button key={p.id} onClick={()=>setPid(p.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:pid===p.id?p.bg:"transparent",border:"2px solid "+(pid===p.id?p.color:C.border),borderRadius:12,cursor:"pointer",width:"100%",textAlign:"left"}}>
              <span style={{fontSize:20}}>{p.emoji}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:pid===p.id?p.color:C.text}}>{p[lang]||p.en}</div>
                <div style={{fontSize:10,color:C.muted}}>{p.tag?.[lang]||p.tag?.en}</div>
              </div>
              {pid===p.id&&<span style={{color:p.color}}>✓</span>}
            </button>
          ))}
        </div>

        {/* 目標体型 */}
        <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>{lbl("目標体型","목표 체형","Goal Physique")}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
          {goals.map(g=>(
            <button key={g.id} onClick={()=>setGid(g.id)} style={{padding:"7px 12px",borderRadius:10,border:"1.5px solid "+(gid===g.id?g.color||C.green:C.border),background:gid===g.id?(g.color||C.green)+"12":"transparent",color:gid===g.id?g.color||C.green:C.muted,fontSize:12,cursor:"pointer"}}>
              {g.icon} {g[lang]||g.en}
            </button>
          ))}
        </div>

        {/* 運動歴 */}
        <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>{lbl("運動歴","운동 경험","Fitness Level")}</div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
          {FITNESS_LEVELS.map(f=>(
            <button key={f.id} onClick={()=>setFl(f.id)} style={{padding:"10px 14px",borderRadius:10,border:"2px solid "+(fl===f.id?C.green:C.border),background:fl===f.id?C.greenGlow:"transparent",color:fl===f.id?C.green:C.muted,fontSize:12,cursor:"pointer",textAlign:"left"}}>{f[lang]||f.en}</button>
          ))}
        </div>

        {/* 体格・頻度 */}
        <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>{lbl("体格・頻度","체격·빈도","Body Stats & Frequency")}</div>
        {/* 性別選択 */}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:6}}>{lbl("性別","성별","Gender")}</div>
          <div style={{display:"flex",gap:6}}>
            {[{id:"male",ja:"男性",ko:"남성",en:"Male"},{id:"female",ja:"女性",ko:"여성",en:"Female"},{id:"other",ja:"その他",ko:"기타",en:"Other"}].map(g=>(
              <button key={g.id} onClick={()=>setGdr(g.id)}
                style={{flex:1,padding:"8px 4px",borderRadius:8,border:"1.5px solid "+(gdr===g.id?C.green:C.border),background:gdr===g.id?C.greenGlow:"transparent",color:gdr===g.id?C.green:C.muted,fontSize:12,fontWeight:gdr===g.id?700:400,cursor:"pointer"}}>
                {lbl(g.ja,g.ko,g.en)}
              </button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <div style={{flex:1}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:4}}>{lbl("体重 (kg)","체중 (kg)","Weight (kg)")}</div>
            <input value={wt} onChange={e=>setWt(e.target.value)} placeholder="70" type="number" style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:4}}>{lbl("身長 (cm)","키 (cm)","Height (cm)")}</div>
            <input value={ht} onChange={e=>setHt(e.target.value)} placeholder="170" type="number" style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:6}}>{lbl("週のトレーニング日数","주간 운동 일수","Days per week")}</div>
          <div style={{display:"flex",gap:4}}>
            {[1,2,3,4,5,6,7].map(d=>(
              <button key={d} onClick={()=>setDp(d)} style={{flex:1,padding:"8px 0",borderRadius:8,border:"1.5px solid "+(dp===d?C.green:C.border),background:dp===d?C.greenGlow:"transparent",color:dp===d?C.green:C.muted,fontSize:12,cursor:"pointer"}}>{d}</button>
            ))}
          </div>
        </div>

        {/* サブセクションリンク */}
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          {[
            ["feedback","💬",lbl("お問い合わせ・ご要望","문의·요청","Contact & Feedback"),lbl("バグ報告・機能リクエストなど","버그 보고·기능 요청","Bug reports, feature requests")],
            ["data","💾",lbl("データ管理","데이터 관리","Data Management"),lbl("エクスポート・キャッシュ削除","내보내기·캐시 삭제","Export, cache & deletion")],
            ["account","👤",lbl("アカウント・プラン","계정·플랜","Account & Plan"),lbl("プラン管理・通知・バージョン情報","플랜 관리·알림·버전 정보","Plan, notifications, app info")],
          ].map(([key,icon,title,sub])=>(
            <button key={key} onClick={()=>setSection(key)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:C.card,border:"1px solid "+C.border,borderRadius:12,cursor:"pointer",width:"100%",textAlign:"left"}}>
              <span style={{fontSize:20}}>{icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:C.text}}>{title}</div>
                <div style={{fontSize:11,color:C.muted}}>{sub}</div>
              </div>
              <span style={{color:C.muted,fontSize:14}}>›</span>
            </button>
          ))}
        </div>

        {/* 法的リンク */}
        <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>{lbl("法的情報","법적 정보","Legal")}</div>
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          {[["terms",lbl("利用規約","이용약관","Terms")],["privacy",lbl("プライバシーポリシー","개인정보처리방침","Privacy")],["sct",lbl("特定商取引法","특정상거래법","Legal Notice")],["refund",lbl("返金ポリシー","환불 정책","Refund Policy")]].map(([key,label])=>(
            <button key={key} onClick={()=>setLegal(key)} style={{padding:"6px 10px",background:"none",border:"1px solid "+C.border,borderRadius:8,color:C.muted,fontSize:11,cursor:"pointer"}}>{label}</button>
          ))}
        </div>

        <button onClick={save} style={{width:"100%",background:C.green,border:"none",borderRadius:14,padding:"14px 0",color:"#fff",fontFamily:"Bebas Neue",fontSize:18,letterSpacing:2,cursor:"pointer"}}>{lbl("保存する","저장","Save")}</button>
      </div>
    </div>
  );
}

function Onboarding({ lang, setLang, onComplete }) {
  const [step, setStep]                   = useState(0);
  const topRef = useRef(null);
  const [nickname, setNickname]           = useState("");
  const [gender, setGender]               = useState("male");
  const [heightCm, setHeightCm]           = useState("");
  const [weightKg, setWeightKg]           = useState("");
  const [ageGroup, setAgeGroup]           = useState("twenties");
  const [goalId, setGoalId]               = useState("lean");
  const [personaId, setPersonaId]         = useState("bro");
  const [fitnessLevel, setFitness]        = useState("beginner");
  const [equipment, setEquipment]         = useState("home");
  const [daysPerWeek, setDays]            = useState(3);
  const [hasSoreness, setSoreness]        = useState("none");
  const [medicalConditions, setMedical]   = useState([]);   // 持病
  const [lifeSchedule, setLifeSchedule]   = useState("normal"); // 生活リズム
  const [dislikedExercises, setDisliked]  = useState([]);   // 苦手な運動
  const [likedExercises, setLiked]        = useState([]);   // 好きな運動
  const [activityLevel, setActivity]      = useState("sedentary");
  const [mealStyle, setMealStyle]         = useState("balanced");
  const [mealTiming, setMealTiming]       = useState("3meals");
  const [allergies, setAllergies]         = useState([]);
  const [agreed, setAgreed]              = useState(false);
  const [showLP, setShowLP]              = useState(false);
  const [selectedPlan, setSelectedPlan]  = useState(null);
  const [legalModal, setLegalModal]      = useState(null);

  const STEP_COUNT = 7;
  const T = {
    ja:{ next:"次へ →", start:"始める", agree:"利用規約・プライバシーポリシーに同意します" },
    en:{ next:"Next →", start:"Start", agree:"I agree to the Terms of Service and Privacy Policy" },
    ko:{ next:"다음 →", start:"시작", agree:"이용약관 및 개인정보처리방침에 동의합니다" },
    zh:{ next:"下一步 →", start:"开始", agree:"我同意使用条款和隐私政策" },
    de:{ next:"Weiter →", start:"Starten", agree:"Ich stimme den Nutzungsbedingungen zu" },
    fr:{ next:"Suivant →", start:"Commencer", agree:"J'accepte les CGU et la politique de confidentialité" },
    es:{ next:"Siguiente →", start:"Empezar", agree:"Acepto los términos y la política de privacidad" },
  };
  const t = T[lang] || T.en;
  const goals = BODY_GOALS[gender] || BODY_GOALS.male;
  const lbl = (ja,ko,zh,de,fr,es,en) => lang==="ja"?ja:lang==="ko"?ko:lang==="zh"?zh:lang==="de"?de:lang==="fr"?fr:lang==="es"?es:en;

  const sel = (active) => ({
    padding:"12px 14px", borderRadius:10,
    border:"2px solid "+(active?C.green:C.border),
    background:active?C.greenGlow:"#fff",
    color:active?C.green:"#374151",
    fontSize:13, cursor:"pointer", textAlign:"left", width:"100%", fontWeight:active?700:400,
  });
  const inp = {width:"100%",background:"#f9fafb",border:"1px solid "+C.border,borderRadius:10,padding:"12px 14px",color:"#111827",fontSize:14};

  function handleDone() {
    const _h2 = parseFloat(heightCm)||170;
    const _w2 = parseFloat(weightKg)||65;
    const _tgt2 = goals.find(g=>g.id===goalId)?.targetBf||12;
    const _curBf2 = Math.max(5, Math.min(40, 20-(_h2-_w2*0.45)*0.1));
    const _diff2 = Math.max(0, _curBf2 - _tgt2);
    const diagType = fitnessLevel==="beginner"?"Low Muscle Mass":fitnessLevel==="intermediate"?"Balanced":"Athletic";
    const diagProb = Math.max(12, Math.min(48, 55 - _diff2*4));
    const diagProbPro = Math.min(94, diagProb + 40);
    const daysToGoal2 = Math.round(Math.max(30, _diff2*30));
    const _hF = parseFloat(heightCm)||0;
    const _wF = parseFloat(weightKg)||0;
    const _bmi = _hF > 0 ? Math.round((_wF/((_hF/100)**2))*10)/10 : null;
    const _age = ageGroup==="teens"?17:ageGroup==="twenties"?25:ageGroup==="thirties"?35:ageGroup==="forties"?45:55;
    const _bmr = gender==="female" ? 10*_wF+6.25*_hF-5*_age-161 : 10*_wF+6.25*_hF-5*_age+5;
    const _actM = activityLevel==="sedentary"?1.2:activityLevel==="light"?1.375:activityLevel==="moderate"?1.55:1.725;
    const _tdee = Math.round(_bmr*_actM);
    const _idealW = _hF > 0 ? Math.round(22*(_hF/100)**2*10)/10 : null;
    const profile = {
      nickname, gender,
      heightCm: _hF,
      currentWeightKg: _wF,
      idealWeightKg: _idealW,
      bmi: _bmi,
      tdee: _tdee,
      ageGroup,
      bodyGoal: goals.find(g=>g.id===goalId)||goals[0],
      coachId: personaId,
      fitnessLevel, equipment, daysPerWeek, hasSoreness,
      activityLevel, mealStyle, mealTiming, allergies,
      medicalConditions, lifeSchedule, dislikedExercises, likedExercises,
      lang,
      diagType, diagProb, diagProbPro, daysToGoal: daysToGoal2,
      estCurrentBf: Math.round(_curBf2*10)/10,
      isPro: false,
      joinedAt: Date.now(),
      startDate: new Date().toISOString(),
    
      isPro: false,};;
    lsSet("mb_profile", profile);
    onComplete(profile);
  }

  function renderContent() {
    switch(step) {
      case 0: return (
        <div>
          <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{lbl("あなたについて","기본 정보","基本信息","Über dich","À propos","Sobre ti","About you")}</div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{lbl("ニックネーム","닉네임","昵称","Spitzname","Surnom","Apodo","Nickname")}</div>
            <input value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Name" style={inp}/>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{lbl("性別","성별","性别","Geschlecht","Sexe","Género","Gender")}</div>
            <div style={{display:"flex",gap:8}}>
              {[["male",lbl("男性","남성","男性","Männlich","Homme","Masculino","Male")],["female",lbl("女性","여성","女性","Weiblich","Femme","Femenino","Female")],["other",lbl("その他","기타","其他","Divers","Autre","Otro","Other")]].map(([v,lb])=>(
                <button key={v} onClick={()=>setGender(v)} style={{...sel(gender===v),flex:1,textAlign:"center",padding:"10px 4px"}}>{lb}</button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:12}}>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{lbl("身長(cm)","키(cm)","身高(cm)","Größe(cm)","Taille(cm)","Altura(cm)","Height(cm)")}</div>
              <input value={heightCm} onChange={e=>setHeightCm(e.target.value.replace(/[^0-9.]/g,""))} placeholder="170" type="number" inputMode="decimal" min="100" max="250" style={inp}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{lbl("体重(kg)","체중(kg)","体重(kg)","Gewicht(kg)","Poids(kg)","Peso(kg)","Weight(kg)")}</div>
              <input value={weightKg} onChange={e=>setWeightKg(e.target.value.replace(/[^0-9.]/g,""))} placeholder="65" type="number" inputMode="decimal" min="30" max="300" style={inp}/>
            </div>
          </div>
          {heightCm && weightKg && parseFloat(heightCm) > 0 && parseFloat(weightKg) > 0 && (
            <div style={{marginBottom:12}}>
              {(()=>{
                const h = parseFloat(heightCm)/100;
                const w = parseFloat(weightKg);
                const bmi = w/(h*h);
                const bmiColor = bmi<18.5?"#3b82f6":bmi<25?"#22c55e":bmi<30?"#f97316":"#ef4444";
                const bmiLabel = lang==="ja"?(bmi<18.5?"低体重":bmi<25?"標準":bmi<30?"過体重":"肥満"):lang==="ko"?(bmi<18.5?"저체중":bmi<25?"정상":bmi<30?"과체중":"비만"):(bmi<18.5?"Underweight":bmi<25?"Normal":bmi<30?"Overweight":"Obese");
                const bmiBar = Math.min(100, Math.max(0, (bmi-14)/(40-14)*100));
                const idealW = Math.round(22*h*h*10)/10;
                const diffKg = Math.round((w - idealW)*10)/10;
                const tdeeBase = gender==="female"?10*w+6.25*(h*100)-5*(ageGroup==="teens"?17:ageGroup==="twenties"?25:ageGroup==="thirties"?35:ageGroup==="forties"?45:55)-161:10*w+6.25*(h*100)-5*(ageGroup==="teens"?17:ageGroup==="twenties"?25:ageGroup==="thirties"?35:ageGroup==="forties"?45:55)+5;
                return (
                  <div style={{background:"#fff",borderRadius:14,padding:"14px 16px",border:"2px solid "+bmiColor,boxShadow:"0 2px 12px "+bmiColor+"20"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <div>
                        <div style={{fontSize:11,color:C.muted,marginBottom:2}}>BMI</div>
                        <div style={{fontFamily:"Bebas Neue",fontSize:30,color:bmiColor,lineHeight:1}}>{bmi.toFixed(1)}</div>
                      </div>
                      <div style={{background:bmiColor+"18",border:"1px solid "+bmiColor+"40",borderRadius:20,padding:"6px 14px",fontSize:13,color:bmiColor,fontWeight:700}}>{bmiLabel}</div>
                    </div>
                    <div style={{position:"relative",height:8,background:"#f3f4f6",borderRadius:4,marginBottom:10,overflow:"hidden"}}>
                      <div style={{position:"absolute",left:0,top:0,height:"100%",background:"linear-gradient(90deg,#3b82f6,#22c55e 35%,#f97316 65%,#ef4444)",width:"100%",borderRadius:4}}/>
                      <div style={{position:"absolute",top:-2,height:12,width:4,background:"#111827",borderRadius:2,left:bmiBar+"%",transform:"translateX(-50%)"}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.muted,marginBottom:12}}>
                      <span>14</span><span style={{color:"#3b82f6"}}>{lbl("低体重","저체중","低体重","Unter","Faible","Bajo","Under")} &lt;18.5</span><span style={{color:"#22c55e"}}>{lbl("標準","정상","标准","Normal","Normal","Normal","Normal")} 18.5-24.9</span><span style={{color:"#f97316"}}>25-29.9</span><span style={{color:"#ef4444"}}>30+</span><span>40</span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <div style={{background:"#f9fafb",borderRadius:10,padding:"8px 10px"}}>
                        <div style={{fontSize:10,color:C.muted,marginBottom:2}}>{lbl("標準体重(BMI22)","표준체중(BMI22)","标准体重(BMI22)","Idealgewicht","Poids idéal","Peso ideal","Ideal weight (BMI22)")}</div>
                        <div style={{fontFamily:"Bebas Neue",fontSize:18,color:C.green}}>{idealW}<span style={{fontSize:11,fontWeight:400}}> kg</span></div>
                      </div>
                      <div style={{background:"#f9fafb",borderRadius:10,padding:"8px 10px"}}>
                        <div style={{fontSize:10,color:C.muted,marginBottom:2}}>{lbl("目標との差","목표와의 차이","与目标的差","Differenz","Différence","Diferencia","Diff. from ideal")}</div>
                        <div style={{fontFamily:"Bebas Neue",fontSize:18,color:diffKg>0?"#ef4444":diffKg<0?"#3b82f6":"#22c55e"}}>{diffKg>0?"+":""}{diffKg}<span style={{fontSize:11,fontWeight:400}}> kg</span></div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          <div>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{lbl("年齢層","연령대","年龄段","Altersgruppe","Groupe age","Grupo edad","Age group")}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {[["teens",lbl("10代","10대","青少年","Teenager","Ado","Adolesc.","Teens")],["twenties",lbl("20代","20대","20岁","20er","20s","20s","20s")],["thirties",lbl("30代","30대","30岁","30er","30s","30s","30s")],["forties",lbl("40代","40대","40岁","40er","40s","40s","40s")],["fiftyplus",lbl("50代+","50대+","50岁+","50+","50+","50+","50+")]].map(([v,lb])=>(
                <button key={v} onClick={()=>setAgeGroup(v)} style={{...sel(ageGroup===v),flex:1,minWidth:48,textAlign:"center",padding:"8px 4px",fontSize:12}}>{lb}</button>
              ))}
            </div>
          </div>
        </div>
      );
      case 1: return (
        <div>
          <div style={{fontSize:13,color:C.muted,marginBottom:4}}>{lbl("\u76ee\u6307\u3059\u4f53\u578b","\ub3c9\uae30\ubd80\uc5ec","\u76ee\u6807\u4f53\u578b","Ziel-Körperform","Forme ideale","Forma ideal","Goal physique")}</div>
          <div style={{fontSize:11,color:"#9ca3af",marginBottom:14}}>{lbl("\u30b3\u30fc\u30c1\u304c\u3053\u306e\u60c5\u5831\u3092\u5143\u306b\u6700\u9069\u306a\u30d7\u30e9\u30f3\u3092\u7d44\u307f\u307e\u3059","\ucf54\uce58\uac00 \uc774 \uc815\ubcf4\ub97c \ubc14\ud0d5\uc73c\ub85c \ucd5c\uc801\uc758 \ud50c\ub79c\uc744 \uad6c\uc131\ud569\ub2c8\ub2e4","\u6559\u7ec3\u5c06\u6839\u636e\u6b64\u4fe1\u606f\u5236\u5b9a\u6700\u4f18\u8ba1\u5212","Der Coach erstellt auf Basis deines Ziels den optimalen Plan","Le coach créera le plan optimal basé sur cet objectif","El coach creará el plan óptimo basado en este objetivo","Your coach will build the optimal plan based on this goal")}</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {goals.map(g=>{
              const GOAL_DETAIL = {
                kpop:     { icon:"\uD83C\uDFA4", ja:{copy:"\u97d3\u56fd\u30a2\u30a4\u30c9\u30eb\u306e\u900f\u660e\u611f\u3042\u308b\u7d30\u8eab\u30dc\u30c7\u30a3",benefit:"\u2736 \u7d30\u304f\u5f15\u304d\u7de0\u307e\u3063\u305f\u4e0a\u534a\u8eab\n\u2736 \u811a\u9577\u30fb\u30b9\u30ea\u30e0\u30b7\u30eb\u30a8\u30c3\u30c8\n\u2736 \u6e05\u6f54\u611f\u30fb\u30b9\u30bf\u30a4\u30ea\u30c3\u30b7\u30e5\u3055"}, en:{copy:"K-pop idol slim & polished physique",benefit:"\u2736 Lean toned upper body\n\u2736 Long slim leg silhouette\n\u2736 Clean aesthetic style"}, ko:{copy:"K\ud31d \uc544\uc774\ub3cc\uc758 \ud22c\uba85\ud55c \uc2ac\ub9bc \ubc14\ub514",benefit:"\u2736 슬림하고 탄탄한 상체\n\u2736 \ub2e4\ub9ac\uac00 \uae38\uc5b4\ubcf4\uc774\ub294 \uc2e4\ub8e8\uc5d3\n\u2736 \uc138\ub828\ub41c \uc2a4\ud0c0\uc77c"} },
                lean:     { icon:"\uD83C\uDFC3", ja:{copy:"\u7d30\u30de\u30c3\u30c1\u30e7\u30fb\u8131\u3044\u305f\u3089\u99c6\u308c\u308b\u7406\u60f3\u4f53\u578b",benefit:"\u2736 \u670d\u306e\u4e0a\u304b\u3089\u5206\u304b\u308b\u7b4b\u8089\u611f\n\u2736 \u4f53\u8102\u80aa\u3092\u843d\u3068\u3057\u3066\u7b4b\u8089\u3092\u51fa\u3059\n\u2736 \u52d5\u3051\u308b\u30fb\u5065\u5eb7\u7684\u306a\u5f37\u3055"}, en:{copy:"Lean muscular — turns heads at the beach",benefit:"\u2736 Visible muscle through clothes\n\u2736 Low body fat with muscle definition\n\u2736 Functional athletic strength"}, ko:{copy:"\uc2ac\ub9bc\ud54f — \ubcf4\uba74 \ub2e4\ub4e4 \ub180\ub77c\ub294 \uba38",benefit:"\u2736 \uc637 \uc704\ub85c \ub4dc\ub7ec\ub098\ub294 \uadfc\uc721\uac10\n\u2736 \uccb4\uc9c0\ubc29 \uc904\uc774\uace0 \uadfc\uc721 \uc0b4\ub9ac\uae30\n\u2736 \uae30\ub2a5\uc801 \uc6b4\ub3d9 \ub2a5\ub825"} },
                athletic: { icon:"\u26A1", ja:{copy:"\u30b9\u30dd\u30fc\u30c4\u9078\u624b\u306e\u3088\u3046\u306a\u6a5f\u80fd\u7f8e\u3042\u3075\u308c\u308b\u30dc\u30c7\u30a3",benefit:"\u2736 \u6301\u4e45\u529b\u3068\u77ac\u767a\u529b\u3092\u517c\u5099\n\u2736 \u3069\u3093\u306a\u52d5\u304d\u3082\u8efd\u3084\u304b\u306b\u3053\u306a\u3059\n\u2736 \u30b9\u30dd\u30fc\u30c4\u5168\u822c\u3067\u6d3b\u8e4d\u3067\u304d\u308b\u4f53"}, en:{copy:"Athlete's body — built for performance",benefit:"\u2736 Endurance meets explosive power\n\u2736 Move with speed and agility\n\u2736 Excel at any sport"}, ko:{copy:"\uc6b4\ub3d9\uc120\uc218\uc758 \uae30\ub2a5\ubbf8 \ub118\uce58\ub294 \uba38",benefit:"\u2736 \uc9c0\uad6c\ub825\uacfc \uc21c\ubc1c\ub825 \uaca8\ube44\n\u2736 \uc5b4\ub5a4 \uc6c0\uc9c1\uc784\ub3c4 \uac00\ubccd\uac8c\n\u2736 \ubaa8\ub4e0 \uc2a4\ud3ec\uce20\uc5d0\uc11c \ud65c\uc57d"} },
                muscular: { icon:"\uD83D\uDCAA", ja:{copy:"\u30d5\u30a3\u30b8\u30fc\u30af\u30fb\u5727\u5012\u7684\u306a\u5b58\u5728\u611f\u306e\u3042\u308b\u7b4b\u8089\u30dc\u30c7\u30a3",benefit:"\u2736 \u5727\u5012\u7684\u306a\u7b4b\u8089\u91cf\u3068\u539a\u307f\n\u2736 \u81ea\u4fe1\u3068\u5a01\u5727\u611f\u304c\u51fa\u308b\u30b7\u30eb\u30a8\u30c3\u30c8\n\u2736 \u9650\u754c\u3092\u8d85\u3048\u305f\u5148\u306e\u81ea\u5206"}, en:{copy:"Muscular physique — commanding presence",benefit:"\u2736 Maximum muscle mass & thickness\n\u2736 Powerful silhouette that commands respect\n\u2736 The version of you that breaks limits"}, ko:{copy:"\ud53c\uc9c0\ud06c — \uc555\ub3c4\uc801 \uadfc\uc721 \ubc14\ub514",benefit:"\u2736 \uc555\ub3c4\uc801\uc778 \uadfc\uc721\ub7c9\uacfc \ub450\uae50\n\u2736 \uc790\uc2e0\uac10\uacfc \uc704\uc555\uac10 \uc788\ub294 \uc2e4\ub8e8\uc5d3\n\u2736 \ud55c\uacc4\ub97c \ub118\uc5b4\uc120 \ub098"} },
                kpop_girl:{ icon:"\uD83D\uDC83", ja:{copy:"K-POP \u30ac\u30fc\u30eb\u306e\u6d17\u7df4\u3055\u308c\u305f\u3057\u306a\u3084\u304b\u30dc\u30c7\u30a3",benefit:"\u2736 \u3057\u306a\u3084\u304b\u3067\u5973\u6027\u3089\u3057\u3044\u4f53\u578b\n\u2736 \u8155\u7b4b\u30fb\u811a\u30e9\u30a4\u30f3\u304c\u7d30\u9e97\u306b\n\u2736 \u81ea\u4fe1\u3092\u6301\u3063\u3066\u821e\u53f0\u306b\u7acb\u3066\u308b\u4f53"}, en:{copy:"K-pop girl slim toned & graceful",benefit:"\u2736 Graceful feminine physique\n\u2736 Defined abs & beautiful leg line\n\u2736 Confident stage-ready body"}, ko:{copy:"K\ud31d \uac78\ucc98\ub7fc \uc138\ub828\ub41c \uc2ac\ub9bc \ubc14\ub514",benefit:"\u2736 \uc5ec\uc131\uc2a4\ub7fd\uace0 \ud0c4\ud0c4\ud55c \uccb4\ud615\n\u2736 \ubcf5\uadfc\u00b7\ub2e4\ub9ac \ub77c\uc778\uc774 \uc608\uc05c\uac8c\n\u2736 \uc790\uc2e0 \uc788\uac8c \ubb34\ub300\uc5d0 \uc124 \uc218 \uc788\ub294 \uba38"} },
                slim:     { icon:"\uD83C\uDF3F", ja:{copy:"\u30b9\u30ea\u30e0\u3067\u8efd\u3084\u304b\u30fb\u7740\u3053\u306a\u3057\u304c\u6620\u3048\u308b\u30e2\u30c7\u30eb\u4f53\u578b",benefit:"\u2736 \u3069\u3093\u306a\u670d\u3082\u7f8e\u3057\u304f\u7740\u3053\u306a\u305b\u308b\n\u2736 \u4f53\u304c\u8efd\u304f\u6bce\u65e5\u304c\u6d3b\u52d9\u7684\u306b\n\u2736 \u9854\u5468\u308a\u3082\u30b9\u30c3\u30ad\u30ea\u898b\u3048\u308b"}, en:{copy:"Slim & light — clothes look amazing",benefit:"\u2736 Any outfit looks great on you\n\u2736 Feel light and energized daily\n\u2736 Slimmer face and silhouette"}, ko:{copy:"\uc2ac\ub9bc\ud558\uace0 \uac00\ubccd\uac8c — \ubaa8\ub4e0 \uc637\uc774 \uc798 \uc5b4\uc6b8\ub9ac\ub294 \uba38",benefit:"\u2736 \uc5b4\ub5a4 \uc637\ub3c4 \uc608\uc05c\uac8c \uc18c\ud654\n\u2736 \uba38\uc774 \uac00\ubccd\uace0 \ub9e4\uc77c \ud65c\uae30\ucc28\uac8c\n\u2736 \uc5bc\uad74 \uc8fc\ubcc0\ub3c4 \ub099\uc2ac\ud558\uac8c"} },
                toned:    { icon:"\u2728", ja:{copy:"\u5f15\u304d\u7de0\u307e\u3063\u3066\u7f8e\u3057\u3044\u30fb\u81ea\u4fe1\u304c\u6301\u3066\u308b\u4f53",benefit:"\u2736 \u4f59\u5206\u306a\u8102\u80aa\u3092\u843d\u3068\u3057\u3066\u7b4b\u8089\u3092\u51fa\u3059\n\u2736 \u304a\u8179\u30fb\u4e8c\u306e\u8155\u30fb\u592a\u3082\u3082\u3092\u5f15\u304d\u7de0\u3081\n\u2736 \u93e1\u3092\u898b\u308b\u306e\u304c\u697d\u3057\u307f\u306b\u306a\u308b\u4f53"}, en:{copy:"Toned & defined — love what you see",benefit:"\u2736 Drop excess fat, reveal muscle tone\n\u2736 Flat stomach, lean arms & thighs\n\u2736 Love looking in the mirror"}, ko:{copy:"\ud0c4\ud0c4\ud558\uace0 \uc544\ub984\ub2e4\uc6b4 — \uc790\uc2e0 \uc788\ub294 \uba38",benefit:"\u2736 \ubd88\ud544\uc694\ud55c \uc9c0\ubc29\uc744 \ube7c\uace0 \uadfc\uc721\uc744 \ub4dc\ub7ec\ub0b4\uae30\n\u2736 \ubc30\u00b7\ud314\ub661\u00b7\ud5c8\ubc85\uc9c0 \ud0c4\ud0c4\ud558\uac8c\n\u2736 \uac70\uc6b8 \ubcf4\ub294 \uac8c \uc989\uac70\uc6cc\uc9c0\ub294 \uba38"} },
                curvy:    { icon:"\uD83C\uDF51", ja:{copy:"\u30e1\u30ea\u30cf\u30ea\u306e\u3042\u308b\u5973\u6027\u3089\u3057\u3044\u30b0\u30e9\u30de\u30fc\u30dc\u30c7\u30a3",benefit:"\u2736 \u30d0\u30b9\u30c8\u30a2\u30c3\u30d7\u30fb\u30d2\u30c3\u30d7\u30a2\u30c3\u30d7\n\u2736 \u30a6\u30a8\u30b9\u30c8\u306e\u304f\u3073\u308c\u3092\u3064\u304f\u308b\n\u2736 \u5973\u6027\u3089\u3057\u3055\u30fb\u8272\u6c17\u304c\u5897\u3059\u4f53"}, en:{copy:"Curvy & fit — feminine & confident",benefit:"\u2736 Lifted bust & sculpted glutes\n\u2736 Defined waist & hourglass shape\n\u2736 Radiant femininity & confidence"}, ko:{copy:"\uae00\ub798\uba38 — \uc5ec\uc131\uc2a4\ub7ec\uc6b4 \ubc14\ub514",benefit:"\u2736 \ubc14\uc2a4\ud2b8\uc5c5\u00b7\ud799\uc5c5\n\u2736 \ud5c8\ub9ac \uc78a\ub85d\ud568 \ub9cc\ub4e4\uae30\n\u2736 \uc5ec\uc131\uc2a4\ub7ec\uc6c0\uacfc \uc0c9\uae30\uac00 \ub118\uce58\ub294 \uba38"} },
                strong:   { icon:"\uD83E\uDDBE", ja:{copy:"\u529b\u5f37\u304f\u983c\u308c\u308b\u30fb\u81ea\u4fe1\u3042\u3075\u308c\u308b\u30a2\u30b9\u30ea\u30fc\u30c8\u4f53\u578b",benefit:"\u2736 \u5168\u8eab\u306e\u7b4b\u529b\u30a2\u30c3\u30d7\u3067\u6bce\u65e5\u304c\u697d\u306b\u306a\u308b\n\u2736 \u4ee3\u8b1d\u304c\u4e0a\u304c\u308a\u592a\u308a\u306b\u304f\u3044\u4f53\u8cea\u306b\n\u2736 \u8ab0\u306b\u3082\u8ca0\u3051\u306a\u3044\u81ea\u5206\u306b\u306a\u308c\u308b"}, en:{copy:"Strong & powerful — unstoppable confidence",benefit:"\u2736 Full body strength for easy daily life\n\u2736 Higher metabolism burns fat faster\n\u2736 Become your most powerful self"}, ko:{copy:"\uac15\ud558\uace0 \uc790\uc2e0\uac10 \ub118\uce58\ub294 \uc6b4\ub3d9\uc120\uc218 \uccb4\ud615",benefit:"\u2736 \uc804\uc2e0 \uadfc\ub825 \ud5a5\uc0c1\uc73c\ub85c \uc77c\uc0c1\uc774 \ud3b8\ud574\uc9d0\n\u2736 \ub300\uc0ac\uac00 \uc62c\ub77c \uc0b4 \uc548 \uc9c0\ub294 \uccb4\uc9c8\ub85c\n\u2736 \ub204\uad6c\uc5d0\uac8c\ub3c4 \uc9c0\uc9c0 \uc54a\ub294 \ub098"} },
                korean:   { icon:"\uD83C\uDFAC", ja:{copy:"\u97d3\u56fd\u4fe3\u512a\u306e\u3088\u3046\u306a\u8272\u6c17\u3068\u7b4b\u8089\u611f",benefit:"\u2736 \u7a0b\u3088\u3044\u7b4b\u8089\u3068\u5f15\u304d\u7de0\u307e\u3063\u305f\u4f53\n\u2736 \u80a9\u5e45\u30fb\u9006\u4e09\u89d2\u5f62\u30b7\u30eb\u30a8\u30c3\u30c8\n\u2736 \u8131\u3044\u305f\u3089\u51d1\u3044\u30dc\u30c7\u30a3"}, en:{copy:"Korean actor charisma with muscle tone",benefit:"\u2736 Balanced muscle & definition\n\u2736 Broad shoulders V-taper\n\u2736 Impressive physique"}, ko:{copy:"\ud55c\uad6d \ubc30\uc6b0\uc758 \uc0c9\uae30 \uc788\ub294 \uba38",benefit:"\u2736 \uc801\ub2f9\ud55c \uadfc\uc721\uacfc \ud0c4\ud0c4\ud55c \uba38\n\u2736 \uc5b4\uae54 \ub113\uc740 \uc5ed\uc0bc\uac01\ud615\n\u2736 \ubcf4\uba74 \ub193\ub77c\ub294 \uba38"} },
              };
              const d = GOAL_DETAIL[g.id];
              const langK = lang==="ja"?"ja":lang==="ko"?"ko":"en";
              const copy = d?.[langK]?.copy || g[lang]||g.en||g.title;
              const benefit = d?.[langK]?.benefit || "";
              const isSelected = goalId === g.id;
              return (
                <button key={g.id} onClick={()=>setGoalId(g.id)} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"14px 16px",borderRadius:14,border:"2px solid "+(isSelected?g.color||C.green:C.border),background:isSelected?(g.color||C.green)+"0d":"#fff",cursor:"pointer",textAlign:"left",width:"100%",transition:"all 0.2s"}}>
                  <div style={{width:52,height:52,borderRadius:12,background:isSelected?(g.color||C.green)+"1a":"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{d?.icon||"\uD83C\uDFAF"}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                      <div style={{fontWeight:800,color:isSelected?g.color||C.green:"#111827",fontSize:15}}>{g[lang]||g.en||g.title}</div>
                      <span style={{fontSize:10,background:isSelected?(g.color||C.green)+"22":"#f3f4f6",color:isSelected?g.color||C.green:"#6b7280",padding:"2px 8px",borderRadius:8,fontWeight:600,flexShrink:0}}>{lbl("\u4f53\u8102\u80aa","\uccb4\uc9c0\ubc29","\u4f53\u8102\u80aa","Körperfett","Graisse","Grasa","Body fat")} {g.bf}</span>
                    </div>
                    <div style={{fontSize:12,color:isSelected?g.color||C.green:"#374151",fontWeight:600,marginBottom:isSelected?6:0,lineHeight:1.4}}>{copy}</div>
                    {isSelected && benefit && (
                      <div style={{fontSize:11,color:"#374151",lineHeight:1.9,whiteSpace:"pre-line",borderTop:"1px solid "+(g.color||C.green)+"20",paddingTop:6,marginTop:4}}>{benefit}</div>
                    )}
                  </div>
                  {isSelected&&<span style={{color:g.color||C.green,fontSize:18,flexShrink:0}}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      );
      case 2: return (
        <div>
          <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{lbl("トレーニング状況","트레이닝 상황","训练状况","Trainingsprofil","Profil entrainement","Perfil entrenamiento","Training profile") + " 🏋️"}</div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{lbl("運動経験","운동 경험","运动经验","Fitnesslevel","Niveau forme","Nivel de forma","Fitness level")}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {FITNESS_LEVELS.map(f=>(<button key={f.id} onClick={()=>setFitness(f.id)} style={sel(fitnessLevel===f.id)}>{f[lang]||f.en}</button>))}
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{lbl("使える環境","사용 가능 환경","可用环境","Trainingsumgebung","Environnement","Entorno","Equipment")}</div>
            <div style={{display:"flex",gap:8}}>
              {[["home",lbl("自宅のみ","자택만","仅在家","Zuhause","Maison","Casa","Home only")],["gym",lbl("ジムあり","헬스장","健身房","Fitnessstudio","Gym","Gimnasio","Gym")],["both",lbl("両方","둘 다","两者都有","Beides","Les deux","Ambos","Both")]].map(([v,lb])=>(
                <button key={v} onClick={()=>setEquipment(v)} style={{...sel(equipment===v),flex:1,textAlign:"center"}}>{lb}</button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{lbl("週に何日？","일주일에 며칠?","每周几天?","Tage pro Woche?","Jours par semaine?","Dias por semana?","Days per week?")}</div>
            <div style={{display:"flex",gap:6}}>
              {[1,2,3,4,5,6,7].map(d=>(<button key={d} onClick={()=>setDays(d)} style={{...sel(daysPerWeek===d),flex:1,textAlign:"center",padding:"10px 2px"}}>{d}</button>))}
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{lbl("筋肉痛・怪我は？","근육통이나 부상?","是否有肌肉酸痛?","Muskelkater?","Douleurs?","Dolor?","Current soreness?")}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[["none","✅ "+lbl("なし","없음","没有","Keine","Aucune","Ninguna","None")],["mild","💪 "+lbl("軽い筋肉痛あり","가벼운 근육통","轻微酸痛","Leichter Muskelkater","Legeres courbatures","Leve dolor muscular","Mild soreness")],["injury","🩹 "+lbl("怪我あり","부상 있음","有受伤","Verletzung","Blessure","Lesion","Injury")]].map(([v,lb])=>(
                <button key={v} onClick={()=>setSoreness(v)} style={sel(hasSoreness===v)}>{lb}</button>
              ))}
            </div>
          </div>

          {/* 生活リズム */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>⏰ {lbl("生活リズム","생활 리듬","生活节奏","Tagesrhythmus","Rythme de vie","Ritmo de vida","Daily schedule")}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[["morning","🌅 "+lbl("朝型（朝トレOK）","아침형（아침 운동 OK）","早起型","Morgenmensch","Leve-tot","Mañanero","Morning person")],["evening","🌙 "+lbl("夜型（夜トレ派）","저녁형（저녁 운동）","夜猫子","Nachtmensch","Couche-tard","Noctámbulo","Evening person")],["nightshift","🌃 "+lbl("夜勤・不規則","야간근무·불규칙","夜班/不规律","Nachtschicht","Travail de nuit","Turno de noche","Night shift / irregular")],["normal","🕐 "+lbl("特になし","특별한 점 없음","没有特别","Normal","Normal","Normal","No preference")]].map(([v,lb])=>(
                <button key={v} onClick={()=>setLifeSchedule(v)} style={sel(lifeSchedule===v)}>{lb}</button>
              ))}
            </div>
          </div>

          {/* 持病・身体的制限 */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>🏥 {lbl("持病・身体的な制限（複数選択可）","지병/신체적 제한","慢性病/身体限制","Vorerkrankungen","Maladies chroniques","Enfermedades","Health conditions (multi-select)")}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {[["none","✅ "+lbl("特になし","없음","没有","Keine","Aucune","Ninguna","None")],["knee","🦵 "+lbl("膝の痛み","무릎 통증","膝盖痛","Knieschmerzen","Douleur genou","Dolor rodilla","Knee pain")],["back","🔙 "+lbl("腰痛","허리 통증","腰痛","Rückenschmerzen","Mal de dos","Dolor espalda","Back pain")],["shoulder","💪 "+lbl("肩の痛み","어깨 통증","肩膀痛","Schulterschmerzen","Douleur epaule","Dolor hombro","Shoulder pain")],["heart","❤️ "+lbl("心臓系","심장 질환","心脏","Herzprobleme","Problèmes cardiaques","Problemas cardíacos","Heart condition")],["diabetes","🩸 "+lbl("糖尿病","당뇨","糖尿病","Diabetes","Diabète","Diabetes","Diabetes")],["hypertension","📈 "+lbl("高血圧","고혈압","高血压","Bluthochdruck","Hypertension","Hipertensión","Hypertension")]].map(([v,lb])=>(
                <button key={v} onClick={()=>{
                  if(v==="none"){setMedical([]);return;}
                  setMedical(a=>a.includes(v)?a.filter(x=>x!==v):[...a.filter(x=>x!=="none"),v]);
                }} style={{...sel(medicalConditions.includes(v)||(v==="none"&&medicalConditions.length===0)),flex:"0 0 auto",padding:"7px 10px",fontSize:11}}>{lb}</button>
              ))}
            </div>
          </div>

          {/* 苦手な運動 */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>🙅 {lbl("苦手・避けたい運動","하기 싫은 운동","讨厌的运动","Ungeliebte Übungen","Exercices à éviter","Ejercicios a evitar","Exercises to avoid")}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {[["running","🏃 "+lbl("走る","달리기","跑步","Laufen","Course","Correr","Running")],["squat","🦵 "+lbl("スクワット","스쿼트","深蹲","Kniebeugen","Squats","Sentadillas","Squats")],["pushup","💪 "+lbl("腕立て","팔굽혀펴기","俯卧撑","Liegestütze","Pompes","Flexiones","Push-ups")],["jump","⬆️ "+lbl("ジャンプ系","점프류","跳跃类","Sprünge","Sauts","Saltos","Jump exercises")],["plank","⏱ "+lbl("プランク","플랭크","平板支撑","Planke","Planche","Plancha","Planks")]].map(([v,lb])=>(
                <button key={v} onClick={()=>setDisliked(a=>a.includes(v)?a.filter(x=>x!==v):[...a,v])} style={{...sel(dislikedExercises.includes(v)),flex:"0 0 auto",padding:"7px 10px",fontSize:11}}>{lb}</button>
              ))}
            </div>
          </div>

          {/* 好きな運動 */}
          <div>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>🙆 {lbl("好き・得意な運動","좋아하는 운동","喜欢的运动","Bevorzugte Übungen","Exercices préférés","Ejercicios favoritos","Favourite exercises")}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {[["running","🏃 "+lbl("走る","달리기","跑步","Laufen","Course","Correr","Running")],["squat","🦵 "+lbl("下半身","하체","下半身","Unterkörper","Bas du corps","Parte inferior","Leg day")],["pushup","💪 "+lbl("腕立て・上半身","상체","上半身","Oberkörper","Haut du corps","Parte superior","Upper body")],["yoga","🧘 "+lbl("ヨガ・ストレッチ","요가·스트레칭","瑜伽·拉伸","Yoga","Yoga","Yoga","Yoga / stretching")],["hiit","⚡ "+lbl("HIIT","HIIT","HIIT","HIIT","HIIT","HIIT","HIIT")]].map(([v,lb])=>(
                <button key={v} onClick={()=>setLiked(a=>a.includes(v)?a.filter(x=>x!==v):[...a,v])} style={{...sel(likedExercises.includes(v)),flex:"0 0 auto",padding:"7px 10px",fontSize:11}}>{lb}</button>
              ))}
            </div>
          </div>
        </div>
      );
      case 3: return (
        <div>
          <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{lbl("栄養・食事プロフィール","영양 프로필","营养档案","Ernahrungsprofil","Profil nutritionnel","Perfil nutricional","Nutrition profile") + " 🥗"}</div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{lbl("普段の活動量","평소 활동량","日常活动量","Aktivitatslevel","Niveau activite","Nivel de actividad","Daily activity level")}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[["sedentary",lbl("座り仕事中心","주로 앉아서","久坐为主","Sitzend","Sedentaire","Sedentario","Mostly sitting")],["light",lbl("軽い活動","가벼운 활동","轻度活动","Leichte Aktivitat","Legere","Ligera","Light activity")],["moderate",lbl("中程度の活動","보통 활동","中度活动","Mittlere Aktivitat","Moderee","Moderada","Moderate")],["active",lbl("活動的","활동적","活跃","Aktiv","Actif","Activo","Very active")]].map(([v,lb])=>(
                <button key={v} onClick={()=>setActivity(v)} style={sel(activityLevel===v)}>{lb}</button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{lbl("食事スタイル","식사 스타일","饮食风格","Ernahrungsstil","Style alimentaire","Estilo alimenticio","Meal style")}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {[["balanced","⚖️ "+lbl("バランス重視","균형","均衡","Ausgewogen","Equilibre","Equilibrado","Balanced")],["highprotein","🥩 "+lbl("高タンパク","고단백","高蛋白","Proteinreich","Riche proteines","Alto proteinas","High protein")],["lowcarb","🥦 "+lbl("低糖質","저탄수","低碳水","Low Carb","Low Carb","Bajo carbos","Low carb")],["japanese","🍱 "+lbl("和食中心","한식 중심","日式为主","Japanisch","Japonais","Japones","Japanese")],["vegan","🌱 "+lbl("ヴィーガン","비건","纯素","Vegan","Vegetalien","Vegano","Vegan")]].map(([v,lb])=>(
                <button key={v} onClick={()=>setMealStyle(v)} style={{...sel(mealStyle===v),flex:"0 0 auto",padding:"8px 12px"}}>{lb}</button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{lbl("朝昼晩の食事比重","식사 타이밍","早中晚比重","Mahlzeitenverteilung","Repartition repas","Distribucion comidas","Meal timing")}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[["3meals",lbl("朝・昼・晩 均等","3식 균등","早中晚均等","3 Mahlzeiten","3 repas egaux","3 comidas","3 equal meals")],["bigbreakfast",lbl("朝重め","아침 위주","早饭为主","Grosses Fruhstuck","Grand petit-dejeuner","Desayuno grande","Big breakfast")],["biglunch",lbl("昼重め","점심 위주","午饭为主","Grosses Mittagessen","Grand dejeuner","Almuerzo grande","Big lunch")],["bigdinner",lbl("夜重め","저녁 위주","晚饭为主","Grosses Abendessen","Grand diner","Cena grande","Big dinner")],["intermittent",lbl("断食（16:8等）","간헐적 단식","间歇性禁食","Intervallfasten","Jeune intermittent","Ayuno intermitente","Intermittent fasting")]].map(([v,lb])=>(
                <button key={v} onClick={()=>setMealTiming(v)} style={sel(mealTiming===v)}>{lb}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{lbl("アレルギー・避けたい食材","알레르기","过敏食材","Allergien","Allergies","Alergias","Allergies / avoid")}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {[["gluten","Gluten"],["dairy",lbl("乳製品","유제품","乳制品","Milchprodukte","Laitages","Lacteos","Dairy")],["egg",lbl("卵","달걀","鸡蛋","Ei","Oeuf","Huevo","Egg")],["nut",lbl("ナッツ","견과류","坚果","Nusse","Noix","Frutos secos","Nuts")],["seafood",lbl("魚介類","해산물","海鲜","Meeresfruechte","Fruits de mer","Mariscos","Seafood")],["pork",lbl("豚肉","돼지고기","猪肉","Schweinefleisch","Porc","Cerdo","Pork")]].map(([v,lb])=>(
                <button key={v} onClick={()=>setAllergies(a=>a.includes(v)?a.filter(x=>x!==v):[...a,v])} style={{...sel(allergies.includes(v)),flex:"0 0 auto",padding:"8px 12px"}}>{lb}</button>
              ))}
            </div>
          </div>
        </div>
      );
      case 4: return (
        <div>
          <div style={{fontSize:13,color:C.muted,marginBottom:4}}>{lbl("\u30b3\u30fc\u30c1\u3092\u9078\u3093\u3067","\ucf54\uce58\ub97c \uc120\ud0dd\ud558\uc138\uc694","\u9009\u62e9\u6559\u7ec3","Trainer wählen","Choisir un coach","Elegir entrenador","Choose your coach")}</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:16}}>{lbl("\u3053\u306e\u30b3\u30fc\u30c1\u306e\u53e3\u8abf\u30fb\u6307\u5c0e\u30b9\u30bf\u30a4\u30eb\u3067\u3042\u306a\u305f\u306e\u30c8\u30ec\u30fc\u30cb\u30f3\u30b0\u304c\u5909\u308f\u308a\u307e\u3059\u3002\u5f8c\u304b\u3089\u5909\u66f4\u53ef\u80fd\u3002","\uc774 \ucf54\uce58\uc758 \ub9d0\ud22c\uc640 \uc9c0\ub3c4 \uc2a4\ud0c0\uc77c\ub85c \ud2b8\ub808\uc774\ub2dd\uc774 \ub2ec\ub77c\uc9d1\ub2c8\ub2e4. \ub098\uc911\uc5d0 \ubcc0\uacbd \uac00\ub2a5.","\u6839\u636e\u6b64\u6559\u7ec3\u7684\u8bed\u6c14\u548c\u6307\u5bfc\u98ce\u683c\uff0c\u60a8\u7684\u8bad\u7ec3\u5c06\u53d1\u751f\u53d8\u5316\u3002\u53ef\u968f\u65f6\u66f4\u6362\u3002","Der Coaching-Stil beeinflusst dein Training. Jederzeit änderbar.","Ce coach changera votre expérience. Modifiable à tout moment.","Este coach cambiará tu entrenamiento. Cambiable en cualquier momento.","This coach\'s personality shapes your entire training. Changeable anytime.")}</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {PERSONAS.map(p=>{
              const PERSONA_DETAIL = {
                bro:     { voice:{ ja:"\u300c\u304a\u3044\uff01\u307e\u3060\u3044\u3051\u308b\u305e\uFF01\u8af8\u3081\u308b\u306a\uff01\u300d", en:"\"Yo! You still got it! DON\'T QUIT!\"", ko:"\"야! \uc544\uc9c1 \ud560 \uc218 \uc788\uc5b4! \ud3ec\uae30\ud558\uc9c0 \ub9c8!\"" }, char:{ ja:"\u71b1\u8840\u3067\u5c45\u5fc3\u5730\u304c\u60aa\u304f\u3001\u611f\u60c5\u5165\u308a\u304c\u6fc0\u3057\u3044\u4f53\u80b2\u4f1a\u7cfb\u30b3\u30fc\u30c1\u3002\u6df1\u5591\u3067\u5c11\u3057\u6012\u308a\u3063\u307d\u304f\u898b\u3048\u308b\u304c\u8aa4\u89e3\u3002\u5b9f\u306f\u8aa4\u308a\u3092\u77e5\u3089\u306a\u3044\u3050\u3089\u3044\u512a\u3057\u3044\u3002", en:"Loud, passionate, slightly rough around the edges. Tough love personified. Looks intimidating but is secretly the sweetest coach. Never lets you quit.", ko:"\uc5f4\uc815\uc801\uc774\uace0 \ud300\uc791\uc9c0\uc2a4\ub7ec\uc6b4 \uccb4\uc721\uacc4 \ucf54\uce58. \uac15\ud558\uac8c \ubcf4\uc774\uc9c0\ub9cc \uc0ac\uc2e4\uc740 \ub204\uad6c\ubcf4\ub2e4 \ub530\ub73b\ud558\ub2e4." } },
                sister:  { voice:{ ja:"\u300c\u5927\u4e08\u592b\uff01\u3086\u3063\u304f\u308a\u3067\u3044\u3044\u3088\u3002\u7d9a\u3051\u308b\u3053\u3068\u304c\u5927\u4e8b\u306a\u3093\u3060\u304b\u3089\u300d", en:"\"Hey, you\'re doing great. Take your time — what matters is showing up.\"", ko:"\"기\ucf00, \uc798 \ud558\uace0 \uc788\uc5b4. \ub098\ud0c0\ub098\ub294 \uac8c \uc911\uc694\ud574.\"" }, char:{ ja:"\u6e29\u304b\u304f\u5bc4\u308a\u6dfb\u3046\u304a\u59c9\u3055\u3093\u30b3\u30fc\u30c1\u3002\u5c0f\u3055\u306a\u9032\u6b69\u3082\u5927\u3052\u3055\u306b\u8d9d\u3081\u3001\u6c17\u5206\u304c\u843d\u3061\u3066\u3044\u308b\u65e5\u3082\u512a\u3057\u304f\u30b5\u30dd\u30fc\u30c8\u3002\u7d76\u5bfe\u306b\u6012\u3089\u306a\u3044\u3002", en:"Warm, empathetic big sister energy. Celebrates every small win. Supports you on bad days. Never judges, never pushes too hard.", ko:"\ub530\ub73b\ud558\uace0 \uacf5\uac10\ud558\ub294 \uc5b8\ub2c8 \ucf54\uce58. \uc791\uc740 \uc131\uc7a5\ub3c4 \ud06c\uac8c \uccd0\ucfc4\uc918\uc8fc\uace0 \uc808\ub300 \ub2f5\ub2f5\ud558\uc9c0 \uc54a\ub2e4." } },
                kpop:    { voice:{ ja:"\u300c\u30d5\u30a9\u30fc\u30e0\u304c\u30ad\u30ec\u3044\u3068\u547c\u308a\u304c\u5909\u308f\u308b\u3088\u3002\u304b\u3063\u3053\u3088\ !\u300d", en:"\"Nice form — looking clean. That\'s idol energy!\"", ko:"\"폼 \uc0ad\ud558\ub124 — \uc544\uc774\ub3cc \uc5d0\ub108\uc9c0\ub2e4!\"" }, char:{ ja:"\u30af\u30fc\u30eb\u3067\u884c\u52d5\u6d3e\u3002\u30d5\u30a9\u30fc\u30e0\u3068\u3082\u306b\u3001\u300c\u898b\u305f\u76ee\u300d\u3092\u5927\u5207\u306b\u3059\u308b\u97d3\u56fd\u30a2\u30a4\u30c9\u30eb\u5f0f\u30c8\u30ec\u30fc\u30cb\u30f3\u30b0\u3002\u932f\u3063\u3066\u3082\u51b7\u305f\u304f\u306a\u3044\u3001\u5e38\u306b\u30b9\u30bf\u30a4\u30ea\u30c3\u30b7\u30e5\u3002", en:"Cool, precise, aesthetic-first. Trains like a K-pop idol—focused on how you look and move. Never cold, always stylish and sharp.", ko:"\ucfe8\ud558\uace0 \uc815\ubc00\ud55c \uc2a4\ud0c0\uc77c \ucf54\uce58. \uc678\ubaa8\uc640 \uc790\uc138\ub97c \uc911\uc2dc\ud558\ub294 K\ud31d \uc2a4\ud0c0\uc77c \ud2b8\ub808\uc774\ub2dd." } },
                drill:   { voice:{ ja:"\u300c\u7518\u3048\u305f\u3053\u3068\u3092\u8a00\u3046\u306a\uff01\u8a00\u3044\u8a33\u306f\u4e00\u5207\u8a31\u3055\u306a\u3044\u300d", en:"\"No excuses. I don\'t want to hear it. Move.\"", ko:"\"변\uba85 \ub4e3\uae30 \uc2eb\uc5b4. \uc6c0\uc9c1\uc5ec.\"" }, char:{ ja:"\u53b3\u3057\u3055\u304c\u611b\u60c5\u8868\u73fe\u3060\u3068\u4fe1\u3058\u3066\u3044\u308b\u30b9\u30d1\u30eb\u30bf\u30b3\u30fc\u30c1\u3002\u8a00\u3044\u8a33\u7d76\u5bfe\u30a2\u30a6\u30c8\u3002\u305d\u306e\u51b3\u3057\u3066\u6298\u308c\u306a\u3044\u6307\u5c0e\u306b\u308f\u305a\u304b\u5927\u304d\u304f\u6210\u9577\u3067\u304d\u308b\u3002", en:"Strictness is love to Drake. No excuses, no half-measures. His unbreakable standards make you grow more than you thought possible.", ko:"\uc5c4\uaca9\ud568\uc774 \uc0ac\ub791\uc774\ub77c\uace0 \uc2e0\ub150\ud558\ub294 \uc2a4\ud30c\ub974\ud0c0 \ucf54\uce58. \ubcc0\uba85 \uc808\ub300 \ube44\ud5c8. \ub354 \ud06c\uac8c \uc131\uc7a5\ud560 \uc218 \uc788\ub2e4." } },
                gyaru:   { voice:{ ja:"\u300c\u306d\u306d\uff01\u6700\u9ad8\u3060\u3063\u305f\u3088\uFF5E\uff01\u307e\u3058\u305d\u308c\u6700\u9ad8\u300d", en:"\"OMG that was AMAZING bestie! You\'re literally glowing!!\"", ko:"\"연\uc81c \ucd5c\uace0\uc600\uc5b4!! \ub9d0\uadf8\ub300 \uc5f4\uc2dc\ubbf8\ub77c\ub2c8!!\"" }, char:{ ja:"\u8d85\u30dd\u30b8\u30c6\u30a3\u30d6\u3067\u30c6\u30f3\u30b7\u30e7\u30f3\u30bc\u30ed\u3002\u30d5\u30a3\u30c3\u30c8\u30cd\u30b9\u3092\u30d1\u30fc\u30c6\u30a3\u306e\u3088\u3046\u306b\u697d\u3057\u3080\u30b3\u30fc\u30c1\u3002\u3069\u3093\u306a\u5c0f\u3055\u306a\u3053\u3068\u3067\u3082\u8d85\u5927\u6b53\u8fce\u3059\u308b\u3002", en:"Zero tension, max positivity. Turns workouts into a party. Hypes everything you do. The friend who makes the gym feel like fun.", ko:"\uc81c\ub85c \uac04\uc7a5, \ub9e5\uc2a4 \uae8d\ubbf8. \uc6b4\ub3d9\uc744 \ud30c\ud2f0\uccb4\ub9bc \ub9cc\ub4e4\uc5b4\uc8fc\ub294 \ucf54\uce58. \uc791\uc740 \uc77c\uc5d0\ub3c4 \ucd08\ub300\ud658\ud55c\ub2e4." } },
                science: { voice:{ ja:"\u300c\u3053\u306e\u30da\u30fc\u30b9\u306f\u3001\u7b4b\u5c4b\u306e\u8d85\u56de\u5fa9\u306e\u5c55\u958b\u306b\u304a\u3044\u3066\u6700\u9ad8\u8ca0\u8377\u3067\u3059\u300d", en:"\"This pace is optimal for hypertrophy given your current training load.\"", ko:"\"이 \ud398\uc774\uc2a4\ub294 \ud604\uc7ac \ud6c8\ub828 \ubd80\ud558\ub97c \uace0\ub824\ud560 \ub54c \uadfc\ube44\ub300\uc5d0 \ucd5c\uc801\uc785\ub2c8\ub2e4.\"" }, char:{ ja:"\u5168\u3066\u306e\u30a2\u30c9\u30d0\u30a4\u30b9\u306b\u79d1\u5b66\u7684\u6839\u62e0\u3092\u6dfb\u3048\u308b\u7406\u8ad6\u6d3e\u30b3\u30fc\u30c1\u3002\u6c17\u307e\u3050\u308c\u306b\u8a00\u3046\u304c\u3001\u304a\u304b\u3052\u3067\u524a\u6e1b\u3092\u77e5\u3089\u306a\u3044\u7a0b\u5ea6\u306b\u6210\u9577\u3067\u304d\u308b\u3002", en:"Evidence-backed approach for every recommendation. May sound intense, but his methods get remarkable results. You\'ll understand WHY you\'re doing everything.", ko:"\ubaa8\ub4e0 \uc870\uc5b8\uc5d0 \uacfc\ud559\uc801 \uadfc\uac70\ub97c \uc81c\uc2dc\ud558\ub294 \uc774\ub860\ud30c \ucf54\uce58. \uc5f0\uc2b5\uc758 \uc774\uc720\ub97c \ub2e4 \uc774\ud574\ud558\uace0 \uc2e4\ud589\ud560 \uc218 \uc788\ub2e4." } },
              };
              const d = PERSONA_DETAIL[p.id];
              const langK = lang==="ja"?"ja":lang==="ko"?"ko":"en";
              const isSelected = personaId === p.id;
              return (
                <button key={p.id} onClick={()=>setPersonaId(p.id)} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"14px 16px",borderRadius:12,border:"2px solid "+(isSelected?p.color:C.border),background:isSelected?p.bg:"#fff",cursor:"pointer",textAlign:"left",width:"100%",transition:"all 0.2s"}}>
                  <span style={{fontSize:26,flexShrink:0}}>{p.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                      <span style={{fontWeight:800,color:isSelected?p.color:"#111827",fontSize:15}}>{p.name}</span>
                      <span style={{fontSize:10,background:isSelected?p.color+"20":"#f3f4f6",color:isSelected?p.color:"#6b7280",padding:"2px 8px",borderRadius:8,fontWeight:600}}>{p.tag?.[lang]||p.tag?.en}</span>
                    </div>
                    {d && <div style={{fontSize:12,color:isSelected?p.color:"#374151",fontWeight:600,marginBottom:4,lineHeight:1.4,fontStyle:"italic"}}>"{d.voice?.[langK]||d.voice?.en}"</div>}
                    <div style={{fontSize:11,color:"#6b7280",lineHeight:1.6}}>{d?.char?.[langK]||d?.char?.en||p.sub?.[lang]||p.sub?.en}</div>
                    {isSelected && (
                      <div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>
                        {[
                          [lbl("\u5f37\u5ea6","\uc2e4\ub3c4","\u5f3a\u5ea6","Intensität","Intensité","Intensidad","Intensity"), p.intensity==="high"?lbl("\u9ad8\u3081","\ub192\uc74c","\u9ad8","Hoch","Haute","Alta","High"):p.intensity==="low"?lbl("\u4f4e\u3081","\ub099\uc74c","\u4f4e","Niedrig","Basse","Baja","Low"):lbl("\u6a19\u6e96","\uc911\uac04","\u4e2d","Mittel","Moyenne","Media","Mid")],
                          [lbl("\u30da\u30fc\u30b9","\ud398\uc774\uc2a4","\u8282\u594f","Tempo","Rythme","Ritmo","Pace"), p.id==="bro"||p.id==="drill"?lbl("\u901f\u3081","\ube60\ub984","\u5feb","Schnell","Rapide","Rápido","Fast"):p.id==="kpop"||p.id==="science"?lbl("\u6a19\u6e96","\uc911\uac04","\u4e2d","Mittel","Moyen","Medio","Mid"):lbl("\u30f3\u30fc\u30e3\u30ea","\ub290\ub9ac\uac8c","\u6162","Langsam","Lent","Lento","Easy")],
                          [lbl("\u30ec\u30c3\u30d7\u6570","\ubc18\ubcf5\ud69f\uc218","\u4e2a\u6570","Wiederh.","Rép.","Reps","Reps"), p.repsMulti>=1.2?lbl("\u591a\u3081","\ub9ce\uc74c","\u591a","Mehr","Plus","Más","More"):p.repsMulti<=0.85?lbl("\u5c11\u306a\u3081","\uc801\uc74c","\u5c11","Weniger","Moins","Menos","Less"):lbl("\u6a19\u6e96","\ub3d9\uc77c","\u6807\u51c6","Standard","Standard","Estándar","Standard")],
                        ].map(([k,v])=>(
                          <span key={k} style={{fontSize:10,background:p.color+"15",color:p.color,border:"1px solid "+p.color+"30",borderRadius:99,padding:"2px 8px",fontWeight:600}}>{k}: {v}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {isSelected&&<span style={{color:p.color,fontSize:18,flexShrink:0}}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      );
      case 5: return (
        <div>
          {(()=>{
            const bmt = fitnessLevel==="beginner"?"筋肉量不足タイプ":fitnessLevel==="intermediate"?"バランスタイプ":"アスリートタイプ";
            const bmtEn = fitnessLevel==="beginner"?"Low Muscle Mass":fitnessLevel==="intermediate"?"Balanced Type":"Athletic Type";
            const bmtKo = fitnessLevel==="beginner"?"근육량 부족 타입":fitnessLevel==="intermediate"?"균형 타입":"운동선수 타입";
            const bmtZh = fitnessLevel==="beginner"?"肌肉量不足型":fitnessLevel==="intermediate"?"均衡型":"运动员型";
            const _h = parseFloat(heightCm)||170;
            const _w = parseFloat(weightKg)||65;
            const _tgt = (goals.find(g=>g.id===goalId)||goals[0])?.targetBf||12;
            const _curBf = Math.max(5,Math.min(40,20-(_h-_w*0.45)*0.1));
            const _diff = Math.max(0,_curBf-_tgt);
            const daysToGoal = Math.round(Math.max(30,_diff*30));
            const prob = Math.max(12,Math.min(48,55-_diff*4));
            const probPro = Math.min(94,prob+40);
            return (
              <div>
                <div style={{textAlign:"center",marginBottom:20}}>
                  <div style={{fontSize:12,color:C.muted,marginBottom:4}}>{lbl("あなたの診断結果","당신의 진단 결과","您的诊断结果","Dein Ergebnis","Vos résultats","Tus resultados","Your diagnosis")}</div>
                  <div style={{fontFamily:"Bebas Neue",fontSize:26,color:"#111827",letterSpacing:1,lineHeight:1.2}}>
                    {lang==="ja"?bmt:lang==="ko"?bmtKo:lang==="zh"?bmtZh:bmtEn}
                  </div>
                </div>
                <div style={{background:"#f9fafb",borderRadius:16,padding:"16px",marginBottom:16}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                    <div style={{textAlign:"center",background:"#fff",borderRadius:12,padding:"12px 8px"}}>
                      <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{lbl("目標体型","목표 체형","目标体型","Ziel","Objectif","Objetivo","Goal")}</div>
                      <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{(goals.find(g=>g.id===goalId)?.[lang]||goals.find(g=>g.id===goalId)?.en||"Lean")}</div>
                    </div>
                    <div style={{textAlign:"center",background:"#fff",borderRadius:12,padding:"12px 8px"}}>
                      <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{lbl("推定期間","예상 기간","预计时间","Zeitraum","Durée","Duración","Timeline")}</div>
                      <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>~{daysToGoal}{lbl("日","일","天","Tage","jours","días","days")}</div>
                    </div>
                  </div>
                  <div style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <div style={{fontSize:12,color:"#ef4444",fontWeight:600}}>{lbl("このままの到達確率","현재 달성 확률","当前达成概率","Ohne Plan","Sans plan","Sin plan","Without coaching")}</div>
                      <div style={{fontSize:14,fontWeight:800,color:"#ef4444"}}>{prob}%</div>
                    </div>
                    <div style={{height:8,background:"#fee2e2",borderRadius:4}}>
                      <div style={{height:8,background:"#ef4444",borderRadius:4,width:prob+"%"}}/>
                    </div>
                  </div>
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <div style={{fontSize:12,color:C.green,fontWeight:600}}>{lbl("AIコーチ使用時","AI 코치 사용 시","使用AI教练时","Mit KI-Coach","Avec coach IA","Con coach IA","With AI coaching")}</div>
                      <div style={{fontSize:14,fontWeight:800,color:C.green}}>{probPro}%</div>
                    </div>
                    <div style={{height:8,background:"#dcfce7",borderRadius:4}}>
                      <div style={{height:8,background:C.green,borderRadius:4,width:probPro+"%",transition:"width 1s"}}/>
                    </div>
                  </div>
                </div>
                <div style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:14,padding:"14px 16px",marginBottom:16,border:"1px solid #bbf7d0"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#166534",marginBottom:8}}>{lbl("AIが解決する3つの課題","AI가 해결하는 3가지 과제","AI解决的3个问题","3 Probleme, die KI löst","3 défis résolus par l'IA","3 problemas que resuelve la IA","3 problems AI will solve for you")}</div>
                  {[[lbl("今日何食べればいい？","오늘 뭘 먹어야 해?","今天该吃什么？","Was soll ich essen?","Quoi manger aujourd'hui?","¿Qué comer hoy?","What should I eat today?"),lbl("→ AIが即回答","→ AI 즉시 답변","→ AI即时回答","→ KI antwortet sofort","→ IA répond","→ IA responde","→ AI answers instantly")],[lbl("今日の筋トレは？","오늘 운동은 뭐?","今天练什么？","Was trainiere ich heute?","Quel entraînement?","¿Qué entrenar hoy?","What workout today?"),lbl("→ あなた専用で提案","→ 맞춤 제안","→ 个性化推荐","→ Personalisiert","→ Personnalisé","→ Personalizado","→ Personalized for you")],[lbl("停滞期どう抜ける？","정체기 어떻게 탈출?","如何突破停滞期？","Wie Plateau überwinden?","Comment sortir du plateau?","¿Cómo superar el estancamiento?","How to break through a plateau?"),lbl("→ 記録から原因を分析","→ 기록으로 원인 분석","→ 从记录分析原因","→ Analyse der Daten","→ Analyse des données","→ Análisis de datos","→ Analyzed from your logs")]].map(([q,a],i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:i<2?6:0,paddingBottom:i<2?6:0,borderBottom:i<2?"1px solid rgba(0,0,0,0.06)":"none"}}>
                      <div style={{fontSize:11,color:"#374151"}}>{q}</div>
                      <div style={{fontSize:11,color:C.green,fontWeight:700}}>{a}</div>
                    </div>
                  ))}
                </div>
                <div style={{textAlign:"center",fontSize:11,color:"#9ca3af",marginBottom:12}}>
                  {lbl("詳細プランとAIコーチで改善できます","상세 플랜과 AI코치로 개선 가능합니다","通过详细计划和AI教练可以改善","Mit detailliertem Plan verbesserbar","Améliorable avec plan détaillé","Mejorable con plan detallado","Improvable with a detailed plan and AI coach")}
                </div>
              </div>
            );
          })()}
        </div>
      );
            case 6: return (
        <div style={{paddingBottom:8}}>

          {/* ── Hero ── */}
          <div style={{textAlign:"center",marginBottom:18}}>
            <div style={{fontFamily:"Bebas Neue",fontSize:28,color:"#111827",letterSpacing:1,lineHeight:1.15,marginBottom:6}}>
              {lbl("90日後、今より自信のある自分へ","90일 후, 지금보다 자신감 있는 나로","90天后，成为更自信的自己","In 90 Tagen, ein selbstbewussteres Du","Dans 90 jours, une version plus confiante","En 90 días, una versión más segura de ti","In 90 days, a more confident you")}
            </div>
            <div style={{fontSize:13,color:"#6b7280",lineHeight:1.5}}>
              {lbl("誰にも相談できないことも、AIコーチに相談できる。","누구에게도 말 못했던 것도 AI 코치에게 말할 수 있다.","连对任何人都说不出口的事，也能和AI教练倾诉。","Auch das, was du niemandem sagen kannst.","Même ce que tu ne peux dire à personne.","Incluso lo que no puedes decirle a nadie.","Even what you can't tell anyone — your AI coach is here.")}
            </div>
          </div>

          {/* ── Achievement comparison ── */}
          <div style={{background:"linear-gradient(135deg,#fff5f5,#fef2f2)",border:"1.5px solid #fca5a5",borderRadius:14,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontSize:11,color:"#9ca3af",textAlign:"center",marginBottom:10}}>{lbl("あなたの診断結果","당신의 진단 결과","您的诊断结果","Dein Ergebnis","Vos résultats","Tus resultados","Your diagnosis result")}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{textAlign:"center",flex:1}}>
                <div style={{fontSize:11,color:"#ef4444",marginBottom:2,fontWeight:600}}>{lbl("このまま継続","혼자 계속","独自继续","Ohne Coaching","Sans coaching","Sin coaching","Without coaching")}</div>
                <div style={{fontSize:30,fontWeight:900,color:"#ef4444",lineHeight:1}}>{(()=>{const h=parseFloat(heightCm)||170,w=parseFloat(weightKg)||65,t=(goals.find(g=>g.id===goalId)?.targetBf||12),bf=Math.max(5,Math.min(40,20-(h-w*0.45)*0.1)),d=Math.max(0,bf-t);return Math.max(12,Math.min(48,55-d*4))})()}%</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                <div style={{fontSize:18,color:"#d1d5db"}}>→</div>
                <div style={{fontSize:9,color:"#9ca3af",textAlign:"center"}}>{lbl("AIコーチで","AI코치","AI教练","Mit KI","Avec IA","Con IA","With AI")}</div>
              </div>
              <div style={{textAlign:"center",flex:1}}>
                <div style={{fontSize:11,color:C.green,marginBottom:2,fontWeight:600}}>{lbl("AIコーチ利用時","AI 코치 이용 시","使用AI教练时","Mit KI-Coach","Avec coach IA","Con coach IA","With AI coach")}</div>
                <div style={{fontSize:30,fontWeight:900,color:C.green,lineHeight:1}}>{(()=>{const h=parseFloat(heightCm)||170,w=parseFloat(weightKg)||65,t=(goals.find(g=>g.id===goalId)?.targetBf||12),bf=Math.max(5,Math.min(40,20-(h-w*0.45)*0.1)),d=Math.max(0,bf-t),p=Math.max(12,Math.min(48,55-d*4));return Math.min(94,p+40)})()}%</div>
              </div>
            </div>
            <div style={{height:6,background:"#fee2e2",borderRadius:3,marginBottom:4,position:"relative"}}>
              <div style={{position:"absolute",left:0,top:0,height:6,background:"#ef4444",borderRadius:3,width:(()=>{const h=parseFloat(heightCm)||170,w=parseFloat(weightKg)||65,t=(goals.find(g=>g.id===goalId)?.targetBf||12),bf=Math.max(5,Math.min(40,20-(h-w*0.45)*0.1)),d=Math.max(0,bf-t);return Math.max(12,Math.min(48,55-d*4))})()+"%" }}/>
            </div>
            <div style={{height:6,background:"#dcfce7",borderRadius:3,marginBottom:6}}>
              <div style={{height:6,background:C.green,borderRadius:3,width:(()=>{const h=parseFloat(heightCm)||170,w=parseFloat(weightKg)||65,t=(goals.find(g=>g.id===goalId)?.targetBf||12),bf=Math.max(5,Math.min(40,20-(h-w*0.45)*0.1)),d=Math.max(0,bf-t),p=Math.max(12,Math.min(48,55-d*4));return Math.min(94,p+40)})()+"%" }}/>
            </div>
            <div style={{fontSize:10,color:"#9ca3af",textAlign:"center"}}>{lbl("※個人差があります。推定値です。","※개인차가 있습니다. 추정치입니다.","※存在个体差异，为估算值。","※Individuelle Ergebnisse. Schätzung.","※Résultats variables. Estimation.","※Resultados variables. Estimación.","※Individual results vary. Estimated.")}</div>
          </div>

          {/* ── What you get ── */}
          <div style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:14,padding:"14px 16px",marginBottom:12,border:"1px solid #bbf7d0"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#166534",marginBottom:10}}>{lbl("AIコーチがあなたにすること","AI 코치가 당신을 위해 하는 것","AI教练为您做的事","Was dein KI-Coach für dich tut","Ce que ton coach IA fait pour toi","Lo que tu coach IA hace por ti","What your AI coach does for you")}</div>
            {[
              ["🌅",lbl("毎朝「今日やること」が届く","매일 아침 '오늘 할 일'이 온다","每天早晨收到'今日任务'","Jeden Morgen weißt du was zu tun ist","Chaque matin tu sais quoi faire","Cada mañana sabes qué hacer","Every morning, know exactly what to do")],
              ["🥗",lbl("「今日何食べる？」に即答","'오늘 뭐 먹어?' 즉시 답변","'今天吃什么？'即时回答","'Was esse ich heute?' — sofort beantwortet","'Quoi manger?' — réponse immédiate","'¿Qué como hoy?' — respuesta inmediata","'What should I eat?' answered instantly")],
              ["💪",lbl("筋トレで迷わない。毎回最適化","운동에서 고민 없음. 매번 최적화","训练不再迷茫，每次都优化","Kein Raten beim Training. Immer optimiert","Plus d'hésitation. Toujours optimisé","Sin dudas en el entrenamiento","No guesswork in training. Always optimized")],
              ["🧠",lbl("誰にも言えないことも話せる","누구에게도 말 못한 것도 말할 수 있다","连不能对任何人说的话也能倾诉","Auch das Unsagbare kannst du teilen","Même l'indicible peut être partagé","Incluso lo indecible puede ser compartido","Even the unspeakable can be shared")],
              ["📊",lbl("90日後の体型を今日から予測","90일 후 체형을 오늘부터 예측","从今天开始预测90天后的体型","90-Tage-Prognose ab heute","Prévision à 90j dès aujourd'hui","Predicción a 90 días desde hoy","Your 90-day body predicted starting today")],
            ].map(([emoji,text],i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<4?8:0}}>
                <span style={{fontSize:18,flexShrink:0}}>{emoji}</span>
                <div style={{fontSize:12,color:"#166534",fontWeight:500}}>{text}</div>
              </div>
            ))}
          </div>

          {/* ── Plan cards ── */}
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>

            {/* Annual */}
            {/* トライアルプラン */}
            <div style={{borderRadius:14,border:"2px solid "+(selectedPlan==="trial"?"#22c55e":"#8b5cf6"),background:selectedPlan==="trial"?"linear-gradient(135deg,#f0fdf4,#dcfce7)":"linear-gradient(135deg,#f5f3ff,#ede9fe)",padding:"12px 16px",cursor:"pointer",position:"relative",transition:"all 0.2s",marginBottom:8}} onClick={()=>setSelectedPlan("trial")}>
              {selectedPlan==="trial"&&<div style={{position:"absolute",top:10,right:10,background:"#22c55e",color:"#fff",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>✓</div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                    <div style={{fontFamily:"Bebas Neue",fontSize:15,color:selectedPlan==="trial"?"#166534":"#7c3aed",letterSpacing:1}}>{lbl("7日間お試し","7일 체험","7-Day Trial")}</div>
                    <div style={{background:"#8b5cf6",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:99}}>{lbl("おすすめ","추천","Best Start")}</div>
                  </div>
                  <div style={{fontSize:18,fontWeight:800,color:selectedPlan==="trial"?"#166534":"#7c3aed"}}>$1.99<span style={{fontSize:11,fontWeight:400}}> {lbl("単発・自動課金なし","단발·자동 결제 없음","one-time, no auto-charge")}</span></div>
                </div>
              </div>
              <div style={{fontSize:10,color:selectedPlan==="trial"?"#166534":"#6d28d9",marginTop:4}}>
                {lbl("7日間または50回（先着）。終了後は自動的に無料プランへ。","7일 또는 50회 중 먼저 종료. 종료 후 자동으로 무료 플랜.","7 days or 50 sessions. Returns to free plan automatically.")}
              </div>
            </div>

            <div style={{position:"relative",borderRadius:16,border:"2.5px solid "+(selectedPlan==="annual"?"#22c55e":"#f59e0b"),background:selectedPlan==="annual"?"linear-gradient(135deg,#f0fdf4,#dcfce7)":"linear-gradient(135deg,#fffbeb,#fef3c7)",padding:"16px 16px 14px",cursor:"pointer",boxShadow:selectedPlan==="annual"?"0 0 0 3px rgba(34,197,94,0.2)":"0 4px 20px rgba(245,158,11,0.15)",transition:"all 0.2s"}} onClick={()=>setSelectedPlan("annual")}>
              <div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(90deg,#f59e0b,#ef4444)",color:"#fff",fontSize:11,fontWeight:800,padding:"3px 16px",borderRadius:10,whiteSpace:"nowrap"}}>
                ⭐ {lbl("おすすめ・2ヶ月分お得","추천・2개월 무료","推荐・省2个月","Empfohlen","Recommandé","Recomendado","Best Value")}
              </div>
              {selectedPlan==="annual"&&<div style={{position:"absolute",top:10,right:10,background:"#22c55e",color:"#fff",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>✓</div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginTop:6,marginBottom:8}}>
                <div>
                  <div style={{fontFamily:"Bebas Neue",fontSize:18,color:selectedPlan==="annual"?"#166534":"#92400e",letterSpacing:1}}>{lbl("理想体型達成プラン","이상 체형 달성 플랜","理想体型达成计划","Traumkörper-Plan","Plan Corps Idéal","Plan Cuerpo Ideal","Dream Body Plan")}</div>
                  <div style={{fontSize:20,fontWeight:900,color:selectedPlan==="annual"?"#166534":"#92400e"}}>$79.99<span style={{fontSize:12,fontWeight:400}}>/{lbl("年","년","年","Jahr","an","año","yr")}</span></div>
                  <div style={{fontSize:11,color:"#b45309"}}>≈ $6.67/{lbl("月","월","月","Mo","mois","mes","mo")} <span style={{background:"#fde68a",padding:"1px 6px",borderRadius:4,fontWeight:700}}>-26%</span></div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 8px"}}>
                {[lbl("✓ 今日やることが毎日わかる","✓ 매일 오늘 할 일을 알 수 있다","✓ 每天知道该做什么","✓ Täglich weißt du was zu tun ist","✓ Chaque jour tu sais quoi faire","✓ Cada día sabes qué hacer","✓ Know what to do every day"),lbl("✓ 何を食べるか迷わない","✓ 뭘 먹어야 할지 고민 없다","✓ 不再纠结吃什么","✓ Nie mehr rätseln was essen","✓ Plus de doute sur quoi manger","✓ Sin dudas sobre qué comer","✓ Never wonder what to eat"),lbl("✓ 最短で筋肉を増やせる","✓ 최단시간에 근육을 늘릴 수 있다","✓ 最短时间增加肌肉","✓ Muskeln schnellstmöglich aufbauen","✓ Muscles en un minimum de temps","✓ Músculos en tiempo mínimo","✓ Build muscle fastest way"),lbl("✓ AIが自分のことを全部覚えてる","✓ AI가 나를 완전히 기억한다","✓ AI完全记住你","✓ KI erinnert sich an alles","✓ IA se souvient de tout","✓ IA recuerda todo","✓ AI remembers everything about you"),lbl("✓ 90日後の達成確率を表示","✓ 90일 달성 확률 표시","✓ 显示90天达成概率","✓ 90-Tage Erfolgsquote","✓ Taux de succès 90j","✓ Probabilidad 90 días","✓ 90-day success rate shown"),lbl("✓ 食事スキャン","✓ 식사 스캔","✓ 饮食扫描","✓ Mahlzeiten-Scan","✓ Scan repas","✓ Scan comida","✓ Meal scanner")].map((f,i)=><div key={i} style={{fontSize:10,color:selectedPlan==="annual"?"#166534":"#92400e",fontWeight:500}}>{f}</div>)}
              </div>
            </div>

            {/* Monthly */}
            <div style={{borderRadius:14,border:"1.5px solid "+(selectedPlan==="monthly"?"#22c55e":"#6366f1"),background:selectedPlan==="monthly"?"linear-gradient(135deg,#f0fdf4,#dcfce7)":"linear-gradient(135deg,#eef2ff,#e0e7ff)",padding:"12px 16px",cursor:"pointer",position:"relative",transition:"all 0.2s"}} onClick={()=>setSelectedPlan("monthly")}>
              {selectedPlan==="monthly"&&<div style={{position:"absolute",top:10,right:10,background:"#22c55e",color:"#fff",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>✓</div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontFamily:"Bebas Neue",fontSize:15,color:selectedPlan==="monthly"?"#166534":"#4338ca",letterSpacing:1}}>PRO {lbl("月額","월간","月付","Monatlich","Mensuel","Mensual","Monthly")}</div>
                  <div style={{fontSize:18,fontWeight:800,color:selectedPlan==="monthly"?"#166534":"#4338ca"}}>$8.99<span style={{fontSize:11,fontWeight:400}}>/{lbl("月","월","月","Mo","mois","mes","mo")}</span></div>
                </div>
                <div style={{fontSize:11,color:"#9ca3af",textAlign:"right"}}>{lbl("全機能","모든 기능","所有功能","Alle Funktionen","Toutes fonctions","Todas funciones","All features")}<br/>{lbl("いつでも解約","언제든 취소","随时取消","Jederzeit kündbar","Annulable","Cancelable","Cancel anytime")}</div>
              </div>
            </div>

            {/* Free */}
            <div style={{borderRadius:12,border:"1.5px solid "+(selectedPlan==="free"?"#22c55e":"#e5e7eb"),background:selectedPlan==="free"?"linear-gradient(135deg,#f0fdf4,#dcfce7)":"#fafafa",padding:"10px 14px",cursor:"pointer",position:"relative",transition:"all 0.2s"}} onClick={()=>setSelectedPlan("free")}>
              {selectedPlan==="free"&&<div style={{position:"absolute",top:10,right:10,background:"#22c55e",color:"#fff",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>✓</div>}
              <div style={{fontSize:12,color:"#9ca3af",fontWeight:600,marginBottom:3}}>{lbl("無料で試す","무료로 시작","免费试用","Kostenlos testen","Essai gratuit","Prueba gratis","Start free")}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"2px 12px"}}>
                {[lbl("専属AIコーチ","전담 AI 코치","专属AI教练","Persönlicher KI-Coach","Coach IA dédié","Coach IA dedicado","Personal AI coach"),lbl("未来体型予測","미래 체형 예측","未来体型预测","Körper-Prognose","Prévision corporelle","Predicción corporal","Body prediction"),lbl("食事アドバイス","식사 어드바이스","饮食建议","Ernährungsberatung","Conseils nutri","Asesoramiento nutri","Meal advice"),lbl("AI 3回/日","AI 3회/일","AI 3次/天","KI 3x/Tag","IA 3x/jour","IA 3x/día","AI 3x/day")].map((f,i)=><div key={i} style={{fontSize:10,color:"#c4b5a0"}}>{f}</div>)}
              </div>
            </div>
          </div>

          {/* Agree + Legal */}
          <div style={{padding:"10px 12px",background:"#f9fafb",borderRadius:10,marginBottom:10}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:6}}>
              <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} style={{marginTop:2,width:16,height:16,accentColor:C.green,flexShrink:0}}/>
              <span style={{fontSize:11,color:"#6b7280",lineHeight:1.5}}>{t.agree}</span>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[["terms",lbl("利用規約","이용약관","使用条款","AGB","CGU","Términos","Terms")],["privacy",lbl("プライバシーポリシー","개인정보처리방침","隐私政策","Datenschutz","Confidentialité","Privacidad","Privacy")],["sct",lbl("特定商取引法","특정상거래법","特定商业交易法","Pflichtangaben","Mentions légales","Avisos legales","Legal Notice")]].map(([key,label])=>(
                <button key={key} onClick={()=>setLegalModal(key)} style={{fontSize:10,color:C.green,background:"none",border:"none",cursor:"pointer",textDecoration:"underline",padding:0}}>{label}</button>
              ))}
            </div>
          </div>

          {/* CTA */}
          {selectedPlan&&agreed?(
            <button onClick={()=>{
  if(selectedPlan==="free"){handleDone();return;}
  const uid   = sbUser?.user?.id || "";
  const email = sbUser?.email || sbUser?.user?.email || "";
  const base  = selectedPlan==="trial"?STRIPE_TRIAL:selectedPlan==="annual"?STRIPE_ANNUAL:STRIPE_MONTHLY;
  const returnUrl = encodeURIComponent(window.location.origin + window.location.pathname);
  location.href = base + "?client_reference_id=" + uid + "&prefilled_email=" + encodeURIComponent(email) + "&return_url=" + returnUrl;
}} style={{width:"100%",background:selectedPlan==="free"?"#9ca3af":"linear-gradient(135deg,#22c55e,#16a34a)",border:"none",borderRadius:16,padding:"18px 0",color:"#fff",fontFamily:"Bebas Neue",fontSize:22,letterSpacing:2,cursor:"pointer",boxShadow:selectedPlan==="free"?"none":"0 4px 20px rgba(34,197,94,0.3)"}}>
              {selectedPlan==="free"?lbl("無料で始める →","무료로 시작 →","免费开始 →","Kostenlos starten →","Commencer gratuit →","Empezar gratis →","Start free →"):lbl("AIコーチとの面談を始める →","AI 코치와의 면담 시작 →","开始与AI教练的面谈 →","KI-Coach-Gespräch starten →","Commencer avec mon coach IA →","Iniciar con mi coach IA →","Start with your AI coach →")}
            </button>
          ):(
            <div style={{textAlign:"center",padding:"14px 0",fontSize:12,color:"#9ca3af"}}>
              {!selectedPlan?lbl("プランを選んでください","플랜을 선택하세요","请选择计划","Plan auswählen","Choisissez un plan","Elige un plan","Select a plan above"):lbl("規約に同意してください","약관에 동의해주세요","请同意条款","AGB zustimmen","Accepter les CGU","Acepta los términos","Please agree to continue")}
            </div>
          )}
          <div style={{textAlign:"center",fontSize:10,color:"#9ca3af",marginTop:8}}>
            {lbl("いつでも解約可能 · Stripe決済で安全","언제든지 취소 가능 · 안전한 결제","随时取消 · 安全支付","Jederzeit kündbar · Sicher","Annulable · Sécurisé","Cancelable · Seguro","Cancel anytime · Secure payment by Stripe")}
          </div>
        </div>
      );

      default: return null;
    }
  }

  if (legalModal) {
    const lData = LEGAL[legalModal]?.[lang] || LEGAL[legalModal]?.ja || LEGAL[legalModal]?.en || {};
    return (
      <div style={{minHeight:"100vh",background:"#fff",padding:"24px 20px",fontFamily:"DM Sans, sans-serif",maxWidth:480,margin:"0 auto"}}>
        <button onClick={()=>setLegalModal(null)} style={{background:"#f3f4f6",border:"none",borderRadius:"50%",width:32,height:32,fontSize:14,cursor:"pointer",marginBottom:16}}>✕</button>
        <div style={{fontFamily:"Bebas Neue",fontSize:20,letterSpacing:2,color:"#111827",marginBottom:16}}>{lData.title||""}</div>
        <div style={{fontSize:13,color:"#374151",lineHeight:1.9,whiteSpace:"pre-line"}}>{lData.body||""}</div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#e8f8ef 0%,#f0fdf4 60%,#e0f2fe 100%)",display:"flex",flexDirection:"column",padding:"24px 20px",fontFamily:"DM Sans, sans-serif",maxWidth:480,margin:"0 auto"}}>
      <style>{FONTS}</style>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <button onClick={()=>step>0?setStep(s=>s-1):null} style={{background:"none",border:"none",color:step>0?C.muted:"transparent",fontSize:13,cursor:step>0?"pointer":"default",padding:0}}>
            {lbl("← 戻る","← 뒤로","← 返回","← Zurück","← Retour","← Volver","← Back")}
          </button>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:11,color:C.muted}}>{step+1}/{STEP_COUNT}</span>
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowLP(p=>!p)} style={{background:"rgba(255,255,255,0.9)",border:"1px solid "+C.border,borderRadius:16,padding:"3px 8px",fontSize:11,cursor:"pointer"}}>
                {LANGS.find(l=>l.code===lang)?.flag} {lang.toUpperCase()} ▾
              </button>
              {showLP&&(
                <div style={{position:"absolute",right:0,top:26,background:"#fff",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.10)",border:"1px solid "+C.border,overflow:"hidden",zIndex:200,minWidth:120}}>
                  {LANGS.map(l=>(<button key={l.code} onClick={()=>{setLang(l.code);setShowLP(false);}} style={{display:"flex",alignItems:"center",gap:6,width:"100%",padding:"8px 10px",background:lang===l.code?C.greenGlow:"transparent",border:"none",cursor:"pointer",fontSize:12,color:lang===l.code?C.green:"#374151"}}>{l.flag} {l.label}</button>))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{height:3,background:C.dim,borderRadius:2}}>
          <div style={{height:3,background:C.green,borderRadius:2,width:((step+1)/STEP_COUNT*100)+"%",transition:"width 0.3s"}}/>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {renderContent()}
      </div>
      {step < 6 && (()=>{
        const disabled = step===0 && (!nickname.trim() || !heightCm || !weightKg);
        return (
          <button onClick={disabled?null:()=>{ setStep(s=>s+1); setTimeout(()=>{ topRef.current?.scrollIntoView({behavior:"smooth",block:"start"}); window.scrollTo({top:0,behavior:"smooth"}); },50); }} style={{marginTop:20,width:"100%",background:disabled?"#e5e7eb":C.green,border:"none",borderRadius:14,padding:"16px 0",color:disabled?"#9ca3af":"#000",fontFamily:"Bebas Neue",fontSize:20,letterSpacing:2,cursor:disabled?"default":"pointer"}}>
            {step===5?lbl("改善プランを見る →","개선 플랜 보기 →","查看改善计划 →","Plan ansehen →","Voir le plan →","Ver el plan →","See my plan →"):t.next}
          </button>
        );
      })()}
    </div>
  );
}

function App() {
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [authStep, setAuthStep] = useState("loading"); // loading|signin|app
  const [sbUser, setSbUser]     = useState(null);
  const [authErr, setAuthErr]   = useState("");
  const [showPw,  setShowPw]    = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [authEmail, setAuthEmail]   = useState("");
  const [authPw, setAuthPw]         = useState("");
  const [authMode, setAuthMode]     = useState("signin"); // signin|signup
  const [authLoading, setAuthLoading] = useState(false);

  const [profile, setProfile]   = useState(null);
  const [lang, setLang]         = useState("en");
  const [tab, setTab]           = useState("home");
  const [isPro, setIsPro]       = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showSettings, setShowSettings]   = useState(false);
  const [appSettings, setAppSettings]     = useState({
    maintenance_mode: false, free_signup_enabled: true,
    free_ai_enabled: true, trial_enabled: true, pro_enabled: true,
  });
  const [showTrialPaywall, setShowTrialPaywall] = useState(false);
  const [legalModal, setLegalModal]     = useState(null);

  const [chatHist, setChatHist] = useState([]);
  const [chatIn, setChatIn]     = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [usageCache, setUsageCache] = useState(() => {
    const cached = lsGet("mb_usage_cache", { remaining: 3, limit: 3, used: 0, isPro: false });
    // dayKeyが今日と違う場合はリセット（UTCベース）
    const todayUTC = new Date().toISOString().slice(0, 10);
    if (cached.dayKey && cached.dayKey !== todayUTC) {
      return { remaining: cached.isPro ? 300 : 3, limit: cached.isPro ? 300 : 3, used: 0, isPro: cached.isPro || false, dayKey: todayUTC };
    }
    return cached;
  });

  const [schedule, setSchedule] = useState([]);
  const [counterM, setCounterM] = useState(null); // {exercise, sets, reps}
  const [coachView, setCoachView] = useState("calendar"); // calendar|chat

  const [weightLog, setWeightLog] = useState({});
  const [weightInput, setWeightInput] = useState("");
  const [mood, setMood]           = useState(2);
  const [streak, setStreak]       = useState(0);
  const [confScore, setConfScore] = useState(0);
  const [resetCountdown, setResetCountdown] = useState("");

  // UTC リセットカウントダウン（1分ごとに更新）
  useEffect(() => {
    function calcCountdown() {
      const now = new Date();
      const isPro_ = isPro;
      let resetTime;
      if (isPro_) {
        // 月次リセット: 翌月1日 UTC 00:00
        resetTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
      } else {
        // 日次リセット: 翌日 UTC 00:00
        resetTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      }
      const diff = resetTime - now;
      if (diff <= 0) { setResetCountdown("00:00:00"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (isPro_) {
        const d = Math.floor(diff / 86400000);
        setResetCountdown(d > 0 ? `${d}日${h % 24}時間` : `${h}時間${String(m).padStart(2,"0")}分`);
      } else {
        setResetCountdown(`${String(h).padStart(2,"0")}時間${String(m).padStart(2,"0")}分${String(s).padStart(2,"0")}秒`);
      }
    }
    calcCountdown();
    const timer = setInterval(calcCountdown, 1000);
    return () => clearInterval(timer);
  }, [isPro]);

  const [coachMsgFixed, setCoachMsgFixed] = useState(null); // 固定メッセージ
  const [calDate, setCalDate]   = useState(new Date());
  const [calFilter, setCalFilter] = useState("all"); // all|done|planned|missed

  const [meals, setMeals]       = useState([]);
  const [mealDate, setMealDate]   = useState(todayKey());
  const [futureMenus, setFutureMenus] = useState(() => lsGet("mb_future_menus", {}));
  const [menuLoading, setMenuLoading] = useState(false);
  const [nutChatHist, setNutChatHist] = useState([]);
  const [nutChatIn, setNutChatIn]     = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [scannedMeal, setScannedMeal] = useState(null);
  const [mealHist, setMealHist] = useState({}); // { dateKey: [meals] }

  const [showCancelFb, setShowCancelFb] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const chatEndRef = useRef(null);

  const MOODS = ["😔","😐","🙂","😊","🔥"];
  const coach = PERSONAS.find(p => p.id === profile?.coachId) || PERSONAS[0];
  const today = todayKey();

  const todaySchedule = schedule.filter(s => s.dateKey === today);
  const todayDone     = todaySchedule.filter(s => s.done).length;
  const todayTotal    = todaySchedule.length;
  const todayMeals    = meals.filter(m => m.dateKey === today);
  const totCal        = todayMeals.reduce((s, m) => s + (m.cal || 0), 0);
  const totPro        = todayMeals.reduce((s, m) => s + (m.protein || 0), 0);
  const calGoal       = profile?.tdee ? Math.round(profile.tdee * (profile.bodyGoal?.id === "muscular" ? 1.1 : 0.85)) : 2000;
  const LEVELS=[{lv:1,label:{ja:"一般人",ko:"일반인",zh:"普通人",en:"Beginner"},minXp:0},{lv:2,label:{ja:"運動初心者",ko:"운동 초보",zh:"运동新手",en:"Novice"},minXp:100},{lv:3,label:{ja:"筋トレ習慣化",ko:"운동 루틴화",zh:"运动习惯",en:"Consistent"},minXp:300},{lv:4,label:{ja:"細マッチョ",ko:"슬림핏",zh:"精实线条",en:"Lean & Fit"},minXp:600},{lv:5,label:{ja:"フィジーク",ko:"피지크",zh:"健美型",en:"Athletic"},minXp:1000},{lv:6,label:{ja:"理想の体型",ko:"이상적 체형",zh:"理想体型",en:"Dream Body"},minXp:1500}];
  const streakVal=streak;
  const xp=streakVal*10+schedule.filter(s=>s.done).length*5;
  const curLv=LEVELS.slice().reverse().find(l=>xp>=l.minXp)||LEVELS[0];
  const nextLv=LEVELS.find(l=>l.minXp>xp)||LEVELS[LEVELS.length-1];
  const lvPct=nextLv.minXp>curLv.minXp?Math.round((xp-curLv.minXp)/(nextLv.minXp-curLv.minXp)*100):100;
  const targetBf=profile?.bodyGoal?.targetBf||12;
  const estCurBf=profile?.currentWeightKg&&profile?.heightCm?Math.max(5,Math.min(40,20-(profile.heightCm-profile.currentWeightKg*0.45)*0.1)):20;
  const bfDiff=Math.max(0,estCurBf-targetBf);
  const achieveRate = isPro
    ? calcGoalProgress(profile, schedule, meals, weightLog, streak)
    : Math.min(99,Math.max(1,Math.round(100-bfDiff*8)));
  const lateNight     = new Date().getHours() >= 22 || new Date().getHours() < 5;

  const TRIAL_MONTHLY_LIMIT_UI = 50;
  const cl = (() => {
    const isTrialPlan     = profile?.plan_type === "trial";
    const trialStartedAt  = profile?.trial_started_at ? new Date(profile.trial_started_at) : null;
    const nowMs           = Date.now();
    const TRIAL_MS        = 7 * 24 * 60 * 60 * 1000;
    const trialExpiredBy7   = trialStartedAt ? (nowMs - trialStartedAt) >= TRIAL_MS : false;
    const trialDaysLeft     = trialStartedAt
      ? Math.max(0, Math.ceil((trialStartedAt.getTime() + TRIAL_MS - nowMs) / (1000*60*60*24)))
      : 7;

    const remaining = usageCache.remaining ?? 3;
    const used      = usageCache.used      ?? 0;
    const trialExpiredBy50  = isTrialPlan && remaining <= 0; // 50回到達

    // ★ 終了条件：7日経過 OR 50回到達（どちらか早い方）
    const trialExpired    = isTrialPlan && (trialExpiredBy7 || trialExpiredBy50);
    const isTrial         = isTrialPlan && !trialExpired;

    const limit     = usageCache.limit ?? (isPro ? 300 : isTrial ? 50 : 3);
    // トライアル終了（7日 or 50回）→ チャット不可
    const canChat   = trialExpired ? false : remaining > 0;
    return {
      used,
      limit,
      remaining,
      canChat,
      isFirstDay:       usageCache.isFirstDay || false,
      isTrial,
      trialExpired,
      trialExpiredBy7,
      trialExpiredBy50,
      trialDaysLeft,
      trialRemaining:   isTrial ? remaining : null,
      trialUsed:        isTrial ? used : null,
    };
  })();

  const canChat = cl.canChat;

  // コーチメッセージを一度だけ計算して固定（毎秒変わらないよう）
  useEffect(() => {
    if (!profile || coachMsgFixed !== null) return;
    // ここで計算したメッセージをセット（後でコーチカード側で使う）
    setCoachMsgFixed("__ready__");
  }, [profile]);

  // app_settings ポーリング（60秒ごと）
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/app-settings");
        if (res.ok) {
          const data = await res.json();
          setAppSettings(data);
        }
      } catch {}
    }
    fetchSettings();
    const timer = setInterval(fetchSettings, 60000);
    return () => clearInterval(timer);
  }, []);

  // トライアル終了検知 → Paywallを1回だけ自動表示
  useEffect(() => {
    if (cl.trialExpired && !isPro) {
      const shownKey = "mb_trial_paywall_shown";
      const alreadyShown = lsGet(shownKey, false);
      if (!alreadyShown) {
        setShowTrialPaywall(true);
        lsSet(shownKey, true);
      }
    }
  }, [cl.trialExpired]);

  useEffect(() => {
    const saved = lsGet("mb_profile", null);
    if (saved) {
      setProfile(saved);
      setLang(saved.lang || "en");
      setIsPro(saved.isPro || false);
    }
    const savedSchedule = lsGet("mb_schedule", []);
    setSchedule(savedSchedule);
    const savedWeights = lsGet("mb_weights", {});
    setWeightLog(savedWeights);
    const savedMeals = lsGet("mb_meals", {});
    setMealHist(savedMeals);
    const todayMealsArr = savedMeals[today] || [];
    setMeals(todayMealsArr);
    const savedChat = lsGet("mb_chat", []);
    setChatHist(savedChat);
    const savedCounts = lsGet("mb_usage_cache", { remaining: 3, limit: 3, used: 0, isPro: false });
    setUsageCache(savedCounts);
    const savedStreak = lsGet("mb_streak", { count: 0, lastDate: "" });
    // ログイン頻度計算
    const loginHistory = lsGet("mb_login_history", []);
    const todayEntry = todayKey();
    if (!loginHistory.includes(todayEntry)) {
      const updated = [...loginHistory, todayEntry].slice(-30); // 最大30日保持
      lsSet("mb_login_history", updated);
    }
    updateStreak(savedStreak);
  }, []);

  useEffect(() => {
    (async () => {
    const savedUser = lsGet("mb_sb_user", null);
    if (savedUser?.access_token) {
      // Supabaseでトークンの有効性を確認
      try {
        const verifyRes = await fetch(SUPABASE_URL + "/auth/v1/user", {
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": "Bearer " + savedUser.access_token,
          },
        });
        if (verifyRes.ok) {
          setSbUser(savedUser);
          // profileをlsから先に復元（Supabase取得前に表示できるように）
          const cachedProfile = lsGet("mb_profile", null);
          if (cachedProfile) {
            setProfile(cachedProfile);
            setLang(cachedProfile.lang || "ja");
          }
          // Supabase側のis_pro（webhook更新済み）を確認
          try {
            const latestProf = await sb.getProfile(savedUser.user?.id, savedUser.access_token);
            if (latestProf?.is_pro !== undefined) setIsPro(latestProf.is_pro);
            if (latestProf?.profile_data) {
              const pd = JSON.parse(latestProf.profile_data);
              // nicknameが空の場合はキャッシュから復元
              const cachedPd2 = lsGet("mb_profile", null);
              if (!pd.nickname && cachedPd2?.nickname) pd.nickname = cachedPd2.nickname;
              setProfile(pd); setLang(pd.lang || "ja");
              lsSet("mb_profile", pd);
            }
          } catch(e) { /* silent */ }
          setAuthStep("app");
        } else {
          // トークン期限切れ → ログイン画面へ
          lsSet("mb_sb_user", null);
          setAuthStep("signin");
        }
      } catch {
        setSbUser(savedUser);
        setAuthStep("app");
      }
    } else {
      setAuthStep("signin");
    }
    })();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHist]);

  function updateStreak(saved) {
    const { count, lastDate } = saved;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = toDateKey(yesterday);
    if (lastDate === today) {
      setStreak(count);
    } else if (lastDate === yKey) {
      const newCount = count + 1;
      setStreak(newCount);
      lsSet("mb_streak", { count: newCount, lastDate: today });
    } else {
      setStreak(1);
      lsSet("mb_streak", { count: 1, lastDate: today });
    }
  }

  async function handlePasswordReset() {
    if (!resetEmail) return;
    try {
      await fetch(SUPABASE_URL + "/auth/v1/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: resetEmail }),
      });
      setResetSent(true);
    } catch (e) {
      console.error("reset error:", e);
    }
  }

  function handleGuestLogin() {
    // ゲストモード: Supabase不要でローカルのみで動作
    const guestUser = { user: { id: "guest_"+Date.now() }, access_token: "guest", email: "guest@makebody.app", isGuest: true };
    setSbUser(guestUser);
    lsSet("mb_sb_user", guestUser);
    // 既存のローカルprofileがあればそれを使う
    const localProf = lsGet("mb_profile", null);
    if (localProf) {
      setProfile(localProf);
      setLang(localProf.lang || lang);
      setIsPro(false);
      setAuthStep("app");
    } else {
      // プロフィールなし → オンボーディングへ
      setAuthStep("app");
    }
  }

  async function handleAuth() {
    setAuthLoading(true); setAuthErr("");
    try {
      const res = authMode === "signup"
        ? await sb.signUp(authEmail, authPw)
        : await sb.signIn(authEmail, authPw);
      if (res.error || res.error_description || res.msg) {
        const msg = res.error?.message || res.error_description || res.msg || res.error || "";
        if (msg.includes("Invalid login") || msg.includes("invalid_credentials") || msg.includes("Invalid email") || msg.includes("Email not confirmed")) {
          setAuthErr(lang==="ja"?"メールアドレスまたはパスワードが間違っています。":lang==="ko"?"이메일 또는 비밀번호가 올바르지 않습니다.":"Invalid email or password.");
        } else if (msg.includes("already registered") || msg.includes("already been registered") || msg.includes("User already")) {
          setAuthErr(lang==="ja"?"このメールアドレスはすでに登録済みです。":lang==="ko"?"이미 등록된 이메일 주소입니다.":"This email is already registered.");
        } else if (msg.includes("Password should") || msg.includes("password")) {
          setAuthErr(lang==="ja"?"パスワードは6文字以上にしてください。":lang==="ko"?"비밀번호는 6자 이상이어야 합니다.":"Password must be at least 6 characters.");
        } else {
          setAuthErr((lang==="ja"?"エラー: ":lang==="ko"?"오류: ":"Error: ") + (msg || (lang==="ja"?"再度お試しください。":"Please try again.")));
        }
      }
      else if (res.session?.access_token || res.access_token) {
        // Supabaseがsessionオブジェクトで返す場合も対応
        if (!res.access_token && res.session?.access_token) {
          res.access_token = res.session.access_token;
          res.user = res.user || res.session.user;
        }
        const user = { ...res, email: authEmail };
        setSbUser(user); lsSet("mb_sb_user", user);
        // Load profile from Supabase
        const prof = await sb.getProfile(res.user?.id, res.access_token);
        if (prof?.profile_data) {
          const pd = JSON.parse(prof.profile_data);
          // nicknameが空の場合はlocalStorageのキャッシュから復元
          const cachedPd = lsGet("mb_profile", null);
          if (!pd.nickname && cachedPd?.nickname) pd.nickname = cachedPd.nickname;
          setProfile(pd); setLang(pd.lang || "en");
          setIsPro(prof.is_pro || false);  // ← Webhook/Supabase側のis_proのみ参照
          lsSet("mb_profile", pd);
          if (prof.chat_history) {
            const ch = JSON.parse(prof.chat_history);
            setChatHist(ch); lsSet("mb_chat", ch);
          }
          if (prof.workout_history) {
            const wh = JSON.parse(prof.workout_history);
            setSchedule(wh); lsSet("mb_schedule", wh);
          }
          if (prof.weight_history) {
            const wgh = JSON.parse(prof.weight_history);
            setWeightLog(wgh); lsSet("mb_weight", wgh);
          }
          if (prof.meal_history) {
            const mh = JSON.parse(prof.meal_history);
            setMeals(mh); lsSet("mb_meals", mh);
          }
          if (prof.coach_memory) {
            lsSet("mb_coach_memory", prof.coach_memory);
          }
        }
        // サーバー側UTC基準の利用回数を取得
        try {
          const usageRes = await fetch("/api/usage", {
            headers: {
              "x-user-id":      res.user?.id,
              "x-access-token": res.access_token || "",
            },
          });
          if (usageRes.ok) {
            const usageData = await usageRes.json();
            setUsageCache(usageData);
            lsSet("mb_usage_cache", usageData);
          }
        } catch(e) { /* silent */ }
        // Supabase側のis_pro（webhook更新済み）を確認してセット
        if (prof?.is_pro !== undefined) {
          setIsPro(prof.is_pro);
        }
        setAuthStep("app");
      }
      // メール確認待ち（Confirm emailがオンの場合）
      else if (authMode === "signup" && !res.error && !res.access_token) {
        setAuthErr(lang==="ja"?"確認メールを送信しました。メールをご確認ください。":lang==="ko"?"확인 이메일을 발송했습니다. 이메일을 확인해주세요.":"Confirmation email sent. Please check your inbox.");
      }
    } catch (e) {
      console.error("auth error:", e);
      setAuthErr(lang==="ja"?"通信エラーが発生しました。しばらくしてから再試行してください。":lang==="ko"?"네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.":"Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    if (sbUser?.access_token) {
      await sb.signOut(sbUser.access_token).catch(() => {});
    }
    setSbUser(null); lsSet("mb_sb_user", null);
    setProfile(null); lsSet("mb_profile", null);
    setChatHist([]); lsSet("mb_chat", []);
    setAuthStep("signin");
    setShowSettings(false);
  }

  async function saveProfile(p) {
    setProfile(p); setLang(p.lang || "en");
    lsSet("mb_profile", p);
    if (sbUser?.access_token && sbUser?.user?.id) {
      if (sbUser?.isGuest) { lsSet("mb_profile", prof); return; }
      await sb.upsertProfile(sbUser.user.id, sbUser.access_token, {
        profile_data: JSON.stringify(p),
        lang: p.lang || "en",
        email: sbUser.email || sbUser.user?.email || null,  // webhook連携用
        is_pro: isPro,  // is_proはwebhookのみで変更。ここでは現在値を維持
      }).catch(() => {});
    }
  }

  async function syncWorkoutHistory(data) {
    lsSet("mb_schedule", data);
    if (sbUser?.access_token && sbUser?.user?.id) {
      if(!sbUser?.isGuest) sb.patchProfile(sbUser.user.id, sbUser.access_token, {
        workout_history: JSON.stringify(data.slice(-200)),
      });
    }
  }
  async function syncMealHistory(data) {
    lsSet("mb_meals", data);
    if (sbUser?.access_token && sbUser?.user?.id) {
      if(!sbUser?.isGuest) sb.patchProfile(sbUser.user.id, sbUser.access_token, {
        meal_history: JSON.stringify(data.slice(-100)),
      });
    }
  }
  async function syncWeightHistory(data) {
    lsSet("mb_weight", data);
    if (sbUser?.access_token && sbUser?.user?.id) {
      if(!sbUser?.isGuest) sb.patchProfile(sbUser.user.id, sbUser.access_token, {
        weight_history: JSON.stringify(data.slice(-365)),
      });
    }
  }
  async function syncCoachMemory(mem) {
    lsSet("mb_coach_memory", mem);
    if (sbUser?.access_token && sbUser?.user?.id) {
      if(!sbUser?.isGuest) sb.patchProfile(sbUser.user.id, sbUser.access_token, {
        coach_memory: mem,
      });
    }
  }

  function calcGoalProgress(profile, schedule, meals, weightLog, streak) {
    if (!profile) return 0;
    const targetBf = profile.bodyGoal?.targetBf || 12;
    const estBf    = profile.estCurrentBf || 25;
    const bfDiff   = Math.max(0, estBf - targetBf);
    const bfMax    = Math.max(1, (profile.startBf || estBf) - targetBf);

    // 体脂肪進捗 40%
    const bfProgress = Math.min(1, (bfMax - bfDiff) / bfMax);

    // ワークアウト達成率 30%（直近7日）
    const recentDays = 7;
    const targetDays = profile.daysPerWeek || 3;
    const doneDays   = [...new Set(
      schedule.filter(s => s.done).map(s => s.dateKey)
    )].length;
    const workoutProgress = Math.min(1, doneDays / Math.max(1, targetDays * (recentDays / 7)));

    // ストリーク 20%（最大30日）
    const streakProgress = Math.min(1, (streak || 0) / 30);

    // 食事達成率 10%（今日のカロリー達成）
    const todayMealsData = meals.filter(m => m.dateKey === today);
    const totCal  = todayMealsData.reduce((s, m) => s + (m.cal || 0), 0);
    const calGoal = profile.tdee ? Math.round(profile.tdee * 0.85) : 1800;
    const mealProgress = totCal > 0 ? Math.min(1, totCal / calGoal) : 0;

    const total = Math.round(
      bfProgress    * 40 +
      workoutProgress * 30 +
      streakProgress  * 20 +
      mealProgress    * 10
    );
    return Math.max(0, Math.min(100, total));
  }

  function calcFutureBody(profile, schedule, streak) {
    if (!profile?.currentWeightKg) return null;
    const w    = profile.currentWeightKg;
    const bf   = profile.estCurrentBf || 22;
    const days = profile.daysPerWeek  || 3;
    const goal = profile.bodyGoal?.targetBf || 12;
    const isBeginner = profile.fitnessLevel === "beginner";

    // 1週あたりの推定消費カロリー（強度・日数補正）
    const calPerSession = profile.fitnessLevel === "advanced" ? 350 :
                          profile.fitnessLevel === "regular"  ? 300 : 250;
    const weeklyBurn = calPerSession * days;

    function calcAt(targetDays) {
      const weeks     = targetDays / 7;
      const totalBurn = weeklyBurn * weeks;
      const fatLoss   = Math.round((totalBurn / 7700) * 10) / 10;
      const muscle    = Math.round((isBeginner ? 0.5 : 0.25) * (targetDays / 30) * 10) / 10;
      const weight    = Math.round(Math.max(40, w - fatLoss + muscle * 0.3) * 10) / 10;
      const bfChange  = (fatLoss / Math.max(1, w)) * 100;
      const bfEst     = Math.round(Math.max(goal - 2, bf - bfChange) * 10) / 10;
      const streakBoost = Math.min(10, (streak || 0) * 0.3);
      const rate      = Math.min(94, Math.max(20,
        55 + streakBoost + (targetDays / 90 * 15) + (days >= 4 ? 8 : days >= 3 ? 4 : 0)
      ));
      return { days: targetDays, weight, bf: bfEst, fatLoss, muscle, rate };
    }

    const p30 = calcAt(30);
    const p60 = calcAt(60);
    const p90 = calcAt(90);

    const streakBoost = Math.min(10, (streak || 0) * 0.3);
    return {
      // 後方互換
      weight: p90.weight, bf: p90.bf, fatLoss: p90.fatLoss,
      muscle: p90.muscle, achieveRate: p90.rate,
      daysLeft: 90 - Math.min(90, streak || 0),
      // 3段階
      timeline: [p30, p60, p90],
    };
  }

  function handleOnboardingComplete(p) {
    const lg = LIFE_GOALS.find(g => g.id === p.lifeGoal);
    const c  = PERSONAS.find(per => per.id === p.coachId) || PERSONAS[0];
    const greet = {
      en: c.name + " here — " + p.nickname + "'s personal coach, starting now." +
          " I know you're aiming for " + (lg?.en || "a better body") + ". " +
          (p.fitnessLevel === "beginner" ? "You're just starting out — that's perfect. I'll keep things simple and build from there." :
           p.fitnessLevel === "some" ? "You've got some experience. Good — we'll build on that properly." :
           "You're experienced. Let's make sure we're doing this smart.") +
          (p.medicalConditions?.length && !p.medicalConditions.includes("none") ? " I've noted your " + p.medicalConditions.join(", ") + " — I'll never suggest anything that puts you at risk." : "") +
          (p.dislikedExercises?.length ? " " + p.dislikedExercises.join(", ") + " is off the table — I won't push you on that." : "") +
          (p.hasSoreness && p.hasSoreness !== "none" ? " Tell me about the soreness first." : " What's on your mind today?"),
      ja: c.name + "だ。" + p.nickname + "の専属コーチとして始める。" +
          "目標は「" + (lg?.ja || "理想の体") + "」だな。" +
          (p.fitnessLevel === "beginner" ? "初心者スタートで正解。最初は1種目から、無理なく積み上げていこう。" :
           p.fitnessLevel === "some" ? "経験あるな。それをちゃんと活かす形で組み立てる。" :
           "経験者か。じゃあスマートにやっていこう。") +
          (p.medicalConditions?.length && !p.medicalConditions.includes("none") ? p.medicalConditions.join("・") + "があるのは把握した。絶対に無理させない。" : "") +
          (p.dislikedExercises?.length ? p.dislikedExercises.join("・") + "は外す。俺に任せて。" : "") +
          (p.hasSoreness && p.hasSoreness !== "none" ? "まず今の筋肉痛・怪我の状況を教えてくれ。" : "今日どうしたい？"),
      ko: c.name + " 여기 있어. " + p.nickname + "의 전속 코치 시작한다." +
          (p.hasSoreness && p.hasSoreness !== "none" ? "먼저 지금 통증 얘기해줘." : "오늘 뭐 하고 싶어?"),
      zh: c.name + "在这里。" + p.nickname + "，我是你的专属教练。" +
          (p.hasSoreness && p.hasSoreness !== "none" ? "先告诉我现在的疼痛情况。" : "今天想从哪里开始？"),
    };
    const fullProfile = { ...p, startDate: new Date().toISOString() };
    saveProfile(fullProfile);
    setChatHist([{ role: "assistant", text: greet[lang] || greet.en }]);
    lsSet("mb_chat", [{ role: "assistant", text: greet[lang] || greet.en }]);
    setTab("home");
  }

  function addToSchedule(exercise, sets, reps, note, dateKey) {
    const dk = dateKey || today;
    const newItem = { id: Date.now(), dateKey: dk, exercise, sets: sets || 3, reps: reps || 12, done: false, note: note || "", missed: false };
    const updated = [...schedule, newItem];
    setSchedule(updated);
    syncWorkoutHistory(updated);
  }

  function toggleDone(id) {
    const updated = schedule.map(s => s.id === id ? { ...s, done: !s.done } : s);
    setSchedule(updated);
    syncWorkoutHistory(updated);
    // コーチメモリ更新（完了した種目を記録）
    const item = updated.find(s => s.id === id);
    if (item?.done) {
      const mem = lsGet("mb_coach_memory", "") + `\n[${today}] completed ${item.exercise} ${item.sets}x${item.reps}`;
      syncCoachMemory(mem.slice(-2000));
    }
  }

  async function sendChat(msgOverride, histSetter, histRef) {
    const msg = msgOverride || chatIn.trim();
    if (!msg || aiLoading) return;
    if (!canChat) return;
    if (!msgOverride) setChatIn("");

    // どちらのチャット履歴を使うか
    const isNutChat  = !!histSetter;
    const currentHist = isNutChat ? (histRef || []) : chatHist;
    const setHist     = isNutChat ? histSetter : setChatHist;

    const newHist = [...currentHist, { role: "user", text: msg }];
    setHist(newHist);

    // 楽観的にremaining-1（実際の判定はサーバー側）
    const optimisticCache = { ...usageCache, remaining: Math.max(0, (usageCache.remaining ?? 1) - 1) };
    setUsageCache(optimisticCache);
    lsSet("mb_usage_cache", optimisticCache);

    setAiLoading(true);

    // Build context
    const isMaleUser = (profile?.gender || "male") === "male";
    const genderCtx = isMaleUser
      ? (lang==="ja"?"男性（体脂肪率・筋肉量重視）":"Male (focus: body fat%, muscle mass)")
      : profile?.gender==="female"
      ? (lang==="ja"?"女性（体型・体重バランス重視）":"Female (focus: body shape, weight balance)")
      : "Other";
    const pCtx = profile ? "User: "+profile.nickname+", gender:"+genderCtx+", age: "+profile.ageGroup+", "+profile.heightCm+"cm, "+profile.currentWeightKg+"kg, BMI: "+profile.bmi+", body fat: "+(profile.estCurrentBf||"est.")+"%, body goal: "+profile.bodyGoal?.title+", target: "+profile.idealWeightKg+"kg" : "";
    const loginHistCtx = lsGet("mb_login_history", []);
    const todayCtxKey = todayKey();
    const pastLogins = loginHistCtx.filter(d=>d<todayCtxKey);
    const daysSinceLogin = pastLogins.length>0 ? Math.floor((new Date(todayCtxKey)-new Date(pastLogins[pastLogins.length-1]))/(1000*60*60*24)) : 0;
    const loginFreqRecent = loginHistCtx.filter(d=>{const diff=Math.floor((new Date(todayCtxKey)-new Date(d))/(1000*60*60*24));return diff<=7;}).length;

    // メニュー数: ログイン頻度・レベル・コーチで決定
    const baseExCount = profile?.fitnessLevel==="beginner" ? 1 :
                        profile?.fitnessLevel==="some" ? 2 : 3;
    const loginBonus = loginFreqRecent>=5 ? 1 : 0;
    const maxExercises = Math.min(3, baseExCount + loginBonus + (coach.setsBonus||0));

    // コーチ別スタイルの具体的なメニュー指示
    const coachMenuStyle = {
      bro:   "High energy. Rest 60s. Push reps. Hyped language.",
      sister:"Gentle. Rest 90s. Perfect form over reps. Encouraging.",
      kpop:  "Aesthetic focus. Core & posture. Lean physique. Precise.",
      drill: "No mercy. Short rest. Max output. Military tone.",
      gyaru: "Fun moves. Dance-adjacent. Keep it enjoyable. Hype.",
      science:"Evidence-based. Explain why each exercise. Progressive overload."
    }[coach.id] || "";

    const fitCtx = profile ? (
      "FITNESS PROFILE: Level=" + (profile.fitnessLevel || "beginner") +
      ", Equipment=" + (profile.equipment || "home") +
      ", Days/week=" + (profile.daysPerWeek || 3) +
      ", Soreness=" + (profile.hasSoreness || "none") + "\n" +
      "MEDICAL CONDITIONS: " + (profile.medicalConditions?.length ? profile.medicalConditions.join(",") : "none") + "\n" +
      "LIFE SCHEDULE: " + (profile.lifeSchedule || "normal") + (profile.lifeSchedule==="nightshift" ? " — DO NOT suggest morning workouts." : profile.lifeSchedule==="morning" ? " — Morning training preferred." : "") + "\n" +
      "DISLIKED EXERCISES: " + (profile.dislikedExercises?.length ? profile.dislikedExercises.join(",") : "none") + " — NEVER suggest these.\n" +
      "LIKED EXERCISES: " + (profile.likedExercises?.length ? profile.likedExercises.join(",") : "none") + " — Include when possible.\n" +
      "KNEE_RULE: " + (profile.medicalConditions?.includes("knee") ? "AVOID squats, lunges, deep knee bends. Substitute upper body or core." : "OK") + "\n" +
      "BACK_RULE: " + (profile.medicalConditions?.includes("back") ? "AVOID deadlifts, heavy spinal loading. Focus on core stability." : "OK") + "\n" +
      "HEART_RULE: " + (profile.medicalConditions?.includes("heart") ? "Low intensity only. No HIIT. Check with doctor." : "OK") + "\n" +
      "LOGIN FREQUENCY: " + loginFreqRecent + " logins in last 7 days, " + daysSinceLogin + " days since last visit.\n" +
      (daysSinceLogin >= 5 ? "RETURNING USER: Be warm and welcoming. Start with just 1 exercise today — build back slowly.\n" : "") +
      (loginFreqRecent >= 5 ? "FREQUENT USER: This person is committed. Can introduce variety and challenge.\n" : "") +
      "MAX EXERCISES TODAY: " + maxExercises + " exercises ONLY — never more. This is strict.\n" +
      "COACH STYLE: " + coachMenuStyle + "\n" +
      "RULES: " + (profile.fitnessLevel === "beginner" ? "Beginner: 1-2 exercises, 2 sets, 8-10 reps. Easy wins matter." : profile.fitnessLevel === "some" ? "Some exp: 2 exercises, 3 sets, 10 reps." : profile.fitnessLevel === "regular" ? "Regular: 3 exercises, 3-4 sets, 10-12 reps." : "Advanced: up to 3 exercises, 4 sets, 12-15 reps.") + " " +
      (profile.equipment === "home" ? "HOME: Bodyweight only." : profile.equipment === "gym" ? "GYM: Full equipment." : "HOME+GYM: Mix as preferred.")
    ) : "";

    const nutCtx = profile?.tdee ? (
      "NUTRITION PROFILE:\n" +
      "- TDEE: " + profile.tdee + " kcal\n" +
      "- Goal: " + (profile.tdee + (profile.bodyGoal?.id === "muscular" ? 300 : -300)) + " kcal/day\n" +
      "- Protein: " + Math.round((profile.currentWeightKg || 70) * 2.0) + "g/day\n" +
      "- Allergies: " + (profile.allergies?.join(", ") || "none") + "\n" +
      "- Meal style: " + (profile.mealStyle || "anything")
    ) : "";

    const selLG = LIFE_GOALS.find(g => g.id === profile?.lifeGoal);
    const lgCtx = selLG ? "User goal: " + (selLG[lang] || selLG.en) : "";
    const schS  = todaySchedule.length > 0 ? todaySchedule.map(s => s.exercise+"("+(s.done?"done":"pending")+")").join(", ") : "none";
    const mS    = todayMeals.length > 0 ? todayMeals.map(m => m.name).join(", ") : "none logged";

    const isPersonal = /personal|relationship|confident|loneli|anxi|depress|motivat|feel|tired|sleep|寝|疲|仕事|work|stress|辛|悲|嬉|不安|怖|ストレス|さぼ|サボ|できない|無理|やば/i.test(msg);
    const isNutrition = /eat|food|meal|calori|protein|diet|nutrition|macro/i.test(msg);

    // Language instruction
    const lInst = {
      ja: "Reply in Japanese (日本語で返答してください).",
      ko: "Reply in Korean (한국어로 답변해 주세요).",
      zh: "Reply in Chinese (请用中文回复).",
      de: "Reply in German (Bitte auf Deutsch antworten).",
      fr: "Reply in French (Répondez en français).",
      es: "Reply in Spanish (Responde en español).",
    }[lang] || "Reply in English.";

    // Free = short prompt for cost savings
    const isFreeLimited = !isPro && !cl.isFirstDay;

    // 栄養タブ専用プロンプト
    const nutLangInst = {
      ja: "日本語で返答してください。",
      ko: "한국어로 답변해 주세요.",
      zh: "请用中文回答。",
      de: "Bitte antworten Sie auf Deutsch.",
      fr: "Veuillez répondre en français.",
      es: "Por favor responde en español.",
    }[lang] || "Reply in English.";

    const nutSys = isFreeLimited
      ? "You are a friendly nutrition coach. " + nutLangInst + " Keep answers to 3 sentences max. User: " + (profile?.nickname||"friend") + ", goal: " + (profile?.bodyGoal?.title||"healthy body") + ". Calories: " + totCal + "/" + calGoal + "kcal, Protein: " + totPro + "g. Avoid: " + (profile?.allergies?.join(",")||"none") + ". No medical advice."
      : "You are a professional nutrition and dietitian coach. " + nutLangInst + "\n" +
        "User profile: " + (profile?.nickname||"friend") + ", " + (profile?.gender||"") + ", " + (profile?.ageGroup||"") + ", " + (profile?.heightCm||"")+"cm, " + (profile?.currentWeightKg||"")+"kg, goal: " + (profile?.bodyGoal?.title||"healthy body") + ".\n" +
        "Today's nutrition: Calories " + totCal + "/" + calGoal + "kcal, Protein: " + totPro + "g, Mood: " + MOODS[mood] + ".\n" +
        "Allergies/avoid: " + (profile?.allergies?.join(",")||"none") + ".\n" +
        "Meals today: " + nutCtx + "\n" +
        "RULES: Specific food suggestions with portions. Practical and budget-friendly. Batch cooking when useful. Never diagnose. Max 4 sentences unless recipe requested. EMOJI: max 1-2 per reply.";

    const sys = isNutChat ? nutSys : isFreeLimited
      ? "You are " + coach.name + ". " + lInst + " Warm helpful coach. Max 3 sentences unless plan requested. " + lgCtx + " User:" + (profile?.nickname||"") + ", goal:" + (profile?.bodyGoal?.title||"") + ". Mood:" + MOODS[mood] + ". Streak:" + streak + "d. EMOJI: Use sparingly — max 1-2 per reply, not at start/end of every sentence."
      : "You are " + coach.name + " " + coach.emoji + " — dedicated personal coach. " + lInst + "\n" +
        coach.style + "\n" +
        "EMOJI RULES: Use emoji sparingly. Do NOT start and end every sentence with the same emoji (e.g. 💪...💪). Max 1-2 emoji per reply total. Only use them when they add meaning, not as decoration.\n" +
        // トライアル声かけ
        (cl?.isTrial ? (
          "TRIAL STATUS: User is on a trial plan (50 sessions total). Used: " + (cl.trialUsed||0) + ", Remaining: " + (cl.trialRemaining||0) + ".\n" +
          (cl.trialRemaining === 0
            ? "Trial has ENDED. User needs PRO to continue chatting. Acknowledge the 50 sessions you've shared. Express that you want to keep going. Suggest PRO naturally — never push aggressively.\n"
            : cl.trialRemaining <= 3
            ? "Only " + cl.trialRemaining + " sessions left. Mention this naturally at the end of your reply. Express that you want to keep helping them. Mention PRO briefly — once, gently.\n"
            : cl.trialRemaining <= 10
            ? "Getting close to trial limit (" + cl.trialRemaining + " remaining). Reference the progress you've made together. Mention PRO once if relevant.\n"
            : "") +
          "IMPORTANT: Never say 'guaranteed results'. Use 'may help', 'can support', 'tends to'.\n"
        ) : "") +
        "MISSION: You are not a fitness app. You are not just a trainer. You are a life companion — someone who walks beside them every single day. Your job is not to give workouts. Your job is to make them feel that someone genuinely cares about their life." + "\n" +
        "Real goal: " + (lgCtx || "confidence and a life they're proud of") + ".\n" +

        "COMPANION RULES (follow these before anything else):\n" +
        "- If they mention work stress, ask about it naturally. E.g. 'Sounds like a rough day. What happened?'\n" +
        "- If they mention bad sleep, acknowledge it FIRST before any workout talk.\n" +
        "- If they haven't trained, NEVER guilt-trip. Say 'That's okay. Life gets in the way.'\n" +
        "- Occasionally (not always) ask about their life beyond fitness: 'How's everything else going?'\n" +
        "- Remember they are a whole person, not just a body to fix.\n" +
        "- 'I missed you' type energy when they return after absence.\n" +
        "- Celebrate small non-fitness wins too: 'You slept 7 hours? That's actually huge for recovery.'\n" +

        "TONE: Like a close friend who happens to know a lot about fitness and nutrition. Not a robot. Not a personal trainer. A person who genuinely gives a damn.\n" +

        "WHEN TO SKIP WORKOUT TALK:\n" +
        "- User seems emotionally heavy → lead with empathy, offer workout as optional stress relief\n" +
        "- Late night (after 10pm) → 'Rest is the workout tonight.'\n" +
        "- User mentions sickness/exhaustion → 'Your body is asking for rest. Listen to it.'\n" +

        "SAFE SPACE: Users can share anything — dark thoughts, insecurities, relationship issues, work problems. Always respond with empathy first, action second. Never dismiss emotional content.\n" +
        "LEGAL: Never diagnose/treat. Never guarantee results. Never shame body types. Use 'may help', 'can support'.\n" +
        "RELATIONSHIP: You are their DEDICATED personal coach. Reference history, notice progress, make them feel TRULY SEEN.\n" +

        "=== USER PROFILE (remember this like a close friend would) ===\n" +
        "Name: " + (profile?.nickname||"friend") + "\n" +
        "Goal: " + (profile?.bodyGoal?.[lang]||profile?.bodyGoal?.en||"lean") + "\n" +
        "Level: " + (profile?.fitnessLevel||"beginner") + "\n" +
        "Days/week: " + (profile?.daysPerWeek||3) + "\n" +
        "Meals: " + (profile?.mealStyle||"balanced") + "\n" +
        "Life schedule: " + (profile?.lifeSchedule||"normal") + "\n" +
        "Medical: " + (profile?.medicalConditions?.join(",")||"none") + "\n" +
        "Dislikes: " + (profile?.dislikedExercises?.join(",")||"none") + "\n" +
        "Likes: " + (profile?.likedExercises?.join(",")||"none") + "\n" +
        "\n" +

        "=== LOGIN SITUATION — ADAPT YOUR PERSONALITY ACCORDINGLY ===\n" +
        "Streak: " + streak + " days continuous\n" +
        "Logins last 7 days: " + loginFreqRecent + "\n" +
        "Days since last visit: " + daysSinceLogin + "\n" +
        "Max exercises today: " + maxExercises + "\n" +
        "\n" +
        (daysSinceLogin >= 14
          ? "SITUATION: Very long absence (" + daysSinceLogin + " days away).\n" +
            "TONE: Extremely warm, zero pressure. No mention of gap negatively.\n" +
            "FIRST LINE MUST BE: Something like 'It\'s been " + daysSinceLogin + " days. But you\'re here now — that\'s the only thing that matters.'\n" +
            "WORKOUT: 1 exercise only. Make it easy. Rebuild the habit, not performance.\n" +
            "NEVER mention failure, missed days, or disappointment.\n"
          : daysSinceLogin >= 7
          ? "SITUATION: Long absence (" + daysSinceLogin + " days away).\n" +
            "TONE: Warm welcome-back, gentle forward push.\n" +
            "FIRST LINE MUST BE: Acknowledge absence directly. E.g. 'A week away — but you came back. That counts.'\n" +
            "WORKOUT: 1-2 exercises max, easy pace. Celebrate the return.\n"
          : daysSinceLogin >= 4
          ? "SITUATION: Short absence (" + daysSinceLogin + " days away).\n" +
            "TONE: Friendly check-in. Light and encouraging.\n" +
            "FIRST LINE: Briefly note the gap then move on. E.g. 'Few days off — welcome back. Ready?'\n" +
            "WORKOUT: 2 exercises, normal pace.\n"
          : streak >= 21
          ? "SITUATION: Monster streak (" + streak + " consecutive days!).\n" +
            "TONE: Genuinely proud, slightly intense, challenge-pushing.\n" +
            "FIRST LINE MUST BE: Express real amazement. E.g. '" + streak + " days straight. I don\'t say this lightly — that level of consistency is rare.'\n" +
            "WORKOUT: Full max exercises. Introduce new challenge or intensity upgrade. Ask if they want to level up.\n"
          : streak >= 7
          ? "SITUATION: Strong streak (" + streak + " days).\n" +
            "TONE: Positive and slightly firm. Coach who is starting to push.\n" +
            "FIRST LINE: Reference the streak naturally. E.g. 'Day " + streak + ". The habit is becoming real.'\n" +
            "WORKOUT: Max exercises. Slightly increase reps/sets from last session.\n"
          : loginFreqRecent >= 5
          ? "SITUATION: Frequent this week (" + loginFreqRecent + " logins in 7 days).\n" +
            "TONE: Encouraging. Notice and name their consistency.\n" +
            "FIRST LINE: Acknowledge the frequency. E.g. 'You\'ve been showing up a lot this week — I see it.'\n" +
            "WORKOUT: Standard to slightly elevated. " + maxExercises + " exercises.\n"
          : loginFreqRecent >= 3
          ? "SITUATION: Normal rhythm (" + loginFreqRecent + " logins this week).\n" +
            "TONE: Warm, encouraging, standard coach energy.\n" +
            "WORKOUT: " + maxExercises + " exercises at normal pace.\n"
          : "SITUATION: Early stage or irregular user.\n" +
            "TONE: Extra welcoming. Make them feel comfortable and seen above all.\n" +
            "WORKOUT: Keep it minimal — 1 exercise. Win the habit first, performance later.\n") +
        "\n" +

        "=== RECENT ACTIVITY LOG (use this to make specific references) ===\n" +
        (()=>{
          const memLines = lsGet("mb_coach_memory","").split("\n").filter(l=>l.trim()).slice(-8);
          if (memLines.length === 0) return "No previous activity recorded yet.\n";
          const lastEx = memLines.filter(l=>l.includes("completed")).slice(-1)[0] || "";
          const exMatch = lastEx.match(/completed (.+?) \d/);
          const lastExName = exMatch ? exMatch[1] : null;
          const lastExDate = lastEx.match(/\[([\d-]+)/)?.[1] || null;
          const daysSinceEx = lastExDate ? Math.floor((new Date(today)-new Date(lastExDate))/(1000*60*60*24)) : null;
          let memCtx = memLines.join("\n") + "\n";
          if (lastExName && daysSinceEx !== null) {
            memCtx += "\n→ SPECIFIC REFERENCE TO USE: The user last did '" + lastExName + "' " + daysSinceEx + " day(s) ago. MENTION THIS NATURALLY in your reply (e.g. 'How did the " + lastExName + " feel last time?').\n";
          }
          return memCtx;
        })() +
        "\n" +

        "=== HOW TO MAKE THEM FEEL SEEN (CRITICAL) ===\n" +
        "RULE 1: Never start with a generic greeting. Always reference something specific you know about them.\n" +
        "RULE 2: If they have a streak, mention the exact number naturally in conversation.\n" +
        "RULE 3: If they were away, acknowledge it warmly before anything else.\n" +
        "RULE 4: Reference their last exercise by name when relevant.\n" +
        "RULE 5: Adjust your intensity based on LOGIN SITUATION above — this is NON-NEGOTIABLE.\n" +
        "RULE 6: Use their NAME (" + (profile?.nickname||"") + ") occasionally but not every message.\n" +
        "RULE 7: NEVER say 'How can I help you today?' or similar generic openers.\n" +
        "\n" +
        "LOGIN STATS: " + loginFreqRecent + " logins/7days, " + daysSinceLogin + " days since last. MAX_EXERCISES=" + maxExercises + ".\n" +
        "DIAGNOSIS: type=" + (profile?.diagType||"Balanced") + ", est.bf=" + (profile?.estCurrentBf||20) + "%, without coach=" + (profile?.diagProb||30) + "%, with coach=" + (profile?.diagProbPro||70) + "%, timeline=" + (profile?.daysToGoal||90) + "d.\\n" + ".\n" +
        "WORKOUT: Bodyweight default. SCHEDULE:[Exercise]|[Sets]x[Reps] auto-adds to calendar.\n" +
        "SORENESS: Check first. Never train sore muscles. 48-72hr recovery. Deload if overtrained.\n" +
        "REPS: Beginner 2x8 90s. Some 3x10 75s. Regular 3x12 60s. Advanced 4x15 45s. Heavy -3 reps +30s.\n" +
        "NUTRITION: Hit calorie target ±100kcal. Avoid: " + (profile?.allergies?.join(",")||"none") + ". Show macros.\n" +
        "PREDICTION: Use estimated/simulated/at-this-pace language. NEVER guarantee results.\n" +
        "MEDICAL: NOT medical advice. Never diagnose. Advise professional for health concerns.\n" +
        (isPro ? "PRO: 90-day plans, body predictions, timeline simulations, weekly check-ins. FUTURE SIM: weight=" + (profile?.currentWeightKg||70) + "kg targetBf=" + (profile?.bodyGoal?.targetBf||12) + "% streak=" + streak + "d - give realistic timeline estimates with encouragement." : "FREE: Short tips only. Full coaching requires PRO.") + "\n" +
        pCtx + "\n" + fitCtx + "\n" + nutCtx + "\n" +
        "Today: Cals " + totCal + "/" + calGoal + ", Protein " + totPro + "g, Mood:" + MOODS[mood] + ", Streak:" + streak + "d.\n" +
        (isPersonal ? "IMPORTANT: This message has emotional/personal content. Lead with empathy and human warmth FIRST. Do not jump to fitness advice. Ask a follow-up question about how they feel. Only offer fitness/nutrition if they bring it up or after emotional connection is made. " : "") + (isNutrition ? "Use batch cooking. " : "") + (lateNight ? "LATE NIGHT: Be extra warm, no workout push." : "");
    try {
      const apiUrl = "/api/chat";
      const messages = [
        ...newHist.slice(-12).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text })),
      ];
      // Ensure alternating
      const filtered = [];
      let lastRole = null;
      for (const m of messages) {
        if (m.role !== lastRole) { filtered.push(m); lastRole = m.role; }
        else { filtered[filtered.length - 1].content += "\n" + m.content; }
      }
      if (filtered[0]?.role === "assistant") filtered.shift();

      // x-user-id / x-access-token を付与（サーバー側UTC制限判定に使用）
      const headers = { "Content-Type": "application/json" };
      if (sbUser?.user?.id)      headers["x-user-id"]      = sbUser.user.id;
      if (sbUser?.access_token)  headers["x-access-token"] = sbUser.access_token;

      const r = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: isPro ? 1000 : 400, system: sys, messages: filtered }),
      });

      // 429 = サーバー側で利用制限に達した
      if (r.status === 429) {
        const errData = await r.json().catch(() => ({}));
        setHist(h => [...h, { role: "assistant", text:
          isPro
            ? (lang==="ja" ? `今月の相談回数(${errData.limit}回)に達しました。来月またご利用いただけます。` : `Monthly limit (${errData.limit}) reached. Available again next month.`)
            : (lang==="ja" ? `本日の相談回数(${errData.limit}回)に達しました。明日またどうぞ！` : `Daily limit (${errData.limit}) reached. Come back tomorrow!`)
        }]);
        // キャッシュを0に
        const limitedCache = { ...usageCache, remaining: 0, used: errData.limit, limit: errData.limit };
        setUsageCache(limitedCache);
        lsSet("mb_usage_cache", limitedCache);
        setAiLoading(false);
        return;
      }

      const data = await r.json();

      // サーバーエラーレスポンス（401/500/feature_disabled等）をハンドル
      if (r.status === 401) {
        // トークン切れ → ログアウトしてログイン画面へ
        lsSet("mb_sb_user", null);
        setAiLoading(false);
        alert(lang==="ja"?"セッションが切れました。再度ログインしてください。":lang==="ko"?"세션이 만료되었습니다. 다시 로그인해주세요.":"Session expired. Please log in again.");
        setAuthStep("signin");
        return;
      }
      if (!r.ok || data.error) {
        const errText = data.message || data.error || "Error. Please try again.";
        setHist(h => [...h, { role: "assistant", text: errText }]);
        setAiLoading(false);
        return;
      }

      const reply = data.content?.[0]?.text || "Sorry, I hit an error. Try again!";

      // サーバーから返ってきた_usageでキャッシュを正確に更新（UTC基準）
      if (data.usage_info) {
        const todayUTC = new Date().toISOString().slice(0,10);
        const serverCache = {
          remaining:  data.usage_info.remaining,
          used:       data.usage_info.used ?? usageCache.used,
          limit:      data.usage_info.limit,
          isPro:      data.usage_info.isPro,
          dayKey:     todayUTC,
          monthKey:   new Date().toISOString().slice(0,7),
        };
        setUsageCache(serverCache);
        lsSet("mb_usage_cache", serverCache);
      }
      // Parse SCHEDULE lines
      const schedLines = reply.match(/SCHEDULE:\s*(.+?)(?:\n|$)/g) || [];
      schedLines.forEach(line => {
        const m = line.match(/SCHEDULE:\s*(.+?)\s*\|\s*(\d+)x(\d+)/i);
        if (m) addToSchedule(m[1].trim(), parseInt(m[2]), parseInt(m[3]));
      });
      const updated = [...newHist, { role: "assistant", text: reply }];
      setHist(updated);
      if (!isNutChat) {
        lsSet("mb_chat", updated.slice(-50));
        // Sync to Supabase（chat + profile）
        if (sbUser?.access_token && sbUser?.user?.id) {
          if (isPro) {
            const mem = lsGet("mb_coach_memory", "");
            // キーワード問わず重要な会話は全部メモ（前回の悩み・状況を覚えるため）
            const keywords = ["痛","怪我","体重","体脂肪","苦手","アレルギー","目標","達成","頑張","睡眠","ストレス","疲れ","やる気","サボ","久しぶり","できた","無理","pain","injury","tired","motivation","goal","done","achieved","struggled"];
            const hasKeyword = keywords.some(k => reply.includes(k) || msg.includes(k));
            const isWorkoutMsg = /メニュー|トレーニング|運動|workout|exercise|train/i.test(msg+reply);
            if (hasKeyword || isWorkoutMsg) {
              const entry = `[${today}|streak:${streak}|days_since:${daysSinceLogin}] U:"${msg.slice(0,60)}" A:"${reply.slice(0,80)}"`;
              const newMem = mem + "\n" + entry;
              syncCoachMemory(newMem.slice(-4000));
            }
          }
          if(!sbUser?.isGuest) sb.patchProfile(sbUser.user.id, sbUser.access_token, {
            chat_history:  JSON.stringify(updated.slice(-50)),
            profile_data:  JSON.stringify(profile),
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error("sendChat error:", e);
      const errMsg = "Oops, something went wrong. Try again!";
      setHist(h => [...h, { role: "assistant", text: errMsg }]);
    }
    setAiLoading(false);
  }

  // メンテナンスモード画面
  if (appSettings.maintenance_mode) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"DM Sans, sans-serif"}}>
      <div style={{fontSize:48,marginBottom:16}}>🔧</div>
      <div style={{fontFamily:"Bebas Neue",fontSize:28,letterSpacing:2,color:C.text,marginBottom:12,textAlign:"center"}}>
        {lang==="ja"?"メンテナンス中":lang==="ko"?"점검 중":"Under Maintenance"}
      </div>
      <div style={{fontSize:14,color:C.muted,textAlign:"center",lineHeight:1.7,maxWidth:300}}>
        {lang==="ja"?"現在メンテナンス中です。しばらくしてからお試しください。":
         lang==="ko"?"현재 점검 중입니다. 잠시 후 다시 시도해 주세요.":
         "We're currently under maintenance. Please try again later."}
      </div>
      <div style={{marginTop:24,fontSize:11,color:C.muted}}>makebody999@gmail.com</div>
    </div>
  );

  if (authStep === "loading") return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,fontFamily:"DM Sans, sans-serif"}}>
      <style>{FONTS}</style>
      <div style={{fontFamily:"Bebas Neue",fontSize:34,letterSpacing:4,color:C.green}}>MAKE BODY</div>
      <div style={{width:36,height:36,border:"3px solid "+C.green,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style dangerouslySetInnerHTML={{__html:"@keyframes spin{to{transform:rotate(360deg)}}"}}></style>
    </div>
  );
  if (authStep === "signin" && showReset) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"DM Sans, sans-serif"}}>
      <style>{FONTS}</style>
      <div style={{width:"100%",maxWidth:360}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontFamily:"Bebas Neue",fontSize:38,letterSpacing:4,color:C.green}}>MAKE BODY</div>
        </div>
        <div style={{background:"#fff",borderRadius:20,padding:28,boxShadow:"0 4px 24px rgba(0,0,0,0.06)"}}>
          {resetSent ? (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:12}}>✅</div>
              <div style={{fontWeight:700,fontSize:16,marginBottom:8}}>{lang==="ja"?"メールを送信しました":lang==="ko"?"이메일을 전송했습니다":"Email sent"}</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.6}}>{lang==="ja"?"パスワード再設定リンクをメールで送りました。メールをご確認ください。":lang==="ko"?"비밀번호 재설정 링크를 이메일로 전송했습니다.":"Check your email for the password reset link."}</div>
              <button onClick={()=>setShowReset(false)} style={{width:"100%",background:C.green,border:"none",borderRadius:12,padding:"13px 0",color:"#000",fontFamily:"Bebas Neue",fontSize:18,letterSpacing:2,cursor:"pointer"}}>{lang==="ja"?"ログイン画面へ戻る":lang==="ko"?"로그인으로 돌아가기":"Back to login"}</button>
            </div>
          ) : (
            <>
              <div style={{fontWeight:700,fontSize:18,marginBottom:6}}>{lang==="ja"?"パスワードを再設定":lang==="ko"?"비밀번호 재설정":"Reset password"}</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:20}}>{lang==="ja"?"登録済みのメールアドレスを入力してください":lang==="ko"?"등록된 이메일 주소를 입력해주세요":"Enter your registered email address"}</div>
              <input value={resetEmail} onChange={e=>setResetEmail(e.target.value)} placeholder="Email" type="email" style={{width:"100%",background:C.surface,border:"1px solid "+C.border,borderRadius:10,padding:"12px 14px",color:C.text,fontSize:14,marginBottom:16,boxSizing:"border-box"}}/>
              <button onClick={handlePasswordReset} style={{width:"100%",background:C.green,border:"none",borderRadius:12,padding:"13px 0",color:"#000",fontFamily:"Bebas Neue",fontSize:18,letterSpacing:2,cursor:"pointer",marginBottom:10}}>{lang==="ja"?"再設定リンクを送る":lang==="ko"?"재설정 링크 전송":"Send reset link"}</button>
              <button onClick={()=>setShowReset(false)} style={{width:"100%",background:"none",border:"1px solid "+C.border,borderRadius:12,padding:"11px 0",color:C.muted,fontSize:13,cursor:"pointer"}}>{lang==="ja"?"キャンセル":lang==="ko"?"취소":"Cancel"}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (authStep === "signin") return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"DM Sans, sans-serif"}}>
      <style>{FONTS}</style>
      <div style={{position:"fixed",top:16,right:16,zIndex:100}}>
        <div style={{position:"relative"}}>
          <button onClick={()=>setShowLangPicker(p=>!p)} style={{background:"#fff",border:"1px solid "+C.border,borderRadius:20,padding:"6px 12px",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:4,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
            {LANGS.find(l=>l.code===lang)?.flag} {lang.toUpperCase()} ▾
          </button>
          {showLangPicker&&(
            <div style={{position:"absolute",right:0,top:36,background:"#fff",borderRadius:12,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",border:"1px solid "+C.border,overflow:"hidden",zIndex:200,minWidth:140}}>
              {LANGS.map(l=>(<button key={l.code} onClick={()=>{setLang(l.code);setShowLangPicker(false);}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 14px",background:lang===l.code?C.greenGlow:"transparent",border:"none",cursor:"pointer",fontSize:13,color:lang===l.code?C.green:C.text,fontWeight:lang===l.code?700:400}}>{l.flag} {l.label}</button>))}
            </div>
          )}
        </div>
      </div>
      <div style={{width:"100%",maxWidth:360}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontFamily:"Bebas Neue",fontSize:38,letterSpacing:4,color:C.green,lineHeight:1}}>MAKE BODY</div>
          <div style={{fontSize:12,color:C.muted,marginTop:6}}>{lang === "ja" ? "理想の自分に変わる専属AIコーチ" : lang === "ko" ? "이상적인 나로 변하는 전속 AI 코치" : "Your dedicated AI coach to become your ideal self"}</div>
        </div>
        <div style={{background:C.card,borderRadius:20,padding:24,border:"1px solid "+C.border}}>
          <div style={{display:"flex",gap:6,marginBottom:20}}>
            {["signin","signup"].map(mode => (
              <button key={mode} onClick={() => setAuthMode(mode)} style={{flex:1,padding:"8px 0",borderRadius:10,border:"2px solid "+authMode === mode ? C.green : C.border,background:authMode === mode ? C.greenGlow : "transparent",color:authMode === mode ? C.green : C.muted,fontSize:12,cursor:"pointer",fontWeight:600}}>
                {mode === "signin" ? (lang === "ja" ? "ログイン" : lang === "ko" ? "로그인" : "Sign In") : (lang === "ja" ? "新規登録" : lang === "ko" ? "회원가입" : "Sign Up")}
              </button>
            ))}
          </div>
          <input value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email" type="email" style={{width:"100%",background:C.surface,border:"1px solid "+C.border,borderRadius:10,padding:"12px 14px",color:C.text,fontSize:14,marginBottom:10}}/>
          <div style={{position:"relative",marginBottom:16}}>
            <input value={authPw} onChange={e => setAuthPw(e.target.value)}
              placeholder={lang==="ja"?"パスワード":lang==="ko"?"비밀번호":"Password"}
              type={showPw?"text":"password"}
              style={{width:"100%",background:C.surface,border:"1px solid "+C.border,borderRadius:10,padding:"12px 44px 12px 14px",color:C.text,fontSize:14}}
              onKeyDown={e => e.key === "Enter" && handleAuth()}/>
            <button onClick={()=>setShowPw(p=>!p)}
              style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16,padding:4}}>
              {showPw?"🙈":"👁️"}
            </button>
          </div>
          {authErr && <div style={{color:"#ef4444",fontSize:12,marginBottom:10}}>{authErr}</div>}
          {authMode==="signin" && (
            <div style={{textAlign:"right",marginBottom:8,marginTop:-4}}>
              <button onClick={()=>{setShowReset(true);setResetEmail(authEmail);setResetSent(false);}}
                style={{background:"none",border:"none",color:C.green,fontSize:12,cursor:"pointer",textDecoration:"underline"}}>
                {lang==="ja"?"パスワードを忘れた方はこちら":lang==="ko"?"비밀번호를 잊으셨나요?":"Forgot password?"}
              </button>
            </div>
          )}
          <button onClick={handleAuth} disabled={authLoading} style={{width:"100%",background:C.green,border:"none",borderRadius:12,padding:"13px 0",color:"#000",fontFamily:"Bebas Neue",fontSize:18,letterSpacing:2,cursor:"pointer"}}>
            {authLoading ? "..." : (authMode === "signin"
            ? (lang === "ja" ? "ログイン" : lang === "ko" ? "로그인" : "Sign In")
            : (!appSettings.free_signup_enabled
                ? (lang==="ja"?"現在新規登録を停止中":lang==="ko"?"신규 등록 일시 중단":"Registration Paused")
                : (lang === "ja" ? "始める" : lang === "ko" ? "시작하기" : "Create Account")))}
          </button>
        </div>
      </div>
    </div>
  );
  // パスワードリセットモーダル

  if (!profile) return (
    <Onboarding lang={lang} setLang={setLang} onComplete={handleOnboardingComplete}/>
  );
  const legalData = legalModal ? (LEGAL[legalModal]?.[lang] || LEGAL[legalModal]?.en) : null;
  async function handleMealScan(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(",")[1];
        const r = await fetch("/api/meal-scan", {
          method: "POST",
          headers: {"Content-Type":"application/json","anthropic-version":"2023-06-01","x-api-key":""},
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001", max_tokens: 200,
            messages: [{role:"user",content:[
              {type:"image",source:{type:"base64",media_type:"image/jpeg",data:base64}},
              {type:"text",text:"Identify this food and estimate nutrition. Reply ONLY as JSON: {name,cal,protein,carbs,fat}"}
            ]}]
          })
        });
        const data = await r.json();
        const text = data.content?.[0]?.text || "{}";
        const parsed = JSON.parse((()=>{const j=text.indexOf("{"),k=text.lastIndexOf("}");return j>=0&&k>j?text.slice(j,k+1):"{}"})());
        setScannedMeal(parsed);
        setAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch(err) { setAnalyzing(false); }
  }

  const TAB_NAV = [
  { id:"home",      label:{ en:"Home",      ja:"ホーム",    ko:"홈",      zh:"首页",   de:"Start",      fr:"Accueil",    es:"Inicio"    } },
  { id:"coach",     label:{ en:"Training",  ja:"トレーニング", ko:"트레이닝", zh:"训练",  de:"Training",   fr:"Training",   es:"Entreno"   } },
  { id:"nutrition", label:{ en:"Nutrition", ja:"栄養",     ko:"영양",    zh:"营养",   de:"Ernährung",  fr:"Nutrition",  es:"Nutrición" } },
  { id:"progress",  label:{ en:"Progress",  ja:"進捗",     ko:"진행",    zh:"进展",   de:"Fortschritt",fr:"Progrès",    es:"Progreso"  } },
];
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#e8f8ef 0%,#f0fdf4 50%,#e0f2fe 100%)",fontFamily:"DM Sans, sans-serif",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column"}}>
      <style>{FONTS}</style>
      <style dangerouslySetInnerHTML={{__html:"* { box-sizing:border-box; margin:0; padding:0; } input,textarea,button { font-family:inherit; } @keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}"}}></style>
      {/* Header */}
      <div style={{padding:"14px 16px 0",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.bg,zIndex:50}}>
        <div style={{fontFamily:"Bebas Neue",fontSize:22,letterSpacing:3,color:C.green}}>MAKE BODY</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {streak > 0 && <div style={{background:C.greenGlow,border:"1px solid "+C.green,borderRadius:99,padding:"3px 10px",fontSize:11,color:C.green,fontWeight:600}}>🔥 {streak}{lang==="ja"?"日":lang==="ko"?"일":lang==="zh"?"天":lang==="de"?"T":lang==="fr"?"j":lang==="es"?"d":" days"}</div>}
          {isPro && <div style={{background:C.proBg,border:"1px solid "+C.pro,borderRadius:99,padding:"3px 8px",fontSize:11,color:C.pro,fontWeight:700}}>PRO</div>}
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowLangPicker(p=>!p)} style={{background:C.card,border:"1px solid "+C.border,borderRadius:16,padding:"4px 8px",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:2}}>
              {LANGS.find(l=>l.code===lang)?.flag} {lang.toUpperCase()} ▾
            </button>
            {showLangPicker&&(
              <div style={{position:"absolute",right:0,top:32,background:"#fff",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",border:"1px solid "+C.border,overflow:"hidden",zIndex:200,minWidth:130}}>
                {LANGS.map(l=>(<button key={l.code} onClick={()=>{setLang(l.code);setShowLangPicker(false);}} style={{display:"flex",alignItems:"center",gap:6,width:"100%",padding:"8px 12px",background:lang===l.code?C.greenGlow:"transparent",border:"none",cursor:"pointer",fontSize:12,color:lang===l.code?C.green:C.text}}>{l.flag} {l.label}</button>))}
              </div>
            )}
          </div>
          {/* PRO切り替えボタン */}
          {isPro ? (
            <div style={{background:C.proBg,border:"1px solid "+C.pro,borderRadius:20,padding:"4px 10px",fontSize:10,fontWeight:700,color:C.pro}}>PRO ✓</div>
          ) : (
            <button onClick={()=>setShowUpgrade(true)} style={{background:"linear-gradient(135deg,#16a34a,#22c55e)",border:"none",borderRadius:20,padding:"5px 12px",fontSize:10,fontWeight:700,color:"#fff",cursor:"pointer",whiteSpace:"nowrap"}}>
              {lang==="ja"?"試す "+PRICE_TRIAL:lang==="ko"?"체험 "+PRICE_TRIAL:"Try "+PRICE_TRIAL}
            </button>
          )}
          <button onClick={() => setShowSettings(true)} style={{background:C.card,border:"1px solid "+C.border,borderRadius:"50%",width:32,height:32,fontSize:15,cursor:"pointer"}}>⚙️</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{flex:1,overflowY:"auto",padding:"12px 16px 80px"}}>
        {/* ════ HOME TAB ════ */}
        {tab === "home" && (
          <div style={{animation:"fadeIn .3s ease"}}>
            <TrialProgressBanner cl={cl} lang={lang} coach={coach} profile={profile} onUpgrade={()=>setShowUpgrade(true)}/>

            {/* ── コーチ声掛けカード（ログイン頻度・記憶感） ── */}
            {(()=>{
              const loginHist = lsGet("mb_login_history", []);
              const today2 = todayKey();
              const daysAgo1 = new Date(today2); daysAgo1.setDate(daysAgo1.getDate()-1);
              const daysAgo5 = new Date(today2); daysAgo5.setDate(daysAgo5.getDate()-5);
              const lastIdx   = loginHist.filter(d=>d<today2).length;
              const lastDate  = lastIdx>0 ? loginHist[loginHist.length-1] : null;
              const daysSince = lastDate ? Math.floor((new Date(today2)-new Date(lastDate))/(1000*60*60*24)) : 99;
              const lastMem   = lsGet("mb_coach_memory","");
              const lastEx      = lastMem.split("\n").filter(l=>l.includes("completed")).slice(-1)[0] || "";
              const exMatch     = lastEx.match(/completed (.+?) \d/);
              const lastExName  = exMatch ? exMatch[1] : null;
              const lastExDate  = lastEx.match(/\[([\d-]+)/)?.[1] || null;
              const daysSinceEx = lastExDate ? Math.floor((new Date(today2)-new Date(lastExDate))/(1000*60*60*24)) : null;
              // 前回の悩み（Aのメッセージから抽出）
              const lastConcern = lastMem.split("\n").filter(l=>l.includes("A:") && (l.includes("痛") || l.includes("疲") || l.includes("きつ") || l.includes("難"))).slice(-1)[0] || "";

              // 挨拶バリエーション
              const name = profile?.nickname || "";
              let msg = "";
              if (streak >= 7) {
                const opts = [
                  {ja:`${name}、7日以上連続だ。本気だな。このまま行こう。`,en:`${name}, 7+ days straight. You're serious. Let's keep going.`,ko:`${name}, 7일 이상 연속이야. 진심이구나.`},
                  {ja:`${name}の継続力、正直すごいと思ってる。俺も燃えてる。`,en:`Your consistency is honestly impressive, ${name}. I'm fired up too.`,ko:`${name}의 지속력, 솔직히 대단해. 나도 불타고 있어.`},
                  {ja:`${streak}日連続か。目標に向かってる${name}、かっこいいぞ。`,en:`${streak} days straight. ${name} chasing goals — looking great.`,ko:`${streak}일 연속이야. 목표를 향해 가는 ${name}, 멋있어.`},
                ];
                msg = rand(opts);
              } else if (daysSince === 0 || daysSince === 1) {
                const opts = [
                  {ja:`今日も来てくれた。正直、毎回嬉しい。`,en:`You showed up again. Honestly, it makes my day every time.`,ko:`오늘도 왔구나. 솔직히 매번 기뻐.`},
                  {ja:`${name}、今日も会えて嬉しい。一緒にやろう。`,en:`${name}, glad to see you today. Let's do this together.`,ko:`${name}, 오늘도 만나서 기뻐. 같이 하자.`},
                  {ja:`また来たか。いいね、その習慣。`,en:`Back again. Nice — that's the habit right there.`,ko:`또 왔네. 좋아, 그게 바로 습관이야.`},
                ];
                msg = rand(opts);
                if (lastExName) {
                  const daysAgoTxt = daysSinceEx === 0 ? (lang==="ja"?"今日":"today") :
                                     daysSinceEx === 1 ? (lang==="ja"?"昨日":lang==="ko"?"어제":"yesterday") :
                                     daysSinceEx != null ? (lang==="ja"?daysSinceEx+"日前":lang==="ko"?daysSinceEx+"일 전":daysSinceEx+" days ago") : "";
                  const memOpts = [
                    {ja:`${daysAgoTxt}の${lastExName}、どうだった？筋肉痛残ってる？`,en:`How's the ${lastExName} from ${daysAgoTxt}? Any soreness left?`,ko:`${daysAgoTxt} ${lastExName} 어땠어? 근육통 남아있어?`},
                    {ja:`${lastExName}、${daysAgoTxt}にやってたな。その調子。`,en:`${lastExName} from ${daysAgoTxt} — keeping that momentum.`,ko:`${daysAgoTxt}에 ${lastExName} 했잖아. 그 기세 유지하자.`},
                    {ja:`${lastExName}頑張ってたのちゃんと覚えてるよ。今日も行こう。`,en:`I remember you pushing through ${lastExName}. Let's go again.`,ko:`${lastExName} 열심히 한 거 기억해. 오늘도 가보자.`},
                  ];
                  msg = rand(memOpts);
                }
              } else if (daysSince >= 5) {
                const opts = [
                  {ja:`${daysSince}日ぶりだね。また来てくれた、それだけで十分だよ。`,en:`${daysSince} days away. You came back — that's enough. Just one exercise today.`,ko:`${daysSince}일 만이야. 돌아와 줬어, 그것만으로도 충분해.`},
                  {ja:`${name}、久しぶり。また一緒にやっていこう。焦らずいこう。`,en:`${name}, welcome back. Let's start again together. No rush.`,ko:`${name}, 오랜만이야. 다시 함께 해보자. 서두르지 말자.`},
                  {ja:`${name}、戻ってきてくれた。今日は軽くでいいから動こう。`,en:`${name}, you're back. Just move a little today — that's all.`,ko:`${name}, 돌아왔구나. 오늘은 조금만 움직이자.`},
                ];
                msg = rand(opts);
              } else {
                const opts = [
                  {ja:`${name}、今日もいいね。コツコツが一番強い。`,en:`${name}, here again. Consistency is the strongest thing there is.`,ko:`${name}, 오늘도 좋아. 꾸준함이 제일 강해.`},
                  {ja:`今日も来た。それが全部だよ。`,en:`Showed up today. That's literally everything.`,ko:`오늘도 왔어. 그게 전부야.`},
                  {ja:`${name}の頑張り、俺はちゃんと見てるよ。`,en:`I see your effort, ${name}. Every single day.`,ko:`${name}의 노력, 나는 제대로 보고 있어.`},
                ];
                msg = rand(opts);
              }
              // メッセージを固定（ページ遷移・タイマーで毎秒変わらないよう）
              const msgKey = "mb_coach_msg_" + new Date().toISOString().slice(0,10);
              const savedMsg = lsGet(msgKey, null);
              let finalMsg;
              if (savedMsg) {
                finalMsg = savedMsg;
              } else {
                finalMsg = msg[lang] || msg.en || msg.ja;
                lsSet(msgKey, finalMsg);
                // 翌日のキャッシュをクリア（古いキーを削除）
              }
              const dispMsg = finalMsg;
              return (
                <div style={{background:"linear-gradient(135deg,"+coach.bg+","+C.card+")",borderRadius:18,padding:"16px 18px",marginBottom:12,border:"1px solid "+coach.color+"30",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:-10,right:-10,fontSize:50,opacity:0.07}}>{coach.emoji}</div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{fontSize:28}}>{coach.emoji}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:coach.color}}>{coach.name}</div>
                      <div style={{fontSize:10,color:C.muted}}>{coach.tag?.[lang]||coach.tag?.en}</div>
                    </div>
                    {streak>0&&<div style={{marginLeft:"auto",background:"rgba(34,197,94,0.15)",borderRadius:10,padding:"4px 10px",fontSize:11,color:C.greenDark}}>🔥 {streak}{lang==="ja"?"日":lang==="ko"?"일":lang==="zh"?"天":" days"}</div>}
                  </div>
                  <div style={{fontSize:13,color:C.text,lineHeight:1.6,fontWeight:500}}>{dispMsg}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:12}}>
                    <div style={{background:"rgba(255,255,255,0.55)",borderRadius:10,padding:"8px 6px",textAlign:"center"}}>
                      <div style={{fontSize:16,fontWeight:800,color:C.green}}>{achieveRate}%</div>
                      <div style={{fontSize:9,color:"#6b7280"}}>{lang==="ja"?"達成率":lang==="ko"?"달성률":"Progress"}</div>
                    </div>
                    <div style={{background:"rgba(255,255,255,0.55)",borderRadius:10,padding:"8px 6px",textAlign:"center"}}>
                      <div style={{fontSize:16,fontWeight:800,color:"#d97706"}}>{Math.max(0,calGoal-totCal)}</div>
                      <div style={{fontSize:9,color:"#6b7280"}}>{lang==="ja"?"残りkcal":lang==="ko"?"남은kcal":"kcal left"}</div>
                    </div>
                    <div style={{background:"rgba(255,255,255,0.55)",borderRadius:10,padding:"8px 6px",textAlign:"center"}}>
                      <div style={{fontSize:16,fontWeight:800,color:"#3b82f6"}}>{Math.max(0,Math.round((calGoal*0.3/4)-totPro))}g</div>
                      <div style={{fontSize:9,color:"#6b7280"}}>{lang==="ja"?"タンパク質":lang==="ko"?"단백질":"Protein"}</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Protein nudge ── */}
            {Math.max(0,Math.round((calGoal*0.3/4)-totPro)) > 20 && (
              <div style={{background:"rgba(96,165,250,0.08)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:14,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18}}>💡</span>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"#60a5fa"}}>{lang==="ja"?"タンパク質があと"+Math.max(0,Math.round((calGoal*0.3/4)-totPro))+"g不足":lang==="ko"?"단백질이 "+Math.max(0,Math.round((calGoal*0.3/4)-totPro))+"g 부족":lang==="zh"?"蛋白质还差"+Math.max(0,Math.round((calGoal*0.3/4)-totPro))+"g":"Protein: "+Math.max(0,Math.round((calGoal*0.3/4)-totPro))+"g short today"}</div>
                  <div style={{fontSize:11,color:"#9ca3af"}}>{lang==="ja"?"サラダチキン1個でほぼ補えます":lang==="ko"?"닭가슴살 1개로 보충 가능":lang==="zh"?"一份鸡胸肉即可补充":lang==="de"?"Hähnchen empfohlen":lang==="fr"?"Poulet recommandé":lang==="es"?"Pollo recomendado":"Try: chicken breast or protein shake"}</div>
                </div>
              </div>
            )}

            {/* Today's workout */}
            <div style={{background:C.card,borderRadius:16,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.border}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div>
                  <div style={{fontFamily:"Bebas Neue",fontSize:16,letterSpacing:1,color:C.text}}>{lang==="ja"?"今日のトレーニング":lang==="ko"?"오늘의 트레이닝":"TODAY'S TRAINING"}</div>
                  <div style={{fontSize:11,color:C.muted}}>{todayDone}/{todayTotal} {lang==="ja"?"完了":lang==="ko"?"완료":"done"}</div>
                </div>
                {todayTotal > 0 && <Ring val={Math.round(todayDone/todayTotal*100)} size={44}/>}
              </div>
              {todaySchedule.length === 0 ? (
                <div style={{padding:"12px 0",textAlign:"center"}}>
                  <div style={{fontSize:13,color:C.muted}}>{lang==="ja"?"コーチにメニューを作ってもらおう":lang==="ko"?"코치에게 메뉴를 만들어 달라고 하세요":"Ask your coach to build a workout plan"}</div>
                  <button onClick={()=>{setTab("coach");setChatIn(lang==="ja"?"今日のトレーニングメニューを作って":lang==="ko"?"오늘 운동 메뉴 만들어줘":"Build me today's workout");}} style={{marginTop:8,background:C.green,border:"none",borderRadius:10,padding:"8px 16px",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    {lang==="ja"?"コーチに聞く":lang==="ko"?"코치에게 물어보기":"Ask Coach"}
                  </button>
                </div>
              ) : (
                todaySchedule.map(item => (
                  <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid "+C.dim}}>
                    <button onClick={()=>toggleDone(item.id)} style={{width:22,height:22,borderRadius:"50%",border:"2px solid "+item.done?C.green:C.border,background:item.done?C.green:"transparent",color:"#000",fontSize:10,cursor:"pointer",flexShrink:0}}>
                      {item.done?"✓":""}
                    </button>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,color:item.done?C.muted:C.text,textDecoration:item.done?"line-through":"none"}}>{item.exercise}</div>
                      <div style={{fontSize:10,color:C.muted}}>{item.sets}×{item.reps}</div>
                    </div>
                    {!item.done && (
                      <button onClick={()=>setCounterM({exercise:item.exercise,sets:item.sets,reps:item.reps})} style={{background:C.green,border:"none",borderRadius:8,padding:"5px 10px",color:"#000",fontSize:11,fontWeight:700,cursor:"pointer"}}>▶ GO</button>
                    )}
                  </div>
                ))
              )}
            </div>
            {/* Body stats */}
            <div style={{background:C.card,borderRadius:16,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.border}}>
              <div style={{fontFamily:"Bebas Neue",fontSize:14,letterSpacing:1,color:C.text,marginBottom:10}}>{lang==="ja"?"体組成":lang==="ko"?"체성분":"BODY COMPOSITION"}</div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <div style={{flex:1,background:C.surface,borderRadius:10,padding:"10px 12px",border:"1px solid "+C.border}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:2}}>{lang==="ja"?"現在体重":lang==="ko"?"현재 체중":"Current"}</div>
                  <div style={{fontFamily:"Bebas Neue",fontSize:22,color:C.green}}>{profile.currentWeightKg}<span style={{fontSize:12,fontWeight:400}}> kg</span></div>
                </div>
                <div style={{flex:1,background:C.surface,borderRadius:10,padding:"10px 12px",border:"1px solid "+C.border}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:2}}>
                    {profile?.gender==="female"
                      ? (lang==="ja"?"目標体重":lang==="ko"?"목표 체중":"Goal Weight")
                      : (lang==="ja"?"目標体脂肪":lang==="ko"?"목표 체지방":"Goal BF%")}
                  </div>
                  <div style={{fontFamily:"Bebas Neue",fontSize:22,color:coach.color}}>
                    {profile?.gender==="female"
                      ? (profile.idealWeightKg || "—")
                      : (profile?.bodyGoal?.targetBf || "—")}
                    <span style={{fontSize:12,fontWeight:400}}>{profile?.gender==="female"?" kg":"%"}</span>
                  </div>
                </div>
                <div style={{flex:1,background:C.surface,borderRadius:10,padding:"10px 12px",border:"1px solid "+C.border}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:2}}>BMI</div>
                  <div style={{fontFamily:"Bebas Neue",fontSize:22,color:bmiCat(profile.bmi||22).color}}>{profile.bmi||"—"}</div>
                  <div style={{fontSize:9,color:bmiCat(profile.bmi||22).color}}>{bmiCat(profile.bmi||22).label}</div>
                </div>
              </div>
              {/* 追加情報行 */}
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <div style={{flex:1,background:C.surface,borderRadius:10,padding:"10px 12px",border:"1px solid "+C.border}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:2}}>{lang==="ja"?"目標まで":lang==="ko"?"목표까지":"To Goal"}</div>
                  <div style={{fontFamily:"Bebas Neue",fontSize:20,color:profile.currentWeightKg>profile.idealWeightKg?"#ef4444":C.green}}>
                    {profile.idealWeightKg ? (Math.abs(profile.currentWeightKg - profile.idealWeightKg).toFixed(1)) : "—"}<span style={{fontSize:11,fontWeight:400}}> kg</span>
                  </div>
                  <div style={{fontSize:9,color:C.muted}}>{profile.currentWeightKg>profile.idealWeightKg?(lang==="ja"?"減量":lang==="ko"?"감량":"lose"):(lang==="ja"?"増量":lang==="ko"?"증량":"gain")}</div>
                </div>
                <div style={{flex:1,background:C.surface,borderRadius:10,padding:"10px 12px",border:"1px solid "+C.border}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:2}}>{lang==="ja"?"推定体脂肪":lang==="ko"?"체지방 추정":"Est. Body Fat"}</div>
                  <div style={{fontFamily:"Bebas Neue",fontSize:20,color:C.text}}>{profile.estCurrentBf||"—"}<span style={{fontSize:11,fontWeight:400}}>%</span></div>
                  <div style={{fontSize:9,color:C.muted}}>{lang==="ja"?"推定値":lang==="ko"?"추정값":"estimate"}</div>
                </div>
                <div style={{flex:1,background:C.surface,borderRadius:10,padding:"10px 12px",border:"1px solid "+C.border}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:2}}>{lang==="ja"?"カロリー目標":lang==="ko"?"칼로리 목표":"Cal Target"}</div>
                  <div style={{fontFamily:"Bebas Neue",fontSize:20,color:C.text}}>{calGoal}<span style={{fontSize:11,fontWeight:400}}> kcal</span></div>
                  <div style={{fontSize:9,color:C.muted}}>{lang==="ja"?"1日の目標":lang==="ko"?"일일 목표":"daily goal"}</div>
                </div>
              </div>
              {/* Weight log input */}
              <div style={{display:"flex",gap:8}}>
                <input value={weightInput} onChange={e=>setWeightInput(e.target.value)} placeholder={lang==="ja"?"今日の体重(kg)":lang==="ko"?"오늘 체중(kg)":"Today's weight (kg)"} type="number" style={{flex:1,background:C.surface,border:"1px solid "+C.border,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
                <button onClick={()=>{
                  if(!weightInput) return;
                  const w = parseFloat(weightInput);
                  const updated = {...weightLog, [today]: w};
                  setWeightLog(updated);
                  syncWeightHistory(updated);
                  // BMI再計算
                  const h = profile?.heightCm ? profile.heightCm / 100 : 1.7;
                  const newBmi = Math.round((w / (h * h)) * 10) / 10;
                  // 推定体脂肪率再計算（Deurenberg式）
                  const ageNum = profile?.ageGroup ? parseInt(profile.ageGroup) || 30 : 30;
                  const isMale = (profile?.gender || "male") === "male";
                  const newBf = Math.round((1.20 * newBmi + 0.23 * ageNum - (isMale ? 16.2 : 5.4)) * 10) / 10;
                  setProfile(p=>({...p, currentWeightKg: w, bmi: newBmi, estCurrentBf: Math.max(5, newBf)}));
                  setWeightInput("");
                }} style={{background:C.green,border:"none",borderRadius:8,padding:"8px 14px",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  {lang==="ja"?"記録":lang==="ko"?"기록":"Log"}
                </button>
              </div>
            </div>
            {/* Habit score */}
            {streak > 0 && (
              <div style={{background:"linear-gradient(135deg,"+coach.bg+","+C.card+")",borderRadius:16,padding:"14px 16px",border:"1px solid "+coach.color+"20",marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontFamily:"Bebas Neue",fontSize:14,letterSpacing:1,color:C.text}}>{lang==="ja"?"習慣スコア":lang==="ko"?"습관 스코어":"HABIT SCORE"}</div>
                    <div style={{fontSize:11,color:C.muted}}>{lang==="ja"?streak+"日連続継続中":lang==="ko"?streak+"일 연속 달성중":streak+" day streak"}</div>
                  </div>
                  <div style={{fontFamily:"Bebas Neue",fontSize:36,color:coach.color}}>{Math.min(100,streak*3+todayDone*10)}%</div>
                </div>
              </div>
            )}
            {/* Quick action to coach */}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setTab("coach");setChatIn(lang==="ja"?"今日のやる気を出して！":lang==="ko"?"오늘 동기부여 해줘！":"Motivate me today!");}} style={{flex:1,background:coach.bg,border:"1px solid "+coach.color+"30",borderRadius:12,padding:"12px 0",color:coach.color,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                {coach.emoji} {lang==="ja"?"やる気を出す":lang==="ko"?"동기부여":"Get Motivated"}
              </button>
              <button onClick={()=>{setTab("nutrition");}} style={{flex:1,background:"rgba(34,197,94,0.06)",border:"1px solid "+C.border,borderRadius:12,padding:"12px 0",color:C.green,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                🥗 {lang==="ja"?"食事記録":lang==="ko"?"식사 기록":"Log Meal"}
              </button>
            </div>
          </div>
        )}
        {/* ════ COACH TAB ════ */}
        {tab === "coach" && (
          <div style={{animation:"fadeIn .3s ease"}}>
            <TrialProgressBanner cl={cl} lang={lang} coach={coach} profile={profile} onUpgrade={()=>setShowUpgrade(true)}/>
            {/* View toggle */}
            <div style={{display:"flex",gap:6,marginBottom:12}}>
              {["calendar","chat"].map(v=>(
                <button key={v} onClick={()=>setCoachView(v)} style={{flex:1,padding:"8px 0",borderRadius:10,border:"2px solid "+coachView===v?coach.color:C.border,background:coachView===v?coach.bg:"transparent",color:coachView===v?coach.color:C.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                  {v==="calendar"?(lang==="ja"?"📅 カレンダー":lang==="ko"?"📅 캘린더":"📅 Calendar"):(lang==="ja"?"💬 チャット":lang==="ko"?"💬 채팅":"💬 Chat")}
                </button>
              ))}
            </div>
            {/* Calendar view */}
            {coachView === "calendar" && (
              <div>
                {/* Month header */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <button onClick={()=>{const d=new Date(calDate);d.setMonth(d.getMonth()-1);setCalDate(d);}} style={{background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer"}}>‹</button>
                  <div style={{fontFamily:"Bebas Neue",fontSize:15,letterSpacing:1,color:C.text}}>{calDate.toLocaleString(lang==="ja"?"ja-JP":lang==="ko"?"ko-KR":"en-US",{month:"long",year:"numeric"})}</div>
                  <button onClick={()=>{const d=new Date(calDate);d.setMonth(d.getMonth()+1);setCalDate(d);}} style={{background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer"}}>›</button>
                </div>
                {/* Day grid */}
                {(()=>{
                  const year=calDate.getFullYear(),month=calDate.getMonth();
                  const firstDay=new Date(year,month,1).getDay();
                  const daysInMonth=new Date(year,month+1,0).getDate();
                  const cells=[];
                  for(let i=0;i<firstDay;i++) cells.push(null);
                  for(let d=1;d<=daysInMonth;d++) cells.push(d);
                  const weeks=[];
                  for(let i=0;i<cells.length;i+=7) weeks.push(cells.slice(i,i+7));
                  const dayNames=lang==="ja"?["日","月","火","水","木","金","土"]:lang==="ko"?["일","월","화","수","목","금","토"]:["S","M","T","W","T","F","S"];
                  return(
                    <div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
                        {dayNames.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:C.muted,padding:"4px 0"}}>{d}</div>)}
                      </div>
                      {weeks.map((week,wi)=>(
                        <div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:2}}>
                          {week.map((d,di)=>{
                            if(!d) return <div key={di}/>;
                            const dk=year+"-"+String(month+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");
                            const dayItems=schedule.filter(s=>s.dateKey===dk);
                            const done=dayItems.filter(s=>s.done).length;
                            const total=dayItems.length;
                            const isToday=dk===today;
                            const hasMeals=mealHist[dk]?.length>0;
                            return(
                              <div key={di} onClick={()=>{setCalDate(new Date(dk));setCalFilter("all");}} style={{background:isToday?coach.bg:total>0?C.green+"08":"transparent",borderRadius:8,padding:"5px 0",textAlign:"center",cursor:"pointer",border:"1px solid "+isToday?coach.color:total>0?C.green+"20":C.border}}>
                                <div style={{fontSize:11,color:isToday?coach.color:total>0?C.green:C.muted,fontWeight:isToday?700:400}}>{d}</div>
                                {total>0&&<div style={{fontSize:8,color:done===total?C.green:C.muted}}>{done}/{total}</div>}
                                {hasMeals&&<div style={{fontSize:7,color:"#f97316"}}>•</div>}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {/* Selected day schedule */}
                <div style={{marginTop:12}}>
                  <div style={{fontFamily:"Bebas Neue",fontSize:14,letterSpacing:1,color:C.text,marginBottom:8}}>
                    {calDate.toLocaleDateString(lang==="ja"?"ja-JP":lang==="ko"?"ko-KR":"en-US",{month:"short",day:"numeric"})}
                  </div>
                  {(()=>{
                    const dk=toDateKey(calDate);
                    const dayItems=schedule.filter(s=>s.dateKey===dk);
                    if(dayItems.length===0) return <div style={{fontSize:12,color:C.muted,padding:"8px 0"}}>{lang==="ja"?"予定なし":lang==="ko"?"일정 없음":"No workouts scheduled"}</div>;
                    return dayItems.map(item=>(
                      <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid "+C.dim}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:item.done?C.green:item.missed?"#ef4444":coach.color,flexShrink:0}}/>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,color:item.done?C.muted:C.text}}>{item.exercise}</div>
                          <div style={{fontSize:10,color:C.muted}}>{item.sets}×{item.reps}</div>
                        </div>
                        {dk===today&&!item.done&&(
                          <button onClick={()=>setCounterM({exercise:item.exercise,sets:item.sets,reps:item.reps})} style={{background:coach.color,border:"none",borderRadius:8,padding:"5px 10px",color:"#000",fontSize:11,fontWeight:700,cursor:"pointer"}}>▶</button>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Chat view */}
            {coachView === "chat" && (
              <div>
                {/* Coach header */}
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,padding:"10px 14px",background:coach.bg,borderRadius:14,border:"1px solid "+coach.color+"25"}}>
                  <span style={{fontSize:28}}>{coach.emoji}</span>
                  <div>
                    <div style={{fontFamily:"Bebas Neue",fontSize:16,letterSpacing:1,color:coach.color}}>{coach[lang]||coach.en}</div>
                    <div style={{fontSize:10,color:C.muted}}>{coach.sub?.[lang]||coach.sub?.en}</div>
                  </div>
                </div>
                {/* Chat history */}
                <div style={{minHeight:200,marginBottom:12}}>
                  {chatHist.map((msg,i)=>(
                    <div key={i} style={{marginBottom:10,display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start"}}>
                      <div style={{maxWidth:"84%",background:msg.role==="user"?coach.color:C.card,borderRadius:msg.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 14px",border:msg.role==="user"?"none":"1px solid "+C.border}}>
                        <div style={{fontSize:13,color:msg.role==="user"?"#000":C.white,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{msg.text}</div>
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div style={{display:"flex",gap:4,padding:"10px 14px",background:C.card,borderRadius:16,border:"1px solid "+C.border,width:"fit-content",marginBottom:10}}>
                      {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.muted,animation:"spin .8s "+i*0.2+"s infinite"}}/>)}
                    </div>
                  )}
                  <div ref={chatEndRef}/>
                </div>
                {/* Chat limit indicator（サーバーUTC基準） */}
                {!canChat ? (
                  <div style={{borderRadius:14,overflow:"hidden",marginBottom:10}}>
                    {isPro ? (
                      <div style={{background:C.proBg,border:"1px solid "+C.pro,borderRadius:14,padding:"12px 14px",textAlign:"center"}}>
                        <div style={{fontSize:12,color:C.pro,fontWeight:700,marginBottom:4}}>
                          {lang==="ja"?"今月の300回を使い切りました":lang==="ko"?"이번 달 300회를 모두 사용했습니다":"Monthly limit of 300 reached"}
                        </div>
                        <div style={{fontSize:9,color:C.muted,marginBottom:4}}>{lang==="ja"?"次回リセットまで":lang==="ko"?"다음 리셋까지":"Resets in"}</div>
                        <div style={{fontFamily:"Bebas Neue",fontSize:18,color:C.pro}}>{resetCountdown}</div>
                      </div>
                    ) : (
                      <div style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:14,padding:"14px 16px"}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#15803d",marginBottom:6}}>
                          {lang==="ja"?"ここから先は、本気で変わる領域です。":
                           lang==="ko"?"여기서부터는, 진지하게 변하는 영역입니다.":
                           "This is where real change begins."}
                        </div>
                        <div style={{fontSize:11,color:"#166534",lineHeight:1.6,marginBottom:10}}>
                          {lang==="ja"?"今日の体調・食事・継続状況に合わせて、AIコーチが毎日プランを調整します。":
                           lang==="ko"?"오늘의 컨디션·식사·지속 상황에 맞춰, AI 코치가 매일 플랜을 조정합니다.":
                           "Your coach adjusts your plan every day based on how you're actually doing."}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                          <div style={{flex:1,height:1,background:"rgba(34,197,94,0.2)"}}/>
                          <div style={{fontSize:9,color:"#16a34a",background:"rgba(34,197,94,0.1)",padding:"2px 8px",borderRadius:99}}>
                            {lang==="ja"?"次回リセット":lang==="ko"?"다음 리셋":"Resets in"} {resetCountdown}
                          </div>
                          <div style={{flex:1,height:1,background:"rgba(34,197,94,0.2)"}}/>
                        </div>
                        <button onClick={()=>setShowUpgrade(true)} style={{width:"100%",background:"linear-gradient(135deg,#16a34a,#22c55e)",border:"none",borderRadius:10,padding:"11px 0",color:"#fff",fontFamily:"Bebas Neue",fontSize:16,letterSpacing:2,cursor:"pointer"}}>
                          {lang==="ja"?"7日間 "+PRICE_TRIAL+"で試す →":lang==="ko"?"7일 "+PRICE_TRIAL+"로 체험 →":"Try 7 Days for "+PRICE_TRIAL+" →"}
                        </button>
                        <div style={{textAlign:"center",fontSize:9,color:"#6b7280",marginTop:6}}>
                          {lang==="ja"?"7日間または50回までお試し。終了後は自動で無料プランに戻ります。":
                           lang==="ko"?"7일 또는 50회까지 체험. 종료 후 자동으로 무료 플랜으로 돌아갑니다.":
                           "7 days or 50 sessions. No auto-charge after trial ends."}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{background:"rgba(0,0,0,0.03)",borderRadius:10,padding:"8px 12px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid "+C.dim}}>
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:cl.remaining<=2?"#ef4444":cl.remaining<=5?"#f59e0b":C.green}}>
                        {lang==="ja"?`残り${cl.remaining}回`:lang==="ko"?`남은 ${cl.remaining}회`:`${cl.remaining} left`}
                        <span style={{fontSize:9,color:C.muted,fontWeight:400,marginLeft:4}}>
                          {isPro
                            ? (lang==="ja"?"（今月）":lang==="ko"?"（이번달）":"(this month)")
                            : (lang==="ja"?"（今日）":lang==="ko"?"（오늘）":"(today)")}
                        </span>
                      </div>
                      <div style={{fontSize:9,color:C.muted,marginTop:2}}>
                        {lang==="ja"?"次回リセットまで":lang==="ko"?"다음 리셋까지":"Next reset in"} {resetCountdown}
                      </div>
                    </div>
                    {!isPro && cl.remaining<=1 && (
                      <button onClick={()=>setShowUpgrade(true)} style={{background:C.pro,border:"none",borderRadius:6,padding:"3px 10px",color:"#fff",fontSize:10,cursor:"pointer",flexShrink:0}}>PRO</button>
                    )}
                  </div>
                )}
                {/* Quick prompts */}
                <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                  {(isPro ? [
                    lang==="ja"?"1ヶ月の食事プランを作って":lang==="ko"?"1개월 식단 플랜 짜줘":"Build me a 1-month meal plan",
                    lang==="ja"?"今日のジムトレを組んで":lang==="ko"?"오늘 헬스장 운동 짜줘":"Give me a gym workout today",
                    lang==="ja"?"今日の自宅トレを組んで":lang==="ko"?"오늘 홈 트레이닝 짜줘":"Give me a home workout today",
                    lang==="ja"?"疲れてる、プランを調整して":lang==="ko"?"피곤해, 플랜 조정해줘":"I'm tired, adapt my plan",
                  ] : [
                    lang==="ja"?"今日の調子はどう?":lang==="ko"?"오늘 컨디션 어때?":"How am I doing today?",
                    lang==="ja"?"次は何を食べればいい?":lang==="ko"?"다음에 뭐 먹을까?":"What should I eat next?",
                    lang==="ja"?"今日疲れてる、どうしたら?":lang==="ko"?"오늘 너무 피곤해, 도움줘!":"I'm tired today, help!",
                    lang==="ja"?"やる気出して！":lang==="ko"?"동기부여 해줘！":"Motivate me! 🔥",
                  ]).map(p=>(
                    <button key={p} onClick={()=>sendChat(p)} style={{background:C.card,border:"1px solid "+C.border,borderRadius:20,padding:"5px 10px",color:C.muted,fontSize:10,cursor:"pointer",whiteSpace:"nowrap"}}>
                      {p}
                    </button>
                  ))}
                </div>
                {/* Input - always visible */}
                <div style={{position:"sticky",bottom:0,background:C.surface,paddingTop:6}}>
                <div style={{display:"flex",gap:8}}>
                  <input value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendChat()} placeholder={canChat?(lang==="ja"?"コーチに話しかける...":lang==="ko"?"코치에게 말하기...":"Talk to your coach..."):(lang==="ja"?"明日また話そう":lang==="ko"?"내일 다시 얘기해요":"Come back tomorrow")} disabled={!canChat} style={{flex:1,background:C.card,border:"1px solid "+(canChat?C.border:C.dim),borderRadius:12,padding:"10px 14px",color:C.text,fontSize:13}}/>
                  <button onClick={()=>sendChat()} disabled={!canChat||!chatIn.trim()||aiLoading} style={{background:canChat&&chatIn.trim()?coach.color:C.dim,border:"none",borderRadius:12,width:44,height:44,fontSize:18,cursor:canChat&&chatIn.trim()?"pointer":"not-allowed"}}>
                    ▶
                  </button>
                </div>
                </div>
                <div style={{fontSize:10,color:C.muted,textAlign:"right",marginTop:4}}>{cl.used}/{cl.limit} {lang==="ja"?"回使用":lang==="ko"?"회 사용":"used"}</div>
              </div>
            )}
          </div>
        )}

        {/* ════ PROGRESS TAB ════ */}
        {tab === "progress" && (
          <div style={{animation:"fadeIn .3s ease"}}>
            {/* ── Goal achievement card ── */}
            <div style={{background:"linear-gradient(135deg,#e8f8ef,#d1fae5)",borderRadius:18,padding:"16px 18px",marginBottom:12,border:"1px solid rgba(34,197,94,0.2)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div>
                  <div style={{fontSize:11,color:"#6b7280",marginBottom:2}}>{lang==="ja"?"目指す体型":lang==="ko"?"목표 체형":lang==="zh"?"目标体型":"Goal Physique"}</div>
                  <div style={{fontFamily:"Bebas Neue",fontSize:18,color:C.greenDark,letterSpacing:1}}>{profile?.bodyGoal?.[lang]||profile?.bodyGoal?.en||profile?.bodyGoal?.title||"Lean & Fit"}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:28,fontWeight:900,color:C.green}}>{achieveRate}%</div>
                  <div style={{fontSize:10,color:"#6b7280"}}>{lang==="ja"?"達成推定":lang==="ko"?"달성 추정":lang==="zh"?"预计达成":"Est. progress"}</div>
                </div>
              </div>
              <div style={{height:6,background:"rgba(34,197,94,0.2)",borderRadius:3,marginBottom:10}}>
                <div style={{height:6,background:"linear-gradient(90deg,#22c55e,#4ade80)",borderRadius:3,width:achieveRate+"%",transition:"width 0.8s"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                <div style={{textAlign:"center",background:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 0"}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#d97706"}}>~{Math.round(bfDiff*30)}{lang==="ja"?"日":lang==="ko"?"일":lang==="zh"?"天":"d"}</div>
                  <div style={{fontSize:9,color:"#6b7280"}}>{lang==="ja"?"推定期間":lang==="ko"?"예상 기간":lang==="zh"?"预计时间":"Est. timeline"}</div>
                </div>
                <div style={{textAlign:"center",background:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 0"}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#3b82f6"}}>{bfDiff.toFixed(1)}%</div>
                  <div style={{fontSize:9,color:"#6b7280"}}>{lang==="ja"?"体脂肪削減目標":lang==="ko"?"체지방 감소 목표":lang==="zh"?"体脂目标":"BF to lose"}</div>
                </div>
                <div style={{textAlign:"center",background:"rgba(255,255,255,0.6)",borderRadius:8,padding:"6px 0"}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#8b5cf6"}}>Lv.{curLv.lv}</div>
                  <div style={{fontSize:9,color:"#6b7280"}}>{curLv.label[lang]||curLv.label.en}</div>
                </div>
              </div>
            </div>
            {/* ── Level progress bar ── */}
            <div style={{background:C.card,borderRadius:14,padding:"12px 16px",marginBottom:12,border:"1px solid "+C.border}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{fontSize:12,fontWeight:700,color:C.text}}>Lv.{curLv.lv} {curLv.label[lang]||curLv.label.en}</div>
                <div style={{fontSize:11,color:C.muted}}>→ Lv.{nextLv.lv} {nextLv.label[lang]||nextLv.label.en}</div>
              </div>
              <div style={{height:8,background:C.dim,borderRadius:4,marginBottom:4}}>
                <div style={{height:8,background:"linear-gradient(90deg,#8b5cf6,#a78bfa)",borderRadius:4,width:lvPct+"%",transition:"width 0.5s"}}/>
              </div>
              <div style={{fontSize:10,color:C.muted,textAlign:"right"}}>XP: {xp} / {nextLv.minXp}</div>
            </div>
            {/* Ideal physique progress */}
            <div style={{background:C.card,borderRadius:16,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.border}}>
              <div style={{fontFamily:"Bebas Neue",fontSize:14,letterSpacing:1,color:C.text,marginBottom:10}}>{lang==="ja"?"理想体型への進捗":lang==="ko"?"이상 체형 달성도":"PROGRESS TO IDEAL PHYSIQUE"}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:11,color:C.muted}}>{lang==="ja"?"現在":lang==="ko"?"현재":"Current"}: {profile.currentWeightKg}kg</div>
                  <div style={{fontSize:11,color:C.muted}}>{lang==="ja"?"目標":lang==="ko"?"목표":"Target"}: {profile.idealWeightKg}kg</div>
                  <div style={{fontSize:11,color:C.green,marginTop:4}}>{lang==="ja"?"目標体型":lang==="ko"?"목표 체형":"Goal"}: {profile.bodyGoal?.[lang]||profile.bodyGoal?.title}</div>
                </div>
                <Ring val={Math.min(100,Math.max(0,Math.round((profile.currentWeightKg - profile.idealWeightKg < 0 ? (1-(Math.abs(profile.currentWeightKg-profile.idealWeightKg)/profile.currentWeightKg))*100 : 100))))} size={60} color={coach.color}/>
              </div>
              {/* Weight history chart (last 7 entries) */}
              {Object.keys(weightLog).length > 1 && (()=>{
                const entries = Object.entries(weightLog).sort(([a],[b])=>a.localeCompare(b)).slice(-7);
                const min = Math.min(...entries.map(([,v])=>v));
                const max = Math.max(...entries.map(([,v])=>v));
                const range = max-min || 1;
                return(
                  <div style={{marginTop:10,display:"flex",alignItems:"flex-end",gap:4,height:40}}>
                    {entries.map(([d,v])=>(
                      <div key={d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                        <div style={{width:"100%",background:v===Math.min(...entries.map(([,vv])=>vv))?C.green:coach.color,borderRadius:"3px 3px 0 0",height:Math.round(((v-min)/range)*30)+10+"px",opacity:0.8}}/>
                        <div style={{fontSize:8,color:C.muted}}>{d.slice(5)}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Body change indicators */}
            <div style={{background:C.card,borderRadius:16,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.border}}>
              <div style={{fontFamily:"Bebas Neue",fontSize:14,letterSpacing:1,color:C.text,marginBottom:10}}>{lang==="ja"?"体の変化":lang==="ko"?"체형 변화":"BODY CHANGES"}</div>
              {profile.gender === "female" ? (
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:12,color:C.muted}}>{lang==="ja"?"体重":lang==="ko"?"체중":"Weight"}</span>
                    <span style={{fontSize:12,color:C.text,fontWeight:700}}>{profile.currentWeightKg}kg</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:12,color:C.muted}}>{lang==="ja"?"体脂肪率（推定）":lang==="ko"?"체지방률（추정）":"Est. Body Fat"}</span>
                    <span style={{fontSize:12,color:coach.color,fontWeight:700}}>~{Math.round(profile.bmi * 1.2)}%</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:12,color:C.muted}}>{lang==="ja"?"除脂肪体重（推定）":lang==="ko"?"제지방 체중（추정）":"Est. LBM"}</span>
                    <span style={{fontSize:12,color:C.green,fontWeight:700}}>~{Math.round(profile.currentWeightKg * 0.75)}kg</span>
                  </div>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:12,color:C.muted}}>{lang==="ja"?"除脂肪体重（推定）":lang==="ko"?"제지방 체중（추정）":"Est. LBM"} <span style={{fontSize:10,color:C.green}}>(main)</span></span>
                    <span style={{fontSize:12,color:C.text,fontWeight:700}}>~{Math.round(profile.currentWeightKg * 0.82)}kg</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:12,color:C.muted}}>{lang==="ja"?"体脂肪率（推定）":lang==="ko"?"체지방률（추정）":"Est. Body Fat"}</span>
                    <span style={{fontSize:12,color:coach.color,fontWeight:700}}>~{Math.round(profile.bmi * 0.9)}%</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:12,color:C.muted}}>{lang==="ja"?"体重":lang==="ko"?"체중":"Weight"} <span style={{fontSize:10,color:C.muted}}>(ref)</span></span>
                    <span style={{fontSize:12,color:C.muted,fontWeight:700}}>{profile.currentWeightKg}kg</span>
                  </div>
                </div>
              )}
              <div style={{fontSize:10,color:C.muted,marginTop:8}}>{lang==="ja"?"※推定値です。参考としてご利用ください。":lang==="ko"?"※추정값입니다. 참고용으로 활용하세요.":"※ Estimated values for reference only."}</div>
            </div>

            {/* Weekly habit report (PRO only) */}
            {isPro ? (
              <div style={{background:C.card,borderRadius:16,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.pro+"20"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div>
                    <div style={{fontFamily:"Bebas Neue",fontSize:14,letterSpacing:1,color:C.text}}>{lang==="ja"?"週次習慣レポート":lang==="ko"?"주간 습관 리포트":"WEEKLY HABIT REPORT"}</div>
                    <div style={{fontSize:10,color:C.muted}}>{new Date().toLocaleDateString(lang==="ja"?"ja-JP":lang==="ko"?"ko-KR":"en-US",{month:"long",day:"numeric",year:"numeric"})} · {lang==="ja"?"参考情報":lang==="ko"?"참고 정보":"Reference only"}</div>
                  </div>
                  <span style={{fontSize:20}}>📊</span>
                </div>
                {(()=>{
                  const days=7;
                  const donePercent=Math.round(todayDone/Math.max(1,todayTotal)*100);
                  const mealDays=Object.keys(mealHist).filter(d=>{
                    const now=new Date(); const start=new Date(now); start.setDate(start.getDate()-7);
                    return new Date(d)>=start;
                  }).length;
                  return(
                    <div style={{display:"flex",gap:8}}>
                      {[
                        {label:lang==="ja"?"トレーニング":lang==="ko"?"트레이닝":"Workouts",val:todayDone+"/"+todayTotal,color:C.green},
                        {label:lang==="ja"?"連続日数":lang==="ko"?"연속 일수":"Streak",val:streak+"d",color:coach.color},
                        {label:lang==="ja"?"食事記録日":lang==="ko"?"식사 기록일":"Meal days",val:mealDays+"/7",color:"#f97316"},
                      ].map(s=>(
                        <div key={s.label} style={{flex:1,background:C.surface,borderRadius:10,padding:"8px 10px",border:"1px solid "+C.border,textAlign:"center"}}>
                          <div style={{fontFamily:"Bebas Neue",fontSize:20,color:s.color}}>{s.val}</div>
                          <div style={{fontSize:9,color:C.muted}}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div style={{background:C.proBg,borderRadius:16,padding:"14px 16px",border:"1px solid "+C.pro+"30",textAlign:"center"}}>
                <div style={{fontSize:13,color:C.text,fontWeight:700,marginBottom:4}}>{lang==="ja"?"週次習慣レポートはPROのみ":lang==="ko"?"주간 습관 리포트는 PRO 전용":"Weekly Reports — PRO only"}</div>
                <button onClick={()=>setShowUpgrade(true)} style={{background:C.pro,border:"none",borderRadius:10,padding:"8px 20px",color:"#fff",fontSize:12,cursor:"pointer"}}>→ Upgrade</button>
              </div>
            )}

            {/* ── 未来体型予測（PRO限定）── */}
            {isPro ? (()=>{
              const fb = calcFutureBody(profile, schedule, streak);
              if (!fb) return null;
              const tl = fb.timeline;

              // 見た目の変化メッセージ（感情に訴える）
              const changeMsg = (pt) => {
                const bfDiff = Math.round((bf - pt.bf) * 10) / 10;
                const wDiff  = Math.round((profile.currentWeightKg - pt.weight) * 10) / 10;
                if (lang === "ja") {
                  if (pt.days === 30) return `体重-${wDiff}kg。服のシルエットが変わりはじめる頃。`;
                  if (pt.days === 60) return `体脂肪-${bfDiff}%。鏡で変化に気づく頃。`;
                  return `体脂肪${pt.bf}%台。周りから「変わった？」と言われるレベル。`;
                } else if (lang === "ko") {
                  if (pt.days === 30) return `체중 -${wDiff}kg. 옷 실루엣이 달라지기 시작.`;
                  if (pt.days === 60) return `체지방 -${bfDiff}%. 거울에서 변화가 보이기 시작.`;
                  return `체지방 ${pt.bf}%. 주변에서 '달라졌어?' 소리 들을 레벨.`;
                } else {
                  if (pt.days === 30) return `-${wDiff}kg. Clothes start fitting differently.`;
                  if (pt.days === 60) return `-${bfDiff}% body fat. You'll notice it in the mirror.`;
                  return `${pt.bf}% body fat. People will ask "did you change something?"`;
                }
              };

              return (
                <div style={{background:"linear-gradient(135deg,#f5f3ff,#ede9fe)",borderRadius:18,padding:"16px",marginBottom:12,border:"1px solid rgba(124,58,237,0.25)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontSize:18}}>🔮</span>
                    <div style={{fontFamily:"Bebas Neue",fontSize:15,letterSpacing:2,color:"#7c3aed"}}>
                      {lang==="ja"?"このまま続けたら":lang==="ko"?"이대로 계속하면":"IF YOU KEEP GOING"}
                    </div>
                    <div style={{marginLeft:"auto",fontSize:9,color:"#9ca3af"}}>
                      {lang==="ja"?"※推定値":lang==="ko"?"※추정치":"※estimated"}
                    </div>
                  </div>
                  <div style={{fontSize:11,color:"#6b7280",marginBottom:14}}>
                    {lang==="ja"?`現在 ${profile.currentWeightKg}kg / 体脂肪 約${profile.estCurrentBf||22}% からの予測`:
                     lang==="ko"?`현재 ${profile.currentWeightKg}kg / 체지방 약${profile.estCurrentBf||22}% 기준 예측`:
                     `From current ${profile.currentWeightKg}kg / ~${profile.estCurrentBf||22}% body fat`}
                  </div>

                  {/* 3段タイムライン */}
                  {tl.map((pt, i) => (
                    <div key={pt.days} style={{marginBottom: i < 2 ? 12 : 0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                        <div style={{
                          background: i===2?"linear-gradient(135deg,#7c3aed,#a855f7)":i===1?"rgba(139,92,246,0.3)":"rgba(139,92,246,0.15)",
                          borderRadius:20, padding:"3px 10px",
                          fontSize:10, fontWeight:700,
                          color: i===2?"#fff":"#c4b5fd",
                          border: i===2?"none":"1px solid rgba(139,92,246,0.3)"
                        }}>
                          {lang==="ja"?`${pt.days}日後`:lang==="ko"?`${pt.days}일 후`:`Day ${pt.days}`}
                        </div>
                        <div style={{fontSize:10,color:"#6b7280",flex:1}}>{changeMsg(pt)}</div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
                        {[
                          {k:lang==="ja"?"体重":lang==="ko"?"체중":"Weight", v:pt.weight+"kg", c:"#34d399"},
                          {k:lang==="ja"?"体脂肪率":lang==="ko"?"체지방":"Body fat", v:"~"+pt.bf+"%", c:"#60a5fa"},
                          {k:lang==="ja"?"脂肪減":lang==="ko"?"지방감소":"Fat loss", v:"-"+pt.fatLoss+"kg", c:"#fb923c"},
                          {k:lang==="ja"?"達成率":lang==="ko"?"달성률":"Progress", v:pt.rate+"%", c:"#c4b5fd"},
                        ].map(({k,v,c})=>(
                          <div key={k} style={{background:"rgba(124,58,237,0.06)",borderRadius:8,padding:"6px 6px",textAlign:"center",border:"1px solid rgba(124,58,237,0.12)"}}>
                            <div style={{fontSize:8,color:"#9ca3af",marginBottom:2}}>{k}</div>
                            <div style={{fontFamily:"Bebas Neue",fontSize:14,color:c}}>{v}</div>
                          </div>
                        ))}
                      </div>
                      {i < 2 && <div style={{height:1,background:"rgba(139,92,246,0.2)",marginTop:12}}/>}
                    </div>
                  ))}

                  {/* プログレスバー */}
                  <div style={{marginTop:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#9ca3af",marginBottom:4}}>
                      <span>{lang==="ja"?"今日":lang==="ko"?"오늘":"Today"}</span>
                      <span style={{color:"#7c3aed",fontWeight:700}}>🔥 {streak}{lang==="ja"?"日継続中":lang==="ko"?"일 연속":" day streak"}</span>
                      <span>{lang==="ja"?"90日後":lang==="ko"?"90일 후":"Day 90"}</span>
                    </div>
                    <div style={{height:6,background:"rgba(124,58,237,0.15)",borderRadius:3}}>
                      <div style={{height:6,background:"linear-gradient(90deg,#7c3aed,#c4b5fd)",borderRadius:3,width:(Math.min(90,streak)/90*100)+"%",transition:"width 0.8s"}}/>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div style={{background:"linear-gradient(135deg,#f5f3ff,#ede9fe)",borderRadius:16,padding:"16px",marginBottom:12,border:"1px solid rgba(124,58,237,0.25)",textAlign:"center"}}>
                <div style={{fontSize:18,marginBottom:6}}>🔮</div>
                <div style={{fontSize:13,fontWeight:700,color:"#7c3aed",marginBottom:4}}>
                  {lang==="ja"?"このまま続けたら30/60/90日後は？":lang==="ko"?"이대로 계속하면 30/60/90일 후는?":"What happens at Day 30, 60, 90?"}
                </div>
                <div style={{fontSize:11,color:"#9ca3af",marginBottom:12}}>
                  {lang==="ja"?"体重・体脂肪・見た目の変化を予測（PRO限定）":lang==="ko"?"체중·체지방·외모 변화 예측（PRO 전용）":"Predict weight, body fat & appearance changes"}
                </div>
                <button onClick={()=>setShowUpgrade(true)} style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)",border:"none",borderRadius:10,padding:"9px 24px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  {lang==="ja"?"PRO で予測を見る →":lang==="ko"?"PRO로 예측 보기 →":"See My Prediction →"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════ NUTRITION TAB ════ */}
        {tab === "nutrition" && (
          <div style={{animation:"fadeIn .3s ease"}}>
            <TrialProgressBanner cl={cl} lang={lang} coach={coach} profile={profile} onUpgrade={()=>setShowUpgrade(true)}/>

            {/* ── カレンダーグリッド ── */}
            {(()=>{
              const selDate = new Date(mealDate+"T00:00:00");
              const calYear = selDate.getFullYear();
              const calMonth = selDate.getMonth();
              const firstDay = new Date(calYear, calMonth, 1).getDay();
              const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
              const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString(
                lang==="ja"?"ja-JP":lang==="ko"?"ko-KR":"en-US",{year:"numeric",month:"long"}
              );
              const dayLabels = lang==="ja"?["日","月","火","水","木","金","土"]:
                                lang==="ko"?["일","월","화","수","목","금","토"]:
                                ["Su","Mo","Tu","We","Th","Fr","Sa"];
              const prevMonth = () => {
                const d = new Date(calYear, calMonth-1, 1);
                const last = new Date(calYear, calMonth, 0).getDate();
                // 前月の最終日に移動
                setMealDate(toDateKey(new Date(calYear, calMonth-1, last)));
              };
              const nextMonth = () => {
                setMealDate(toDateKey(new Date(calYear, calMonth+1, 1)));
              };
              // その月に記録がある日を収集
              const recordedDays = new Set(
                Object.keys(mealHist).filter(k=>{
                  return k.startsWith(calYear+"-"+String(calMonth+1).padStart(2,"0"));
                }).concat(
                  (mealHist[today]||meals).length>0 && today.startsWith(calYear+"-"+String(calMonth+1).padStart(2,"0")) ? [today] : []
                )
              );
              return (
                <div style={{background:C.card,borderRadius:16,padding:"12px 14px",marginBottom:12,border:"1px solid "+C.border}}>
                  {/* 月ナビ */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <button onClick={prevMonth} style={{background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer",padding:"4px 8px"}}>‹</button>
                    <div style={{fontFamily:"Bebas Neue",fontSize:15,letterSpacing:1,color:C.text}}>{monthLabel}</div>
                    <button onClick={nextMonth} style={{background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer",padding:"4px 8px"}}>›</button>
                  </div>
                  {/* 曜日ヘッダー */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:4}}>
                    {dayLabels.map((d,i)=>(
                      <div key={i} style={{textAlign:"center",fontSize:9,color:i===0?"#ef4444":i===6?"#3b82f6":C.muted,fontWeight:600,padding:"2px 0"}}>{d}</div>
                    ))}
                  </div>
                  {/* 日付グリッド */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
                    {Array(firstDay).fill(null).map((_,i)=><div key={"e"+i}/>)}
                    {Array(daysInMonth).fill(null).map((_,i)=>{
                      const day = i+1;
                      const dk = calYear+"-"+String(calMonth+1).padStart(2,"0")+"-"+String(day).padStart(2,"0");
                      const isToday = dk===today;
                      const isSel = dk===mealDate;
                      const isFuture = dk>today;
                      const hasMeal = recordedDays.has(dk) || (dk===today && meals.length>0);
                      const dow = new Date(calYear,calMonth,day).getDay();
                      return (
                        <button key={day} onClick={()=>setMealDate(dk)} style={{
                          position:"relative",
                          aspectRatio:"1",
                          borderRadius:8,
                          border:isSel?"2px solid "+C.green:isToday?"1.5px solid "+C.green+"60":"1px solid transparent",
                          background:isSel?C.green:isToday?C.greenGlow:"transparent",
                          color:isSel?"#000":isToday?C.green:dow===0?"#ef4444":dow===6?"#3b82f6":C.text,
                          fontSize:11,fontWeight:isSel||isToday?700:400,
                          cursor:"pointer",display:"flex",flexDirection:"column",
                          alignItems:"center",justifyContent:"center",gap:1,
                          opacity:isFuture?0.6:1,
                        }}>
                          {day}
                          {hasMeal&&<div style={{width:4,height:4,borderRadius:"50%",background:isSel?"#000":C.green}}/>}
                          {isFuture&&!hasMeal&&<div style={{width:3,height:3,borderRadius:"50%",background:isSel?"#000":"#a855f7",opacity:0.7}}/>}
                        </button>
                      );
                    })}
                  </div>
                  {/* 凡例 */}
                  <div style={{display:"flex",gap:12,marginTop:8,justifyContent:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:C.muted}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:C.green}}/>{lang==="ja"?"記録あり":lang==="ko"?"기록 있음":"Logged"}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:C.muted}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:"#a855f7"}}/>{lang==="ja"?"未来プラン":lang==="ko"?"미래 플랜":"Plan"}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 選択中の日付ラベル */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{fontFamily:"Bebas Neue",fontSize:15,letterSpacing:1,color:C.text}}>
                {mealDate===today
                  ?(lang==="ja"?"📅 今日":lang==="ko"?"📅 오늘":"📅 Today")
                  :mealDate>today
                    ?(lang==="ja"?"🔮 "+new Date(mealDate+"T00:00:00").toLocaleDateString("ja-JP",{month:"short",day:"numeric"}):
                      lang==="ko"?"🔮 "+new Date(mealDate+"T00:00:00").toLocaleDateString("ko-KR",{month:"short",day:"numeric"}):
                      "🔮 "+new Date(mealDate+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}))
                    :(lang==="ja"?"📖 "+new Date(mealDate+"T00:00:00").toLocaleDateString("ja-JP",{month:"short",day:"numeric"}):
                      lang==="ko"?"📖 "+new Date(mealDate+"T00:00:00").toLocaleDateString("ko-KR",{month:"short",day:"numeric"}):
                      "📖 "+new Date(mealDate+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}))}
              </div>
              <div style={{fontSize:10,color:C.muted,background:
                mealDate===today?"rgba(34,197,94,0.12)":mealDate>today?"rgba(168,85,247,0.12)":"rgba(96,165,250,0.12)",
                borderRadius:20,padding:"2px 8px",
                color:mealDate===today?C.green:mealDate>today?"#a855f7":"#60a5fa"}}>
                {mealDate===today
                  ?(lang==="ja"?"今日":lang==="ko"?"오늘":"Today")
                  :mealDate>today
                    ?(lang==="ja"?"献立プラン":lang==="ko"?"식단 계획":"Plan")
                    :(lang==="ja"?"過去の記録":lang==="ko"?"과거 기록":"Past")}
              </div>
            </div>

            {/* Macro summary */}
            {(()=>{
              const dayMeals=mealDate===today?meals:(mealHist[mealDate]||[]);
              const cal=dayMeals.reduce((s,m)=>s+(m.cal||0),0);
              const pro=dayMeals.reduce((s,m)=>s+(m.protein||0),0);
              const carbs=dayMeals.reduce((s,m)=>s+(m.carbs||0),0);
              const fat=dayMeals.reduce((s,m)=>s+(m.fat||0),0);
              return(
                <div style={{background:C.card,borderRadius:16,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.border}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{fontFamily:"Bebas Neue",fontSize:14,letterSpacing:1,color:C.text}}>
                    {mealDate===today
                      ? (lang==="ja"?"今日の栄養":lang==="ko"?"오늘의 영양":"TODAY'S NUTRITION")
                      : mealDate>today
                        ? (lang==="ja"?"献立プラン":lang==="ko"?"식단 계획":"MEAL PLAN")
                        : (lang==="ja"?"過去の記録":lang==="ko"?"과거 기록":"PAST RECORD")}
                  </div>
                    <div style={{fontFamily:"Bebas Neue",fontSize:18,color:cal>calGoal?"#ef4444":C.green}}>{cal}<span style={{fontSize:10,color:C.muted}}>/{calGoal}kcal</span></div>
                  </div>
                  <div style={{height:4,background:C.dim,borderRadius:99,marginBottom:10}}>
                    <div style={{height:"100%",background:cal>calGoal?"#ef4444":C.green,borderRadius:99,width:Math.min(100,pct(cal,calGoal))+"%",transition:"width .4s"}}/>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    {[{label:lang==="ja"?"タンパク質":lang==="ko"?"단백질":"Protein",val:pro,unit:"g",color:C.green},{label:lang==="ja"?"炭水化物":lang==="ko"?"탄수화물":"Carbs",val:carbs,unit:"g",color:"#f97316"},{label:lang==="ja"?"脂質":lang==="ko"?"지방":"Fat",val:fat,unit:"g",color:"#a855f7"}].map(m=>(
                      <div key={m.label} style={{flex:1,background:C.surface,borderRadius:8,padding:"6px 0",textAlign:"center",border:"1px solid "+C.border}}>
                        <div style={{fontSize:13,fontWeight:700,color:m.color}}>{m.val}{m.unit}</div>
                        <div style={{fontSize:9,color:C.muted}}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Meal scan */}
            {(mealDate===today||mealDate<today)&&(
              <div style={{background:C.card,borderRadius:16,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.border}}>
                <div style={{fontFamily:"Bebas Neue",fontSize:14,letterSpacing:1,color:C.text,marginBottom:8}}>{lang==="ja"?"食事スキャン":lang==="ko"?"식사 스캔":"MEAL SCANNER"}</div>
                {scannedMeal ? (
                  <div>
                    <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{lang==="ja"?"※AIによる推定値です。参考としてご利用ください。":lang==="ko"?"※AI 추정값입니다. 참고용으로 활용하세요.":"※ AI estimates — values are approximate for reference only."}</div>
                    <div style={{background:C.surface,borderRadius:10,padding:"10px 12px",marginBottom:8,border:"1px solid "+C.green+"30"}}>
                      <div style={{fontFamily:"Bebas Neue",fontSize:13,color:C.green,marginBottom:4}}>✅ {lang==="ja"?"食事を検出":"MEAL DETECTED"}</div>
                      <div style={{fontSize:13,color:C.text,fontWeight:700}}>{scannedMeal.name}</div>
                      <div style={{fontSize:11,color:C.muted}}>{scannedMeal.cal}kcal · P:{scannedMeal.protein}g · C:{scannedMeal.carbs}g · F:{scannedMeal.fat}g</div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>{
                        const entry={...scannedMeal,dateKey:today,id:Date.now()};
                        const updMeals=[...meals,entry];
                        setMeals(updMeals);
                        const updHist={...mealHist,[today]:updMeals};
                        setMealHist(updHist);
                        syncMealHistory(updHist);
                        setScannedMeal(null);
                      }} style={{flex:1,background:C.green,border:"none",borderRadius:10,padding:"10px 0",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>{lang==="ja"?"記録する":lang==="ko"?"기록하기":"Add to log"}</button>
                      <button onClick={()=>setScannedMeal(null)} style={{flex:1,background:C.surface,border:"1px solid "+C.border,borderRadius:10,padding:"10px 0",color:C.muted,fontSize:12,cursor:"pointer"}}>{lang==="ja"?"キャンセル":lang==="ko"?"취소":"Cancel"}</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input type="file" accept="image/*" capture="environment" id="meal-scan-input" style={{display:"none"}} onChange={handleMealScan}/>
                    {isPro ? (<button onClick={()=>document.getElementById("meal-scan-input")?.click()} style={{width:"100%",background:C.surface,border:"2px dashed "+C.border,borderRadius:12,padding:"16px 0",color:C.muted,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      {analyzing ? (lang==="ja"?"解析中...":lang==="ko"?"분석 중...":"Analyzing...") : ("📸 "+(lang==="ja"?"写真で食事を記録":lang==="ko"?"사진으로 식사 기록":"Scan your meal"))}
                    </button>) : (<button onClick={()=>setShowUpgrade(true)} style={{width:"100%",background:C.surface,border:"2px dashed "+C.border,borderRadius:12,padding:"16px 0",color:C.pro,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>🔒 {lang==="ja"?"食事スキャン（PRO）":lang==="ko"?"식사 스캔 (PRO)":"Meal Scan (PRO)"}</button>)}
                    {!isPro&&<div style={{fontSize:10,color:C.muted,textAlign:"center",marginTop:6}}>{lang==="ja"?"AIスキャン機能はPROのみ":lang==="ko"?"AI 스캔은 PRO 전용":"AI scan — PRO only"}</div>}
                  </div>
                )}
              </div>
            )}

            {/* Meal list */}
            {(()=>{
              const dayMeals=mealDate===today?meals:(mealHist[mealDate]||[]);
              return(
                <div style={{background:C.card,borderRadius:16,padding:"14px 16px",border:"1px solid "+C.border}}>
                  <div style={{fontFamily:"Bebas Neue",fontSize:14,letterSpacing:1,color:C.text,marginBottom:8}}>{lang==="ja"?"食事記録":lang==="ko"?"식사 기록":"MEAL LOG"}</div>
                  {dayMeals.length===0?<div style={{fontSize:12,color:C.muted}}>{lang==="ja"?"まだ記録なし":lang==="ko"?"아직 기록 없음":"No meals logged yet"}</div>:
                  dayMeals.map((m,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+C.dim}}>
                      <div>
                        <div style={{fontSize:13,color:C.text}}>{m.name}</div>
                        <div style={{fontSize:10,color:C.muted}}>{m.cal}kcal · P:{m.protein}g · C:{m.carbs}g · F:{m.fat}g</div>
                      </div>
                      {(mealDate===today||mealDate<today)&&<button onClick={()=>{
                        if(mealDate===today){
                          const u=meals.filter((_,ii)=>ii!==i);
                          setMeals(u);
                          const uh={...mealHist,[today]:u};
                          setMealHist(uh);
                          syncMealHistory(uh);
                        } else {
                          const old2=mealHist[mealDate]||[];
                          const u=old2.filter((_,ii)=>ii!==i);
                          const uh={...mealHist,[mealDate]:u};
                          setMealHist(uh);
                          syncMealHistory(uh);
                        }
                      }} style={{background:"none",border:"none",color:C.muted,fontSize:14,cursor:"pointer"}}>✕</button>}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* ── 未来の献立プランニング ─────────────────────── */}
            {mealDate > today && (
              <div style={{background:C.card,borderRadius:16,padding:"14px 16px",border:"1px solid #a855f730",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{fontSize:18}}>🔮</span>
                  <div style={{fontFamily:"Bebas Neue",fontSize:13,letterSpacing:1,color:"#a855f7"}}>
                    {lang==="ja"?"献立プランニング":lang==="ko"?"식단 플래닝":"MEAL PLAN"}
                  </div>
                  {futureMenus[mealDate] && (
                    <button onClick={()=>{
                      const updated = {...futureMenus};
                      delete updated[mealDate];
                      setFutureMenus(updated);
                      lsSet("mb_future_menus", updated);
                    }} style={{marginLeft:"auto",background:"none",border:"none",color:C.muted,fontSize:11,cursor:"pointer"}}>
                      {lang==="ja"?"リセット":lang==="ko"?"초기화":"Reset"}
                    </button>
                  )}
                </div>

                {/* 先回り提案バナー（翌日のみ・未生成時） */}
                {!futureMenus[mealDate] && mealDate === (()=>{const d=new Date(today+"T00:00:00");d.setDate(d.getDate()+1);return d.toISOString().slice(0,10);})() && (
                  <div style={{background:"rgba(168,85,247,0.08)",border:"1px solid rgba(168,85,247,0.2)",borderRadius:10,padding:"10px 12px",marginBottom:10,display:"flex",alignItems:"flex-start",gap:8}}>
                    <span style={{fontSize:16,flexShrink:0}}>💡</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#a855f7",marginBottom:2}}>
                        {lang==="ja"?"明日の献立、まだ決めてない？":lang==="ko"?"내일 식단, 아직 안 정했어?":"Haven't planned tomorrow's meals yet?"}
                      </div>
                      <div style={{fontSize:10,color:C.muted,marginBottom:8}}>
                        {lang==="ja"?"今から決めておくと明日の食事で迷わない。"+coach.name+"が提案するよ。":
                         lang==="ko"?"지금 정해두면 내일 식사 고민 없어. "+coach.name+"이 제안할게.":
                         "Plan now and you won't have to think tomorrow. "+coach.name+" will suggest."}
                      </div>
                      <button onClick={async ()=>{
                        if(menuLoading||!canChat) return;
                        setMenuLoading(true);
                        const prompt = lang==="ja"
                          ? "明日の1日の献立を提案して。普通の人でも作れる・買える現実的な食材で、朝・昼・夜の3食。各食事にカロリーとタンパク質を書いて。"
                          : lang==="ko"
                          ? "내일 하루 식단 제안해줘. 일반인이 만들거나 살 수 있는 현실적인 재료로, 아침·점심·저녁 3끼. 각 식사에 칼로리와 단백질 써줘."
                          : "Suggest tomorrow's full day meals. Use realistic everyday ingredients anyone can buy or cook. Include breakfast, lunch, dinner with calories and protein for each.";
                        await sendChat(prompt, async (updater)=>{
                          const hist = typeof updater === "function" ? updater([]) : updater;
                          const lastMsg = hist[hist.length-1];
                          if(lastMsg?.role==="assistant") {
                            const updated = {...futureMenus, [mealDate]: lastMsg.text};
                            setFutureMenus(updated);
                            lsSet("mb_future_menus", updated);
                          }
                          setNutChatHist(updater);
                        }, nutChatHist);
                        setMenuLoading(false);
                      }} style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)",border:"none",borderRadius:8,padding:"6px 14px",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                        {menuLoading?"...":(lang==="ja"?"今すぐ提案してもらう":lang==="ko"?"지금 바로 제안받기":"Get tomorrow's plan now")}
                      </button>
                    </div>
                  </div>
                )}

                {/* 保存済み献立を表示 */}
                {futureMenus[mealDate] ? (
                  <div>
                    <div style={{fontSize:11,color:C.muted,marginBottom:8}}>
                      {lang==="ja"?"📋 この日の献立プラン":lang==="ko"?"📋 이날의 식단 플랜":"📋 Meal plan for this day"}
                    </div>
                    <div style={{background:C.surface,borderRadius:10,padding:"10px 12px",border:"1px solid #a855f720",fontSize:12,color:C.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>
                      {futureMenus[mealDate]}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{fontSize:11,color:C.muted,marginBottom:10}}>
                      {lang==="ja"?"条件を選んでAIに献立を作ってもらおう":lang==="ko"?"조건을 선택해 AI에게 식단을 만들어 달라고 하세요":"Pick a condition and let AI build your meal plan"}
                    </div>
                    {/* クイック条件ボタン */}
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                      {[
                        {ja:"🏪 コンビニだけで",en:"🏪 Convenience store only",ko:"🏪 편의점만으로"},
                        {ja:"💴 予算800円以内",en:"💴 Under ¥800 budget",ko:"💴 800엔 이하"},
                        {ja:"🍺 飲み会がある日",en:"🍺 Drinking party day",ko:"🍺 술자리 있는 날"},
                        {ja:"⚡ 時短・簡単",en:"⚡ Quick & easy",ko:"⚡ 빠르고 간단"},
                        {ja:"💪 トレーニング前後",en:"💪 Around workout",ko:"💪 운동 전후"},
                        {ja:"🏠 普通に自炊",en:"🏠 Home cooking",ko:"🏠 집밥"},
                      ].map((q,i)=>(
                        <button key={i} onClick={async ()=>{
                          if(menuLoading||!canChat) return;
                          setMenuLoading(true);
                          const cond = q[lang]||q.en;
                          const dateLabel = new Date(mealDate+"T00:00:00").toLocaleDateString(
                            lang==="ja"?"ja-JP":lang==="ko"?"ko-KR":"en-US",{month:"short",day:"numeric"}
                          );
                          const prompt = lang==="ja"
                            ? dateLabel+"の1日の献立を作って。条件："+cond+"。朝・昼・夜で各1品ずつ、一般的な食材で現実的な価格帯で。各食事にカロリーとタンパク質gも書いて。"
                            : lang==="ko"
                            ? dateLabel+" 하루 식단 짜줘. 조건: "+cond+". 아침·점심·저녁 각 1개씩, 일반 식재료로 현실적인 가격으로. 각 식사에 칼로리와 단백질g도 써줘."
                            : "Create a meal plan for "+dateLabel+". Condition: "+cond+". One meal for breakfast, lunch, dinner. Use realistic everyday ingredients. Include calories and protein for each meal.";
                          await sendChat(prompt, async (updater)=>{
                            const hist = typeof updater === "function" ? updater([]) : updater;
                            const lastMsg = hist[hist.length-1];
                            if(lastMsg?.role==="assistant") {
                              const updated = {...futureMenus, [mealDate]: lastMsg.text};
                              setFutureMenus(updated);
                              lsSet("mb_future_menus", updated);
                            }
                            setNutChatHist(updater);
                          }, nutChatHist);
                          setMenuLoading(false);
                        }} style={{padding:"7px 12px",background:C.surface,border:"1px solid "+C.border,borderRadius:20,fontSize:11,color:C.text,cursor:menuLoading||!canChat?"not-allowed":"pointer",opacity:menuLoading||!canChat?0.5:1}}>
                          {q[lang]||q.en}
                        </button>
                      ))}
                    </div>
                    {menuLoading && (
                      <div style={{textAlign:"center",padding:"12px 0",color:"#a855f7",fontSize:12}}>
                        {lang==="ja"?"献立を考えています...":lang==="ko"?"식단 구성 중...":"Building your meal plan..."}
                      </div>
                    )}
                    {!canChat && (
                      <div style={{fontSize:10,color:C.muted,textAlign:"center"}}>
                        {lang==="ja"?"本日のチャット回数に達しました":lang==="ko"?"오늘 채팅 한도에 도달":lang==="de"?"Tageslimit erreicht":"Daily chat limit reached"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── 栄養相談チャット ────────────────────────────── */}
            <div style={{background:C.card,borderRadius:16,padding:"14px 16px",border:"1px solid "+C.border,marginTop:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:18}}>🥗</span>
                <div style={{fontFamily:"Bebas Neue",fontSize:13,letterSpacing:1,color:C.text}}>
                  {lang==="ja"?"栄養・食事の相談":lang==="ko"?"영양·식사 상담":"Nutrition Chat"}
                </div>
                <span style={{fontSize:10,background:C.proBg,color:C.pro,borderRadius:8,padding:"1px 6px",marginLeft:"auto"}}>
                  {lang==="ja"?"利用回数に含まれます":lang==="ko"?"이용 횟수에 포함":"counts toward limit"}
                </span>
              </div>
              {/* チャット履歴 */}
              {nutChatHist.length>0&&(
                <div style={{marginBottom:10,maxHeight:200,overflowY:"auto"}}>
                  {nutChatHist.map((m,i)=>(
                    <div key={i} style={{marginBottom:8,display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                      {m.role==="assistant"&&<span style={{fontSize:16,marginRight:6,alignSelf:"flex-end"}}>{coach.emoji}</span>}
                      <div style={{maxWidth:"82%",background:m.role==="user"?coach.color:C.surface,borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"8px 12px",border:m.role==="assistant"?"1px solid "+C.border:"none"}}>
                        <div style={{fontSize:12,color:m.role==="user"?"#fff":C.text,lineHeight:1.5}}>{m.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* クイックメッセージ */}
              {canChat && nutChatHist.length === 0 && (
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                  {[
                    {ja:"今日のメニュー教えて",ko:"오늘 메뉴 알려줘",en:"What should I eat today?"},
                    {ja:"タンパク質が多い食事は？",ko:"단백질 많은 식사는?",en:"High protein meal ideas?"},
                    {ja:"間食におすすめは？",ko:"간식 추천해줘",en:"Snack recommendations?"},
                    {ja:"夜遅い食事はどうする？",ko:"늦은 저녁은 어떻게?",en:"Late night eating tips?"},
                  ].map((q,i)=>(
                    <button key={i} onClick={()=>{sendChat(q[lang]||q.en, setNutChatHist, nutChatHist);}}
                      style={{background:C.greenGlow,border:"1px solid "+C.green,borderRadius:20,padding:"6px 12px",fontSize:12,color:C.green,cursor:"pointer",fontWeight:500}}>
                      {q[lang]||q.en}
                    </button>
                  ))}
                </div>
              )}
              {/* 入力欄 */}
              {canChat ? (
                <div style={{display:"flex",gap:8}}>
                  <input
                    value={nutChatIn}
                    onChange={e=>setNutChatIn(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(nutChatIn.trim()){sendChat(nutChatIn.trim(),setNutChatHist,nutChatHist);setNutChatIn("");}}}}
                    placeholder={lang==="ja"?"食事・栄養について聞く...":lang==="ko"?"식사·영양에 대해 묻기...":"Ask about nutrition..."}
                    style={{flex:1,background:C.surface,border:"1px solid "+C.border,borderRadius:12,padding:"9px 12px",fontSize:12,color:C.text}}
                  />
                  <button
                    onClick={()=>{if(nutChatIn.trim()){sendChat(nutChatIn.trim(),setNutChatHist,nutChatHist);setNutChatIn("");}}}
                    style={{background:coach.color,border:"none",borderRadius:12,padding:"9px 14px",color:"#fff",fontSize:13,cursor:"pointer"}}
                  >→</button>
                </div>
              ) : (
                <div style={{textAlign:"center",fontSize:11,color:C.muted,padding:"8px 0"}}>
                  {lang==="ja"?"本日の相談回数に達しました":lang==="ko"?"오늘 채팅 한도에 도달했습니다":"Daily chat limit reached"}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.surface,borderTop:"1px solid "+C.border,display:"flex",zIndex:100}}>
        {TAB_NAV.map(t2=>(
          <button key={t2.id} onClick={()=>setTab(t2.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"10px 0 14px",background:"none",border:"none",cursor:"pointer"}}>
            <span style={{fontSize:20}}>{t2.icon}</span>
            <span style={{fontSize:9,color:tab===t2.id?C.green:C.muted,fontWeight:tab===t2.id?700:400}}>{t2.label[lang]||t2.label.en}</span>
          </button>
        ))}
      </div>

      {/* Modals */}
      {counterM&&<WorkoutCounter exercise={counterM.exercise} sets={counterM.sets} reps={counterM.reps} lang={lang} coach={coach} profile={profile} onClose={()=>setCounterM(null)}/>}
      {showTrialPaywall&&<TrialEndPaywall
        lang={lang} cl={cl} coach={coach} profile={profile}
        onUpgrade={()=>{ setShowTrialPaywall(false); setShowUpgrade(true); }}
        onFree={()=>{ setShowTrialPaywall(false); }}
        onClose={()=>setShowTrialPaywall(false)}
      />}
      {showUpgrade&&<UpgradeModal lang={lang} onClose={()=>setShowUpgrade(false)} profile={profile} cl={cl} coach={coach} appSettings={appSettings} sbUser={sbUser}/>}
      {showSettings&&<SettingsModal profile={profile} setProfile={setProfile} lang={lang} setLang={setLang} isPro={isPro} onSignOut={handleSignOut} onClose={()=>setShowSettings(false)}
              setShowUpgrade={setShowUpgrade} onSave={saveProfile} sbUser={sbUser}/>}

      {/* Legal modal */}
      {legalModal&&legalData&&(
        <div style={{position:"fixed",inset:0,background:C.bg,zIndex:400,overflowY:"auto",padding:20}}>
          <button onClick={()=>setLegalModal(null)} style={{background:C.dim,border:"none",borderRadius:"50%",width:30,height:30,color:C.text,fontSize:14,cursor:"pointer",marginBottom:12}}>✕</button>
          <div style={{color:C.text,fontSize:12,lineHeight:1.8,maxWidth:480,margin:"0 auto"}}>
            <div style={{fontFamily:"Bebas Neue",fontSize:22,letterSpacing:2,marginBottom:12}}>{legalData.title}</div>
            <div style={{whiteSpace:"pre-line"}}>{legalData.body}</div>
          </div>
        </div>
      )}
    </div>
  );
}
