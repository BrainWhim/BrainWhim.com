/* The Writing Desk's prompts (Create - The Studio), Nov 21, 2026.
   One prompt a day; each weekday has its own kind of writing (WD_KINDS). A weekday's prompts are used in turn, a week at a time,
   so adding a prompt to a kind simply joins the rotation (same as the Reading Room's lessons).
   A prompt: { id, title, prompt (what to write, 1-3 sentences), start (an opening line they may use, or ""), nudge (one small tip) }
   American spelling. Plain ASCII only (non-ASCII as \u escapes: a page without a charset garbles them). */
var WD_KINDS = [
  { id: "memory",   name: "Memory",   line: "Something true, from your own life." },        /* Sunday */
  { id: "mystery",  name: "Mystery",  line: "A small puzzle. You decide the answer." },     /* Monday */
  { id: "letter",   name: "Letter",   line: "Write to someone. You never have to send it." }, /* Tuesday */
  { id: "poem",     name: "Poem",     line: "A few lines. Rhyme only if you want to." },    /* Wednesday */
  { id: "dialogue", name: "Dialogue", line: "Two voices. Let them talk." },                 /* Thursday */
  { id: "whimsy",   name: "Whimsy",   line: "Something impossible, told as if it were ordinary." }, /* Friday */
  { id: "place",    name: "Place",    line: "Put the reader somewhere, and keep them there." } /* Saturday */
];
var WD_PROMPTS = {
  memory: [
    { id: "mem-kitchen", title: "The Kitchen You Grew Up In",
      prompt: "Stand in the kitchen of a house you lived in as a child. What is on the counter? Who is there, and what are they doing? Write it in the present tense, as if you are there right now.",
      start: "The first thing I notice is the smell of",
      nudge: "Name one sound and one smell before you name anything you can see." },
    { id: "mem-first-job", title: "Your First Paycheck",
      prompt: "Write about the first money you ever earned. What did you do for it, how much was it, and what did you spend it on? Did it feel like a lot?",
      start: "",
      nudge: "Give the real number. Small exact details make a memory feel true." },
    { id: "mem-lost", title: "Something You Lost",
      prompt: "Write about an object you lost and never found. Describe it so well that a stranger could pick it out of a drawer. Where do you think it is now?",
      start: "I still think about",
      nudge: "End with where you imagine it is today, even if that part is made up." },
    { id: "mem-snow", title: "A Day the Plans Fell Through",
      prompt: "Think of a day when the plan fell apart: a storm, a closed road, a canceled trip. What did you do instead? Sometimes the day that went wrong is the one we remember best.",
      start: "We were supposed to",
      nudge: "Spend most of your words on what happened instead, not on the plan." }
  ],
  mystery: [
    { id: "mys-key", title: "The Key Under the Mat",
      prompt: "You come home and find a key under your doormat. It is not yours, and it does not fit your door. A small paper tag is tied to it with string. Write what happens next.",
      start: "The tag said only one word:",
      nudge: "Decide what the key opens before you start, even if the reader won't learn it until the end." },
    { id: "mys-postcard", title: "A Postcard From Nowhere",
      prompt: "A postcard arrives with your name and address, a picture of a town you have never heard of, and a message in handwriting you almost recognize. Who sent it, and why now?",
      start: "",
      nudge: "Write the postcard's message first, word for word. Then follow it." },
    { id: "mys-clock", title: "The Clock That Stopped",
      prompt: "Every clock in the house stopped at exactly 3:17 last night, even the one on the oven. Nothing else seems wrong. Yet.",
      start: "It was the kitchen clock I noticed first.",
      nudge: "Keep the strange thing small and specific. Quiet mysteries are the most unsettling." },
    { id: "mys-library", title: "The Overdue Book",
      prompt: "The library calls about a book you checked out. The problem: it was checked out in your name in 1962, and it has finally been returned, with a note tucked inside.",
      start: "",
      nudge: "Let the note change the story's direction in its last line." }
  ],
  letter: [
    { id: "let-younger", title: "To You at Twelve",
      prompt: "Write a letter to yourself at twelve years old. What would you warn them about? What would you tell them not to worry about at all?",
      start: "Dear me,",
      nudge: "Include one thing you know they would not believe." },
    { id: "let-thanks", title: "The Thank-You You Never Sent",
      prompt: "Write a thank-you letter to someone who helped you and never knew how much it mattered: a teacher, a neighbor, a stranger. You never have to send it.",
      start: "",
      nudge: "Describe the exact moment they helped, as if they might have forgotten it." },
    { id: "let-house", title: "A Letter to a House",
      prompt: "Write a letter to a house you used to live in. Tell it what has happened to you since you left, and ask it what has happened to it.",
      start: "Dear house on",
      nudge: "Talk to the house the way you would talk to an old friend." },
    { id: "let-future", title: "To Be Opened in Ten Years",
      prompt: "Write a letter to be opened ten years from today. Describe an ordinary day in your life right now, so your future self remembers what it was like.",
      start: "",
      nudge: "Prices, songs, the view out your window: the ordinary details are the ones that disappear." }
  ],
  poem: [
    { id: "poem-window", title: "What the Window Sees",
      prompt: "Write a short poem from the point of view of a window. What has it watched, year after year? What does it wish it could see?",
      start: "",
      nudge: "Try short lines. Each one a single thing the window saw." },
    { id: "poem-list", title: "A List Poem",
      prompt: "Write a poem that is a list: ten things that make you feel at home. Make each line a single, specific thing. The last line should surprise you a little.",
      start: "",
      nudge: "Not \"coffee\" but \"the first sip, before anyone else is up.\"" },
    { id: "poem-weather", title: "Today's Weather, Inside",
      prompt: "Write a poem describing your mood today as if it were a weather report. Is there a chance of rain by afternoon? A warm front moving in?",
      start: "This morning, light fog",
      nudge: "Borrow real forecast words: front, gusts, clearing, overnight lows." },
    { id: "poem-hands", title: "Hands",
      prompt: "Write a poem about someone's hands: what they made, what they held, what they did every day. They can be your own hands, or someone you love.",
      start: "",
      nudge: "Hands tell a life story through what they did, so use strong verbs." }
  ],
  dialogue: [
    { id: "dia-diner", title: "Two Strangers at a Diner",
      prompt: "Two strangers share the counter at a late-night diner. One of them is leaving town tomorrow for good. Write their conversation, using only what they say out loud.",
      start: "\"Is anyone sitting here?\"",
      nudge: "Let what they don't say do the work. People rarely say exactly what they mean." },
    { id: "dia-return", title: "The Return Desk",
      prompt: "A customer is trying to return something very unusual to a store. The clerk is doing their best. Write the conversation.",
      start: "",
      nudge: "The clerk should stay polite no matter what. That's where the comedy is." },
    { id: "dia-old-friends", title: "Old Friends, Twenty Years Later",
      prompt: "Two friends who haven't spoken in twenty years run into each other in a grocery store. Write what they say, and what they don't.",
      start: "\"I'd know you anywhere.\"",
      nudge: "Give each friend one thing they want to ask and can't quite bring up." },
    { id: "dia-interview", title: "The Strangest Job Interview",
      prompt: "Write a job interview where it slowly becomes clear the job is not at all what the applicant thought it was.",
      start: "",
      nudge: "Let the interviewer treat every strange question as perfectly normal." }
  ],
  whimsy: [
    { id: "whim-moon", title: "The Moon Calls in Sick",
      prompt: "One night the moon calls in sick and doesn't rise. Who has to fill in, and how does it go?",
      start: "The message came in a little after sunset.",
      nudge: "Treat it like an ordinary workplace problem. Somebody has to cover the shift." },
    { id: "whim-shop", title: "The Shop That Sells Lost Things",
      prompt: "On a side street there is a shop that sells only lost things: single gloves, forgotten umbrellas, misplaced afternoons. Describe the shop and one customer who comes in.",
      start: "",
      nudge: "Give the shopkeeper rules about what can and can't be sold." },
    { id: "whim-cat", title: "The Cat Who Wrote a Review",
      prompt: "Write a five-star (or one-star) review of your home, written by a cat, a dog or a houseplant that lives there.",
      start: "",
      nudge: "Strong opinions about small things are what make a review funny." },
    { id: "whim-umbrella", title: "An Umbrella With Opinions",
      prompt: "Your new umbrella has opinions about the weather, about where you're going, and about you. Write one rainy walk together.",
      start: "\"Oh, we're going there?\" said the umbrella.",
      nudge: "Give the umbrella one thing it's secretly afraid of." }
  ],
  place: [
    { id: "place-station", title: "A Train Station at Dawn",
      prompt: "Describe a small train station at dawn, before the first train. Who is there? What do they carry? Make the reader feel the cold and hear the quiet.",
      start: "The benches were still damp with dew.",
      nudge: "Use all five senses at least once, and save the train itself for the last line." },
    { id: "place-attic", title: "The Attic",
      prompt: "Take the reader up the stairs into an attic that hasn't been opened in years. What is up there? What does one object tell you about who lived here?",
      start: "",
      nudge: "Move through the attic slowly, one thing at a time, as if your flashlight is small." },
    { id: "place-market", title: "A Market in the Rain",
      prompt: "Describe an outdoor market in the middle of a sudden rain. The sellers, the awnings, the smells, the people who stay and the people who run.",
      start: "",
      nudge: "Pick one seller and stay with them for a few sentences." },
    { id: "place-favorite", title: "A Place Only You Know",
      prompt: "Describe a place that matters only to you: a corner, a bench, a spot by the water. Write it so clearly that the reader could find it without you.",
      start: "If you go there, sit",
      nudge: "Write it like directions to a friend, ending with what you see once you're there." }
  ]
};
