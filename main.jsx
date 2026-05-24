import { useState, useRef, useEffect } from "react";

// ── Palette (light & bright) ──────────────────────────────────────
const C = {
  bg: "#f0fdf4",
  surface: "#ffffff",
  card: "#ffffff",
  cardHover: "#f0fdf4",
  green: "#16a34a",
  greenLight: "#4ade80",
  greenPale: "#dcfce7",
  greenMid: "#86efac",
  accent: "#65a30d",
  accentPale: "#ecfccb",
  gold: "#d97706",
  goldPale: "#fef3c7",
  red: "#dc2626",
  redPale: "#fee2e2",
  pro: "#7c3aed",
  proPale: "#ede9fe",
  text: "#14532d",
  textMid: "#166534",
  muted: "#6b7280",
  border: "#bbf7d0",
  shadow: "0 2px 12px rgba(22,163,74,0.10)",
};

const fonts = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap');`;

const MEALS = [
  { name: "Grilled Chicken Salad", cal: 420, protein: 38, carbs: 22, fat: 18, emoji: "🥗" },
  { name: "Avocado Toast", cal: 310, protein: 9, carbs: 34, fat: 17, emoji: "🥑" },
  { name: "Protein Shake", cal: 180, protein: 30, carbs: 12, fat: 3, emoji: "🥤" },
  { name: "Salmon & Rice", cal: 550, protein: 42, carbs: 48, fat: 14, emoji: "🍣" },
  { name: "Greek Yogurt Bowl", cal: 240, protein: 18, carbs: 28, fat: 6, emoji: "🫙" },
  { name: "Burrito Bowl", cal: 680, protein: 35, carbs: 72, fat: 22, emoji: "🌯" },
];

const MOODS = ["😤","😐","🙂","😊","🔥"];
const MOOD_LABELS = ["Rough","Meh","OK","Good","Fired up"];

const FREE_LIMIT = 3; // chats per day on free plan

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pct  = (v, max) => Math.min(100, Math.round((v / max) * 100));

// ── Quick-prompt sets by tier ─────────────────────────────────────
const FREE_PROMPTS  = ["How am I doing today?", "What should I eat next?", "Motivate me! 🔥"];
const PRO_PROMPTS   = ["Build me a 1-month meal plan", "Give me a full workout program", "Optimize my macros for fat loss", "What should I eat next?", "Motivate me! 🔥"];

// ── Sub-components ────────────────────────────────────────────────
function Ring({ value, max, color, colorBg, label, size = 64 }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const dash = (pct(value, max) / 100) * circ;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={colorBg||C.border} strokeWidth={5}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition:"stroke-dasharray 0.6s ease" }}/>
        <text x="50%" y="54%" textAnchor="middle" fill={C.text} fontSize={size*0.22} fontFamily="DM Sans" fontWeight="700">
          {value}
        </text>
      </svg>
      <span style={{ fontSize:11, color:C.muted, fontFamily:"DM Sans" }}>{label}</span>
    </div>
  );
}

function Badge({ icon, label, earned }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, opacity: earned?1:0.3 }}>
      <div style={{
        width:48, height:48, borderRadius:"50%",
        background: earned ? C.greenPale : "#f3f4f6",
        border: `2px solid ${earned ? C.green : "#e5e7eb"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:22, boxShadow: earned ? `0 0 10px ${C.greenMid}` : "none"
      }}>{icon}</div>
      <span style={{ fontSize:10, color: earned?C.green:C.muted, fontFamily:"DM Sans", textAlign:"center" }}>{label}</span>
    </div>
  );
}

function StatBar({ label, value, max, color, colorBg }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:12, color:C.muted, fontFamily:"DM Sans" }}>{label}</span>
        <span style={{ fontSize:12, color:C.text, fontFamily:"DM Sans", fontWeight:600 }}>{value} / {max}</span>
      </div>
      <div style={{ height:8, background:colorBg||C.border, borderRadius:99, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct(value,max)}%`, background:color, borderRadius:99, transition:"width 0.5s ease" }}/>
      </div>
    </div>
  );
}

function ProBadge() {
  return (
    <span style={{
      background: C.pro, color:"#fff", fontSize:9, fontFamily:"DM Sans",
      fontWeight:700, padding:"2px 6px", borderRadius:99, letterSpacing:0.5
    }}>PRO</span>
  );
}

