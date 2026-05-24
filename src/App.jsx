import { useState, useRef, useEffect } from "react";

// ── Palette ───────────────────────────────────────────────────────
const C = {
  bg:"#f0fdf4", surface:"#ffffff", card:"#ffffff",
  green:"#16a34a", greenLight:"#4ade80", greenPale:"#dcfce7", greenMid:"#86efac",
  accent:"#65a30d", accentPale:"#ecfccb",
  gold:"#d97706", goldPale:"#fef3c7",
  red:"#dc2626", redPale:"#fee2e2",
  pro:"#7c3aed", proPale:"#ede9fe",
  text:"#14532d", textMid:"#166534", muted:"#6b7280",
  border:"#bbf7d0", shadow:"0 2px 12px rgba(22,163,74,0.10)",
};

const fonts = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&display=swap');`;

// ── i18n ──────────────────────────────────────────────────────────
const LANGS = [
  { code:"en", label:"English",  flag:"🇺🇸" },
  { code:"ja", label:"日本語",   flag:"🇯🇵" },
  { code:"zh", label:"中文",     flag:"🇨🇳" },
  { code:"ko", label:"한국어",   flag:"🇰🇷" },
  { code:"es", label:"Español",  flag:"🇪🇸" },
  { code:"fr", label:"Français", flag:"🇫🇷" },
  { code:"de", label:"Deutsch",  flag:"🇩🇪" },
];

