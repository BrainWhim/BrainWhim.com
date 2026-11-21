# Live page settings for build-pillar.py (Nov 20)
ROOMS = r"""var ROOMS=[
  {id:"garden", name:"The Habit Garden", kind:"Habits", glow:"rgba(120,220,150,.5)",
   line:"Every habit you keep is a plant that grows. Water it by doing the thing. Miss a day and it waits for you; nothing wilts away.",
   try:["gardenplots","orrery"]},
  {id:"daybook", name:"The Daybook", kind:"Planning & Journal", glow:"rgba(255,210,140,.45)",
   line:"A calm daily planner with room for one line about your day. Look back a month later and see what really happened.",
   try:["clockmaker","telegraph"]},
  {id:"bell", name:"The Morning Bell", kind:"Routines", glow:"rgba(255,200,110,.45)",
   line:"Step-by-step morning and evening routines with a soft chime at each step, so the start of the day runs itself.",
   try:["nighttrain","observatory"]},
  {id:"pantry", name:"The Pantry", kind:"Home", glow:"rgba(200,230,140,.45)",
   line:"Plan the week's meals and let the grocery list write itself, sorted the way you walk through the store.",
   try:["countinghouse","harbor"]}];"""
FAM = r"""var FAM=[
  ["Chore Chart","chorechart.html","ch/fam-card.jpg?v=1120a","The Outpost → Mission Control → Chore Chart","Pick chores together, set a weekly schedule, and fill a jar with quarters toward a saving goal, or play without money. Ages 8 to 12."],
  ["Launch Timer","launchtimer.html","lt/fam-card.jpg?v=1120a","The Outpost → Mission Control → Launch Timer","Turn homework or getting ready into a rocket countdown, with a Mission Log of what got done. Ages 8 to 12."],
  ["Sophie's Smoothie Stand","smoothie.html","sm/fam-card.jpg?v=1120a","The Outpost → The Workshop → Sophie's Smoothie Stand","Blend layered smoothies for animal friends and earn real recipe cards to make together. Ages 8 to 12."],
  ["Brush-Brush Timer","moonlets-brush.html","bb/card.webp?v=1117d","Moonlets → My Moon Day → Brush-Brush Timer","Brush along with Finn for two minutes and chase the sugar bugs away, with a Tooth Fairy who keeps count. Ages 3 to 7."],
  ["My Morning Chart","moonlets-morning.html","mo/card.webp?v=1117a","Moonlets → My Moon Day → My Morning Chart","Wake up the sleepy sun: tap each morning job as it's done. Ages 3 to 7."],
  ["Sleepy Moon","moonlets-sleepy.html","sy/card.webp?v=1117a","Moonlets → My Moon Day → Sleepy Moon","Say goodnight to the room, breathe slowly like a sleepy moon, and drift off to a lullaby. Ages 3 to 7."]];"""
def li(n,e): return '      <li class="c-live"><i class="pd"></i><span><b>%s</b><em>%s</em></span></li>' % (n,e)
C = dict(META="Live at BrainWhim: habits that grow like a garden. The Habit Garden, the Daybook, the Morning Bell and the Pantry are opening soon, with chore charts and bedtime helpers for kids ready now.", OUT="live.html", TITLE="Live · The Household · BrainWhim", PLANET='url("planet-live-word.jpg")',
  GLOW="0 0 36px rgba(120,220,170,.45),0 0 100px rgba(60,200,140,.22)", KC="color:#9fe3c0",
  KICK="The Household · Opening Soon", H1="<h1>Live</h1>",
  INTRO="Habits that grow like a garden. Four rooms are being furnished in this wing of the house: a garden for the habits you keep, a daybook for plans and one line a day, a bell that walks you through your routines, and a pantry that writes your grocery list. Each room opens on its own, and the first letter from the studio will say when.",
  TRYLINE="While Live is being furnished, a puzzle a day is a good habit to start with. Keep a streak in any of these rooms.",
  FAMH2="Everyday Helpers in the Kids' Corner",
  FAMLINE="Ready now for families: chores, countdowns, brushing and bedtime. No ads, no chat, nothing sent anywhere. Open one here, or on your child's own tablet with the QR code.",
  SIGNUP='data-bw-signup="live"', PLANKICK="The Plan for Live", PLANH2="What Live Will Hold",
  PLANP="The rooms above come first. Behind them, Live grows into a few longer paths:",
  TRACKS="""            <li><b>Habits &amp; Routines</b>Routines you can actually keep on an ordinary Tuesday.</li>
            <li><b>Recipes &amp; Cooking</b>Everyday cooking systems that respect real kitchens and real time.</li>
            <li><b>Personal Finance</b>Simple money tools without the lecture, including kids and money.</li>
            <li><b>Recovery &amp; Mindful Living</b>Mindful living and recovery support: practical, not preachy.</li>""",
  CLUBROOMS="and the Club rooms in Live as they open.", ASK="Questions, or a routine you'd love help with?",
  NEXTH="<h3>Opening Next in Live</h3>",
  NEXTLI="\n".join([li("The Habit Garden","Habits that grow"),li("The Daybook","Plans and one line a day"),li("The Morning Bell","Routines with a chime"),li("The Pantry","Meals and the grocery list")]),
  ROOMS=ROOMS, FAM=FAM, PW="live",
  DAYOLD='["live","Live","The Morning Bell","live.html","Soon",0,1]', DAYNEW='["live","Live","The Habit Garden","#r-garden","Soon",0,1]')
