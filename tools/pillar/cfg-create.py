# Create page settings for build-pillar.py (Nov 20)
ROOMS = r"""var ROOMS=[
  {id:"desk", name:"The Writing Desk", kind:"Writing", glow:"rgba(160,170,255,.5)",
   line:"A fresh story starter every day and a quiet page to write on, with a word-count goal that keeps you coming back.",
   try:["telegraph","study"]},
  {id:"mood", name:"The Mood Board", kind:"Design", glow:"rgba(255,170,210,.45)",
   line:"Save color palettes and pin pictures into layout boards, so a feeling turns into something you can build from.",
   try:["gardenplots","observatory"]},
  {id:"brainstorm", name:"The Brainstorm Table", kind:"Ideas", glow:"rgba(255,220,140,.45)",
   line:"Idea cards to shuffle, group and pin. Spread everything out, then move it around until a plan appears.",
   try:["nighttrain","maproom"]},
  {id:"type", name:"The Type Case", kind:"Type", glow:"rgba(230,170,110,.45)",
   line:"Real type specimens for pairing fonts: see a heading and its body text side by side before you commit.",
   try:["clockmaker","countinghouse"]}];"""
FAM = r"""var FAM=[
  ["Sophie's Style Studio","stylestudio.html","ss/fam-card.jpg?v=1120a","The Outpost → The Workshop → Sophie's Style Studio","Put together looks for a fashion show and see how colors and patterns work together. Ages 8 to 12."],
  ["Sophie's Slime Lab","slimelab.html","sl/fam-card.jpg?v=1120a","The Outpost → The Lab → Sophie's Slime Lab","Mix colors, glitter and bits into slime that matches each animal's order. Ages 8 to 12."],
  ["Print Shop Jr.","printshop-jr.html","pj/fam-card.jpg?v=1120a","The Outpost → The Lab → Print Shop Jr.","Find the hidden words in an old wooden type case. Ages 8 to 12."],
  ["Paint Easel","moonlets-easel.html","ez/fam-card.jpg?v=1120a","Moonlets → the purple moon → Paint Easel","Paint with a fingertip at an easel in a sunny art corner. Ages 3 to 7."],
  ["Sticker Scenes","moonlets-stickers.html","sc/card.webp?v=1118b","Moonlets → Moon Games → Sticker Scenes","Fill Finn's sticker book with stickers on the farm, at the beach and in space. Ages 3 to 7."],
  ["Make a Face","moonlets-face.html","mf/card.webp?v=1118b","Moonlets → Moon Games → Make a Face","Moonbeam lost her face! Give her eyes, a mouth and a hat, and decide how she feels. Ages 3 to 7."]];"""
def li(n,e): return '      <li class="c-create"><i class="pd"></i><span><b>%s</b><em>%s</em></span></li>' % (n,e)
C = dict(META="Create at BrainWhim: aids for writers, makers and designers. The Writing Desk, the Mood Board, the Brainstorm Table and the Type Case are opening soon, with making games for kids ready now.", OUT="create.html", TITLE="Create · The Studio · BrainWhim", PLANET='url("planet-create-word.jpg")',
  GLOW="0 0 36px rgba(220,150,255,.45),0 0 100px rgba(160,90,255,.22)", KC="color:#e2b8ff",
  KICK="The Studio · Opening Soon", H1="<h1>Create</h1>",
  INTRO="Aids for writers, makers and designers. Four rooms are being furnished in this wing of the house: a writing desk with a story starter every day, a mood board for colors and layouts, a table of idea cards to shuffle and pin, and a case of real type for pairing fonts. Each room opens on its own, and the first letter from the studio will say when.",
  TRYLINE="While Create is being furnished, these daily puzzle rooms stretch the same muscles: words, patterns, and watching a plan come together.",
  FAMH2="Making Things in the Kids' Corner",
  FAMLINE="Ready now for young makers: fashion, slime, paint and stickers. No ads, no chat, nothing sent anywhere. Open one here, or on your child's own tablet with the QR code.",
  SIGNUP='data-bw-signup="create"', PLANKICK="The Plan for Create", PLANH2="What Create Will Hold",
  PLANP="The rooms above come first. Behind them, Create grows into a few longer paths:",
  TRACKS="""            <li><b>Tools</b>Small creative utilities for people who make things.</li>
            <li><b>Projects</b>A place to park an idea until it becomes a next step.</li>
            <li><b>Trending</b>A desk for what's moving, without the noise.</li>""",
  CLUBROOMS="and the Club rooms in Create as they open.", ASK="Questions, or a tool you wish existed?",
  NEXTH="<h3>Opening Next in Create</h3>",
  NEXTLI="\n".join([li("The Writing Desk","A story starter a day"),li("The Mood Board","Palettes and layout boards"),li("The Brainstorm Table","Idea cards to shuffle and pin"),li("The Type Case","Font pairing with real type")]),
  ROOMS=ROOMS, FAM=FAM, PW="create",
  DAYOLD='["create","Create","Today\'s writing prompt","create.html","Soon",0,1]', DAYNEW='["create","Create","The Writing Desk","#r-desk","Soon",0,1]')