const T = {
  en: {
    appSub:"Build the body you want 💪",
    upgradeTo:"Upgrade to PRO →",
    dayStreak:"day streak",
    todayFuel:"TODAY'S FUEL",
    calLeft:"cal remaining — keep crushing it!",
    calOver:"cal over goal — hydrate & move!",
    vibe:"HOW'S YOUR VIBE?",
    moodLabels:["Rough","Meh","OK","Good","Fired up"],
    weightLog:"WEIGHT LOG",
    weightPh:"Enter lbs...",
    logBtn:"LOG",
    progress:"PROGRESS!",
    adjustOn:"— adjust & push on!",
    downBy:"⬇️ Down",
    upBy:"⬆️ Up",
    achievements:"ACHIEVEMENTS",
    badges:[["🔥","7-Day Streak"],["📸","First Snap"],["💪","Protein King"],["⚡","Level 5"],["🏆","30-Day Goal"]],
    snapMeal:"SNAP YOUR MEAL",
    snapSub:"AI identifies food & calculates nutrition instantly",
    analyzing:"ANALYZING YOUR FOOD...",
    analyzingSub:"AI scanning nutritional content",
    detected:"✅ MEAL DETECTED",
    confidence:"AI Confidence: 94%",
    retake:"✗ Retake",
    addLog:"ADD TO LOG +20 XP",
    todayMeals:"TODAY'S MEALS",
    noMeals:"No meals logged yet — snap your first meal! 📸",
    macroBreak:"MACRO BREAKDOWN",
    weightTrend:"WEIGHT TREND (7 DAYS)",
    xpLevel:"XP & LEVEL",
    xpActions:[["📸 Meal Snap","+20 XP"],["⚖️ Weight Log","+10 XP"],["💬 Chat","+5 XP"]],
    coachSub:"AI-powered · always in your corner",
    proUnlimited:"⚡ PRO UNLIMITED",
    upgradeMore:"Upgrade for more",
    chatsLeft:"chats left today",
    limitReached:"Daily limit reached",
    proLocked:"PRO features locked",
    proLockedSub:"Workout programs & monthly meal plans require PRO",
    unlock:"Unlock",
    chatPh:"Ask Coach Rex anything...",
    chatPhLimit:"Daily limit reached — upgrade for unlimited",
    send:"SEND",
    pro:"PRO",
    freePrompts:["How am I doing today?","What should I eat next?","I'm tired today, help!","Motivate me! 🔥"],
    proPrompts:["Build me a 1-month meal plan","Give me a full workout program","Optimize my macros for fat loss","What should I eat next?","Motivate me! 🔥"],
    modalTitle:"GO PRO WITH REX",
    modalSub:"Unlock the full coaching experience",
    modalFeatures:[["💬","Unlimited AI coach chats","Free: 3/day"],["🏋️","Full workout programs","1-month plans, by muscle group"],["🍽️","Custom 1-month meal plans","Tailored to your goals"],["📊","Advanced macro optimization","PFC deep-dive coaching"],["🔓","All future features","Early access included"]],
    planLabel:"Make Body PRO",
    stripeFee:"Stripe processing fee",
    youPay:"You pay today",
    cancelNote:"Cancel anytime · Secured by Stripe 🔒",
    devNote:"Developer Setup Required",
    devNoteSub:"Replace STRIPE_PAYMENT_LINK in App.jsx with your Stripe Payment Link URL.",
    setupFirst:"SETUP STRIPE FIRST",
    payBtn:"PAY",
    redirecting:"REDIRECTING TO STRIPE...",
    maybeLater:"Maybe later",
    trustBadges:["🔒 Secure","💳 All cards","🔄 Cancel anytime"],
    tabs:[{id:"home",icon:"🏠",label:"Home"},{id:"log",icon:"📸",label:"Log"},{id:"stats",icon:"📊",label:"Stats"},{id:"coach",icon:"🦾",label:"Coach"}],
    coachIntro:"Yo! I'm Coach Rex 🦾 — I push hard, but I've always got your back. Free users get 3 chats/day. Ask me about food, motivation, or go PRO for full workout & meal programs! Let's GO! 💪",
    lbs:"lbs", protein:"Protein", carbs:"Carbs", fat:"Fat", calories:"Calories",
    level:"LVL", language:"Language",
  },
  ja: {
    appSub:"理想の体を作ろう 💪",
    upgradeTo:"PROにアップグレード →",
    dayStreak:"日連続",
    todayFuel:"今日の食事",
    calLeft:"kcal 残り — その調子！",
    calOver:"kcal オーバー — 水分補給して動こう！",
    vibe:"今日の調子は？",
    moodLabels:["最悪","微妙","普通","良い","最高"],
    weightLog:"体重記録",
    weightPh:"体重を入力 (kg)...",
    logBtn:"記録",
    progress:"減量成功！",
    adjustOn:"— 調整して頑張ろう！",
    downBy:"⬇️ 減少",
    upBy:"⬆️ 増加",
    achievements:"実績",
    badges:[["🔥","7日連続"],["📸","初スナップ"],["💪","タンパク王"],["⚡","レベル5"],["🏆","30日達成"]],
    snapMeal:"食事を撮影",
    snapSub:"AIが食品を認識して栄養素を即座に計算",
    analyzing:"解析中...",
    analyzingSub:"AIが栄養成分をスキャン中",
    detected:"✅ 食事を検出しました",
    confidence:"AI信頼度: 94%",
    retake:"✗ 撮り直す",
    addLog:"記録に追加 +20 XP",
    todayMeals:"今日の食事",
    noMeals:"まだ記録なし — 食事を撮影しよう！ 📸",
    macroBreak:"マクロ栄養素",
    weightTrend:"体重推移 (7日間)",
    xpLevel:"XP & レベル",
    xpActions:[["📸 食事記録","+20 XP"],["⚖️ 体重記録","+10 XP"],["💬 コーチ","+5 XP"]],
    coachSub:"AIコーチ · いつもそばに",
    proUnlimited:"⚡ PRO 無制限",
    upgradeMore:"もっと使うにはアップグレード",
    chatsLeft:"回残り（今日）",
    limitReached:"本日の上限に達しました",
    proLocked:"PRO機能はロックされています",
    proLockedSub:"筋トレプログラム・月間食事プランはPRO限定",
    unlock:"解除する",
    chatPh:"Rex コーチに何でも聞こう...",
    chatPhLimit:"本日の上限 — アップグレードで無制限に",
    send:"送信",
    pro:"PRO",
    freePrompts:["今日の調子はどう?","次は何を食べればいい?","今日疲れてる、どうしたら?","やる気出して! 🔥"],
    proPrompts:["1ヶ月の食事プランを作って","筋トレプログラムを組んで","脂肪燃焼のためのマクロを最適化して","次は何を食べればいい?","やる気出して! 🔥"],
    modalTitle:"PROにアップグレード",
    modalSub:"フルコーチング体験を解放",
    modalFeatures:[["💬","AIコーチ無制限","無料: 3回/日"],["🏋️","完全筋トレプログラム","部位別・1ヶ月プラン"],["🍽️","カスタム月間食事プラン","目標に合わせて作成"],["📊","詳細マクロ最適化","PFCバランス徹底指導"],["🔓","今後の全機能","先行アクセス含む"]],
    planLabel:"Make Body PRO",
    stripeFee:"Stripe手数料",
    youPay:"今日のお支払い",
    cancelNote:"いつでもキャンセル可 · Stripeで安全決済 🔒",
    devNote:"開発者設定が必要",
    devNoteSub:"App.jsx の STRIPE_PAYMENT_LINK をStripeのURLに変更してください。",
    setupFirst:"Stripe設定が必要",
    payBtn:"支払う",
    redirecting:"Stripeに移動中...",
    maybeLater:"後で",
    trustBadges:["🔒 安全","💳 全カード対応","🔄 いつでもキャンセル"],
    tabs:[{id:"home",icon:"🏠",label:"ホーム"},{id:"log",icon:"📸",label:"記録"},{id:"stats",icon:"📊",label:"統計"},{id:"coach",icon:"🦾",label:"コーチ"}],
    coachIntro:"よし！俺がコーチRexだ 🦾 厳しく鍛えるけど、ちゃんと支えるぞ。無料ユーザーは1日3回まで。食事・モチベーション何でも聞いてくれ！PROなら筋トレ・食事プランも完全対応！行くぞ！💪",
    lbs:"kg", protein:"タンパク質", carbs:"炭水化物", fat:"脂質", calories:"カロリー",
    level:"レベル", language:"言語",
  },
  zh: {
    appSub:"打造你想要的身体 💪",
    upgradeTo:"升级到PRO →",
    dayStreak:"天连续",
    todayFuel:"今日饮食",
    calLeft:"卡路里剩余 — 继续加油！",
    calOver:"卡路里超标 — 多喝水多运动！",
    vibe:"今天状态如何？",
    moodLabels:["很差","一般","还好","不错","超棒"],
    weightLog:"体重记录",
    weightPh:"输入体重 (kg)...",
    logBtn:"记录",
    progress:"减重成功！",
    adjustOn:"— 调整继续加油！",
    downBy:"⬇️ 减少",
    upBy:"⬆️ 增加",
    achievements:"成就",
    badges:[["🔥","7天连续"],["📸","首次拍照"],["💪","蛋白质王"],["⚡","5级"],["🏆","30天目标"]],
    snapMeal:"拍摄餐食",
    snapSub:"AI识别食物并即时计算营养成分",
    analyzing:"分析中...",
    analyzingSub:"AI正在扫描营养成分",
    detected:"✅ 检测到餐食",
    confidence:"AI置信度: 94%",
    retake:"✗ 重拍",
    addLog:"添加记录 +20 XP",
    todayMeals:"今日餐食",
    noMeals:"还没有记录 — 拍摄你的第一餐！ 📸",
    macroBreak:"宏量营养素",
    weightTrend:"体重趋势 (7天)",
    xpLevel:"XP & 等级",
    xpActions:[["📸 餐食记录","+20 XP"],["⚖️ 体重记录","+10 XP"],["💬 教练","+5 XP"]],
    coachSub:"AI驱动 · 永远支持你",
    proUnlimited:"⚡ PRO 无限制",
    upgradeMore:"升级获取更多",
    chatsLeft:"次剩余（今天）",
    limitReached:"今日已达上限",
    proLocked:"PRO功能已锁定",
    proLockedSub:"训练计划和月度饮食计划需要PRO",
    unlock:"解锁",
    chatPh:"问Rex教练任何问题...",
    chatPhLimit:"今日已达上限 — 升级获取无限次数",
    send:"发送",
    pro:"PRO",
    freePrompts:["今天状态怎么样?","接下来吃什么?","今天太累了怎么办?","给我打打气! 🔥"],
    proPrompts:["制定1个月饮食计划","制定完整训练计划","优化我的减脂宏量","接下来吃什么?","给我打打气! 🔥"],
    modalTitle:"升级到PRO",
    modalSub:"解锁完整教练体验",
    modalFeatures:[["💬","AI教练无限次","免费: 3次/天"],["🏋️","完整训练计划","按肌肉群·1个月计划"],["🍽️","定制月度饮食计划","根据目标量身定制"],["📊","高级宏量优化","PFC深度指导"],["🔓","所有未来功能","包含早期访问"]],
    planLabel:"Make Body PRO",
    stripeFee:"Stripe手续费",
    youPay:"今日支付",
    cancelNote:"随时取消 · Stripe安全支付 🔒",
    devNote:"需要开发者设置",
    devNoteSub:"请将App.jsx中的STRIPE_PAYMENT_LINK替换为您的Stripe链接。",
    setupFirst:"需要配置Stripe",
    payBtn:"支付",
    redirecting:"正在跳转到Stripe...",
    maybeLater:"稍后再说",
    trustBadges:["🔒 安全","💳 支持所有卡","🔄 随时取消"],
    tabs:[{id:"home",icon:"🏠",label:"主页"},{id:"log",icon:"📸",label:"记录"},{id:"stats",icon:"📊",label:"统计"},{id:"coach",icon:"🦾",label:"教练"}],
    coachIntro:"嘿！我是Rex教练 🦾 — 我会严格训练你，但我永远支持你。免费用户每天3次对话。问我饮食、动力，或升级PRO获取完整训练和饮食计划！开始吧！💪",
    lbs:"kg", protein:"蛋白质", carbs:"碳水", fat:"脂肪", calories:"卡路里",
    level:"等级", language:"语言",
  },
  ko: {
    appSub:"원하는 몸을 만들어 보세요 💪",
    upgradeTo:"PRO로 업그레이드 →",
    dayStreak:"일 연속",
    todayFuel:"오늘의 식사",
    calLeft:"kcal 남음 — 계속 화이팅！",
    calOver:"kcal 초과 — 수분 보충하고 움직여요！",
    vibe:"오늘 컨디션은?",
    moodLabels:["최악","별로","보통","좋음","최고"],
    weightLog:"체중 기록",
    weightPh:"체중 입력 (kg)...",
    logBtn:"기록",
    progress:"감량 성공！",
    adjustOn:"— 조정하고 계속 파이팅！",
    downBy:"⬇️ 감소",
    upBy:"⬆️ 증가",
    achievements:"업적",
    badges:[["🔥","7일 연속"],["📸","첫 스냅"],["💪","단백질 왕"],["⚡","레벨 5"],["🏆","30일 달성"]],
    snapMeal:"식사 촬영",
    snapSub:"AI가 음식을 인식하고 영양소를 즉시 계산",
    analyzing:"분석 중...",
    analyzingSub:"AI가 영양 성분을 스캔 중",
    detected:"✅ 식사가 감지되었습니다",
    confidence:"AI 신뢰도: 94%",
    retake:"✗ 다시 찍기",
    addLog:"기록 추가 +20 XP",
    todayMeals:"오늘의 식사",
    noMeals:"아직 기록 없음 — 첫 식사를 찍어보세요！ 📸",
    macroBreak:"영양소 분석",
    weightTrend:"체중 추이 (7일)",
    xpLevel:"XP & 레벨",
    xpActions:[["📸 식사 기록","+20 XP"],["⚖️ 체중 기록","+10 XP"],["💬 코치","+5 XP"]],
    coachSub:"AI 코치 · 항상 당신 곁에",
    proUnlimited:"⚡ PRO 무제한",
    upgradeMore:"더 많은 기능 업그레이드",
    chatsLeft:"회 남음 (오늘)",
    limitReached:"오늘 한도 도달",
    proLocked:"PRO 기능이 잠겨 있습니다",
    proLockedSub:"운동 프로그램·월간 식단은 PRO 전용",
    unlock:"잠금 해제",
    chatPh:"Rex 코치에게 무엇이든 물어보세요...",
    chatPhLimit:"오늘 한도 도달 — 업그레이드로 무제한",
    send:"전송",
    pro:"PRO",
    freePrompts:["오늘 컨디션 어때?","다음에 뭐 먹을까?","오늘 너무 피곤해","동기부여 해줘! 🔥"],
    proPrompts:["1개월 식단 계획 짜줘","전체 운동 프로그램 만들어줘","체지방 감소를 위한 매크로 최적화","다음에 뭐 먹을까?","동기부여 해줘! 🔥"],
    modalTitle:"PRO로 업그레이드",
    modalSub:"풀 코칭 경험 잠금 해제",
    modalFeatures:[["💬","AI 코치 무제한","무료: 3회/일"],["🏋️","완전한 운동 프로그램","부위별·1개월 계획"],["🍽️","맞춤 월간 식단","목표에 맞게 제작"],["📊","고급 매크로 최적화","PFC 심층 코칭"],["🔓","모든 미래 기능","얼리 액세스 포함"]],
    planLabel:"Make Body PRO",
    stripeFee:"Stripe 수수료",
    youPay:"오늘 결제 금액",
    cancelNote:"언제든지 취소 · Stripe 보안 결제 🔒",
    devNote:"개발자 설정 필요",
    devNoteSub:"App.jsx의 STRIPE_PAYMENT_LINK를 실제 Stripe 링크로 교체하세요.",
    setupFirst:"Stripe 설정 필요",
    payBtn:"결제",
    redirecting:"Stripe로 이동 중...",
    maybeLater:"나중에",
    trustBadges:["🔒 안전","💳 모든 카드","🔄 언제든 취소"],
    tabs:[{id:"home",icon:"🏠",label:"홈"},{id:"log",icon:"📸",label:"기록"},{id:"stats",icon:"📊",label:"통계"},{id:"coach",icon:"🦾",label:"코치"}],
    coachIntro:"안녕! 나는 Rex 코치야 🦾 — 혹독하게 훈련시키지만 항상 네 편이야. 무료는 하루 3번 대화 가능. 식사·동기부여 뭐든 물어봐！PRO면 운동·식단 풀 프로그램도 OK！가자！💪",
    lbs:"kg", protein:"단백질", carbs:"탄수화물", fat:"지방", calories:"칼로리",
    level:"레벨", language:"언어",
  },
  es: {
    appSub:"Construye el cuerpo que quieres 💪",
    upgradeTo:"Actualizar a PRO →",
    dayStreak:"días seguidos",
    todayFuel:"ALIMENTACIÓN DE HOY",
    calLeft:"cal restantes — ¡sigue así!",
    calOver:"cal de más — ¡hidrátatey muévete!",
    vibe:"¿CÓMO TE SIENTES?",
    moodLabels:["Fatal","Regular","OK","Bien","¡Fuego!"],
    weightLog:"REGISTRO DE PESO",
    weightPh:"Ingresa kg...",
    logBtn:"GUARDAR",
    progress:"¡PROGRESO!",
    adjustOn:"— ajusta y sigue adelante",
    downBy:"⬇️ Bajó",
    upBy:"⬆️ Subió",
    achievements:"LOGROS",
    badges:[["🔥","7 días seguidos"],["📸","Primer snap"],["💪","Rey proteína"],["⚡","Nivel 5"],["🏆","Meta 30 días"]],
    snapMeal:"FOTOGRAFÍA TU COMIDA",
    snapSub:"La IA identifica los alimentos y calcula la nutrición al instante",
    analyzing:"ANALIZANDO TU COMIDA...",
    analyzingSub:"La IA está escaneando el contenido nutricional",
    detected:"✅ COMIDA DETECTADA",
    confidence:"Confianza IA: 94%",
    retake:"✗ Repetir",
    addLog:"AÑADIR AL REGISTRO +20 XP",
    todayMeals:"COMIDAS DE HOY",
    noMeals:"Sin registros aún — ¡fotografía tu primera comida! 📸",
    macroBreak:"DESGLOSE DE MACROS",
    weightTrend:"TENDENCIA DE PESO (7 DÍAS)",
    xpLevel:"XP & NIVEL",
    xpActions:[["📸 Comida","+20 XP"],["⚖️ Peso","+10 XP"],["💬 Chat","+5 XP"]],
    coachSub:"Con IA · siempre en tu esquina",
    proUnlimited:"⚡ PRO ILIMITADO",
    upgradeMore:"Actualizar para más",
    chatsLeft:"chats restantes hoy",
    limitReached:"Límite diario alcanzado",
    proLocked:"Funciones PRO bloqueadas",
    proLockedSub:"Programas de ejercicio y planes de comida requieren PRO",
    unlock:"Desbloquear",
    chatPh:"Pregunta al Coach Rex lo que sea...",
    chatPhLimit:"Límite diario — actualiza para ilimitado",
    send:"ENVIAR",
    pro:"PRO",
    freePrompts:["¿Cómo voy hoy?","¿Qué como ahora?","Hoy estoy agotado/a","¡Motívame! 🔥"],
    proPrompts:["Hazme un plan de comidas de 1 mes","Dame un programa de ejercicios completo","Optimiza mis macros para quemar grasa","¿Qué como ahora?","¡Motívame! 🔥"],
    modalTitle:"HAZTE PRO CON REX",
    modalSub:"Desbloquea la experiencia completa de coaching",
    modalFeatures:[["💬","Chats IA ilimitados","Gratis: 3/día"],["🏋️","Programas de ejercicio completos","Planes de 1 mes por grupo muscular"],["🍽️","Planes de comida mensuales","Adaptados a tus objetivos"],["📊","Optimización avanzada de macros","Coaching PFC profundo"],["🔓","Todas las funciones futuras","Acceso anticipado incluido"]],
    planLabel:"Make Body PRO",
    stripeFee:"Tarifa Stripe",
    youPay:"Pagas hoy",
    cancelNote:"Cancela cuando quieras · Pagos seguros con Stripe 🔒",
    devNote:"Configuración de desarrollador necesaria",
    devNoteSub:"Reemplaza STRIPE_PAYMENT_LINK en App.jsx con tu URL de Stripe.",
    setupFirst:"CONFIGURAR STRIPE PRIMERO",
    payBtn:"PAGAR",
    redirecting:"REDIRIGIENDO A STRIPE...",
    maybeLater:"Quizás luego",
    trustBadges:["🔒 Seguro","💳 Todas las tarjetas","🔄 Cancela cuando quieras"],
    tabs:[{id:"home",icon:"🏠",label:"Inicio"},{id:"log",icon:"📸",label:"Registro"},{id:"stats",icon:"📊",label:"Stats"},{id:"coach",icon:"🦾",label:"Coach"}],
    coachIntro:"¡Yo soy Coach Rex 🦾 — te exigiré mucho, pero siempre estaré contigo! Usuarios gratis: 3 chats/día. ¡Pregúntame sobre comida, motivación o hazte PRO para programas completos! ¡Vamos! 💪",
    lbs:"kg", protein:"Proteína", carbs:"Carbos", fat:"Grasa", calories:"Calorías",
    level:"NVL", language:"Idioma",
  },
  fr: {
    appSub:"Construis le corps que tu veux 💪",
    upgradeTo:"Passer à PRO →",
    dayStreak:"jours consécutifs",
    todayFuel:"REPAS DU JOUR",
    calLeft:"cal restantes — continue comme ça !",
    calOver:"cal de trop — hydrate-toi et bouge !",
    vibe:"COMMENT TU TE SENS ?",
    moodLabels:["Nul","Bof","OK","Bien","En feu !"],
    weightLog:"SUIVI DU POIDS",
    weightPh:"Entrer kg...",
    logBtn:"NOTER",
    progress:"PROGRÈS !",
    adjustOn:"— ajuste et continue !",
    downBy:"⬇️ Baisse de",
    upBy:"⬆️ Hausse de",
    achievements:"SUCCÈS",
    badges:[["🔥","7 jours consec."],["📸","Premier snap"],["💪","Roi protéines"],["⚡","Niveau 5"],["🏆","Objectif 30j"]],
    snapMeal:"PHOTOGRAPHIER TON REPAS",
    snapSub:"L'IA identifie les aliments et calcule la nutrition instantanément",
    analyzing:"ANALYSE EN COURS...",
    analyzingSub:"L'IA scanne les valeurs nutritionnelles",
    detected:"✅ REPAS DÉTECTÉ",
    confidence:"Confiance IA : 94 %",
    retake:"✗ Reprendre",
    addLog:"AJOUTER AU JOURNAL +20 XP",
    todayMeals:"REPAS DU JOUR",
    noMeals:"Aucun repas enregistré — photographie ton premier repas ! 📸",
    macroBreak:"RÉPARTITION DES MACROS",
    weightTrend:"TENDANCE DU POIDS (7 JOURS)",
    xpLevel:"XP & NIVEAU",
    xpActions:[["📸 Repas","+20 XP"],["⚖️ Poids","+10 XP"],["💬 Chat","+5 XP"]],
    coachSub:"IA · toujours dans ton coin",
    proUnlimited:"⚡ PRO ILLIMITÉ",
    upgradeMore:"Passer à plus",
    chatsLeft:"chats restants aujourd'hui",
    limitReached:"Limite quotidienne atteinte",
    proLocked:"Fonctions PRO verrouillées",
    proLockedSub:"Programmes d'entraînement et plans de repas nécessitent PRO",
    unlock:"Déverrouiller",
    chatPh:"Pose n'importe quelle question à Coach Rex...",
    chatPhLimit:"Limite atteinte — passe à PRO pour illimité",
    send:"ENVOYER",
    pro:"PRO",
    freePrompts:["Comment je m'en sors aujourd'hui ?","Que manger ensuite ?","Je suis épuisé(e) aujourd'hui","Motive-moi ! 🔥"],
    proPrompts:["Fais-moi un plan repas d'1 mois","Donne-moi un programme complet","Optimise mes macros pour perdre du gras","Que manger ensuite ?","Motive-moi ! 🔥"],
    modalTitle:"PASSE PRO AVEC REX",
    modalSub:"Débloque l'expérience coaching complète",
    modalFeatures:[["💬","Chats IA illimités","Gratuit : 3/jour"],["🏋️","Programmes complets","Plans 1 mois par groupe musculaire"],["🍽️","Plans repas mensuels personnalisés","Adaptés à tes objectifs"],["📊","Optimisation avancée des macros","Coaching PFC approfondi"],["🔓","Toutes les futures fonctions","Accès anticipé inclus"]],
    planLabel:"Make Body PRO",
    stripeFee:"Frais Stripe",
    youPay:"Tu paies aujourd'hui",
    cancelNote:"Annule quand tu veux · Sécurisé par Stripe 🔒",
    devNote:"Configuration développeur requise",
    devNoteSub:"Remplace STRIPE_PAYMENT_LINK dans App.jsx par ton URL Stripe.",
    setupFirst:"CONFIGURER STRIPE D'ABORD",
    payBtn:"PAYER",
    redirecting:"REDIRECTION VERS STRIPE...",
    maybeLater:"Peut-être plus tard",
    trustBadges:["🔒 Sécurisé","💳 Toutes cartes","🔄 Annule quand tu veux"],
    tabs:[{id:"home",icon:"🏠",label:"Accueil"},{id:"log",icon:"📸",label:"Journal"},{id:"stats",icon:"📊",label:"Stats"},{id:"coach",icon:"🦾",label:"Coach"}],
    coachIntro:"Salut ! Je suis Coach Rex 🦾 — je suis exigeant mais toujours là pour toi ! Les utilisateurs gratuits ont 3 chats/jour. Pose-moi des questions sur la nourriture, la motivation ou passe PRO pour des programmes complets ! Allons-y ! 💪",
    lbs:"kg", protein:"Protéines", carbs:"Glucides", fat:"Lipides", calories:"Calories",
    level:"NIV", language:"Langue",
  },
  de: {
    appSub:"Bau den Körper, den du willst 💪",
    upgradeTo:"Auf PRO upgraden →",
    dayStreak:"Tage in Folge",
    todayFuel:"HEUTIGES ESSEN",
    calLeft:"kal übrig — weiter so!",
    calOver:"kal über Ziel — Wasser trinken & bewegen!",
    vibe:"WIE FÜHLST DU DICH?",
    moodLabels:["Schlecht","Naja","OK","Gut","Feuer!"],
    weightLog:"GEWICHTSPROTOKOLL",
    weightPh:"Gewicht eingeben (kg)...",
    logBtn:"SPEICHERN",
    progress:"FORTSCHRITT!",
    adjustOn:"— anpassen und weitermachen!",
    downBy:"⬇️ Runter um",
    upBy:"⬆️ Rauf um",
    achievements:"ERRUNGENSCHAFTEN",
    badges:[["🔥","7 Tage Serie"],["📸","Erster Snap"],["💪","Protein-König"],["⚡","Level 5"],["🏆","30-Tage-Ziel"]],
    snapMeal:"MAHLZEIT FOTOGRAFIEREN",
    snapSub:"KI erkennt Lebensmittel und berechnet Nährwerte sofort",
    analyzing:"ANALYSE LÄUFT...",
    analyzingSub:"KI scannt Nährwertgehalt",
    detected:"✅ MAHLZEIT ERKANNT",
    confidence:"KI-Konfidenz: 94 %",
    retake:"✗ Wiederholen",
    addLog:"ZUM PROTOKOLL +20 XP",
    todayMeals:"HEUTIGE MAHLZEITEN",
    noMeals:"Noch keine Einträge — fotografiere deine erste Mahlzeit! 📸",
    macroBreak:"MAKRO-AUFSCHLÜSSELUNG",
    weightTrend:"GEWICHTSVERLAUF (7 TAGE)",
    xpLevel:"XP & LEVEL",
    xpActions:[["📸 Mahlzeit","+20 XP"],["⚖️ Gewicht","+10 XP"],["💬 Chat","+5 XP"]],
    coachSub:"KI-gestützt · immer in deiner Ecke",
    proUnlimited:"⚡ PRO UNBEGRENZT",
    upgradeMore:"Upgraden für mehr",
    chatsLeft:"Chats heute übrig",
    limitReached:"Tageslimit erreicht",
    proLocked:"PRO-Funktionen gesperrt",
    proLockedSub:"Trainingsprogramme & Monatspläne erfordern PRO",
    unlock:"Freischalten",
    chatPh:"Frag Coach Rex alles...",
    chatPhLimit:"Tageslimit erreicht — upgrade für unbegrenzt",
    send:"SENDEN",
    pro:"PRO",
    freePrompts:["Wie läuft's heute?","Was soll ich als nächstes essen?","Ich bin heute erschöpft","Motivier mich! 🔥"],
    proPrompts:["Erstell mir einen 1-Monats-Ernährungsplan","Gib mir ein vollständiges Trainingsprogramm","Optimiere meine Makros zur Fettverbrennung","Was soll ich als nächstes essen?","Motivier mich! 🔥"],
    modalTitle:"WERDE PRO MIT REX",
    modalSub:"Schalte das vollständige Coaching-Erlebnis frei",
    modalFeatures:[["💬","Unbegrenzte KI-Chats","Gratis: 3/Tag"],["🏋️","Vollständige Trainingsprogramme","1-Monats-Pläne nach Muskelgruppe"],["🍽️","Individuelle Monatspläne","Auf deine Ziele zugeschnitten"],["📊","Erweiterte Makro-Optimierung","PFC-Tiefencoaching"],["🔓","Alle zukünftigen Funktionen","Früher Zugang inklusive"]],
    planLabel:"Make Body PRO",
    stripeFee:"Stripe-Gebühr",
    youPay:"Du zahlst heute",
    cancelNote:"Jederzeit kündbar · Gesichert durch Stripe 🔒",
    devNote:"Entwickler-Setup erforderlich",
    devNoteSub:"Ersetze STRIPE_PAYMENT_LINK in App.jsx durch deine Stripe-URL.",
    setupFirst:"STRIPE ZUERST EINRICHTEN",
    payBtn:"BEZAHLEN",
    redirecting:"WEITERLEITUNG ZU STRIPE...",
    maybeLater:"Vielleicht später",
    trustBadges:["🔒 Sicher","💳 Alle Karten","🔄 Jederzeit kündbar"],
    tabs:[{id:"home",icon:"🏠",label:"Start"},{id:"log",icon:"📸",label:"Protokoll"},{id:"stats",icon:"📊",label:"Stats"},{id:"coach",icon:"🦾",label:"Coach"}],
    coachIntro:"Hey! Ich bin Coach Rex 🦾 — ich fordere dich hart, aber ich hab immer deinen Rücken! Gratis-Nutzer: 3 Chats/Tag. Frag mich alles über Ernährung, Motivation — oder werde PRO für vollständige Programme! Los geht's! 💪",
    lbs:"kg", protein:"Protein", carbs:"Kohlenhydrate", fat:"Fett", calories:"Kalorien",
    level:"LVL", language:"Sprache",
  },
};

