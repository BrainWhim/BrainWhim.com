# Learn page settings for build-pillar.py (Nov 20)
ROOMS = r"""var ROOMS=[
  {id:"reading", name:"The Reading Room", kind:"A Fascinating Fact a Day", glow:"rgba(120,170,255,.5)", page:"reading.html", cta:"Read Today's Lesson", moon:["The Book Club","pw/learn-book-sm.jpg?v=1123a","bookclub.html","Open now · a book for every shelf"],
   line:"A five-minute lesson a day on one good idea, with a new subject each weekday, then three quick questions to see if it stuck. Keep a streak, just like the puzzle rooms.",
   try:["telegraph","study"]},
  {id:"book", orb:false, name:"The Book Club", kind:"A Book for Every Shelf", glow:"rgba(140,190,140,.5)", page:"bookclub.html", cta:"Browse This Month's Shelf",
   line:"A bright bookshop caf\u00e9 with a fresh pick on every one of our 14 shelves each month, from Fiction to Do It Yourself. Read why we chose each one and keep track of what you've read. Comments open soon.",
   try:["study","telegraph"]},
  {id:"catalog", name:"The Card Catalog", kind:"Memory", glow:"rgba(120,200,230,.5)",
   line:"Flashcards that come back just before you'd forget them. Make your own decks or borrow ours, from state capitals to Spanish verbs.",
   try:["countinghouse","clockmaker"]},
  {id:"curio", name:"Cabinet of Curiosities", kind:"Explorers", glow:"rgba(255,190,120,.45)",
   line:"Small working models you can turn and poke: gears that mesh, light that bends, tides that follow the moon. Science you can touch.",
   try:["observatory","orrery"]},
  {id:"atlas", name:"The Atlas Room", kind:"Maps & Time", glow:"rgba(255,170,90,.45)",
   line:"Geography and history through maps and timelines you can explore. Later, a real language course that grows out of the Kids' Corner's Hello World.",
   try:["maproom","harbor"]}];"""
FAM = r"""var FAM=[
  ["Hello World","moonlets-hello.html","hw/card.webp?v=1116a","Moonlets → Moon Games → Hello World","First words in six languages with Finn, and a balloon ride between them. Ages 3 to 7."],
  ["Letter Lights","moonlets-letters.html","ll/card.webp?v=1117a","Moonlets → Moon Games → Letter Lights","Trace the glowing letters with a finger and light up the ABCs. Ages 3 to 7."],
  ["How Do I Feel?","moonlets-feel.html","hf/card.webp?v=1117a","Moonlets → My Moon Day → How Do I Feel?","Name a feeling with Clover the bunny, hear a little story, and breathe together. Ages 3 to 7."],
  ["Star Stickers","starstickers.html","sk/fam-card.jpg?v=1120a","The Outpost → The Telescope → Star Stickers","Connect the stars to find 29 real constellations and collect their stickers. Ages 8 to 12."],
  ["Circuit Builder","circuit.html","cb/bg-sm.jpg","The Outpost → Mission Control → Circuit Builder","Turn the wire tiles until the battery lights every bulb: first steps in circuits and logic. Ages 8 to 12."],
  ["Jack's Bee Garden","beegarden.html","jb/bg-sm.jpg","The Outpost → The Workshop → Jack's Bee Garden","A sliding puzzle with 31 real bee facts from Jack, a 10-year-old beekeeper. Ages 8 to 12."]];"""
def li(n,e): return '      <li class="c-learn"><i class="pd"></i><span><b>%s</b><em>%s</em></span></li>' % (n,e)
C = dict(META="Learn at BrainWhim: short lessons that stick. The Reading Room is open, with a fascinating fact a day. The Card Catalog, a Cabinet of Curiosities and the Atlas Room are on the way, with learning games for kids ready now.", OUT="learn.html", TITLE="Learn · The Library Wing · BrainWhim", PLANET='url("planet-learn-word.jpg")',
  GLOW="0 0 36px rgba(120,190,255,.45),0 0 100px rgba(80,140,255,.22)", KC="color:#a9d2ff",
  KICK="The Library Wing · Now Open: The Reading Room", H1="<h1>Learn</h1>",
  INTRO="Short lessons that stick. The first room in this wing of the house is open: the Reading Room, with a fascinating fact a day. Three more are being furnished: flashcards that come back when you need them, small working models you can poke, and maps that tell stories. Each opens on its own, and a letter from the studio will say when.",
  TRYLINE="Alongside the Reading Room, these daily puzzle rooms work the same muscles: words, numbers, maps and the night sky.",
  FAMH2="Learning in the Kids' Corner",
  FAMLINE="Ready now for young learners: no ads, no chat, nothing sent anywhere. Open one here, or on your child's own tablet with the QR code.",
  SIGNUP='data-bw-signup="learn"', PLANKICK="The Plan for Learn", PLANH2="What Learn Will Hold",
  PLANP="The rooms above come first. Behind them, Learn grows into a few longer paths:",
  TRACKS="""            <li><b>Homeschool</b>Family learning maps and simple ways to see progress, for parents teaching at home.</li>
            <li><b>Early Learning</b>Gentle skill-building for first-time learners, picking up where the Kids' Corner leaves off.</li>
            <li><b>Skills</b>Self-paced maps for the thing you actually want to get better at.</li>
            <li><b>Languages</b>A real language course that grows out of Hello World's first words.</li>""",
  CLUBROOMS="and the Club rooms in Learn as they open.", ASK="Questions, or something you'd love to learn here?",
  NEXTH="<h3>Opening Next in Learn</h3>",
  NEXTLI="\n".join([li("The Card Catalog","Flashcards that come back in time"),li("Cabinet of Curiosities","Science you can touch"),li("The Atlas Room","Maps, timelines and languages")]),
  ROOMS=ROOMS, FAM=FAM, PW="learn",
  DAYOLD='["learn","Learn",readDone?"Today\'s fact: read":"Today\'s fascinating fact","reading.html",readDone?"\\u2713":"",readDone]', DAYNEW='["learn","Learn",readDone?"Today\'s fact: read":"Today\'s fascinating fact","reading.html",readDone?"\\u2713":"",readDone]')