function UpgradeModal({ onClose, onUpgrade }) {
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:999,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20
    }}>
      <div style={{
        background:C.surface, borderRadius:24, padding:28, maxWidth:360, width:"100%",
        boxShadow:"0 20px 60px rgba(0,0,0,0.2)", animation:"slideUp 0.3s ease"
      }}>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🦾⚡</div>
          <div style={{ fontFamily:"Bebas Neue", fontSize:28, letterSpacing:2, color:C.pro }}>GO PRO WITH REX</div>
          <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>Unlock the full coaching experience</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
          {[
            ["💬","Unlimited AI coach chats","Free: 3/day"],
            ["🏋️","Full workout programs","1-month plans, by muscle group"],
            ["🍽️","Custom 1-month meal plans","Tailored to your goals"],
            ["📊","Advanced macro optimization","PFC deep-dive coaching"],
            ["🔓","All future features","Early access included"],
          ].map(([icon, title, sub]) => (
            <div key={title} style={{
              display:"flex", alignItems:"center", gap:12,
              background:C.proPale, borderRadius:12, padding:"10px 14px"
            }}>
              <span style={{ fontSize:22 }}>{icon}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{title}</div>
                <div style={{ fontSize:11, color:C.muted }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onUpgrade} style={{
          width:"100%", background:`linear-gradient(135deg, ${C.pro}, #9333ea)`,
          border:"none", borderRadius:14, padding:"14px 0",
          color:"#fff", fontFamily:"Bebas Neue", fontSize:20, letterSpacing:2,
          cursor:"pointer", marginBottom:10,
          boxShadow:"0 4px 16px rgba(124,58,237,0.35)"
        }}>UPGRADE — $9.99 / MONTH</button>
        <button onClick={onClose} style={{
          width:"100%", background:"transparent", border:`1px solid ${C.border}`,
          borderRadius:14, padding:"10px 0", color:C.muted,
          fontFamily:"DM Sans", fontSize:13, cursor:"pointer"
        }}>Maybe later</button>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────
export default function DietApp() {
  const [tab, setTab]             = useState("home");
  const [isPro, setIsPro]         = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [meals, setMeals]         = useState([]);
  const [weight, setWeight]       = useState("");
  const [weights, setWeights]     = useState([182,181,180,179.5,179,178,177.5]);
  const [mood, setMood]           = useState(2);
  const [streak, setStreak]       = useState(7);
  const [xp, setXp]               = useState(340);
  const [chatHistory, setChatHistory] = useState([
    { role:"assistant", text:"Yo! I'm Coach Rex 🦾 — I push hard, but I've always got your back. Free users get 3 chats/day. Ask me about food, motivation, or go PRO for full workout & meal programs! Let's GO! 💪" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scannedMeal, setScannedMeal] = useState(null);
  const [addedToday, setAddedToday]   = useState(false);
  const [freeChatsUsed, setFreeChatsUsed] = useState(0);
  const chatEndRef = useRef(null);
  const fileRef    = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chatHistory]);

  const totalCals    = meals.reduce((s,m) => s+m.cal,     0);
  const totalProtein = meals.reduce((s,m) => s+m.protein, 0);
  const totalCarbs   = meals.reduce((s,m) => s+m.carbs,   0);
  const totalFat     = meals.reduce((s,m) => s+m.fat,     0);
  const calGoal  = 1800;
  const level    = Math.floor(xp/100)+1;
  const xpInLvl  = xp%100;
  const chatsLeft = FREE_LIMIT - freeChatsUsed;
  const canChat   = isPro || chatsLeft > 0;

  function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAnalyzing(true); setScannedMeal(null);
    setTimeout(() => { setScannedMeal(rand(MEALS)); setAnalyzing(false); }, 2200);
  }

  function confirmMeal(m) {
    setMeals(p => [...p, m]); setXp(x => x+20);
    setScannedMeal(null); setAddedToday(true);
  }

  function logWeight() {
    const w = parseFloat(weight); if (!w) return;
    setWeights(p => [...p.slice(-6), w]); setWeight(""); setXp(x => x+10);
  }

  async function sendChat() {
    if (!chatInput.trim() || aiLoading) return;
    if (!canChat) { setShowUpgrade(true); return; }

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatHistory(h => [...h, { role:"user", text:userMsg }]);
    setAiLoading(true);
    if (!isPro) setFreeChatsUsed(n => n+1);

    const mealSummary = meals.length
      ? meals.map(m => `${m.emoji} ${m.name} (${m.cal} cal)`).join(", ")
      : "nothing logged yet";

    const isWorkoutQ = /workout|exercise|lift|gym|muscle|training|squat|bench|deadlift/i.test(userMsg);
    const isMealPlanQ = /meal plan|1.month|monthly|week.*plan|plan.*week/i.test(userMsg);

    // Free users asking about workout/meal plan → tease then upsell
    const freeRestrict = !isPro && (isWorkoutQ || isMealPlanQ);

    const systemPrompt = freeRestrict
      ? `You are Coach Rex, a fired-up but warm diet coach. The user asked about ${isWorkoutQ?"workouts":"meal plans"} but is on the FREE plan. Give them ONE exciting teaser sentence about what you COULD do for them (e.g. one exercise name or one meal idea), then enthusiastically tell them to go PRO to unlock the full ${isWorkoutQ?"workout program":"monthly meal plan"}. Keep it to 2-3 sentences, energetic, use emojis and caps. End with "Hit that PRO button and let's BUILD! 🔥"`
      : `You are Coach Rex, a fired-up passionate diet & fitness coach for solo dieters. Personality: intense trainer, tough love, ALWAYS ends with genuine encouragement. Keep responses SHORT (3-5 sentences). Use fitness slang, emojis, ALL-CAPS for emphasis. User tier: ${isPro?"PRO — give full workout & meal plan details":"FREE — food advice & motivation only, no detailed workout programs or monthly plans"}.
User stats — Calories: ${totalCals}/${calGoal}, Protein: ${totalProtein}g, Mood: ${MOOD_LABELS[mood]}, Streak: ${streak} days, Meals: ${mealSummary}.
${isPro ? "PRO coaching scope: detailed workout programs (sets/reps/muscle groups), 1-month meal plans, macro optimization, periodization." : "FREE coaching scope: general food feedback, hydration, motivation, basic calorie tips."}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system: systemPrompt,
          messages:[
            ...chatHistory.filter(m=>m.role!=="system").map(m=>({ role:m.role==="assistant"?"assistant":"user", content:m.text })),
            { role:"user", content:userMsg }
          ]
        })
      });
      const data = await res.json();
      const reply = data.content?.map(b=>b.text||"").join("") || "LET'S GO! 💪";
      setChatHistory(h => [...h, { role:"assistant", text:reply }]);
    } catch {
      setChatHistory(h => [...h, { role:"assistant", text:"Connection dropped — but YOUR grind never stops! 🔥" }]);
    }
    setAiLoading(false);
  }

  const tabs = [
    { id:"home",  icon:"🏠", label:"Home"  },
    { id:"log",   icon:"📸", label:"Log"   },
    { id:"stats", icon:"📊", label:"Stats" },
    { id:"coach", icon:"🦾", label:"Coach" },
  ];

  return (
    <>
      <style>{`
        ${fonts}
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:${C.bg}; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:${C.bg}; }
        ::-webkit-scrollbar-thumb { background:${C.greenMid}; border-radius:4px; }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideUp{ from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow   { 0%,100%{box-shadow:0 0 8px ${C.greenLight}66} 50%{box-shadow:0 0 22px ${C.greenLight}cc} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .tab-btn:hover { background:${C.greenPale} !important; }
        .meal-card { animation:slideUp 0.3s ease; }
        .snap-zone:hover { background:${C.greenPale} !important; }
      `}</style>

      {showUpgrade && <UpgradeModal onClose={()=>setShowUpgrade(false)} onUpgrade={()=>{ setIsPro(true); setShowUpgrade(false); }}/>}

      <div style={{
        maxWidth:420, margin:"0 auto", minHeight:"100vh",
        background:C.bg, color:C.text, fontFamily:"DM Sans, sans-serif",
        display:"flex", flexDirection:"column"
      }}>

        {/* Header */}
        <div style={{
          padding:"18px 20px 12px",
          background:C.surface,
          borderBottom:`1px solid ${C.border}`,
          boxShadow:C.shadow
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:"Bebas Neue", fontSize:30, letterSpacing:2, color:C.green, lineHeight:1 }}>MAKE BODY</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Build the body you want 💪</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
              {/* Tier badge */}
              {isPro ? (
                <span style={{
                  background:`linear-gradient(135deg,${C.pro},#9333ea)`, color:"#fff",
                  fontSize:11, fontFamily:"DM Sans", fontWeight:700,
                  padding:"3px 10px", borderRadius:99, letterSpacing:0.5
                }}>⚡ PRO</span>
              ) : (
                <button onClick={()=>setShowUpgrade(true)} style={{
                  background:C.proPale, color:C.pro, border:`1px solid #c4b5fd`,
                  fontSize:10, fontFamily:"DM Sans", fontWeight:700,
                  padding:"3px 10px", borderRadius:99, cursor:"pointer"
                }}>Upgrade to PRO →</button>
              )}
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:16 }}>🔥</span>
                <span style={{ fontFamily:"Bebas Neue", fontSize:20, color:C.gold }}>{streak}</span>
                <span style={{ fontSize:11, color:C.muted }}>day streak</span>
              </div>
            </div>
          </div>
          {/* XP bar */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10 }}>
            <span style={{ fontSize:11, color:C.muted, minWidth:36 }}>LVL {level}</span>
            <div style={{ flex:1, height:6, background:C.border, borderRadius:99 }}>
              <div style={{ width:`${xpInLvl}%`, height:"100%", background:`linear-gradient(90deg,${C.green},${C.greenLight})`, borderRadius:99, transition:"width 0.5s" }}/>
            </div>
            <span style={{ fontSize:10, color:C.accent, minWidth:48, textAlign:"right" }}>{xpInLvl}/100 XP</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 90px" }}>

          {/* ── HOME ── */}
          {tab==="home" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* Calorie card */}
              <div style={{ background:C.surface, borderRadius:20, padding:20, border:`1px solid ${C.border}`, boxShadow:C.shadow }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <span style={{ fontFamily:"Bebas Neue", fontSize:18, letterSpacing:1 }}>TODAY'S FUEL</span>
                  <span style={{ fontSize:11, color:C.muted }}>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-around", alignItems:"center" }}>
                  <Ring value={totalCals} max={calGoal} color={totalCals>calGoal?C.red:C.green} colorBg={C.border} label="Calories" size={80}/>
                  <Ring value={totalProtein} max={150} color={C.accent} colorBg={C.accentPale} label="Protein g" size={64}/>
                  <Ring value={totalCarbs} max={200} color={C.gold} colorBg={C.goldPale} label="Carbs g" size={64}/>
                  <Ring value={totalFat} max={60} color="#f97316" colorBg="#ffedd5" label="Fat g" size={64}/>
                </div>
                <div style={{
                  marginTop:14, padding:"8px 12px",
                  background: totalCals>calGoal ? C.redPale : C.greenPale,
                  borderRadius:10, textAlign:"center", fontSize:12,
                  color: totalCals>calGoal ? C.red : C.green, fontWeight:600
                }}>
                  {totalCals>calGoal
                    ? `⚠️ ${totalCals-calGoal} cal over goal — hydrate & move!`
                    : `✅ ${calGoal-totalCals} cal remaining — keep crushing it!`}
                </div>
              </div>

              {/* Mood */}
              <div style={{ background:C.surface, borderRadius:20, padding:16, border:`1px solid ${C.border}`, boxShadow:C.shadow }}>
                <div style={{ fontFamily:"Bebas Neue", fontSize:16, letterSpacing:1, marginBottom:12, color:C.textMid }}>HOW'S YOUR VIBE?</div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  {MOODS.map((m,i) => (
                    <button key={i} onClick={()=>setMood(i)} style={{
                      background: mood===i ? C.greenPale : "transparent",
                      border: `2px solid ${mood===i ? C.green : C.border}`,
                      borderRadius:14, padding:"8px 10px", cursor:"pointer",
                      display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                      transition:"all 0.2s"
                    }}>
                      <span style={{ fontSize:22 }}>{m}</span>
                      <span style={{ fontSize:10, color:mood===i?C.green:C.muted, fontFamily:"DM Sans" }}>{MOOD_LABELS[i]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight */}
              <div style={{ background:C.surface, borderRadius:20, padding:16, border:`1px solid ${C.border}`, boxShadow:C.shadow }}>
                <div style={{ fontFamily:"Bebas Neue", fontSize:16, letterSpacing:1, marginBottom:12, color:C.textMid }}>WEIGHT LOG</div>
                <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                  <input type="number" placeholder="Enter lbs..." value={weight}
                    onChange={e=>setWeight(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&logWeight()}
                    style={{ flex:1, background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"9px 12px", color:C.text, fontFamily:"DM Sans", fontSize:14, outline:"none" }}/>
                  <button onClick={logWeight} style={{
                    background:C.green, color:"#fff", border:"none", borderRadius:10,
                    padding:"9px 18px", fontFamily:"Bebas Neue", fontSize:15, letterSpacing:1, cursor:"pointer"
                  }}>LOG</button>
                </div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:52 }}>
                  {weights.slice(-7).map((w,i) => {
                    const mn=Math.min(...weights), mx=Math.max(...weights);
                    const h = mx===mn ? 50 : ((w-mn)/(mx-mn))*70+30;
                    return (
                      <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                        <div style={{ width:"100%", background:i===weights.length-1?C.green:C.greenMid, borderRadius:"4px 4px 0 0", height:`${h}%`, minHeight:4, transition:"height 0.4s" }}/>
                        <span style={{ fontSize:9, color:C.muted }}>{w}</span>
                      </div>
                    );
                  })}
                </div>
                {weights.length>=2 && (
                  <div style={{ marginTop:8, fontSize:12, fontWeight:600, textAlign:"center",
                    color: weights[weights.length-1]<weights[weights.length-2] ? C.green : C.red }}>
                    {weights[weights.length-1]<weights[weights.length-2]
                      ? `⬇️ Down ${(weights[weights.length-2]-weights[weights.length-1]).toFixed(1)} lbs — PROGRESS!`
                      : `⬆️ Up ${(weights[weights.length-1]-weights[weights.length-2]).toFixed(1)} lbs — adjust & push on!`}
                  </div>
                )}
              </div>

              {/* Badges */}
              <div style={{ background:C.surface, borderRadius:20, padding:16, border:`1px solid ${C.border}`, boxShadow:C.shadow }}>
                <div style={{ fontFamily:"Bebas Neue", fontSize:16, letterSpacing:1, marginBottom:12, color:C.textMid }}>ACHIEVEMENTS</div>
                <div style={{ display:"flex", justifyContent:"space-around" }}>
                  <Badge icon="🔥" label="7-Day Streak" earned={streak>=7}/>
                  <Badge icon="📸" label="First Snap"   earned={addedToday}/>
                  <Badge icon="💪" label="Protein King" earned={totalProtein>=100}/>
                  <Badge icon="⚡" label="Level 5"      earned={level>=5}/>
                  <Badge icon="🏆" label="30-Day Goal"  earned={streak>=30}/>
                </div>
              </div>
            </div>
          )}

          {/* ── LOG ── */}
          {tab==="log" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div className="snap-zone" onClick={()=>fileRef.current?.click()} style={{
                background:C.surface, borderRadius:20, padding:24,
                border:`2px dashed ${C.green}`, textAlign:"center", cursor:"pointer",
                transition:"all 0.2s", boxShadow:C.shadow
              }}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhotoUpload}/>
                <div style={{ fontSize:52, marginBottom:8 }}>📸</div>
                <div style={{ fontFamily:"Bebas Neue", fontSize:24, letterSpacing:2, color:C.green }}>SNAP YOUR MEAL</div>
                <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>AI identifies food & calculates nutrition instantly</div>
              </div>

              {analyzing && (
                <div style={{ background:C.surface, borderRadius:20, padding:24, textAlign:"center", border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:38, marginBottom:8, animation:"spin 1s linear infinite", display:"inline-block" }}>🔬</div>
                  <div style={{ fontFamily:"Bebas Neue", fontSize:18, letterSpacing:1, color:C.green }}>ANALYZING YOUR FOOD...</div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>AI scanning nutritional content</div>
                </div>
              )}

              {scannedMeal && !analyzing && (
                <div style={{ background:C.surface, borderRadius:20, padding:16, border:`2px solid ${C.green}`, animation:"slideUp 0.4s ease", boxShadow:C.shadow }}>
                  <div style={{ fontFamily:"Bebas Neue", fontSize:14, letterSpacing:1, color:C.green, marginBottom:10 }}>✅ MEAL DETECTED</div>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                    <span style={{ fontSize:44 }}>{scannedMeal.emoji}</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:16 }}>{scannedMeal.name}</div>
                      <div style={{ fontSize:12, color:C.muted }}>AI Confidence: 94%</div>
                    </div>
                    <div style={{ marginLeft:"auto", textAlign:"right" }}>
                      <div style={{ fontFamily:"Bebas Neue", fontSize:26, color:C.green }}>{scannedMeal.cal}</div>
                      <div style={{ fontSize:11, color:C.muted }}>calories</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                    {[["Protein",scannedMeal.protein,C.accent,C.accentPale],["Carbs",scannedMeal.carbs,C.gold,C.goldPale],["Fat",scannedMeal.fat,"#f97316","#ffedd5"]].map(([l,v,c,bg])=>(
                      <div key={l} style={{ flex:1, background:bg, borderRadius:10, padding:8, textAlign:"center" }}>
                        <div style={{ fontFamily:"Bebas Neue", fontSize:20, color:c }}>{v}g</div>
                        <div style={{ fontSize:10, color:C.muted }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setScannedMeal(null)} style={{
                      flex:1, background:C.bg, border:`1px solid ${C.border}`, borderRadius:10,
                      padding:10, color:C.muted, fontFamily:"DM Sans", fontSize:13, cursor:"pointer"
                    }}>✗ Retake</button>
                    <button onClick={()=>confirmMeal(scannedMeal)} style={{
                      flex:2, background:C.green, border:"none", borderRadius:10, padding:10,
                      color:"#fff", fontFamily:"Bebas Neue", fontSize:16, letterSpacing:1, cursor:"pointer"
                    }}>ADD TO LOG +20 XP</button>
                  </div>
                </div>
              )}

              <div style={{ fontFamily:"Bebas Neue", fontSize:15, letterSpacing:1, color:C.muted }}>TODAY'S MEALS ({meals.length})</div>
              {meals.length===0 ? (
                <div style={{ textAlign:"center", color:C.muted, fontSize:13, padding:20 }}>No meals logged yet — snap your first meal! 📸</div>
              ) : meals.map((m,i)=>(
                <div key={i} className="meal-card" style={{
                  background:C.surface, borderRadius:14, padding:"12px 14px",
                  border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, boxShadow:C.shadow
                }}>
                  <span style={{ fontSize:28 }}>{m.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{m.name}</div>
                    <div style={{ fontSize:11, color:C.muted }}>P:{m.protein}g · C:{m.carbs}g · F:{m.fat}g</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:"Bebas Neue", fontSize:22, color:C.green }}>{m.cal}</div>
                    <div style={{ fontSize:10, color:C.muted }}>cal</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── STATS ── */}
          {tab==="stats" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ background:C.surface, borderRadius:20, padding:16, border:`1px solid ${C.border}`, boxShadow:C.shadow }}>
                <div style={{ fontFamily:"Bebas Neue", fontSize:16, letterSpacing:1, marginBottom:14, color:C.textMid }}>MACRO BREAKDOWN</div>
                <StatBar label="Protein (g)" value={totalProtein} max={150} color={C.accent} colorBg={C.accentPale}/>
                <StatBar label="Carbs (g)"   value={totalCarbs}   max={200} color={C.gold}   colorBg={C.goldPale}/>
                <StatBar label="Fat (g)"     value={totalFat}     max={60}  color="#f97316"  colorBg="#ffedd5"/>
                <StatBar label="Calories"    value={totalCals}    max={calGoal} color={C.green} colorBg={C.greenPale}/>
              </div>

              <div style={{ background:C.surface, borderRadius:20, padding:16, border:`1px solid ${C.border}`, boxShadow:C.shadow }}>
                <div style={{ fontFamily:"Bebas Neue", fontSize:16, letterSpacing:1, marginBottom:14, color:C.textMid }}>WEIGHT TREND (7 DAYS)</div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:80 }}>
                  {weights.slice(-7).map((w,i)=>{
                    const mn=Math.min(...weights), mx=Math.max(...weights);
                    const h=mx===mn?50:((w-mn)/(mx-mn))*70+30;
                    return (
                      <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                        <span style={{ fontSize:9, color:i===weights.length-1?C.green:C.muted }}>{w}</span>
                        <div style={{ width:"100%", background:i===weights.length-1?C.green:C.greenMid, borderRadius:"4px 4px 0 0", height:`${h}%`, minHeight:4, transition:"height 0.4s" }}/>
                        <span style={{ fontSize:9, color:C.muted }}>D{i+1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ background:C.surface, borderRadius:20, padding:16, border:`1px solid ${C.border}`, boxShadow:C.shadow }}>
                <div style={{ fontFamily:"Bebas Neue", fontSize:16, letterSpacing:1, marginBottom:12, color:C.textMid }}>XP & LEVEL</div>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                  <div style={{
                    width:52, height:52, borderRadius:"50%",
                    background:C.greenPale, border:`2px solid ${C.green}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:"Bebas Neue", fontSize:20, color:C.green
                  }}>L{level}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:13, color:C.text }}>Level {level} → {level+1}</span>
                      <span style={{ fontSize:12, color:C.accent, fontWeight:700 }}>{xpInLvl}/100 XP</span>
                    </div>
                    <div style={{ height:8, background:C.greenPale, borderRadius:99 }}>
                      <div style={{ width:`${xpInLvl}%`, height:"100%", background:`linear-gradient(90deg,${C.green},${C.greenLight})`, borderRadius:99, transition:"width 0.5s" }}/>
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {[["📸 Meal Snap","+20 XP"],["⚖️ Weight Log","+10 XP"],["💬 Chat","+5 XP"]].map(([a,x])=>(
                    <div key={a} style={{ flex:1, background:C.greenPale, borderRadius:10, padding:8, textAlign:"center" }}>
                      <div style={{ fontSize:11, color:C.text, marginBottom:2 }}>{a}</div>
                      <div style={{ fontSize:12, color:C.accent, fontWeight:700 }}>{x}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── COACH ── */}
          {tab==="coach" && (
            <div style={{ display:"flex", flexDirection:"column", gap:0, height:"calc(100vh - 210px)" }}>

              {/* Coach header */}
              <div style={{
                background:C.surface, borderRadius:16, padding:14,
                border:`1px solid ${C.border}`, marginBottom:10,
                display:"flex", alignItems:"center", gap:12, boxShadow:C.shadow
              }}>
                <div style={{
                  width:48, height:48, borderRadius:"50%",
                  background:C.greenPale, border:`2px solid ${C.green}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:26, boxShadow:`0 0 12px ${C.greenMid}`
                }}>🦾</div>
                <div>
                  <div style={{ fontFamily:"Bebas Neue", fontSize:18, letterSpacing:1, color:C.green }}>COACH REX</div>
                  <div style={{ fontSize:11, color:C.muted }}>AI-powered · always in your corner</div>
                </div>
                <div style={{ marginLeft:"auto", display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                  {isPro ? (
                    <span style={{ background:`linear-gradient(135deg,${C.pro},#9333ea)`, color:"#fff", fontSize:9, fontFamily:"DM Sans", fontWeight:700, padding:"2px 8px", borderRadius:99 }}>⚡ PRO UNLIMITED</span>
                  ) : (
                    <button onClick={()=>setShowUpgrade(true)} style={{
                      background:C.proPale, color:C.pro, border:`1px solid #c4b5fd`,
                      fontSize:9, fontFamily:"DM Sans", fontWeight:700,
                      padding:"2px 8px", borderRadius:99, cursor:"pointer"
                    }}>Upgrade for more</button>
                  )}
                  {!isPro && (
                    <span style={{ fontSize:10, color: chatsLeft>0?C.accent:C.red, fontWeight:600 }}>
                      {chatsLeft>0 ? `${chatsLeft} chats left today` : "Daily limit reached"}
                    </span>
                  )}
                </div>
              </div>

              {/* Feature gates info */}
              {!isPro && (
                <div style={{
                  background:C.proPale, borderRadius:12, padding:"10px 14px", marginBottom:10,
                  border:`1px solid #c4b5fd`, display:"flex", alignItems:"center", gap:10
                }}>
                  <span style={{ fontSize:20 }}>🔒</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:C.pro }}>PRO features locked</div>
                    <div style={{ fontSize:11, color:C.muted }}>Workout programs & monthly meal plans require PRO</div>
                  </div>
                  <button onClick={()=>setShowUpgrade(true)} style={{
                    background:C.pro, color:"#fff", border:"none", borderRadius:8,
                    padding:"5px 10px", fontSize:11, fontFamily:"DM Sans", fontWeight:700, cursor:"pointer"
                  }}>Unlock</button>
                </div>
              )}

              {/* Chat messages */}
              <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:10, marginBottom:10, paddingRight:4 }}>
                {chatHistory.map((msg,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start", animation:"slideUp 0.3s ease" }}>
                    {msg.role==="assistant" && <span style={{ fontSize:18, marginRight:6, marginTop:4 }}>🦾</span>}
                    <div style={{
                      maxWidth:"78%", padding:"10px 14px", borderRadius:14,
                      background: msg.role==="user" ? C.greenPale : C.surface,
                      border:`1px solid ${msg.role==="user"?C.green:C.border}`,
                      fontSize:13, lineHeight:1.55, color:C.text,
                      borderTopRightRadius: msg.role==="user"?4:14,
                      borderTopLeftRadius:  msg.role==="assistant"?4:14,
                      boxShadow:C.shadow
                    }}>{msg.text}</div>
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:18 }}>🦾</span>
                    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, borderTopLeftRadius:4, padding:"10px 16px" }}>
                      <span style={{ animation:"pulse 1s infinite", color:C.green, fontSize:16 }}>● ● ●</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef}/>
              </div>

              {/* Quick prompts */}
              <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
                {(isPro ? PRO_PROMPTS : FREE_PROMPTS).map(q=>(
                  <button key={q} onClick={()=>setChatInput(q)} style={{
                    background:C.surface, border:`1px solid ${C.border}`,
                    borderRadius:20, padding:"5px 10px", fontSize:11,
                    color:C.muted, cursor:"pointer", fontFamily:"DM Sans", whiteSpace:"nowrap",
                    display:"flex", alignItems:"center", gap:4
                  }}>
                    {(q.includes("workout")||q.includes("Workout")||q.includes("meal plan")||q.includes("Meal")) && !isPro && <span style={{ fontSize:9 }}>🔒</span>}
                    {q}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div style={{ display:"flex", gap:8 }}>
                <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&sendChat()}
                  placeholder={canChat ? "Ask Coach Rex anything..." : "Daily limit reached — upgrade for unlimited"}
                  disabled={!canChat}
                  style={{
                    flex:1, background: canChat?C.bg:"#f9fafb",
                    border:`1.5px solid ${C.border}`, borderRadius:10,
                    padding:"10px 14px", color:C.text, fontFamily:"DM Sans",
                    fontSize:13, outline:"none", opacity:canChat?1:0.6
                  }}/>
                <button onClick={sendChat} disabled={aiLoading||!canChat} style={{
                  background: !canChat?C.pro : aiLoading?C.greenMid:C.green,
                  border:"none", borderRadius:10, padding:"10px 16px",
                  color:"#fff", fontFamily:"Bebas Neue", fontSize:15,
                  letterSpacing:1, cursor:(aiLoading||!canChat)?"not-allowed":"pointer"
                }}>{!canChat?"PRO":"SEND"}</button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div style={{
          position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
          width:"100%", maxWidth:420,
          background:C.surface, borderTop:`1px solid ${C.border}`,
          display:"flex", padding:"8px 0 12px", boxShadow:"0 -4px 16px rgba(22,163,74,0.08)"
        }}>
          {tabs.map(t=>(
            <button key={t.id} className="tab-btn" onClick={()=>setTab(t.id)} style={{
              flex:1, background: tab===t.id?C.greenPale:"transparent",
              border:"none", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              padding:"6px 0", borderRadius:8, margin:"0 4px", transition:"all 0.2s"
            }}>
              <span style={{ fontSize:20 }}>{t.icon}</span>
              <span style={{ fontSize:10, fontFamily:"DM Sans", color:tab===t.id?C.green:C.muted, fontWeight:tab===t.id?700:400 }}>{t.label}</span>
              {tab===t.id && <div style={{ width:20, height:2.5, background:C.green, borderRadius:99 }}/>}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
