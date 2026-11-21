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
  }]
};