// ── Stripe ────────────────────────────────────────────────────────
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/00w4gscClbob0UegMl2Fa01";
const STRIPE_PORTAL_LINK = "https://billing.stripe.com/p/login/YOUR_PORTAL_LINK";

const PRICE = "$7.99";

function handleStripeCheckout() {
  window.open(STRIPE_PAYMENT_LINK, "_blank");
}
function handleStripePortal() {
  window.open(STRIPE_PORTAL_LINK, "_blank");
}

// ── Helpers ───────────────────────────────────────────────────────
const MEALS = [
  { name:"Grilled Chicken Salad", cal:420, protein:38, carbs:22, fat:18, emoji:"🥗" },
  { name:"Avocado Toast",         cal:310, protein:9,  carbs:34, fat:17, emoji:"🥑" },
  { name:"Protein Shake",         cal:180, protein:30, carbs:12, fat:3,  emoji:"🥤" },
  { name:"Salmon & Rice",         cal:550, protein:42, carbs:48, fat:14, emoji:"🍣" },
  { name:"Greek Yogurt Bowl",     cal:240, protein:18, carbs:28, fat:6,  emoji:"🫙" },
  { name:"Burrito Bowl",          cal:680, protein:35, carbs:72, fat:22, emoji:"🌯" },
];
const MOODS = ["😤","😐","🙂","😊","🔥"];
const FREE_LIMIT = 3;
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pct  = (v, max) => Math.min(100, Math.round((v / max) * 100));

