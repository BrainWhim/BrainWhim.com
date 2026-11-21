/* The Reading Room's lessons (Learn · The Library Wing), Nov 21, 2026.
   One lesson a day; each weekday has its own subject (TRACKS). A weekday's lessons are used in turn, a week at a time,
   so adding a lesson to a track simply joins the rotation. Every fact is checked before it goes in.
   A lesson: { id, title, dek (one line under the title), pages:[{h, p:[paragraphs]}], remember, qs:[{q, a:[3 answers], c: right one, why}] }
   Write American spelling and U.S. measurements. Non-ASCII characters as \u escapes (a page without a charset garbles them). */
var RR_TRACKS = [
  { id: "how",    name: "How Things Work" },   /* Sunday */
  { id: "sci",    name: "Science" },           /* Monday */
  { id: "hist",   name: "History" },           /* Tuesday */
  { id: "words",  name: "Words" },             /* Wednesday */
  { id: "money",  name: "Money & Life" },      /* Thursday */
  { id: "art",    name: "Art & Music" },       /* Friday */
  { id: "nature", name: "Nature & Places" }    /* Saturday */
];
var RR_LESSONS = {
  sci: [{
    id: "sci-blue-sky", title: "Why the Sky Is Blue",
    dek: "Sunlight holds every color. The air simply throws one of them around more than the rest.",
    pages: [
      { h: "White light, all mixed up", p: [
        "Sunlight looks white, but it is really every color of the rainbow traveling together. A prism, or a rainbow after a storm, pulls those colors apart so you can see them: red, orange, yellow, green, blue and violet.",
        "Each color is a wave of light, and each has its own wavelength. Red light has long, lazy waves. Blue and violet light have short, quick ones. That one difference is the whole secret of the blue sky." ] },
      { h: "The air bounces blue around", p: [
        "Air is mostly nitrogen and oxygen molecules, far smaller than a wave of light. When sunlight passes through them, a little of it is knocked off course in every direction. Scientists call this scattering.",
        "Tiny particles scatter short waves much more than long ones. Blue light is scattered roughly six times more than red. So as sunlight crosses the sky, blue light is bounced from molecule to molecule until it seems to come from everywhere at once. Look anywhere away from the sun and you see that scattered blue.",
        "The British scientist Lord Rayleigh worked out the math of this in 1871, and it is still called Rayleigh scattering." ] },
      { h: "Then why not violet?", p: [
        "Violet waves are even shorter than blue, so they scatter even more. But sunlight carries less violet to begin with, some of it is absorbed high in the atmosphere, and our eyes are much less sensitive to violet than to blue. Add it all up and the sky reads as blue." ] },
      { h: "Red sunsets, and a sky on Mars", p: [
        "At sunrise and sunset, sunlight travels through far more air to reach you. By the time it arrives, most of the blue has been scattered away along the path, and the longer reds and oranges are what is left. That is why the low sun glows orange.",
        "On Mars, the thin air is full of fine dust, and the dust scatters light differently. The daytime sky there looks butterscotch, and the sunsets look blue: the opposite of ours." ] }
    ],
    remember: "Air scatters short blue waves far more than long red ones, so blue light seems to come from the whole sky.",
    qs: [
      { q: "Which colors of light are scattered most by the air?", a: ["Short waves, like blue", "Long waves, like red", "All colors equally"], c: 0, why: "Tiny air molecules scatter short waves much more than long ones. Blue is scattered roughly six times more than red." },
      { q: "Why does the sun look orange at sunset?", a: ["The sun cools down in the evening", "Its light crosses more air, and most of the blue is scattered away", "Clouds turn the light orange"], c: 1, why: "Low in the sky, sunlight passes through much more air. The blue is scattered out along the way, leaving the reds and oranges." },
      { q: "What color are sunsets on Mars?", a: ["Red", "Green", "Blue"], c: 2, why: "Fine dust in Mars's thin air scatters light differently: the daytime sky looks butterscotch and the sunsets look blue." }
    ]
  }, {
    id: "sci-ice-floats", title: "Why Ice Floats",
    dek: "Almost every solid sinks in its own liquid. Water breaks the rule, and life on Earth depends on it.",
    pages: [
      { h: "A strange exception", p: [
        "Drop a chunk of solid wax into melted wax and it sinks. The same goes for most metals and most other substances: the solid form is packed tighter than the liquid, so it is heavier for its size.",
        "Water does the opposite. Ice floats, with about a tenth of it above the surface. That is unusual enough that scientists count it among water's oddest habits." ] },
      { h: "Ice is full of open space", p: [
        "A water molecule is one oxygen atom with two hydrogen atoms, shaped like a wide letter V. Neighboring molecules cling to each other through weak links called hydrogen bonds.",
        "In liquid water, those links keep breaking and re-forming, so the molecules tumble close together. When water freezes, the links lock into a neat six-sided framework that holds the molecules a little apart. That framework has more open space than the liquid, so ice is about 9 percent less dense than water, and it floats." ] },
      { h: "Densest just above freezing", p: [
        "As water cools, it gets denser, but only down to about 39 \u00b0F. Below that, the molecules start lining up into their open, ice-like arrangement, and the water grows lighter again.",
        "So in a pond in winter, the densest water, at about 39 \u00b0F, sinks to the bottom, and the coldest water stays on top, where it freezes." ] },
      { h: "Why fish survive the winter", p: [
        "Because lakes freeze from the top down, the ice forms a lid that shelters the water beneath it. Fish, frogs and turtles spend the winter in liquid water under the ice.",
        "If ice sank, lakes would freeze from the bottom up, layer after layer, and many might freeze solid. The same open space explains why a full bottle of water can crack in the freezer: ice takes up more room than the water it came from." ] }
    ],
    remember: "Freezing locks water molecules into an open framework, so ice is about 9 percent lighter than water and floats.",
    qs: [
      { q: "Why is ice lighter than liquid water?", a: ["Its molecules lock into an open framework with more space", "It is full of trapped air from the freezer", "Its molecules are smaller"], c: 0, why: "Hydrogen bonds hold frozen water molecules a little apart in a six-sided framework, so ice is less dense." },
      { q: "At about what temperature is water densest?", a: ["32 \u00b0F", "39 \u00b0F", "50 \u00b0F"], c: 1, why: "Water is densest at about 39 \u00b0F, just above freezing. Colder than that, it starts to get lighter." },
      { q: "Why can fish live through a winter in a frozen lake?", a: ["Fish can freeze and thaw safely", "The whole lake freezes slowly", "The ice floats on top, and liquid water stays below"], c: 2, why: "Lakes freeze from the top down, and the floating ice shelters the liquid water underneath." }
    ]
  }, {
    id: "sci-fireflies", title: "How Fireflies Make Light",
    dek: "A firefly's glow is a chemical reaction so efficient that it barely makes any heat.",
    pages: [
      { h: "A lantern in the tail", p: [
        "Fireflies are not flies at all: they are beetles, and there are more than 2,000 kinds. Many of them glow from a light organ, or lantern, near the end of the abdomen.",
        "The glow comes from bioluminescence: light made by a living thing through chemistry." ] },
      { h: "The recipe for light", p: [
        "Inside the lantern's cells is a substance called luciferin and an enzyme called luciferase. When luciferin combines with oxygen, with luciferase speeding the reaction along and the cell's energy molecule, ATP, providing the push, it gives off light.",
        "The names come from the Latin word lucifer, meaning \u201clight-bringer.\u201d" ] },
      { h: "Cold light", p: [
        "A regular incandescent bulb wastes most of its energy as heat. A firefly can't afford that: if its lantern got as hot as a light bulb, the firefly would not survive.",
        "Instead, nearly all the energy in the reaction comes out as light, with very little heat. That's why firefly light is called \u201ccold light.\u201d To flash, a firefly controls how much oxygen reaches the lantern: oxygen in, light on; oxygen cut off, light out." ] },
      { h: "Flashing in code", p: [
        "Each species has its own pattern of flashes, like a signal in code. In one common North American firefly, the male flashes in flight about every five or six seconds, and a female on the ground answers about two seconds later.",
        "Some females are tricksters: they copy another species' answer to lure in males of that species, and eat them. Scientists also borrow firefly chemistry: the gene for luciferase is used in labs to make cells light up." ] }
    ],
    remember: "Fireflies glow when luciferin reacts with oxygen, helped by the enzyme luciferase; almost all the energy becomes light, not heat.",
    qs: [
      { q: "What chemical reaction makes a firefly glow?", a: ["Luciferin reacting with oxygen, helped by luciferase", "Electricity in the firefly's wings", "Sunlight stored during the day"], c: 0, why: "Luciferin combines with oxygen, with the enzyme luciferase and the cell's ATP, and gives off light." },
      { q: "Why is firefly light called \u201ccold light\u201d?", a: ["It only appears on cold nights", "Almost all the energy becomes light, with very little heat", "It is blue"], c: 1, why: "Unlike a hot light bulb, the firefly's reaction turns nearly all its energy into light." },
      { q: "How does a firefly switch its light on and off?", a: ["It closes its eyes", "It flaps its wings faster", "It controls how much oxygen reaches its lantern"], c: 2, why: "Oxygen is needed for the reaction, so letting it in or cutting it off turns the light on and off." }
    ]
  }, {
    id: "sci-fall-leaves", title: "Why Leaves Change Color",
    dek: "The reds and golds of autumn are not added in the fall. Most of them were there all summer.",
    pages: [
      { h: "Green on top", p: [
        "All summer, leaves are packed with chlorophyll, the green pigment that captures sunlight to make food for the tree. A leaf uses up chlorophyll constantly and keeps making more.",
        "There is so much chlorophyll that it hides every other color in the leaf." ] },
      { h: "The calendar in the trees", p: [
        "As fall nights grow longer, trees stop making new chlorophyll and begin breaking down what's left. The main signal is the lengthening night, not the temperature.",
        "As the green fades, it unmasks yellow and orange pigments called carotenoids. They were in the leaf all summer; the same family of pigments makes carrots orange." ] },
      { h: "Reds made new", p: [
        "Reds and purples are different. They come from pigments called anthocyanins, which many trees make fresh in the fall, from sugars trapped in the leaf. Bright sun makes more sugar, and cool nights keep it from draining away.",
        "That's why the best red seasons follow warm, sunny days and cool nights that stay above freezing. The browns of oaks come from tannins, the substances left when the other pigments are gone." ] },
      { h: "Letting go", p: [
        "Meanwhile, a layer of cells forms where each leaf stem joins its twig, slowly sealing it off. When the layer is complete, the leaf falls, and the tree is ready for winter, its scar already healed over.",
        "The tree pulls valuable nutrients back from the leaves before they drop, saving them for next spring's buds." ] }
    ],
    remember: "As nights lengthen, trees break down green chlorophyll, revealing yellow carotenoids; reds are new pigments made from sugars on sunny, cool days.",
    qs: [
      { q: "What makes summer leaves green?", a: ["Chlorophyll", "Tannins", "Anthocyanins"], c: 0, why: "Chlorophyll, which captures sunlight, is so plentiful it hides the leaf's other colors." },
      { q: "Where do the yellows and oranges of fall come from?", a: ["They are made new after the first frost", "Pigments that were in the leaf all summer, hidden by the green", "Dust from the air"], c: 1, why: "Carotenoids are there all along; they show once the chlorophyll breaks down." },
      { q: "What weather brings the brightest red leaves?", a: ["Rainy, cloudy weeks", "An early hard freeze", "Warm, sunny days and cool nights above freezing"], c: 2, why: "Sunny days make sugar, and cool nights keep it in the leaf, where it becomes red anthocyanins." }
    ]
  }],
  hist: [{
    id: "hist-two-noons", title: "The Day of Two Noons",
    dek: "How America's railroads put the whole country on the same clock, one Sunday in 1883.",
    pages: [
      { h: "Every town kept its own time", p: [
        "Before 1883, time in America was local. Each town set its clocks by the sun: noon was the moment the sun stood highest over that town. Because the sun moves across the sky, noon came a little later as you went west.",
        "Boston's clocks ran about twelve minutes ahead of New York's. Travel a few miles east or west and the time changed again. Nobody minded much, until the railroads arrived." ] },
      { h: "A timetable nightmare", p: [
        "By the 1880s, trains crossed the country, and every railroad kept its own time. A big station might have several clocks on the wall, each for a different line, and each showing a different time. Passengers had to work out which clock their train ran on.",
        "Missed connections were the least of it. Two trains on the same track, running on different clocks, could meet head-on." ] },
      { h: "William Allen's plan", p: [
        "The railroads decided to fix it themselves. William F. Allen, the secretary of their General Time Convention and the editor of a railway guide, drew up a plan: divide the continent into a few broad zones, each one hour apart, with every clock in a zone showing the same time.",
        "On October 11, 1883, railroad leaders meeting in Chicago voted for it. The switch was set for noon on Sunday, November 18." ] },
      { h: "Noon, twice", p: [
        "That day, a telegraph signal carried the exact time across the country, and railroad clocks were reset all at once. In the eastern part of each new zone, clocks had already struck noon by local time; they were turned back, and noon struck again. Newspapers called it the Day of Two Noons.",
        "Some people grumbled about railroads changing “God's time.” But most towns soon set their own clocks to railroad time. The zones did not become federal law until the Standard Time Act of 1918, thirty-five years later." ] }
    ],
    remember: "America's time zones were started by the railroads on November 18, 1883, decades before Congress made them law.",
    qs: [
      { q: "Before 1883, how did most American towns set their clocks?", a: ["By a signal from Washington", "By the sun: noon was when it stood highest", "By the nearest railroad"], c: 1, why: "Time was local: each town's noon was when the sun was highest there, so clocks differed from town to town." },
      { q: "Who led the plan for standard time zones?", a: ["William F. Allen of the railroads", "President Chester Arthur", "Thomas Edison"], c: 0, why: "William F. Allen, secretary of the railroads' General Time Convention, drew up the plan the railroads adopted in 1883." },
      { q: "When did time zones become U.S. federal law?", a: ["The same day, in 1883", "In 1900", "In 1918, with the Standard Time Act"], c: 2, why: "The railroads made the switch in 1883; Congress made the zones law with the Standard Time Act of 1918." }
    ]
  }, {
    id: "hist-thanksgiving", title: "The Woman Who Gave Us Thanksgiving",
    dek: "A magazine editor wrote letters for seventeen years until a president said yes.",
    pages: [
      { h: "A holiday with no fixed day", p: [
        "For most of America's early history, Thanksgiving came and went. Presidents now and then declared a day of thanks, and New England states held their own feasts each autumn, but every state picked its own date, and many had none at all.",
        "One woman decided that should change. Her name was Sarah Josepha Hale." ] },
      { h: "The editor who wouldn't stop", p: [
        "Hale was the editor of Godey's Lady's Book, one of the most widely read magazines in America. (She is also remembered for writing the poem \u201cMary Had a Little Lamb.\u201d)",
        "Starting in 1846, she used her magazine to call for one national Thanksgiving Day. She wrote editorials year after year, and she wrote letters to governors, to Congress and to five presidents: Taylor, Fillmore, Pierce, Buchanan and Lincoln." ] },
      { h: "Lincoln says yes", p: [
        "By 1863, the country was at war with itself. In September that year, Hale wrote to President Lincoln once more, asking him to make the last Thursday in November a national day of thanks.",
        "On October 3, 1863, Lincoln issued a proclamation doing exactly that. Secretary of State William Seward wrote the words; Lincoln signed it. From then on, presidents proclaimed Thanksgiving every year." ] },
      { h: "The one-week detour", p: [
        "In 1939, during the Great Depression, November had five Thursdays. President Franklin Roosevelt moved Thanksgiving a week earlier to give stores a longer shopping season before Christmas. Many people objected, and some states refused to follow.",
        "In 1941, Congress settled it for good: Thanksgiving would fall on the fourth Thursday of November. That law is why the date still moves around a little from year to year." ] }
    ],
    remember: "Sarah Josepha Hale campaigned for 17 years until Lincoln proclaimed a national Thanksgiving in 1863; Congress fixed it to the fourth Thursday in 1941.",
    qs: [
      { q: "Who campaigned for years for a national Thanksgiving Day?", a: ["Martha Washington", "Sarah Josepha Hale", "Harriet Beecher Stowe"], c: 1, why: "Sarah Josepha Hale, editor of Godey's Lady's Book, wrote editorials and letters from 1846 until Lincoln acted in 1863." },
      { q: "Which president proclaimed a national Thanksgiving in 1863?", a: ["Abraham Lincoln", "George Washington", "Ulysses S. Grant"], c: 0, why: "Lincoln issued the proclamation on October 3, 1863, setting the last Thursday in November." },
      { q: "Why did Franklin Roosevelt move Thanksgiving in 1939?", a: ["To avoid a war", "To match Canada", "To give stores a longer shopping season before Christmas"], c: 2, why: "During the Depression, he moved it a week earlier to lengthen the Christmas shopping season; in 1941 Congress fixed it to the fourth Thursday." }
    ]
  }, {
    id: "hist-pony-express", title: "The Pony Express: 18 Famous Months",
    dek: "Riders carried mail nearly 2,000 miles in ten days, and then a wire put them out of business.",
    pages: [
      { h: "A country too wide for its mail", p: [
        "By 1860, California had joined the Union and gold-rush towns were booming, but the railroad and the telegraph stopped at St. Joseph, Missouri. Mail to the West Coast went by stagecoach or by ship, and it took weeks.",
        "With war between the states looming, news needed to travel faster." ] },
      { h: "Horse after horse", p: [
        "On April 3, 1860, the Pony Express began. Riders carried mail in relays between St. Joseph and Sacramento, California, a route of nearly 2,000 miles across prairie, desert and mountains.",
        "Riders galloped from station to station, swapping for fresh horses and handing the mail to the next rider, day and night. A letter that once took weeks now crossed in about ten days." ] },
      { h: "Fast, but costly", p: [
        "The service was expensive: at first, $5 for every half ounce of mail. Mostly newspapers and businesses used it. Its fastest run carried President Lincoln's first inaugural address from St. Joseph to Sacramento in 7 days and 17 hours.",
        "Over its life it carried roughly 35,000 letters, but it never made its owners a profit." ] },
      { h: "Beaten by a wire", p: [
        "Even as the riders galloped, crews were stringing a telegraph line across the country. On October 24, 1861, the transcontinental telegraph was finished, and messages could cross the continent in moments.",
        "Two days later, the Pony Express officially ended. It had lasted only about 18 months, yet it became one of the best-known legends of the American West." ] }
    ],
    remember: "The Pony Express carried mail about 2,000 miles in ten days from April 1860 until the transcontinental telegraph replaced it in October 1861.",
    qs: [
      { q: "Between which two cities did the Pony Express run?", a: ["New York and Chicago", "St. Joseph, Missouri, and Sacramento, California", "Boston and San Francisco"], c: 1, why: "Riders relayed mail between St. Joseph, Missouri, and Sacramento, California, nearly 2,000 miles." },
      { q: "About how long did a Pony Express letter take to cross?", a: ["About ten days", "About ten weeks", "About two days"], c: 0, why: "The relays cut the trip to about ten days, compared with weeks by stagecoach or ship." },
      { q: "What put the Pony Express out of business?", a: ["The Civil War", "The first transcontinental railroad", "The transcontinental telegraph, finished in October 1861"], c: 2, why: "Once the telegraph line was completed, messages crossed in moments; the Pony Express ended two days later." }
    ]
  }, {
    id: "hist-molasses-flood", title: "The Great Molasses Flood",
    dek: "On a mild January day in 1919, a wave of molasses swept through a Boston neighborhood.",
    pages: [
      { h: "A giant tank on the waterfront", p: [
        "In Boston's North End stood a steel tank 50 feet tall and 90 feet across, holding molasses, which was used to make industrial alcohol. A few days earlier, a new shipment had filled it nearly to the top.",
        "Neighbors had noticed it groaning, and molasses seeping through its seams." ] },
      { h: "Noon, January 15, 1919", p: [
        "Around 12:30 in the afternoon, the tank burst. About 2.3 million gallons of molasses poured out in a wave reported at as much as 25 feet high, moving at an estimated 35 miles an hour.",
        "It knocked buildings off their foundations, bent the steel supports of an elevated railway and swept away wagons and horses." ] },
      { h: "Stuck fast", p: [
        "Molasses is thick, and on that winter afternoon it grew thicker as it cooled, trapping people and animals in the sticky flood. Rescuers, including sailors from a ship docked nearby, waded in to help.",
        "Twenty-one people died and about 150 were injured. The cleanup took weeks, and people said the neighborhood smelled of molasses for decades." ] },
      { h: "Why it happened", p: [
        "Investigations found the tank had been poorly built and never properly tested; the company had even painted it brown to hide the leaks. A sudden warm spell and the large new shipment added strain.",
        "After years in court, the company was found responsible. The disaster helped bring tougher rules requiring engineers to check and sign off on the safety of such structures." ] }
    ],
    remember: "In 1919, a badly built tank in Boston burst and sent 2.3 million gallons of molasses through the North End, killing 21 people.",
    qs: [
      { q: "Where did the Great Molasses Flood happen?", a: ["Boston's North End", "New Orleans", "Chicago's South Side"], c: 0, why: "A huge storage tank burst on Boston's waterfront in the North End, on January 15, 1919." },
      { q: "About how fast was the wave of molasses estimated to move?", a: ["About 3 miles an hour", "About 35 miles an hour", "About 100 miles an hour"], c: 1, why: "The wave was estimated at 35 miles an hour, far faster than anyone could run." },
      { q: "What was the main cause of the disaster?", a: ["An earthquake", "Lightning", "A poorly built, untested tank, strained by warm weather and a full load"], c: 2, why: "The tank was badly built and never properly tested; a warm spell and a new shipment added strain." }
    ]
  }],
  words: [{
    id: "words-ok", title: "OK: The Word That Started as a Joke",
    dek: "One of the most widely used words on Earth began as a newspaper gag in 1839 Boston.",
    pages: [
      { h: "A craze for silly initials", p: [
        "In the late 1830s, Boston newspapers had a running joke. Writers shortened phrases to initials, often misspelling them on purpose for extra fun. “All right” became O.W., for “oll wright.” Readers were expected to decode them.",
        "On March 23, 1839, Charles Gordon Greene, editor of the Boston Morning Post, used a new one in a playful article: O.K., for “oll korrect,” a joke spelling of “all correct.”" ] },
      { h: "A president gives it a push", p: [
        "Most jokes like that faded within months. OK might have too, but for an election.",
        "In 1840, President Martin Van Buren ran for a second term. He came from Kinderhook, New York, and was nicknamed “Old Kinderhook.” His supporters formed O.K. Clubs. Now OK meant two things at once: Old Kinderhook, and all correct. The slogan spread across the country with the campaign." ] },
      { h: "A mystery for a century", p: [
        "Van Buren lost the election, but OK stayed. Over the years people offered many stories for where it came from. One said it came from “Old Kinderhook” alone; Woodrow Wilson believed it came from a Choctaw word, which he wrote as “okeh.”",
        "The real answer came in the 1960s, when Allen Walker Read, a professor at Columbia University, searched old newspapers line by line. In a series of articles in 1963 and 1964, he traced OK back to that 1839 joke in the Boston Morning Post." ] },
      { h: "Why it lasted", p: [
        "OK is short, easy to say in almost any language, and hard to mishear. It slipped into everyday speech, then onto telegraphs, and today it is used around the world. Not bad for a newspaper gag." ] }
    ],
    remember: "OK began as “oll korrect,” a joke in the Boston Morning Post on March 23, 1839, and spread through Van Buren's 1840 campaign.",
    qs: [
      { q: "What did O.K. first stand for?", a: ["Old Kinderhook", "“Oll korrect,” a joke spelling of “all correct”", "Only kidding"], c: 1, why: "The Boston Morning Post used O.K. for “oll korrect” on March 23, 1839, part of a fad for misspelled initials." },
      { q: "How did Martin Van Buren help OK spread?", a: ["His nickname, Old Kinderhook, gave his 1840 campaign O.K. Clubs", "He signed a law about it", "He wrote it on every letter"], c: 0, why: "Van Buren was “Old Kinderhook”; his 1840 supporters formed O.K. Clubs, and the word spread with the campaign." },
      { q: "Who finally traced OK to its true beginning?", a: ["Noah Webster", "Woodrow Wilson", "Allen Walker Read, in the 1960s"], c: 2, why: "Professor Allen Walker Read of Columbia University traced it in articles published in 1963 and 1964." }
    ]
  }, {
    id: "words-eponyms", title: "Words That Were Once People",
    dek: "Some everyday words began as somebody's name. A few of those somebodies might not be pleased.",
    pages: [
      { h: "Names that became words", p: [
        "A word made from a person's name is called an eponym. English is full of them, and most of the time we never notice the person hiding inside.",
        "Here are a few of the best stories." ] },
      { h: "Boycott", p: [
        "In 1880, in County Mayo, Ireland, Captain Charles Boycott managed farmland for an absentee landlord. When tenants asked for lower rents, he refused and moved to evict them.",
        "The Irish Land League urged everyone nearby to have nothing to do with him: no workers for his harvest, no service in the shops, no letters delivered. Within weeks, newspapers were using his name as a verb. To boycott still means to refuse to deal with someone in protest." ] },
      { h: "Sandwich", p: [
        "John Montagu, the 4th Earl of Sandwich, was an English statesman of the 1700s. The popular story says he asked for meat tucked between slices of bread so he could eat without leaving a long card game. Others say he was simply working late at his desk. Either way, people began asking for food \u201cthe same as Sandwich,\u201d and the name stuck.",
        "People had surely eaten bread with fillings long before; the Earl just lent it a name." ] },
      { h: "Saxophone, leotard and silhouette", p: [
        "Adolphe Sax, a Belgian instrument maker, invented the saxophone in the 1840s. Jules L\u00e9otard, a French acrobat who performed the first flying trapeze act in 1859, gave his name to the snug one-piece outfit he wore.",
        "Silhouette comes from \u00c9tienne de Silhouette, a French finance minister in 1759 who was famous for cutting costs. The most common explanation is that cheap black-paper outline portraits were mocked as being \u201c\u00e0 la Silhouette\u201d: done on the cheap." ] }
    ],
    remember: "An eponym is a word made from a person's name: boycott, sandwich, saxophone, leotard and silhouette all began as people.",
    qs: [
      { q: "What is an eponym?", a: ["A word that sounds like its meaning", "A word made from a person's name", "A word spelled the same backward"], c: 1, why: "An eponym comes from someone's name, like boycott from Charles Boycott." },
      { q: "Where did the word boycott come from?", a: ["An Irish land agent shunned by his neighbors in 1880", "A sailor who refused to board a ship", "A French king"], c: 0, why: "Charles Boycott refused to lower rents in 1880, and his neighbors refused to deal with him; his name became the verb." },
      { q: "Which word comes from a French acrobat?", a: ["Saxophone", "Silhouette", "Leotard"], c: 2, why: "Jules L\u00e9otard, who performed the first flying trapeze act in 1859, gave his name to the leotard." }
    ]
  }, {
    id: "words-nice", title: "When \u201cNice\u201d Meant Foolish",
    dek: "Words drift over the centuries. Some have turned completely around.",
    pages: [
      { h: "Not a compliment", p: [
        "If you had called someone nice about 700 years ago, they might have been insulted. When nice came into English, around the 1300s, it meant foolish or ignorant.",
        "It came through French from the Latin word nescius, meaning \u201cnot knowing.\u201d That makes nice a distant cousin of science, from the Latin for knowing." ] },
      { h: "A long, wandering road", p: [
        "Over the centuries, nice kept shifting. At different times it meant shy, then fussy, then delicate and precise. That precise sense survives in phrases like \u201ca nice distinction.\u201d",
        "Only in the 1700s did nice settle into its familiar meaning: pleasant, kind and agreeable." ] },
      { h: "Silly was once blessed", p: [
        "Nice is not alone. Silly comes from an Old English word meaning happy or blessed. It slid to innocent, then to pitiable, then to simple, and finally to foolish.",
        "Linguists call this drift semantic change, and it happens all the time, slowly enough that no one notices while it's underway." ] },
      { h: "Awful and awesome", p: [
        "Awful and awesome were once near-twins: both described something that filled you with awe, a mix of wonder and fear. Awful slid toward \u201cvery bad,\u201d while awesome drifted toward \u201cvery good.\u201d",
        "Terrible and terrific made the same split. Both once meant \u201ccausing terror,\u201d and today one is bad and the other is wonderful." ] }
    ],
    remember: "Nice once meant foolish (from Latin nescius, \u201cnot knowing\u201d); words like silly and awful have changed just as much.",
    qs: [
      { q: "What did nice mean when it first came into English?", a: ["Kind", "Foolish or ignorant", "Expensive"], c: 1, why: "Around the 1300s, nice meant foolish or ignorant, from the Latin nescius, \u201cnot knowing.\u201d" },
      { q: "What did silly originally mean?", a: ["Happy or blessed", "Clumsy", "Loud"], c: 0, why: "Silly comes from an Old English word meaning happy or blessed, then slowly shifted toward foolish." },
      { q: "Awful and awesome once both meant\u2026", a: ["Very small", "Very new", "Filling you with awe"], c: 2, why: "Both described something that inspired awe, wonder mixed with fear, before they split apart." }
    ]
  }, {
    id: "words-goodbye", title: "Goodbye, Daisy and the Myth of \u201cNews\u201d",
    dek: "Some words hide whole phrases inside them. One famous explanation is simply made up.",
    pages: [
      { h: "Goodbye was a blessing", p: [
        "When people parted in the 1300s, they often said \u201cGod be with you.\u201d Said thousands of times a day, the phrase got squeezed. By the 1570s, writers were spelling it \u201cgodbwye.\u201d",
        "Then God became good, probably borrowed from greetings like \u201cgood day\u201d and \u201cgood night.\u201d So every goodbye carries a blessing hidden inside it." ] },
      { h: "Daisy, the day's eye", p: [
        "Daisy comes from the Old English for \u201cday's eye.\u201d The flower opens its petals in the morning to show its yellow center, and closes them in the evening, like an eye opening and shutting with the day.",
        "Many words are worn-down phrases like this; we just stop hearing the pieces." ] },
      { h: "The myth of news", p: [
        "You may have heard that news stands for North, East, West and South, because news comes from every direction. It's a charming story, and it isn't true.",
        "News is simply the plural of new: \u201cnew things.\u201d English speakers were using \u201cnewes\u201d this way in the 1400s, long before anyone thought of the compass explanation." ] },
      { h: "Why the myths appeal", p: [
        "Explanations like the news story are called folk etymologies: tidy stories invented after the fact to explain a word. They spread because they're neat and easy to remember.",
        "Real word histories are usually messier and slower, built from many small changes across centuries." ] }
    ],
    remember: "Goodbye is a squeezed \u201cGod be with you,\u201d daisy is the \u201cday's eye,\u201d and news is just the plural of new, not North-East-West-South.",
    qs: [
      { q: "What phrase did goodbye come from?", a: ["\u201cGood journey\u201d", "\u201cGod be with you\u201d", "\u201cGo by\u201d"], c: 1, why: "\u201cGod be with you\u201d was squeezed into \u201cgodbwye,\u201d and God became good, like \u201cgood day.\u201d" },
      { q: "Why is the daisy called the \u201cday's eye\u201d?", a: ["It opens in the morning and closes at night", "It only grows in sunny places", "It is the first flower of spring"], c: 0, why: "Its petals open in the morning and close at evening, like an eye with the day." },
      { q: "Where does the word news really come from?", a: ["North, East, West, South", "A Latin word for paper", "The plural of new: new things"], c: 2, why: "News simply means new things; the compass explanation is a folk etymology." }
    ]
  }],
  money: [{
    id: "money-rule-72", title: "The Rule of 72",
    dek: "One easy division tells you how fast money doubles, whether it's working for you or against you.",
    pages: [
      { h: "Interest on interest", p: [
        "When you save money, the bank pays you interest: a small percentage each year. Simple interest is paid only on the money you first put in. Compound interest is paid on that money and on all the interest it has already earned.",
        "Put $1,000 away at 6% simple interest and you earn $60 every year, forever. With compound interest, the second year pays 6% of $1,060, the third year 6% of a little more, and so on. The growth keeps speeding up." ] },
      { h: "The shortcut", p: [
        "How long until your money doubles? Divide 72 by the interest rate. That's the Rule of 72.",
        "At 6%, 72 ÷ 6 = 12, so $1,000 grows to about $2,000 in twelve years. At 8%, it doubles in about nine. At 3%, about twenty-four. The rule is an estimate, but for everyday rates it is remarkably close: $1,000 at 6% for twelve years really does come to $2,012." ] },
      { h: "Time does the heavy lifting", p: [
        "Doubling keeps doubling. At 6%, $1,000 becomes about $2,000 in 12 years, $4,000 in 24 and $8,000 in 36. With simple interest, the same 36 years would give you $3,160.",
        "That's why starting early matters more than starting big. The last doubling is worth more than all the earlier ones put together." ] },
      { h: "It works against you, too", p: [
        "The same math runs on debt. A credit card balance at 24% interest, left unpaid, roughly doubles in about three years (72 ÷ 24 = 3).",
        "You may have seen compound interest called “the eighth wonder of the world,” a line often credited to Albert Einstein. There's no record he ever said it. The math, though, is real." ] }
    ],
    remember: "Divide 72 by the interest rate to see roughly how many years it takes money (or debt) to double.",
    qs: [
      { q: "At 8% compound interest, about how long does money take to double?", a: ["About 9 years", "About 12 years", "About 16 years"], c: 0, why: "72 ÷ 8 = 9. The Rule of 72 says about nine years." },
      { q: "What makes compound interest different from simple interest?", a: ["It is always a higher rate", "You also earn interest on the interest already earned", "It is paid only once"], c: 1, why: "Compound interest is paid on your money plus the interest it has already earned, so growth speeds up." },
      { q: "A card balance at 24% is left unpaid. Roughly when has it doubled?", a: ["After 1 year", "After 10 years", "After about 3 years"], c: 2, why: "72 ÷ 24 = 3: the rule works on debt just as it does on savings." }
    ]
  }, {
    id: "money-credit-score", title: "What's in a Credit Score",
    dek: "A three-digit number shapes the rates you pay. Here's what goes into it.",
    pages: [
      { h: "A grade for borrowing", p: [
        "When you apply for a loan or a credit card, the lender wants to know how likely you are to pay it back. A credit score is their quick answer: a number built from your credit report.",
        "The most widely used is the FICO Score, which runs from 300 to 850. Higher is better, and a better score usually means a lower interest rate." ] },
      { h: "The five ingredients", p: [
        "FICO groups what it looks at into five parts. Payment history counts the most, about 35 percent: do you pay on time? Amounts owed come next, about 30 percent: how much of your available credit are you using?",
        "Length of credit history is about 15 percent. New credit, such as recently opened accounts, is about 10 percent, and your mix of credit, such as cards plus a car loan, is the last 10 percent." ] },
      { h: "What helps most", p: [
        "Paying every bill on time is the single biggest thing you can do. A late payment can stay on your credit report for years.",
        "The next is keeping your card balances low compared with your limits. Using a small share of your available credit looks better than running cards close to the top. Keeping old accounts open can help too, because it lengthens your history." ] },
      { h: "Myths worth dropping", p: [
        "Checking your own score does not lower it. Lenders' checks when you apply for credit can lower it a little, for a while; your own look never does.",
        "And you don't need to carry a balance to build credit. Paying the full balance every month builds your history just as well, without paying a cent of interest." ] }
    ],
    remember: "On-time payments (about 35 percent) and low balances (about 30 percent) matter most in a FICO Score, which runs from 300 to 850.",
    qs: [
      { q: "Which counts the most in a FICO Score?", a: ["Payment history", "Your income", "Your credit mix"], c: 0, why: "Payment history is about 35 percent of a FICO Score, the largest single part." },
      { q: "What is the range of a FICO Score?", a: ["0 to 100", "300 to 850", "1 to 1,000"], c: 1, why: "FICO Scores run from 300 to 850; higher is better." },
      { q: "Does checking your own credit score lower it?", a: ["Yes, by a few points each time", "Only if you check it monthly", "No, your own check never lowers it"], c: 2, why: "Looking at your own score never hurts it. Only some lender checks, when you apply for credit, can lower it a little for a while." }
    ]
  }, {
    id: "money-50-30-20", title: "The 50/30/20 Budget",
    dek: "A budget with just three buckets, and the one rule that makes it work.",
    pages: [
      { h: "Budgets that don't last", p: [
        "Many people try a budget with dozens of categories and give up within weeks. Tracking every coffee and every bus fare is tiring.",
        "The 50/30/20 plan keeps it simple: three buckets for your take-home pay, the money you actually receive after taxes." ] },
      { h: "The three buckets", p: [
        "Fifty percent goes to needs: housing, utilities, groceries, insurance, transportation and minimum loan payments, the things you must pay.",
        "Thirty percent goes to wants: dining out, trips, hobbies, streaming, the extras that make life fun. The last twenty percent goes to savings and to paying down debt faster." ] },
      { h: "An example", p: [
        "Say your take-home pay is $4,000 a month. Under 50/30/20, about $2,000 covers needs, $1,200 is for wants, and $800 goes to savings and extra debt payments.",
        "The idea was popularized by Elizabeth Warren and her daughter, Amelia Warren Tyagi, in their 2005 book All Your Worth." ] },
      { h: "Bend it to fit", p: [
        "In places where rent is high, needs can take far more than half. That's fine: the numbers are a guide, not a law. Some people use 60/20/20, or 50/20/30.",
        "What matters most is the habit underneath it: decide in advance where the money goes, and pay your savings first rather than saving whatever is left over." ] }
    ],
    remember: "50/30/20: about half of take-home pay for needs, 30 percent for wants and 20 percent for savings and paying down debt.",
    qs: [
      { q: "In 50/30/20, what does the 20 percent go to?", a: ["Savings and paying down debt", "Rent", "Groceries"], c: 0, why: "Twenty percent goes to savings and to paying debt down faster." },
      { q: "With $4,000 take-home pay, about how much goes to wants?", a: ["$2,000", "$1,200", "$800"], c: 1, why: "Thirty percent of $4,000 is $1,200 for wants." },
      { q: "Who popularized the 50/30/20 rule?", a: ["Benjamin Franklin", "Warren Buffett", "Elizabeth Warren and Amelia Warren Tyagi"], c: 2, why: "They described it in their 2005 book All Your Worth." }
    ]
  }, {
    id: "money-99-cents", title: "Why Prices End in 99",
    dek: "A price of $4.99 instead of $5.00 saves you one cent, and changes how the price feels.",
    pages: [
      { h: "The one-cent difference", p: [
        "Look around any store and you'll see $9.99, $19.99, $499. Prices ending in 9 or 99 are everywhere. Retailers call it charm pricing.",
        "One cent less is almost nothing. So why do sellers bother?" ] },
      { h: "The left-digit effect", p: [
        "We read numbers from left to right, and the first digit grabs our attention. In 2005, researchers named this the left-digit effect: $4.99 feels closer to $4 than to $5, even though it's only a penny shy of five dollars.",
        "Studies of real shopping often find that a price just under a round number can sell noticeably better, though results vary from store to store." ] },
      { h: "A story that may not be true", p: [
        "You may have heard that odd prices began as a way to stop cashiers from stealing: an odd price forced them to open the register to make change, recording each sale.",
        "It's a popular story, but historians haven't found good evidence that this is how charm pricing began." ] },
      { h: "Shop with the full number", p: [
        "Knowing about the left-digit effect helps you shop smarter: round prices up in your head. $19.99 is $20, and $299 is $300.",
        "Some high-end stores do the opposite, using round prices like $200, because round numbers can feel more confident and upscale. And with the U.S. Mint no longer making new pennies since 2025, some stores now round cash totals at the register." ] }
    ],
    remember: "Prices ending in 99 work because of the left-digit effect: the first digit shapes how big a price feels, so round prices up in your head.",
    qs: [
      { q: "What is the left-digit effect?", a: ["The first digit of a price shapes how big it feels", "Prices on the left side of a shelf sell better", "Left-handed shoppers spend more"], c: 0, why: "We focus on the leftmost digit, so $4.99 feels closer to $4 than to $5." },
      { q: "Is the cashier-theft story proven as the origin of 99 pricing?", a: ["Yes, it's in every history book", "No, it's popular but lacks good evidence", "Yes, it was a law"], c: 1, why: "It's a common story, but historians haven't found good evidence for it." },
      { q: "What's a smart habit when you see $19.99?", a: ["Read it as $19", "Ignore the price", "Round it up to $20 in your head"], c: 2, why: "Rounding up in your head cancels the left-digit effect." }
    ]
  }],
  art: [{
    id: "art-a440", title: "Why Orchestras Tune to 440",
    dek: "The note every orchestra tunes to was settled at a meeting in London in 1939.",
    pages: [
      { h: "The oboe's A", p: [
        "Before a concert, the orchestra falls quiet, and the oboe plays a single long note. One by one, the other instruments tune to it. The note is an A, and in most of the world it vibrates 440 times a second: 440 hertz.",
        "The oboe usually gives the note because its sound is clear, steady and hard to bend." ] },
      { h: "Centuries of wandering pitch", p: [
        "For most of history, there was no standard. An A in one city could be noticeably higher or lower than an A in the next, and church organs, town bands and orchestras each had their own.",
        "During the 1800s, orchestras crept higher, because a higher pitch sounds brighter and more brilliant. Singers suffered: they had to strain to reach notes their music was never written to need." ] },
      { h: "France sets a rule", p: [
        "In 1859, France passed a law setting the A at 435 hertz, called the diapason normal. Much of Europe adopted it. But it didn't settle the question everywhere, and pitch kept wandering in other countries." ] },
      { h: "London, 1939", p: [
        "In May 1939, delegates from several European countries met at Broadcasting House in London, the BBC's headquarters, and agreed on A = 440. Radio helped: broadcasts and recordings needed everyone to match.",
        "The International Organization for Standardization recommended 440 in 1955 and confirmed it in 1975 as the standard called ISO 16. Some orchestras still tune a touch higher, to 442 or 443, for a little extra sparkle." ] }
    ],
    remember: "The standard A is 440 hertz, agreed in London in 1939 and confirmed as ISO 16 in 1975.",
    qs: [
      { q: "Which instrument usually gives the orchestra its tuning A?", a: ["The oboe", "The tuba", "The first violin"], c: 0, why: "The oboe's clear, steady tone makes it the usual source of the tuning A." },
      { q: "What did France's 1859 law set the A at?", a: ["440 hertz", "435 hertz", "452 hertz"], c: 1, why: "France's diapason normal of 1859 set the A at 435 hertz." },
      { q: "Where was A = 440 agreed in 1939?", a: ["Vienna", "Paris", "London"], c: 2, why: "Delegates met at Broadcasting House in London in May 1939 and agreed on 440." }
    ]
  }, {
    id: "art-mona-lisa", title: "The Theft That Made the Mona Lisa Famous",
    dek: "In 1911, a little-known portrait vanished from the Louvre. When it came back, the whole world knew its face.",
    pages: [
      { h: "Before it was famous", p: [
        "Leonardo da Vinci began the Mona Lisa around 1503. For centuries it was admired by artists and experts, but it was not the household name it is today. In the Louvre in Paris, it hung among many other masterpieces.",
        "That changed on a quiet Monday in August 1911." ] },
      { h: "An empty wall", p: [
        "On the morning of August 21, 1911, Vincenzo Peruggia, an Italian handyman who had worked at the Louvre, slipped the painting off the wall, took it out of its frame and walked out with it under his clothing. He had even helped build the painting's protective glass case.",
        "Staff did not notice for more than a day; they assumed it had been taken away to be photographed. When they realized it was gone, the Louvre closed, and newspapers around the world ran the story." ] },
      { h: "The world comes to look", p: [
        "Crowds lined up at the Louvre to stare at the empty space where the painting had hung. Its face appeared in newspapers, on postcards and in cartoons across Europe and America.",
        "The police even questioned the poet Guillaume Apollinaire, and the young painter Pablo Picasso was brought in for questioning too. Both were cleared." ] },
      { h: "Found in Florence", p: [
        "For more than two years, the painting sat hidden in a trunk in Peruggia's room. In December 1913, he took it to Florence and offered it to an art dealer, who called the authorities. Peruggia was arrested, and he said he had wanted to return the painting to Italy.",
        "The Mona Lisa was shown in Italy, then went home to the Louvre in January 1914, by then the most famous painting in the world." ] }
    ],
    remember: "The Mona Lisa was stolen from the Louvre in 1911; the worldwide headlines over the next two years made it the most famous painting on Earth.",
    qs: [
      { q: "Who stole the Mona Lisa in 1911?", a: ["A gang of art collectors", "Vincenzo Peruggia, a handyman who had worked at the Louvre", "Pablo Picasso"], c: 1, why: "Vincenzo Peruggia, an Italian handyman who had worked at the Louvre, walked out with it on August 21, 1911." },
      { q: "Where was the painting found in 1913?", a: ["In Florence, Italy", "In New York", "In a Paris cellar"], c: 0, why: "Peruggia offered it to an art dealer in Florence in December 1913, and he was caught." },
      { q: "Why did the theft make the Mona Lisa so famous?", a: ["It was repainted afterward", "It was sold for a record price", "Newspapers worldwide covered the story for two years"], c: 2, why: "The theft and the long search put the painting's face in newspapers and postcards around the world." }
    ]
  }, {
    id: "art-happy-birthday", title: "The Story of \u201cHappy Birthday\u201d",
    dek: "The world's best-known song began as a classroom greeting, and spent decades in a copyright fight.",
    pages: [
      { h: "A song for a kindergarten", p: [
        "In the 1890s, in Louisville, Kentucky, Patty Hill ran a kindergarten, and her sister Mildred was a pianist and composer. They wanted songs that small children could sing easily.",
        "One of their songs, \u201cGood Morning to All,\u201d was published in a songbook in 1893. Its tune is the one we now sing at every birthday." ] },
      { h: "New words, same tune", p: [
        "Over the following years, people began singing the same simple melody with birthday words instead. No one knows exactly who first did it.",
        "By the early 1900s the birthday version had spread across the country, and in time across the world, sung in many languages." ] },
      { h: "Who owned it?", p: [
        "In the 1930s, a music publisher registered a copyright on a version of the song, and for decades its owners collected fees whenever it was used in films, on television or on stage. That's why restaurants and movies often used their own birthday songs instead.",
        "Historians have even debated whether the Hill sisters wrote the tune themselves or adapted it from earlier songs of the day." ] },
      { h: "Free for everyone", p: [
        "In 2015, a federal judge ruled that the company claiming the copyright didn't actually hold a valid one for the lyrics. In 2016, the company agreed to pay back $14 million in fees.",
        "Today the song is in the public domain in the United States, free for anyone to sing, record or use." ] }
    ],
    remember: "\u201cHappy Birthday\u201d uses the tune of \u201cGood Morning to All\u201d (1893), credited to the Hill sisters; a 2015 ruling made it free for all to use.",
    qs: [
      { q: "What song shares the tune of \u201cHappy Birthday\u201d?", a: ["\u201cGood Morning to All\u201d", "\u201cTwinkle, Twinkle, Little Star\u201d", "\u201cYankee Doodle\u201d"], c: 0, why: "The Hill sisters' classroom song \u201cGood Morning to All\u201d was published in 1893 with the same tune." },
      { q: "Who were the Hill sisters?", a: ["Opera singers from New York", "A Kentucky kindergarten teacher and her musician sister", "Two Broadway producers"], c: 1, why: "Patty Hill ran a kindergarten in Louisville; her sister Mildred was a pianist and composer." },
      { q: "What happened to the song's copyright claim in 2015?", a: ["It was extended for 50 years", "It was sold to a movie studio", "A judge ruled it wasn't valid, opening the song to everyone"], c: 2, why: "A federal judge ruled the claim invalid in 2015, and the song is now in the public domain in the U.S." }
    ]
  }, {
    id: "art-ultramarine", title: "Ultramarine: The Blue Worth Its Weight in Gold",
    dek: "For centuries, the finest blue paint came from a stone mined in the mountains of Afghanistan.",
    pages: [
      { h: "A blue from beyond the sea", p: [
        "Ultramarine was made by grinding lapis lazuli, a deep blue stone. For centuries, the main source was a remote valley in the mountains of what is now northeastern Afghanistan.",
        "The stone traveled thousands of miles to Europe, and the name tells the story: ultramarine comes from the Latin for \u201cbeyond the sea.\u201d" ] },
      { h: "Harder than it looks", p: [
        "Simply grinding the stone makes a dull grayish powder. To get the brilliant blue, painters' workshops kneaded the powder into a dough of wax, resin and oil, then washed out the blue particles again and again. It took days.",
        "Because of the cost of the stone and the labor, the finest ultramarine could cost as much as gold." ] },
      { h: "Saved for the most important things", p: [
        "Renaissance painters used it sparingly. It was often reserved for the robes of the Virgin Mary, where its cost honored the most important figure in the picture.",
        "Some patrons even wrote into their contracts exactly how much ultramarine a painter had to use." ] },
      { h: "A prize for a cheaper blue", p: [
        "In 1824, a French society offered a prize of 6,000 francs to anyone who could make ultramarine cheaply. The French chemist Jean-Baptiste Guimet found a way and was awarded the prize in 1828.",
        "Synthetic ultramarine, called French ultramarine, made the deep blue affordable. Today a tube of it costs about the same as any other paint." ] }
    ],
    remember: "Ultramarine was ground from Afghan lapis lazuli and cost as much as gold, until a synthetic version won a French prize in 1828.",
    qs: [
      { q: "What was natural ultramarine made from?", a: ["Crushed blueberries", "Lapis lazuli, a blue stone", "Ocean water"], c: 1, why: "It was ground from lapis lazuli, a deep blue stone, then carefully purified." },
      { q: "What does the name ultramarine mean?", a: ["Beyond the sea", "Very blue", "Royal color"], c: 0, why: "It comes from the Latin for \u201cbeyond the sea,\u201d since the stone came from far away." },
      { q: "What made ultramarine affordable?", a: ["A new mine in France", "Mixing it with chalk", "A synthetic version, after a French prize won in 1828"], c: 2, why: "Jean-Baptiste Guimet won the prize for a cheap synthetic ultramarine, and the price fell." }
    ]
  }],
  nature: [{
    id: "nature-tides", title: "What Makes the Tides",
    dek: "Twice a day the ocean rises and falls, pulled by the Moon, helped by the Sun.",
    pages: [
      { h: "The Moon's pull", p: [
        "The Moon's gravity tugs on the whole Earth, but not evenly. The ocean on the side facing the Moon is pulled a little more than Earth itself, so the water there bulges toward the Moon.",
        "On the far side, the ocean is pulled a little less than Earth, so it lags behind and makes a second bulge. That is why most coasts get two high tides a day, not one." ] },
      { h: "Why the times keep moving", p: [
        "Earth turns through both bulges every day. But while it turns, the Moon moves along its orbit, so Earth needs about 24 hours and 50 minutes to face the Moon again.",
        "That makes high tides arrive about 12 hours and 25 minutes apart, and nearly an hour later each day. Check a tide table for a week and you'll see them slide." ] },
      { h: "Spring tides and neap tides", p: [
        "The Sun pulls on the ocean too, a little less than half as strongly as the Moon. At new moon and full moon, the Sun and Moon line up, their pulls add together, and the tides are highest and lowest: spring tides. The name has nothing to do with the season; the water “springs” up.",
        "At the half moons, the Sun pulls at a right angle to the Moon, partly canceling it. Those smaller tides are neap tides." ] },
      { h: "The world's biggest tides", p: [
        "Out in the open ocean, the tide rises and falls only about three feet. Coastlines change that. In Canada's Bay of Fundy, the long, narrowing bay funnels the water so well that high tide can stand about 53 feet above low tide: taller than a four-story building.",
        "In the United States, the biggest tides are near Anchorage, Alaska, where they average around 30 feet." ] }
    ],
    remember: "Two bulges of water, pulled by the Moon (and the Sun), give most coasts two high tides about 12 hours and 25 minutes apart.",
    qs: [
      { q: "Why do most coasts get two high tides a day?", a: ["The ocean bulges on the Moon's side and on the far side too", "The Sun and Moon take turns", "Earth turns twice a day"], c: 0, why: "There are two bulges: one toward the Moon and one on the far side. Earth turns through both every day." },
      { q: "When do spring tides happen?", a: ["Only in springtime", "At new moon and full moon, when the Sun and Moon line up", "At the half moons"], c: 1, why: "At new and full moon the Sun's and Moon's pulls add together, making the biggest tides. The name means “springing up.”" },
      { q: "Where are the biggest tides in the world?", a: ["Hawaii", "The Gulf of Mexico", "Canada's Bay of Fundy"], c: 2, why: "The Bay of Fundy's funnel shape builds tides of about 53 feet." }
    ]
  }, {
    id: "nature-monarchs", title: "The Monarchs' Long Flight",
    dek: "Each fall, butterflies that weigh less than a paper clip fly up to 3,000 miles to a forest they have never seen.",
    pages: [
      { h: "A journey across a continent", p: [
        "Every autumn, monarch butterflies from the eastern United States and Canada head south. They fly as far as 3,000 miles to a few mountains in central Mexico, where they spend the winter.",
        "No other butterfly makes such a long round trip every year, and no single monarch makes the whole round trip itself." ] },
      { h: "The super generation", p: [
        "A summer monarch lives only a few weeks. It takes several generations, one after another, to move north across the continent in spring and summer.",
        "The last generation hatched in late summer is different. These butterflies can live up to eight months, about eight times longer than their parents. They are the ones that make the long flight south, ride out the winter, and start the trip north again in spring." ] },
      { h: "A winter in the fir forest", p: [
        "In Mexico, the monarchs gather high in the mountains, around 10,000 feet up, in forests of oyamel fir trees. Millions of them cluster on the branches, so thickly that the trees look orange.",
        "The cool mountain air lets them rest without using up their stored fat, and the forest shelters them from cold and rain." ] },
      { h: "How do they know the way?", p: [
        "These butterflies have never been to Mexico, yet they find the same forests their great-great-grandparents left. Scientists have found that monarchs steer by the sun, using an internal clock to account for the sun's movement across the sky.",
        "Along the way they ride warm rising air and drink from fall flowers. Their caterpillars eat only milkweed, which is why planting milkweed helps them." ] }
    ],
    remember: "A special long-lived generation of monarchs flies up to 3,000 miles to winter in Mexico's fir forests, steering by the sun.",
    qs: [
      { q: "How far can a monarch fly on its fall migration?", a: ["About 30 miles", "Up to 3,000 miles", "Around the world"], c: 1, why: "Eastern monarchs can fly up to 3,000 miles to their winter forests in central Mexico." },
      { q: "What is special about the super generation?", a: ["It lives up to eight months, long enough to make the trip", "It never eats", "It is bigger and blue"], c: 0, why: "Most monarchs live a few weeks; the late-summer generation lives up to eight months and makes the long flight." },
      { q: "What is the only food monarch caterpillars eat?", a: ["Oak leaves", "Clover", "Milkweed"], c: 2, why: "Monarch caterpillars eat only milkweed, so milkweed in gardens and fields helps the butterflies." }
    ]
  }, {
    id: "nature-great-lakes", title: "The Great Lakes: Inland Seas",
    dek: "Five lakes on the U.S.-Canada border hold about a fifth of all the fresh surface water on Earth.",
    pages: [
      { h: "Five lakes, one system", p: [
        "Superior, Michigan, Huron, Erie and Ontario are linked by rivers and straits into one great chain that drains to the Atlantic through the St. Lawrence River.",
        "They were carved by glaciers during the last ice age and filled with meltwater as the ice retreated." ] },
      { h: "An astonishing amount of water", p: [
        "Together the Great Lakes hold about 6 quadrillion gallons of fresh water: roughly 21 percent of all the fresh surface water on Earth, and about 84 percent of North America's.",
        "Spread across the lower 48 states, that water would stand nearly 10 feet deep." ] },
      { h: "Two lakes that are really one", p: [
        "Lake Michigan and Lake Huron sit at the same water level and are joined by the wide, deep Straits of Mackinac. Scientists often treat them as a single lake, Michigan-Huron.",
        "Lake Michigan is also the only one of the five that lies entirely within the United States." ] },
      { h: "Superior's slow water", p: [
        "Lake Superior is the largest and deepest, holding about half of all the water in the Great Lakes. It is so big that a drop of water entering it stays, on average, nearly 200 years before it flows out.",
        "Lake Erie, the shallowest, replaces its water in less than three years. The lakes are close to the surface for tens of millions of people, who drink from them every day." ] }
    ],
    remember: "The Great Lakes hold about 21 percent of Earth's fresh surface water; Michigan and Huron are really one lake, and Superior holds about half the water.",
    qs: [
      { q: "About how much of Earth's fresh surface water is in the Great Lakes?", a: ["About 2 percent", "About 21 percent", "About 80 percent"], c: 1, why: "The Great Lakes hold roughly 21 percent of the world's fresh surface water." },
      { q: "Which two Great Lakes are really one connected lake?", a: ["Michigan and Huron", "Erie and Ontario", "Superior and Erie"], c: 0, why: "Michigan and Huron share the same water level, joined by the deep Straits of Mackinac." },
      { q: "Which Great Lake holds the most water?", a: ["Lake Erie", "Lake Ontario", "Lake Superior"], c: 2, why: "Lake Superior, the largest and deepest, holds about half the water in the Great Lakes." }
    ]
  }, {
    id: "nature-old-faithful", title: "Old Faithful's Schedule",
    dek: "America's most famous geyser doesn't go off every hour, but rangers can still predict it.",
    pages: [
      { h: "Named for keeping time", p: [
        "In September 1870, an expedition exploring the Yellowstone region watched a geyser erupt again and again at regular intervals. They named it Old Faithful.",
        "It was the first geyser in the area to be named, and two years later, in 1872, Yellowstone became the world's first national park." ] },
      { h: "How a geyser works", p: [
        "Deep under Yellowstone lies hot rock. Rain and snowmelt seep down through cracks and collect in underground chambers, where the rock heats the water far above its normal boiling point; the weight of the water above keeps it from boiling.",
        "When a little water finally flashes to steam, it pushes water out the top, the pressure drops, and much of the rest boils at once. Out it comes." ] },
      { h: "Not every hour", p: [
        "A common belief says Old Faithful erupts every hour on the hour. It never has. Today the gap between eruptions is usually about 60 to 110 minutes, around an hour and a half on average.",
        "Each eruption lasts 1\u00bd to 5 minutes, shooting 3,700 to 8,400 gallons of boiling water as high as about 180 feet." ] },
      { h: "How rangers predict it", p: [
        "The secret is the eruption before. A short eruption, under about 2\u00bd minutes, empties less of the chamber, and the next one comes sooner, after about an hour. A longer eruption means a longer wait, about an hour and a half.",
        "Using that rule, park rangers post predictions that are usually right within about 10 minutes." ] }
    ],
    remember: "Old Faithful erupts about every 60 to 110 minutes, and the length of each eruption tells rangers when the next will come.",
    qs: [
      { q: "How often does Old Faithful usually erupt today?", a: ["Exactly every hour", "About every 60 to 110 minutes", "Once a day"], c: 1, why: "The gap is usually 60 to 110 minutes, around an hour and a half on average; it was never exactly hourly." },
      { q: "How do rangers predict the next eruption?", a: ["From the length of the eruption before", "From the weather forecast", "From the time of sunrise"], c: 0, why: "Short eruptions are followed by shorter waits, long ones by longer waits." },
      { q: "What keeps the water underground from boiling at its normal boiling point?", a: ["Ice in the ground", "Salt in the water", "The weight of the water above it"], c: 2, why: "The pressure of the water above lets it get far hotter than its usual boiling point before it flashes to steam." }
    ]
  }],
  how: [{
    id: "how-refrigerator", title: "How a Refrigerator Makes Cold",
    dek: "It doesn't make cold at all. It carries heat out of the box and leaves it in your kitchen.",
    pages: [
      { h: "Moving heat, not making cold", p: [
        "A refrigerator can't create cold. What it does is pick up heat from inside the box and carry it outside. Cold is simply what's left when heat has been taken away.",
        "The carrier is a special fluid called a refrigerant, which travels around a sealed loop of pipes, over and over." ] },
      { h: "The trick: boiling soaks up heat", p: [
        "When a liquid boils into a gas, it soaks up heat. You feel this when you step out of a swimming pool: the water evaporating from your skin carries heat away, and you shiver.",
        "Inside the refrigerator's walls, the refrigerant is allowed to spread out into coils where the pressure is low. There it boils at a very cold temperature, and as it boils it soaks up heat from your food and the air in the box." ] },
      { h: "Squeeze it, and the heat comes out", p: [
        "The compressor, the motor you hear humming, squeezes that warm gas hard. Squeezed gas gets hot. The hot gas flows through coils on the back or underneath the refrigerator, where it gives its heat to the kitchen air and turns back into a liquid.",
        "Then the liquid passes through a narrow opening into the low-pressure coils inside, and the loop starts again. Pick up heat inside, drop it off outside, every cycle." ] },
      { h: "So don't cool the kitchen with it", p: [
        "Because the heat goes into your kitchen, leaving the door open won't cool the room. It warms it: the refrigerator moves the same heat in a circle while its motor adds more.",
        "Early refrigerators used dangerous gases such as ammonia. Safer chemicals called CFCs, often sold as Freon, replaced them in the 1930s; when CFCs were found to harm the ozone layer, the 1987 Montreal Protocol phased them out in favor of newer refrigerants." ] }
    ],
    remember: "A refrigerator moves heat: its refrigerant soaks up heat inside as it boils and gives it off outside after the compressor squeezes it.",
    qs: [
      { q: "What does a refrigerator actually do?", a: ["Carries heat out of the box", "Makes cold air with ice", "Blows outside air in"], c: 0, why: "It moves heat from inside the box to the kitchen; the cold is what's left." },
      { q: "What happens when the refrigerant boils in the inside coils?", a: ["It gives off heat", "It soaks up heat", "It stops moving"], c: 1, why: "Boiling soaks up heat, the same way evaporating pool water cools your skin." },
      { q: "If you leave the refrigerator door open, what happens to the kitchen?", a: ["It gets cooler", "Nothing changes", "It gets a little warmer"], c: 2, why: "The heat goes right back into the kitchen, and the motor adds its own heat too." }
    ]
  }, {
    id: "how-lock-key", title: "How a Lock and Key Work",
    dek: "Inside an ordinary door lock is a row of tiny pins, and your key is the only thing that lines them up.",
    pages: [
      { h: "An idea 4,000 years old", p: [
        "The basic idea behind most door locks is ancient. Thousands of years ago, the Egyptians built large wooden locks with loose pins that dropped into a bolt and held it shut. A wooden key with pegs lifted the pins so the bolt could slide.",
        "The lock on your front door works on the same principle, just much smaller and far more precise." ] },
      { h: "The pins inside", p: [
        "Inside the lock is a cylinder, called the plug, that turns when you turn the key. Above it sits a row of small spring-loaded pins, usually five or six. Each pin is really two pieces stacked on top of each other.",
        "With no key in the lock, the springs push the pins down so the upper pieces cross the gap between the plug and its housing. That blocks the plug from turning." ] },
      { h: "Why only your key works", p: [
        "The lower pieces of the pins are different lengths. The bumps and dips along your key are cut to match them exactly.",
        "When you slide the right key in, every pin is lifted to precisely the right height, so the split between its two pieces lines up with the edge of the plug. That edge is called the shear line. With every pin lined up, the plug turns and the lock opens. A wrong key leaves at least one pin out of line, and the plug stays stuck." ] },
      { h: "The Yales", p: [
        "In America, Linus Yale Sr. made pin tumbler locks in the 1840s. His son, Linus Yale Jr., patented a small, compact version in 1861 that used the flat key with a wavy edge we still carry today.",
        "The Yale name became so tied to locks that this kind of lock is still often called a Yale lock." ] }
    ],
    remember: "A key's cuts lift each pin in the lock to just the right height; when every pin meets the shear line, the cylinder can turn.",
    qs: [
      { q: "What does the right key do inside a pin tumbler lock?", a: ["Lifts every pin to just the right height", "Melts a small wax seal", "Pushes the door open"], c: 0, why: "The key's cuts raise each pin so the split lines up with the shear line, and the plug can turn." },
      { q: "Why won't a wrong key turn the lock?", a: ["It is the wrong color", "At least one pin is left out of line, blocking the plug", "The spring breaks"], c: 1, why: "If even one pin isn't lifted to the shear line, it blocks the plug from turning." },
      { q: "Who patented the compact pin tumbler lock with a flat key in 1861?", a: ["Thomas Edison", "Benjamin Franklin", "Linus Yale Jr."], c: 2, why: "Linus Yale Jr. patented his compact cylinder lock in 1861, building on his father's pin tumbler locks." }
    ]
  }, {
    id: "how-gps", title: "How GPS Knows Where You Are",
    dek: "Your phone finds itself by listening to clocks in space, and it needs Einstein to get the answer right.",
    pages: [
      { h: "Clocks in the sky", p: [
        "About 31 GPS satellites circle the Earth roughly 12,550 miles up, each going around twice a day. They are spaced so that from almost anywhere on Earth, at least four are above the horizon.",
        "Each satellite carries extremely precise atomic clocks, and it does one simple thing, over and over: it broadcasts the exact time and its own position." ] },
      { h: "Timing a signal", p: [
        "The signal travels at the speed of light, about 186,000 miles a second. Your phone notes when each signal arrives and compares it with the time the satellite says it was sent. The tiny delay tells it how far away that satellite is.",
        "Know your distance from one satellite and you could be anywhere on a huge sphere around it. Add a second and a third, and those spheres cross at only one spot on Earth's surface. That method is called trilateration." ] },
      { h: "Why it takes four", p: [
        "The satellites' clocks are superb, but the one in your phone is cheap and drifts. Being off by just a millionth of a second would put you about 1,000 feet from where you are.",
        "A fourth satellite solves it: with four distances, your phone can work out its own clock error along with its position. Your phone only listens; it never sends anything to the satellites." ] },
      { h: "Einstein in your pocket", p: [
        "Here is the surprising part. Because the satellites move fast and sit where Earth's gravity is weaker, Einstein's theories of relativity say their clocks run differently from ours. Added together, they gain about 38 millionths of a second every day.",
        "That sounds like nothing, but left uncorrected, GPS positions would drift by miles a day. So the satellite clocks are adjusted to keep step with ours." ] }
    ],
    remember: "GPS finds you by timing signals from at least four satellites, and it works only because the satellites' clocks are corrected for relativity.",
    qs: [
      { q: "How does your phone work out how far away a GPS satellite is?", a: ["By timing how long the satellite's signal takes to arrive", "By sending a signal and waiting for an echo", "By measuring how bright the satellite looks"], c: 0, why: "Each satellite broadcasts the exact time; the delay before the signal arrives, at the speed of light, gives the distance." },
      { q: "Why does a phone need signals from four satellites, not three?", a: ["One is always broken", "The fourth lets it correct its own less accurate clock", "Each satellite covers only one direction"], c: 1, why: "Three distances give a position; the fourth lets the phone work out its own clock error too." },
      { q: "Without relativity corrections, what would happen to GPS?", a: ["Nothing at all", "It would only work at night", "Its positions would drift by miles every day"], c: 2, why: "The satellites' clocks gain about 38 millionths of a second a day; uncorrected, positions would drift by miles." }
    ]
  }, {
    id: "how-microwave", title: "How a Microwave Heats Food",
    dek: "A melted candy bar in an engineer's pocket led to a machine in nearly every American kitchen.",
    pages: [
      { h: "A sticky discovery", p: [
        "In the 1940s, Percy Spencer, an engineer at the Raytheon company, worked with magnetrons, the tubes that make microwaves for radar. As the story goes, he was standing near one when he noticed the candy bar in his pocket had melted.",
        "He tried popcorn kernels next, and they popped. Raytheon filed a patent for microwave cooking on October 8, 1945." ] },
      { h: "Spinning water", p: [
        "Microwaves are radio waves, much shorter than the ones that carry radio stations. In an oven, they flip back and forth about 2.45 billion times a second.",
        "Water molecules are lopsided, with a slightly positive end and a slightly negative end, so they keep trying to line up with the flipping waves. All that twisting jostles neighboring molecules, and that motion is heat. Food warms because of its water." ] },
      { h: "Why the middle stays cold", p: [
        "Microwaves only reach about an inch into food. Deeper parts warm as heat spreads inward from there, which is why recipes say to stir, or to let food stand for a minute.",
        "The waves also bounce around the box and make hot and cool spots. The turntable carries food through them so it heats more evenly." ] },
      { h: "From giant to countertop", p: [
        "The first microwave oven, the Radarange, went on sale in 1947. It stood nearly 6 feet tall and weighed about 750 pounds.",
        "Smaller, cheaper countertop ovens arrived in the late 1960s. Today, microwave ovens are in more than 90 percent of American homes." ] }
    ],
    remember: "Microwaves make water molecules in food twist back and forth billions of times a second, and that motion is heat.",
    qs: [
      { q: "What gave Percy Spencer the idea for the microwave oven?", a: ["A candy bar melted in his pocket near a magnetron", "He watched lightning strike", "A cup of coffee boiled over"], c: 0, why: "Working near a radar magnetron, he noticed the candy bar in his pocket had melted." },
      { q: "What does a microwave oven mainly heat in food?", a: ["The salt", "The water molecules", "The air around the food"], c: 1, why: "Lopsided water molecules twist to follow the flipping waves, and that motion becomes heat." },
      { q: "Why does a microwave oven have a turntable?", a: ["To keep the door closed", "To make the waves stronger", "To carry food through hot and cool spots so it heats evenly"], c: 2, why: "Waves bouncing in the box leave hot and cool spots; turning the food evens them out." }
    ]
  }]
};