// ── Sub-components ────────────────────────────────────────────────
function Ring({ value, max, color, colorBg, label, size=64 }) {
  const r=size/2-6, circ=2*Math.PI*r, dash=(pct(value,max)/100)*circ;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={colorBg||C.border} strokeWidth={5}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition:"stroke-dasharray 0.6s ease" }}/>
        <text x="50%" y="54%" textAnchor="middle" fill={C.text} fontSize={size*0.22} fontFamily="DM Sans" fontWeight="700">{value}</text>
      </svg>
      <span style={{ fontSize:11, color:C.muted, fontFamily:"DM Sans" }}>{label}</span>
    </div>
  );
}

function Badge({ icon, label, earned }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, opacity:earned?1:0.3 }}>
      <div style={{ width:48, height:48, borderRadius:"50%", background:earned?C.greenPale:"#f3f4f6", border:`2px solid ${earned?C.green:"#e5e7eb"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:earned?`0 0 10px ${C.greenMid}`:"none" }}>{icon}</div>
      <span style={{ fontSize:10, color:earned?C.green:C.muted, fontFamily:"DM Sans", textAlign:"center" }}>{label}</span>
    </div>
  );
}

function StatBar({ label, value, max, color, colorBg }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:12, color:C.muted }}>{label}</span>
        <span style={{ fontSize:12, color:C.text, fontWeight:600 }}>{value} / {max}</span>
      </div>
      <div style={{ height:8, background:colorBg||C.border, borderRadius:99, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct(value,max)}%`, background:color, borderRadius:99, transition:"width 0.5s ease" }}/>
      </div>
    </div>
  );
}

function LangModal({ current, onSelect, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.surface, borderRadius:20, padding:24, maxWidth:320, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ fontFamily:"Bebas Neue", fontSize:22, letterSpacing:2, color:C.green, marginBottom:16, textAlign:"center" }}>🌐 LANGUAGE</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {LANGS.map(l => (
            <button key={l.code} onClick={()=>{ onSelect(l.code); onClose(); }} style={{
              display:"flex", alignItems:"center", gap:12, padding:"10px 14px",
              background: current===l.code ? C.greenPale : C.bg,
              border:`1.5px solid ${current===l.code ? C.green : C.border}`,
              borderRadius:12, cursor:"pointer", transition:"all 0.15s"
            }}>
              <span style={{ fontSize:22 }}>{l.flag}</span>
              <span style={{ fontSize:14, fontWeight: current===l.code?700:400, color:C.text }}>{l.label}</span>
              {current===l.code && <span style={{ marginLeft:"auto", color:C.green, fontSize:16 }}>✓</span>}
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ marginTop:12, width:"100%", background:"transparent", border:`1px solid ${C.border}`, borderRadius:12, padding:"9px 0", color:C.muted, fontSize:13, cursor:"pointer" }}>Close</button>
      </div>
    </div>
  );
}

function UpgradeModal({ t, onClose, onUpgrade }) {
  const [loading, setLoading] = useState(false);
  const isSetup = false; // URL configured
  function handlePay() {
    if (isSetup) return;
    setLoading(true);
    handleStripeCheckout();
    setTimeout(() => { setLoading(false); onUpgrade(); }, 1500);
  }
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.surface, borderRadius:24, padding:28, maxWidth:360, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.2)", animation:"slideUp 0.3s ease", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🦾⚡</div>
          <div style={{ fontFamily:"Bebas Neue", fontSize:26, letterSpacing:2, color:C.pro }}>{t.modalTitle}</div>
          <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>{t.modalSub}</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
          {t.modalFeatures.map(([icon,title,sub]) => (
            <div key={title} style={{ display:"flex", alignItems:"center", gap:12, background:C.proPale, borderRadius:12, padding:"10px 14px" }}>
              <span style={{ fontSize:22 }}>{icon}</span>
              <div><div style={{ fontSize:13, fontWeight:600, color:C.text }}>{title}</div><div style={{ fontSize:11, color:C.muted }}>{sub}</div></div>
            </div>
          ))}
        </div>
        <div style={{ background:"#f8fafc", borderRadius:12, padding:"12px 16px", marginBottom:14, border:"1px solid #e2e8f0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontSize:13, color:C.muted }}>{t.planLabel}</span>
            <span style={{ fontSize:13, fontWeight:600 }}>{PRICE}/month</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontSize:11, color:C.muted }}>{t.stripeFee}</span>
            <span style={{ fontSize:11, color:C.muted }}>2.9% + $0.30</span>
          </div>
          <div style={{ borderTop:"1px solid #e2e8f0", marginTop:8, paddingTop:8, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:13, fontWeight:700 }}>{t.youPay}</span>
            <span style={{ fontSize:16, fontWeight:700, color:C.pro }}>{PRICE}</span>
          </div>
          <div style={{ fontSize:10, color:C.muted, marginTop:6, textAlign:"center" }}>{t.cancelNote}</div>
        </div>
        {isSetup && (
          <div style={{ background:"#fef3c7", borderRadius:10, padding:"10px 14px", marginBottom:12, border:"1px solid #fde68a" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#92400e", marginBottom:3 }}>⚠️ {t.devNote}</div>
            <div style={{ fontSize:11, color:"#78350f", lineHeight:1.5 }}>{t.devNoteSub}</div>
          </div>
        )}
        <button onClick={handlePay} disabled={loading||isSetup} style={{
          width:"100%", background:isSetup?"#94a3b8":`linear-gradient(135deg,${C.pro},#9333ea)`,
          border:"none", borderRadius:14, padding:"14px 0", color:"#fff",
          fontFamily:"Bebas Neue", fontSize:18, letterSpacing:2,
          cursor:isSetup?"not-allowed":"pointer", marginBottom:10,
          boxShadow:isSetup?"none":"0 4px 16px rgba(124,58,237,0.35)"
        }}>
          {loading ? t.redirecting : isSetup ? t.setupFirst : `${t.payBtn} ${PRICE} — STRIPE`}
        </button>
        <div style={{ display:"flex", justifyContent:"center", gap:14, marginBottom:12 }}>
          {t.trustBadges.map(b=><span key={b} style={{ fontSize:10, color:C.muted }}>{b}</span>)}
        </div>
        <button onClick={onClose} style={{ width:"100%", background:"transparent", border:`1px solid ${C.border}`, borderRadius:14, padding:"10px 0", color:C.muted, fontSize:13, cursor:"pointer" }}>{t.maybeLater}</button>
      </div>
    </div>
  );
}


// ── Body type goals data ──────────────────────────────────────────
const BODY_GOALS = {
  male: [
    {
      id:"lean",
      emoji:"🏃",
      title:"Lean & Toned",
      celeb:"Ryan Reynolds style",
      desc:"Slim, defined muscles, low body fat",
      bodyFatRange:"10–15%",
      muscleFocal:"Lean muscle, cardio base",
      targetBf:12,
      color:"#e0f2fe", border:"#7dd3fc", textColor:"#0369a1",
      calAdjust: -300,
      proteinMultiplier: 1.8,
    },
    {
      id:"athletic",
      emoji:"💪",
      title:"Athletic",
      celeb:"Chris Hemsworth style",
      desc:"Strong, visible muscle definition",
      bodyFatRange:"8–12%",
      muscleFocal:"Strength + conditioning",
      targetBf:10,
      color:"#dcfce7", border:"#4ade80", textColor:"#15803d",
      calAdjust: 0,
      proteinMultiplier: 2.0,
    },
    {
      id:"muscular",
      emoji:"🦁",
      title:"Muscular",
      celeb:"Dwayne Johnson style",
      desc:"Maximum muscle mass, powerful build",
      bodyFatRange:"6–10%",
      muscleFocal:"Heavy lifting, bulk & cut",
      targetBf:8,
      color:"#fef3c7", border:"#fbbf24", textColor:"#b45309",
      calAdjust: +400,
      proteinMultiplier: 2.2,
    },
  ],
  female: [
    {
      id:"lean",
      emoji:"🏃",
      title:"Lean & Toned",
      celeb:"Jennifer Aniston style",
      desc:"Slim, toned, light muscle definition",
      bodyFatRange:"18–22%",
      muscleFocal:"Cardio + light toning",
      targetBf:20,
      color:"#e0f2fe", border:"#7dd3fc", textColor:"#0369a1",
      calAdjust: -250,
      proteinMultiplier: 1.6,
    },
    {
      id:"athletic",
      emoji:"💪",
      title:"Athletic",
      celeb:"Gal Gadot style",
      desc:"Strong, fit, well-defined physique",
      bodyFatRange:"15–20%",
      muscleFocal:"Strength + functional fitness",
      targetBf:17,
      color:"#dcfce7", border:"#4ade80", textColor:"#15803d",
      calAdjust: 0,
      proteinMultiplier: 1.8,
    },
    {
      id:"muscular",
      emoji:"🦁",
      title:"Muscular",
      celeb:"Zoë Saldaña style",
      desc:"Defined, powerful, athletic build",
      bodyFatRange:"13–18%",
      muscleFocal:"Resistance training, muscle gain",
      targetBf:15,
      color:"#fef3c7", border:"#fbbf24", textColor:"#b45309",
      calAdjust: +300,
      proteinMultiplier: 2.0,
    },
  ],
};

function getBMICategory(bmi, lang) {
  if (bmi < 18.5) return { label: lang==="ja"?"痩せ型":lang==="zh"?"偏瘦":lang==="ko"?"저체중":"Underweight", color:"#3b82f6", emoji:"💧" };
  if (bmi < 25)   return { label: lang==="ja"?"標準":lang==="zh"?"正常":lang==="ko"?"정상":"Normal", color:"#16a34a", emoji:"✅" };
  if (bmi < 30)   return { label: lang==="ja"?"ぽっちゃり":lang==="zh"?"偏胖":lang==="ko"?"과체중":"Overweight", color:"#f97316", emoji:"🟠" };
  return           { label: lang==="ja"?"肥満":lang==="zh"?"肥胖":lang==="ko"?"비만":"Obese", color:"#dc2626", emoji:"🔴" };
}

function calcIdealWeight(heightCm, gender, targetBf) {
  // Uses Boer formula for LBM, then adds target body fat
  const lbm = gender==="male"
    ? (0.407 * heightCm) - 10.3  // simplified
    : (0.252 * heightCm) - 4.3;
  return Math.round(lbm / (1 - targetBf / 100));
}

// ── Onboarding component ──────────────────────────────────────────
function Onboarding({ onComplete, lang }) {
  const [step, setStep]       = useState(0); // 0=nick, 1=gender, 2=body, 3=goal
  const [nickname, setNickname] = useState("");
  const [gender, setGender]   = useState(null);
  const [heightCm, setHeightCm] = useState("");
  const [currentWeightVal, setCurrentWeightVal] = useState("");
  const [selectedGoal, setSelectedGoal] = useState(null);

  const useLbs = lang === "en";
  const goals = gender ? BODY_GOALS[gender] : BODY_GOALS.male;

  function calcBMI() {
    const h = parseFloat(heightCm) / 100;
    let w = parseFloat(currentWeightVal);
    if (useLbs) w = w * 0.453592;
    if (!h || !w) return null;
    return w / (h * h);
  }

  const bmi = calcBMI();
  const bmiCat = bmi ? getBMICategory(bmi, lang) : null;

  function handleComplete() {
    const h = parseFloat(heightCm);
    let wKg = parseFloat(currentWeightVal);
    if (useLbs) wKg = wKg * 0.453592;
    const goal = goals.find(g=>g.id===selectedGoal);
    const idealWkg = calcIdealWeight(h, gender, goal?.targetBf || 15);
    onComplete({
      nickname,
      gender,
      heightCm: h,
      currentWeightKg: Math.round(wKg * 10) / 10,
      selectedGoalId: selectedGoal,
      goalData: goal,
      idealWeightKg: idealWkg,
      bmi: Math.round(bmi * 10) / 10,
    });
  }

  const stepTitles = {
    en: ["What's your name?", "Your gender", "Your measurements", "Your goal body"],
    ja: ["ニックネームは？", "性別を選択", "現在の体型", "目標の体型"],
    zh: ["你的昵称是？", "选择性别", "当前体型", "目标体型"],
    ko: ["닉네임은？", "성별 선택", "현재 체형", "목표 체형"],
    es: ["¿Cuál es tu nombre?", "Tu género", "Tu medidas", "Tu cuerpo ideal"],
    fr: ["Ton prénom ?", "Ton genre", "Tes mesures", "Ton corps idéal"],
    de: ["Wie heißt du?", "Dein Geschlecht", "Deine Maße", "Dein Zielkörper"],
  };
  const titles = stepTitles[lang] || stepTitles.en;

  const btnLabel = {
    en:"Continue →", ja:"次へ →", zh:"继续 →", ko:"다음 →",
    es:"Continuar →", fr:"Continuer →", de:"Weiter →"
  }[lang] || "Continue →";
  const startLabel = {
    en:"Start My Journey! 🚀", ja:"始めよう！🚀", zh:"开始我的旅程！🚀",
    ko:"시작하자！🚀", es:"¡Empezar！🚀", fr:"C'est parti！🚀", de:"Los geht's！🚀"
  }[lang] || "Start My Journey! 🚀";

  return (
    <div style={{ maxWidth:420, margin:"0 auto", minHeight:"100vh", background:`linear-gradient(160deg, #f0fdf4 0%, #dcfce7 100%)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 20px", fontFamily:"DM Sans, sans-serif" }}>
      <style>{fonts}</style>

      {/* Logo */}
      <div style={{ fontFamily:"Bebas Neue", fontSize:36, letterSpacing:3, color:C.green, marginBottom:4 }}>MAKE BODY</div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:32 }}>Build the body you want 💪</div>

      {/* Step indicators */}
      <div style={{ display:"flex", gap:8, marginBottom:28 }}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{ width: i===step?28:8, height:8, borderRadius:99, background: i<=step?C.green:C.border, transition:"all 0.3s" }}/>
        ))}
      </div>

      <div style={{ width:"100%", background:"#fff", borderRadius:24, padding:28, boxShadow:"0 8px 32px rgba(22,163,74,0.12)", minHeight:340 }}>
        <div style={{ fontFamily:"Bebas Neue", fontSize:22, letterSpacing:1, color:C.text, marginBottom:6 }}>{titles[step]}</div>

        {/* Step 0 — Nickname */}
        {step===0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16, marginTop:20 }}>
            <div style={{ fontSize:48, textAlign:"center" }}>👤</div>
            <input
              autoFocus
              value={nickname}
              onChange={e=>setNickname(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&nickname.trim()&&setStep(1)}
              placeholder={lang==="ja"?"例：タロウ":lang==="zh"?"例如：小明":lang==="ko"?"예: 철수":"e.g. Alex"}
              style={{ background:C.bg, border:`2px solid ${C.border}`, borderRadius:12, padding:"14px 16px", fontSize:18, fontWeight:700, color:C.text, outline:"none", textAlign:"center", fontFamily:"DM Sans" }}
            />
            <button disabled={!nickname.trim()} onClick={()=>setStep(1)} style={{ background:nickname.trim()?C.green:"#d1d5db", color:"#fff", border:"none", borderRadius:12, padding:"14px 0", fontFamily:"Bebas Neue", fontSize:18, letterSpacing:1, cursor:nickname.trim()?"pointer":"not-allowed" }}>{btnLabel}</button>
          </div>
        )}

        {/* Step 1 — Gender */}
        {step===1 && (
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:20 }}>
            {[
              { id:"male",   emoji:"♂️", label:{en:"Male",ja:"男性",zh:"男性",ko:"남성",es:"Hombre",fr:"Homme",de:"Mann"} },
              { id:"female", emoji:"♀️", label:{en:"Female",ja:"女性",zh:"女性",ko:"여성",es:"Mujer",fr:"Femme",de:"Frau"} },
              { id:"other",  emoji:"⚧️", label:{en:"Other / Prefer not to say",ja:"その他・未回答",zh:"其他/不填",ko:"기타/무응답",es:"Otro/Prefiero no decir",fr:"Autre/Ne pas préciser",de:"Andere/Keine Angabe"} },
            ].map(g=>(
              <button key={g.id} onClick={()=>{ setGender(g.id==="other"?"male":g.id); setStep(2); }} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", background: gender===g.id?C.greenPale:C.bg, border:`2px solid ${gender===g.id?C.green:C.border}`, borderRadius:14, cursor:"pointer", transition:"all 0.2s" }}>
                <span style={{ fontSize:28 }}>{g.emoji}</span>
                <span style={{ fontSize:16, fontWeight:600, color:C.text }}>{g.label[lang]||g.label.en}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — Height & Weight */}
        {step===2 && (
          <div style={{ display:"flex", flexDirection:"column", gap:14, marginTop:16 }}>
            <div>
              <div style={{ fontSize:12, color:C.muted, marginBottom:6 }}>{lang==="ja"?"身長 (cm)":lang==="zh"?"身高 (cm)":lang==="ko"?"키 (cm)":"Height (cm)"}</div>
              <input type="number" value={heightCm} onChange={e=>setHeightCm(e.target.value)}
                placeholder="170"
                style={{ width:"100%", background:C.bg, border:`2px solid ${C.border}`, borderRadius:12, padding:"12px 16px", fontSize:16, color:C.text, outline:"none", fontFamily:"DM Sans" }}/>
            </div>
            <div>
              <div style={{ fontSize:12, color:C.muted, marginBottom:6 }}>
                {lang==="ja"?"現在の体重":lang==="zh"?"当前体重":lang==="ko"?"현재 체중":"Current Weight"} ({useLbs?"lbs":"kg"})
              </div>
              <input type="number" value={currentWeightVal} onChange={e=>setCurrentWeightVal(e.target.value)}
                placeholder={useLbs?"160":"70"}
                style={{ width:"100%", background:C.bg, border:`2px solid ${C.border}`, borderRadius:12, padding:"12px 16px", fontSize:16, color:C.text, outline:"none", fontFamily:"DM Sans" }}/>
            </div>

            {/* BMI result */}
            {bmi && bmiCat && (
              <div style={{ background:C.greenPale, borderRadius:12, padding:"12px 16px", border:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:11, color:C.muted }}>{lang==="ja"?"あなたのBMI":lang==="zh"?"您的BMI":lang==="ko"?"현재 BMI":"Your BMI"}</div>
                    <div style={{ fontFamily:"Bebas Neue", fontSize:28, color:bmiCat.color }}>{Math.round(bmi*10)/10}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:22 }}>{bmiCat.emoji}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:bmiCat.color }}>{bmiCat.label}</div>
                  </div>
                </div>
                {/* BMI bar */}
                <div style={{ marginTop:8, height:6, background:"#e2e8f0", borderRadius:99, position:"relative", overflow:"hidden" }}>
                  {[
                    {pct:20,color:"#3b82f6"},{pct:27.5,color:"#16a34a"},
                    {pct:27.5,color:"#f97316"},{pct:25,color:"#dc2626"}
                  ].reduce((acc,seg,i)=>{
                    const left=acc.left;
                    acc.elements.push(<div key={i} style={{ position:"absolute", left:`${left}%`, width:`${seg.pct}%`, height:"100%", background:seg.color }}/>);
                    acc.left+=seg.pct;
                    return acc;
                  },{left:0,elements:[]}).elements}
                  <div style={{ position:"absolute", left:`${Math.min(95,Math.max(2,(bmi-10)/30*100))}%`, top:-2, width:10, height:10, background:"#1e293b", borderRadius:"50%", transform:"translateX(-50%)" }}/>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, fontSize:9, color:C.muted }}>
                  <span>10</span><span>18.5</span><span>25</span><span>30</span><span>40+</span>
                </div>
              </div>
            )}

            <button disabled={!heightCm||!currentWeightVal} onClick={()=>setStep(3)} style={{ background:heightCm&&currentWeightVal?C.green:"#d1d5db", color:"#fff", border:"none", borderRadius:12, padding:"14px 0", fontFamily:"Bebas Neue", fontSize:18, letterSpacing:1, cursor:heightCm&&currentWeightVal?"pointer":"not-allowed" }}>{btnLabel}</button>
          </div>
        )}

        {/* Step 3 — Goal body type */}
        {step===3 && (
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:16 }}>
            {goals.map(g=>(
              <button key={g.id} onClick={()=>setSelectedGoal(g.id)} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", background:selectedGoal===g.id?g.color:C.bg, border:`2px solid ${selectedGoal===g.id?g.border:C.border}`, borderRadius:16, cursor:"pointer", transition:"all 0.2s", textAlign:"left" }}>
                <span style={{ fontSize:32 }}>{g.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"Bebas Neue", fontSize:17, letterSpacing:1, color:selectedGoal===g.id?g.textColor:C.text }}>{g.title}</div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:2 }}>{g.celeb}</div>
                  <div style={{ fontSize:11, color:selectedGoal===g.id?g.textColor:C.muted }}>{g.desc}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:selectedGoal===g.id?g.textColor:C.muted }}>{g.bodyFatRange}</div>
                  <div style={{ fontSize:9, color:C.muted }}>body fat</div>
                </div>
              </button>
            ))}

            {selectedGoal && bmi && (
              <div style={{ background:C.greenPale, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 16px" }}>
                {(()=>{
                  const g = goals.find(x=>x.id===selectedGoal);
                  const idealKg = calcIdealWeight(parseFloat(heightCm), gender||"male", g.targetBf);
                  const idealLbs = Math.round(idealKg*2.205);
                  let wKg = parseFloat(currentWeightVal);
                  if (useLbs) wKg = wKg * 0.453592;
                  const diff = Math.round((wKg - idealKg)*10)/10;
                  return (
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:C.green, marginBottom:4 }}>
                        🎯 {lang==="ja"?"目標体重":lang==="zh"?"目标体重":lang==="ko"?"목표 체중":"Target Weight"}: {useLbs?`${idealLbs} lbs`:`${idealKg} kg`}
                      </div>
                      <div style={{ fontSize:11, color:C.muted }}>
                        {diff>0
                          ? `${lang==="ja"?"あと":lang==="zh"?"还需减少":lang==="ko"?"앞으로":"Need to lose"} ${useLbs?Math.round(diff*2.205):diff} ${useLbs?"lbs":"kg"}`
                          : `${lang==="ja"?"目標達成！筋肉をつけよう":lang==="zh"?"已达目标！增肌吧":lang==="ko"?"목표 달성！근육 키우기":"Already at goal! Focus on muscle gain"}`
                        } · {lang==="ja"?"目標体脂肪率":lang==="zh"?"目标体脂率":lang==="ko"?"목표 체지방률":"Target body fat"}: {g.targetBf}%
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <button disabled={!selectedGoal} onClick={handleComplete} style={{ background:selectedGoal?`linear-gradient(135deg,${C.green},${C.greenLight})`:"#d1d5db", color:"#fff", border:"none", borderRadius:12, padding:"16px 0", fontFamily:"Bebas Neue", fontSize:20, letterSpacing:2, cursor:selectedGoal?"pointer":"not-allowed", marginTop:4, boxShadow:selectedGoal?"0 4px 16px rgba(22,163,74,0.3)":"none" }}>{startLabel}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang]         = useState("en");
  const [showLang, setShowLang] = useState(false);
  const t = T[lang];

  // Onboarding
  const [profile, setProfile]   = useState(null); // null = not completed yet

  const [tab, setTab]           = useState("home");
  const [isPro, setIsPro]       = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [meals, setMeals]       = useState([]);
  const [weight, setWeight]     = useState("");
  const [weightsLbs, setWeightsLbs] = useState([182,181,180,179.5,179,178,177.5]);
  const [weightsKg,  setWeightsKg]  = useState([82.5,82.1,81.6,81.4,81.2,80.7,80.5]);
  const useLbs = lang === "en";
  const weights    = useLbs ? weightsLbs : weightsKg;
  const setWeights = useLbs ? setWeightsLbs : setWeightsKg;
  const [mood, setMood]         = useState(2);
  const [streak]                = useState(7);
  const [xp, setXp]             = useState(340);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput]     = useState("");
  const [aiLoading, setAiLoading]     = useState(false);
  const [analyzing, setAnalyzing]     = useState(false);
  const [scannedMeal, setScannedMeal] = useState(null);
  const [addedToday, setAddedToday]   = useState(false);
  const [freeChatsUsed, setFreeChatsUsed] = useState(0);
  const chatEndRef = useRef(null);
  const fileRef    = useRef(null);

  // Reset chat intro when language changes
  useEffect(() => {
    setChatHistory([{ role:"assistant", text: T[lang].coachIntro }]);
  }, [lang]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chatHistory]);

  const totalCals    = meals.reduce((s,m)=>s+m.cal,0);
  const totalProtein = meals.reduce((s,m)=>s+m.protein,0);
  const totalCarbs   = meals.reduce((s,m)=>s+m.carbs,0);
  const totalFat     = meals.reduce((s,m)=>s+m.fat,0);
  const calGoal  = 1800;
  const level    = Math.floor(xp/100)+1;
  const xpInLvl  = xp%100;
  const chatsLeft = FREE_LIMIT - freeChatsUsed;
  const canChat   = isPro || chatsLeft > 0;

  function handlePhotoUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    setAnalyzing(true); setScannedMeal(null);
    setTimeout(()=>{ setScannedMeal(rand(MEALS)); setAnalyzing(false); }, 2200);
  }
  function confirmMeal(m) {
    setMeals(p=>[...p,m]); setXp(x=>x+20); setScannedMeal(null); setAddedToday(true);
  }
  function logWeight() {
    const w=parseFloat(weight); if(!w) return;
    setWeights(p=>[...p.slice(-6),w]); setWeight(""); setXp(x=>x+10);
  }

  async function sendChat() {
    if (!chatInput.trim()||aiLoading) return;
    if (!canChat) { setShowUpgrade(true); return; }
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatHistory(h=>[...h,{role:"user",text:userMsg}]);
    setAiLoading(true);
    if (!isPro) setFreeChatsUsed(n=>n+1);

    const mealSummary = meals.length ? meals.map(m=>`${m.emoji} ${m.name} (${m.cal} cal)`).join(", ") : "nothing logged";
    const profileCtx = profile ? `User profile — Name: ${profile.nickname}, Gender: ${profile.gender}, Height: ${profile.heightCm}cm, Current weight: ${profile.currentWeightKg}kg, BMI: ${profile.bmi}, Goal body type: ${profile.goalData?.title} (${profile.goalData?.celeb}), Target body fat: ${profile.goalData?.targetBf}%, Target weight: ${profile.idealWeightKg}kg.` : "";
    const isWorkout = /workout|exercise|lift|gym|muscle|training|squat|bench|deadlift|筋トレ|运动|훈련|entraînement|entrenamiento|training/i.test(userMsg);
    const isMealPlan = /meal plan|monthly|1.month|1ヶ月|食事プラン|饮食计划|식단|plan.*repas|plan.*comida|ernährungsplan/i.test(userMsg);
    const freeRestrict = !isPro && (isWorkout || isMealPlan);

    const langNames = { en:"English", ja:"Japanese", zh:"Chinese", ko:"Korean", es:"Spanish", fr:"French", de:"German" };
    const replyLang = langNames[lang] || "English";

    // Detect if user is describing a situation/constraint
    const isSituational = /tired|exhausted|busy|sick|sore|no time|no gym|travel|hotel|outside|restaurant|can.t|cannot|疲れ|忙し|外食|体調|出張|旅行|tired|cansado|fatigué|müde|피곤|疲惫/i.test(userMsg);

    const systemPrompt = freeRestrict
      ? `You are Coach Rex, a fired-up but warm fitness coach. Reply ONLY in ${replyLang}. The user asked about ${isWorkout?"workouts":"meal plans"} but is on FREE plan. Give ONE exciting teaser (one exercise or meal idea), then tell them to go PRO for the full plan. 2-3 sentences, energetic, emojis. End with a call to action to upgrade.`
      : `You are Coach Rex, a fired-up passionate diet & fitness coach. Reply ONLY in ${replyLang}. Intense trainer energy, tough love, ALWAYS ends with genuine encouragement. SHORT responses (3-5 sentences max). Use emojis and energy.

ADAPTIVE COACHING RULES (very important):
- If the user mentions being tired, sick, busy, traveling, eating out, or any life constraint: IMMEDIATELY adapt the plan. Don't push the original plan. Instead give a modified, realistic alternative that fits their situation. Example: tired → lighter workout or rest day + recovery meal. Traveling → hotel room workout or healthy restaurant order. Busy → 10-min express workout or easy meal swap.
- Always acknowledge their situation with empathy first (1 sentence), then give the adapted solution (2-3 sentences), then end with encouragement (1 sentence).
- Never make the user feel guilty for not following the original plan. Life happens — adapt and move forward.

User tier: ${isPro?"PRO — give specific sets/reps, detailed meal plans, macro numbers":"FREE — general food tips & motivation only"}.
${profileCtx}
Stats — Calories: ${totalCals}/${calGoal}, Protein: ${totalProtein}g, Mood: ${t.moodLabels[mood]}, Streak: ${streak} days, Meals: ${mealSummary}.
${isSituational ? "IMPORTANT: User is describing a life constraint or situation — activate adaptive coaching mode immediately." : ""}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          system: systemPrompt,
          messages:[
            ...chatHistory.filter(m=>m.role!=="system").map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text})),
            {role:"user",content:userMsg}
          ]
        })
      });
      const data = await res.json();
      const reply = data.content?.map(b=>b.text||"").join("") || "LET'S GO! 💪";
      setChatHistory(h=>[...h,{role:"assistant",text:reply}]);
    } catch {
      setChatHistory(h=>[...h,{role:"assistant",text:"Connection dropped — keep pushing! 🔥"}]);
    }
    setAiLoading(false);
  }

  const currentLang = LANGS.find(l=>l.code===lang);

  // Show onboarding on first launch
  if (!profile) {
    return <Onboarding lang={lang} onComplete={(p) => {
      setProfile(p);
      // Update initial weights to match user input
      const kg = p.currentWeightKg;
      setWeightsKg([kg]);
      setWeightsLbs([Math.round(kg*2.205*10)/10]);
      // Personalise chat intro
      setChatHistory([{ role:"assistant", text: T[lang].coachIntro.replace("Yo!", `Yo ${p.nickname}!`) }]);
    }}/>;
  }

  return (
    <>
      <style>{`
        ${fonts}
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.bg};}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:${C.greenMid};border-radius:4px;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .tab-btn:hover{background:${C.greenPale} !important;}
        .snap-zone:hover{background:${C.greenPale} !important;}
        .meal-card{animation:slideUp 0.3s ease;}
      `}</style>

      {showLang    && <LangModal    current={lang} onSelect={setLang} onClose={()=>setShowLang(false)}/>}
      {showUpgrade && <UpgradeModal t={t} onClose={()=>setShowUpgrade(false)} onUpgrade={()=>{setIsPro(true);setShowUpgrade(false);}}/>}

      <div style={{ maxWidth:420, margin:"0 auto", minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"DM Sans, sans-serif", display:"flex", flexDirection:"column" }}>

        {/* Header */}
        <div style={{ padding:"16px 20px 12px", background:C.surface, borderBottom:`1px solid ${C.border}`, boxShadow:C.shadow }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:"Bebas Neue", fontSize:30, letterSpacing:2, color:C.green, lineHeight:1 }}>MAKE BODY</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{t.appSub}</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
              <div style={{ display:"flex", gap:6 }}>
                {/* Language button */}
                <button onClick={()=>setShowLang(true)} style={{ background:C.greenPale, border:`1px solid ${C.border}`, borderRadius:20, padding:"3px 10px", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                  <span>{currentLang.flag}</span>
                  <span style={{ fontSize:10, color:C.textMid, fontWeight:600 }}>{currentLang.code.toUpperCase()}</span>
                </button>
                {isPro ? (
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ background:`linear-gradient(135deg,${C.pro},#9333ea)`, color:"#fff", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:99 }}>⚡ PRO</span>
                    <button onClick={handleStripePortal} style={{ background:"transparent", border:`1px solid #c4b5fd`, color:C.pro, fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:99, cursor:"pointer" }}>Manage</button>
                  </div>
                ) : (
                  <button onClick={()=>setShowUpgrade(true)} style={{ background:C.proPale, color:C.pro, border:`1px solid #c4b5fd`, fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:99, cursor:"pointer" }}>{t.upgradeTo}</button>
                )}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:16 }}>🔥</span>
                <span style={{ fontFamily:"Bebas Neue", fontSize:20, color:C.gold }}>{streak}</span>
                <span style={{ fontSize:11, color:C.muted }}>{t.dayStreak}</span>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10 }}>
            <span style={{ fontSize:11, color:C.muted, minWidth:40 }}>{t.level} {level}</span>
            <div style={{ flex:1, height:6, background:C.border, borderRadius:99 }}>
              <div style={{ width:`${xpInLvl}%`, height:"100%", background:`linear-gradient(90deg,${C.green},${C.greenLight})`, borderRadius:99, transition:"width 0.5s" }}/>
            </div>
            <span style={{ fontSize:10, color:C.accent, minWidth:48, textAlign:"right" }}>{xpInLvl}/100 XP</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 90px" }}>

          {/* HOME */}
          {tab==="home" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* Profile goal card */}
              {profile && (
                <div style={{ background:`linear-gradient(135deg, ${profile.goalData?.color||C.greenPale}, #fff)`, borderRadius:20, padding:16, border:`1.5px solid ${profile.goalData?.border||C.border}`, boxShadow:C.shadow }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:36 }}>{profile.goalData?.emoji||"💪"}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"Bebas Neue", fontSize:15, letterSpacing:1, color:profile.goalData?.textColor||C.green }}>GOAL: {profile.goalData?.title?.toUpperCase()}</div>
                      <div style={{ fontSize:11, color:C.muted }}>{profile.goalData?.celeb}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"Bebas Neue", fontSize:20, color:profile.goalData?.textColor||C.green }}>{profile.idealWeightKg}kg</div>
                      <div style={{ fontSize:9, color:C.muted }}>target</div>
                    </div>
                  </div>
                  {(()=>{
                    const currentKg = weights[weights.length-1];
                    const diff = Math.round((currentKg - profile.idealWeightKg)*10)/10;
                    const startKg = profile.currentWeightKg;
                    const totalToLose = startKg - profile.idealWeightKg;
                    const lost = startKg - currentKg;
                    const pctDone = totalToLose>0 ? Math.min(100,Math.round((lost/totalToLose)*100)) : 100;
                    return (
                      <div style={{ marginTop:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:11, color:C.muted }}>Progress to goal</span>
                          <span style={{ fontSize:11, fontWeight:700, color:profile.goalData?.textColor||C.green }}>{pctDone}%</span>
                        </div>
                        <div style={{ height:7, background:"#e2e8f0", borderRadius:99 }}>
                          <div style={{ width:`${pctDone}%`, height:"100%", background:`linear-gradient(90deg,${C.green},${profile.goalData?.border||C.greenLight})`, borderRadius:99, transition:"width 0.5s" }}/>
                        </div>
                        <div style={{ marginTop:6, fontSize:11, color:diff>0?C.red:C.green, fontWeight:600 }}>
                          {diff>0 ? `${diff}kg to go · Body fat target: ${profile.goalData?.targetBf}%` : "🎉 Goal reached! Focus on muscle quality"}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              <div style={{ background:C.surface, borderRadius:20, padding:20, border:`1px solid ${C.border}`, boxShadow:C.shadow }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <div>
                    <span style={{ fontFamily:"Bebas Neue", fontSize:18, letterSpacing:1 }}>{t.todayFuel}</span>
                    <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}</div>
                  </div>
                  <button onClick={()=>setTab("log")} style={{ background:C.greenPale, border:`1px solid ${C.border}`, borderRadius:20, padding:"4px 12px", fontSize:11, color:C.green, fontWeight:700, cursor:"pointer" }}>+ Add meal</button>
                </div>
                {meals.length===0 && (
                  <div style={{ textAlign:"center", padding:"12px 0 4px", fontSize:12, color:C.muted }}>
                    📸 No meals yet — tap <strong>+ Add meal</strong> to snap your first one!
                  </div>
                )}
                <div style={{ display:"flex", justifyContent:"space-around", alignItems:"center" }}>
                  <Ring value={totalCals} max={calGoal} color={totalCals>calGoal?C.red:C.green} colorBg={C.border} label={t.calories} size={80}/>
                  <Ring value={totalProtein} max={150} color={C.accent} colorBg={C.accentPale} label={t.protein} size={64}/>
                  <Ring value={totalCarbs} max={200} color={C.gold} colorBg={C.goldPale} label={t.carbs} size={64}/>
                  <Ring value={totalFat} max={60} color="#f97316" colorBg="#ffedd5" label={t.fat} size={64}/>
                </div>
                <div style={{ marginTop:14, padding:"8px 12px", background:totalCals>calGoal?C.redPale:C.greenPale, borderRadius:10, textAlign:"center", fontSize:12, color:totalCals>calGoal?C.red:C.green, fontWeight:600 }}>
                  {totalCals>calGoal ? `⚠️ ${totalCals-calGoal} ${t.calOver}` : `✅ ${calGoal-totalCals} ${t.calLeft}`}
                </div>
              </div>

              <div style={{ background:C.surface, borderRadius:20, padding:16, border:`1px solid ${C.border}`, boxShadow:C.shadow }}>
                <div style={{ fontFamily:"Bebas Neue", fontSize:16, letterSpacing:1, marginBottom:12, color:C.textMid }}>{t.vibe}</div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  {MOODS.map((m,i)=>(
                    <button key={i} onClick={()=>setMood(i)} style={{ background:mood===i?C.greenPale:"transparent", border:`2px solid ${mood===i?C.green:C.border}`, borderRadius:14, padding:"8px 10px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, transition:"all 0.2s" }}>
                      <span style={{ fontSize:22 }}>{m}</span>
                      <span style={{ fontSize:10, color:mood===i?C.green:C.muted }}>{t.moodLabels[i]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background:C.surface, borderRadius:20, padding:16, border:`1px solid ${C.border}`, boxShadow:C.shadow }}>
                <div style={{ fontFamily:"Bebas Neue", fontSize:16, letterSpacing:1, marginBottom:12, color:C.textMid }}>{t.weightLog}</div>
                <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                  <input type="number" placeholder={t.weightPh} value={weight} onChange={e=>setWeight(e.target.value)} onKeyDown={e=>e.key==="Enter"&&logWeight()}
                    style={{ flex:1, background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"9px 12px", color:C.text, fontFamily:"DM Sans", fontSize:14, outline:"none" }}/>
                  <button onClick={logWeight} style={{ background:C.green, color:"#fff", border:"none", borderRadius:10, padding:"9px 18px", fontFamily:"Bebas Neue", fontSize:15, letterSpacing:1, cursor:"pointer" }}>{t.logBtn}</button>
                </div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:52 }}>
                  {weights.slice(-7).map((w,i)=>{
                    const mn=Math.min(...weights),mx=Math.max(...weights);
                    const h=mx===mn?50:((w-mn)/(mx-mn))*70+30;
                    return (
                      <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                        <div style={{ width:"100%", background:i===weights.length-1?C.green:C.greenMid, borderRadius:"4px 4px 0 0", height:`${h}%`, minHeight:4, transition:"height 0.4s" }}/>
                        <span style={{ fontSize:9, color:C.muted }}>{w}</span>
                      </div>
                    );
                  })}
                </div>
                {weights.length>=2 && (
                  <div style={{ marginTop:8, fontSize:12, fontWeight:600, textAlign:"center", color:weights[weights.length-1]<weights[weights.length-2]?C.green:C.red }}>
                    {weights[weights.length-1]<weights[weights.length-2]
                      ? `${t.downBy} ${(weights[weights.length-2]-weights[weights.length-1]).toFixed(1)} ${t.lbs} — ${t.progress}`
                      : `${t.upBy} ${(weights[weights.length-1]-weights[weights.length-2]).toFixed(1)} ${t.lbs} ${t.adjustOn}`}
                  </div>
                )}
              </div>

              <div style={{ background:C.surface, borderRadius:20, padding:16, border:`1px solid ${C.border}`, boxShadow:C.shadow }}>
                <div style={{ fontFamily:"Bebas Neue", fontSize:16, letterSpacing:1, marginBottom:12, color:C.textMid }}>{t.achievements}</div>
                <div style={{ display:"flex", justifyContent:"space-around" }}>
                  {t.badges.map(([icon,label],i)=><Badge key={i} icon={icon} label={label} earned={[streak>=7,addedToday,totalProtein>=100,level>=5,streak>=30][i]}/>)}
                </div>
              </div>
            </div>
          )}

          {/* LOG */}
          {tab==="log" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div className="snap-zone" onClick={()=>fileRef.current?.click()} style={{ background:C.surface, borderRadius:20, padding:24, border:`2px dashed ${C.green}`, textAlign:"center", cursor:"pointer", transition:"all 0.2s", boxShadow:C.shadow }}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhotoUpload}/>
                <div style={{ fontSize:52, marginBottom:8 }}>📸</div>
                <div style={{ fontFamily:"Bebas Neue", fontSize:22, letterSpacing:2, color:C.green }}>{t.snapMeal}</div>
                <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>{t.snapSub}</div>
              </div>
              {analyzing && (
                <div style={{ background:C.surface, borderRadius:20, padding:24, textAlign:"center", border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:38, marginBottom:8, animation:"spin 1s linear infinite", display:"inline-block" }}>🔬</div>
                  <div style={{ fontFamily:"Bebas Neue", fontSize:18, letterSpacing:1, color:C.green }}>{t.analyzing}</div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{t.analyzingSub}</div>
                </div>
              )}
              {scannedMeal && !analyzing && (
                <div className="meal-card" style={{ background:C.surface, borderRadius:20, padding:16, border:`2px solid ${C.green}`, boxShadow:C.shadow }}>
                  <div style={{ fontFamily:"Bebas Neue", fontSize:14, letterSpacing:1, color:C.green, marginBottom:10 }}>{t.detected}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                    <span style={{ fontSize:44 }}>{scannedMeal.emoji}</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:16 }}>{scannedMeal.name}</div>
                      <div style={{ fontSize:12, color:C.muted }}>{t.confidence}</div>
                    </div>
                    <div style={{ marginLeft:"auto", textAlign:"right" }}>
                      <div style={{ fontFamily:"Bebas Neue", fontSize:26, color:C.green }}>{scannedMeal.cal}</div>
                      <div style={{ fontSize:11, color:C.muted }}>{t.calories}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                    {[[t.protein,scannedMeal.protein,C.accent,C.accentPale],[t.carbs,scannedMeal.carbs,C.gold,C.goldPale],[t.fat,scannedMeal.fat,"#f97316","#ffedd5"]].map(([l,v,c,bg])=>(
                      <div key={l} style={{ flex:1, background:bg, borderRadius:10, padding:8, textAlign:"center" }}>
                        <div style={{ fontFamily:"Bebas Neue", fontSize:20, color:c }}>{v}g</div>
                        <div style={{ fontSize:10, color:C.muted }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setScannedMeal(null)} style={{ flex:1, background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, padding:10, color:C.muted, fontSize:13, cursor:"pointer" }}>{t.retake}</button>
                    <button onClick={()=>confirmMeal(scannedMeal)} style={{ flex:2, background:C.green, border:"none", borderRadius:10, padding:10, color:"#fff", fontFamily:"Bebas Neue", fontSize:15, letterSpacing:1, cursor:"pointer" }}>{t.addLog}</button>
                  </div>
                </div>
              )}
              <div style={{ fontFamily:"Bebas Neue", fontSize:15, letterSpacing:1, color:C.muted }}>{t.todayMeals} ({meals.length})</div>
              {meals.length===0 ? (
                <div style={{ textAlign:"center", color:C.muted, fontSize:13, padding:20 }}>{t.noMeals}</div>
              ) : meals.map((m,i)=>(
                <div key={i} className="meal-card" style={{ background:C.surface, borderRadius:14, padding:"12px 14px", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, boxShadow:C.shadow }}>
                  <span style={{ fontSize:28 }}>{m.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{m.name}</div>
                    <div style={{ fontSize:11, color:C.muted }}>P:{m.protein}g · C:{m.carbs}g · F:{m.fat}g</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:"Bebas Neue", fontSize:22, color:C.green }}>{m.cal}</div>
                    <div style={{ fontSize:10, color:C.muted }}>{t.calories}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STATS */}
          {tab==="stats" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ background:C.surface, borderRadius:20, padding:16, border:`1px solid ${C.border}`, boxShadow:C.shadow }}>
                <div style={{ fontFamily:"Bebas Neue", fontSize:16, letterSpacing:1, marginBottom:14, color:C.textMid }}>{t.macroBreak}</div>
                <StatBar label={`${t.protein} (g)`} value={totalProtein} max={150} color={C.accent} colorBg={C.accentPale}/>
                <StatBar label={`${t.carbs} (g)`}   value={totalCarbs}   max={200} color={C.gold}   colorBg={C.goldPale}/>
                <StatBar label={`${t.fat} (g)`}     value={totalFat}     max={60}  color="#f97316"  colorBg="#ffedd5"/>
                <StatBar label={t.calories}          value={totalCals}    max={calGoal} color={C.green} colorBg={C.greenPale}/>
              </div>
              <div style={{ background:C.surface, borderRadius:20, padding:16, border:`1px solid ${C.border}`, boxShadow:C.shadow }}>
                <div style={{ fontFamily:"Bebas Neue", fontSize:16, letterSpacing:1, marginBottom:14, color:C.textMid }}>{t.weightTrend}</div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:80 }}>
                  {weights.slice(-7).map((w,i)=>{
                    const mn=Math.min(...weights),mx=Math.max(...weights);
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
                <div style={{ fontFamily:"Bebas Neue", fontSize:16, letterSpacing:1, marginBottom:12, color:C.textMid }}>{t.xpLevel}</div>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                  <div style={{ width:52, height:52, borderRadius:"50%", background:C.greenPale, border:`2px solid ${C.green}`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Bebas Neue", fontSize:18, color:C.green }}>{t.level} {level}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:13 }}>{t.level} {level} → {level+1}</span>
                      <span style={{ fontSize:12, color:C.accent, fontWeight:700 }}>{xpInLvl}/100 XP</span>
                    </div>
                    <div style={{ height:8, background:C.greenPale, borderRadius:99 }}>
                      <div style={{ width:`${xpInLvl}%`, height:"100%", background:`linear-gradient(90deg,${C.green},${C.greenLight})`, borderRadius:99, transition:"width 0.5s" }}/>
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {t.xpActions.map(([a,x])=>(
                    <div key={a} style={{ flex:1, background:C.greenPale, borderRadius:10, padding:8, textAlign:"center" }}>
                      <div style={{ fontSize:11, color:C.text, marginBottom:2 }}>{a}</div>
                      <div style={{ fontSize:12, color:C.accent, fontWeight:700 }}>{x}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* COACH */}
          {tab==="coach" && (
            <div style={{ display:"flex", flexDirection:"column", gap:0, height:"calc(100vh - 210px)" }}>
              <div style={{ background:C.surface, borderRadius:16, padding:14, border:`1px solid ${C.border}`, marginBottom:10, display:"flex", alignItems:"center", gap:12, boxShadow:C.shadow }}>
                <div style={{ width:48, height:48, borderRadius:"50%", background:C.greenPale, border:`2px solid ${C.green}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, boxShadow:`0 0 12px ${C.greenMid}` }}>🦾</div>
                <div>
                  <div style={{ fontFamily:"Bebas Neue", fontSize:18, letterSpacing:1, color:C.green }}>COACH REX</div>
                  <div style={{ fontSize:11, color:C.muted }}>{t.coachSub}</div>
                </div>
                <div style={{ marginLeft:"auto", display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                  {isPro ? (
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
                      <span style={{ background:`linear-gradient(135deg,${C.pro},#9333ea)`, color:"#fff", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:99 }}>{t.proUnlimited}</span>
                      <button onClick={handleStripePortal} style={{ background:"transparent", border:`1px solid #c4b5fd`, color:C.pro, fontSize:9, fontWeight:600, padding:"2px 6px", borderRadius:99, cursor:"pointer" }}>Cancel / Manage →</button>
                    </div>
                  ) : (
                    <button onClick={()=>setShowUpgrade(true)} style={{ background:C.proPale, color:C.pro, border:`1px solid #c4b5fd`, fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:99, cursor:"pointer" }}>{t.upgradeMore}</button>
                  )}
                  {!isPro && <span style={{ fontSize:10, color:chatsLeft>0?C.accent:C.red, fontWeight:600 }}>{chatsLeft>0?`${chatsLeft} ${t.chatsLeft}`:t.limitReached}</span>}
                </div>
              </div>

              {!isPro && (
                <div style={{ background:C.proPale, borderRadius:12, padding:"10px 14px", marginBottom:10, border:"1px solid #c4b5fd", display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:20 }}>🔒</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:C.pro }}>{t.proLocked}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{t.proLockedSub}</div>
                  </div>
                  <button onClick={()=>setShowUpgrade(true)} style={{ background:C.pro, color:"#fff", border:"none", borderRadius:8, padding:"5px 10px", fontSize:11, fontWeight:700, cursor:"pointer" }}>{t.unlock}</button>
                </div>
              )}

              {/* PRO sample plans — shown to PRO users */}
              {isPro && (
                <div style={{ display:"flex", gap:8, marginBottom:10, overflowX:"auto", paddingBottom:4 }}>
                  {[
                    { icon:"🍽️", title:"This Week's Meals", sub:"7-day plan", color:C.goldPale, border:C.gold, prompt:"Give me a 7-day meal plan for this week" },
                    { icon:"🏋️", title:"Workout Plan", sub:"Week 1 of 4", color:C.accentPale, border:C.accent, prompt:"Give me this week's workout plan with sets and reps" },
                    { icon:"😴", title:"Rest Day Plan", sub:"Tired? Adapt!", color:"#fce7f3", border:"#f9a8d4", prompt:"I'm tired today, adapt my plan for a rest day" },
                    { icon:"✈️", title:"Travel Mode", sub:"Away from gym", color:"#e0f2fe", border:"#7dd3fc", prompt:"I'm traveling and have no gym access, what can I do?" },
                    { icon:"🍜", title:"Eating Out", sub:"Restaurant tips", color:"#fff7ed", border:"#fdba74", prompt:"I have to eat out today, what should I order to stay on track?" },
                    { icon:"📊", title:"Macro Target", sub:"PFC balance", color:C.greenPale, border:C.green, prompt:"Optimize my macros for fat loss" },
                  ].map(p=>(
                    <button key={p.title} onClick={()=>setChatInput(p.prompt)} style={{
                      minWidth:120, background:p.color, border:`1.5px solid ${p.border}`,
                      borderRadius:14, padding:"10px 12px", cursor:"pointer", textAlign:"left", flexShrink:0
                    }}>
                      <div style={{ fontSize:22, marginBottom:4 }}>{p.icon}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{p.title}</div>
                      <div style={{ fontSize:10, color:C.muted }}>{p.sub}</div>
                    </button>
                  ))}
                </div>
              )}

              <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:10, marginBottom:10, paddingRight:4 }}>
                {chatHistory.map((msg,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start", animation:"slideUp 0.3s ease" }}>
                    {msg.role==="assistant" && <span style={{ fontSize:18, marginRight:6, marginTop:4 }}>🦾</span>}
                    <div style={{ maxWidth:"78%", padding:"10px 14px", borderRadius:14, background:msg.role==="user"?C.greenPale:C.surface, border:`1px solid ${msg.role==="user"?C.green:C.border}`, fontSize:13, lineHeight:1.55, color:C.text, borderTopRightRadius:msg.role==="user"?4:14, borderTopLeftRadius:msg.role==="assistant"?4:14, boxShadow:C.shadow }}>{msg.text}</div>
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

              <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
                {(isPro?t.proPrompts:t.freePrompts).map(q=>(
                  <button key={q} onClick={()=>setChatInput(q)} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"5px 10px", fontSize:11, color:C.muted, cursor:"pointer", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:4 }}>
                    {(q.includes("workout")||q.includes("meal plan")||q.includes("筋トレ")||q.includes("食事プラン")||q.includes("运动")||q.includes("饮食")||q.includes("훈련")||q.includes("식단")||q.includes("entraîn")||q.includes("entrena")||q.includes("Training")||q.includes("Ernähr"))&&!isPro&&<span style={{ fontSize:9 }}>🔒</span>}
                    {q}
                  </button>
                ))}
              </div>

              <div style={{ display:"flex", gap:8 }}>
                <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()}
                  placeholder={canChat?t.chatPh:t.chatPhLimit} disabled={!canChat}
                  style={{ flex:1, background:canChat?C.bg:"#f9fafb", border:`1.5px solid ${C.border}`, borderRadius:10, padding:"10px 14px", color:C.text, fontFamily:"DM Sans", fontSize:13, outline:"none", opacity:canChat?1:0.6 }}/>
                <button onClick={sendChat} disabled={aiLoading||!canChat} style={{ background:!canChat?C.pro:aiLoading?C.greenMid:C.green, border:"none", borderRadius:10, padding:"10px 16px", color:"#fff", fontFamily:"Bebas Neue", fontSize:15, letterSpacing:1, cursor:(aiLoading||!canChat)?"not-allowed":"pointer" }}>
                  {!canChat?t.pro:t.send}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:420, background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", padding:"8px 0 12px", boxShadow:"0 -4px 16px rgba(22,163,74,0.08)" }}>
          {t.tabs.map(tab_=>( 
            <button key={tab_.id} className="tab-btn" onClick={()=>setTab(tab_.id)} style={{ flex:1, background:tab===tab_.id?C.greenPale:"transparent", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"6px 0", borderRadius:8, margin:"0 4px", transition:"all 0.2s" }}>
              <span style={{ fontSize:20 }}>{tab_.icon}</span>
              <span style={{ fontSize:10, color:tab===tab_.id?C.green:C.muted, fontWeight:tab===tab_.id?700:400 }}>{tab_.label}</span>
              {tab===tab_.id && <div style={{ width:20, height:2.5, background:C.green, borderRadius:99 }}/>}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
