// ── The Parent & Baby Quest Library ──
// Real-world, OT-informed play activities for the youngest children,
// organized by developmental band and domain. Noel frames each one as a
// quest; the parent plays it with the child off-screen, then reports with
// one tap. Reports feed the quiet measurement log.
//
// Band 1 ≈ 6–18 months · Band 2 ≈ 18 mo–2½ yrs · Band 3 ≈ 2½–4 yrs

import { logQuestMetric } from './metrics';

export type ActivityDomain = 'fine motor' | 'communication' | 'reading' | 'math' | 'sensory' | 'processing';

export interface ParentActivity {
  id: string;
  band: 1 | 2 | 3;
  domain: ActivityDomain;
  emoji: string;
  title: string;
  noel: string;        // Noel's story framing, read aloud to the child
  materials: string;   // ordinary household things
  steps: string[];     // what the grown-up does, in plain language
  watchFor: string;    // the skill hiding inside the game
  minutes: number;
}

export const DOMAIN_META: Record<ActivityDomain, { emoji: string; label: string }> = {
  'fine motor':    { emoji: '🤲', label: 'Little Hands' },
  'communication': { emoji: '🗣️', label: 'Talking & Listening' },
  'reading':       { emoji: '📖', label: 'Early Books & Sounds' },
  'math':          { emoji: '🔢', label: 'Counting & Sorting' },
  'sensory':       { emoji: '🌈', label: 'Senses' },
  'processing':    { emoji: '🧠', label: 'Thinking & Remembering' },
};

export const ACTIVITIES: ParentActivity[] = [

  // ════════ BAND 1 · Little Sprout (≈ 6–18 months) ════════

  {
    id: 'b1-cheerio-pickup', band: 1, domain: 'fine motor', emoji: '🫐',
    title: 'Tiny Treasure Pickup',
    noel: 'Noel dropped his tiny berries! Can those little fingers rescue them?',
    materials: 'A few O-cereals, puffs, or soft berry bits on a highchair tray',
    steps: [
      'Place 3–4 small safe snacks in front of your child.',
      'Let them pick each one up — no helping hands unless needed!',
      'Cheer every single grab.',
    ],
    watchFor: 'Picking up with thumb and pointer finger (pincer grasp) instead of raking with the whole hand.',
    minutes: 5,
  },
  {
    id: 'b1-block-stack', band: 1, domain: 'fine motor', emoji: '🧱',
    title: 'Tower for Noel',
    noel: 'Noel wants a lookout tower! Even two blocks high makes him happy.',
    materials: '4–6 stackable blocks or cups',
    steps: [
      'Build a 2-block tower slowly while your child watches.',
      'Hand them a block and pat the top: "your turn!"',
      'Knock it down together — that is the best part.',
    ],
    watchFor: 'Placing one block on another and letting go on purpose.',
    minutes: 5,
  },
  {
    id: 'b1-band-bang', band: 1, domain: 'fine motor', emoji: '🥁',
    title: 'Forest Drum Band',
    noel: 'Noel loves a drum parade! Two hands, two blocks, big noise!',
    materials: 'Two blocks, cups, or wooden spoons',
    steps: [
      'Give one to each of your child\'s hands.',
      'Bang yours together and wait.',
      'Copy every rhythm they make back to them.',
    ],
    watchFor: 'Bringing both hands to the middle and banging objects together — two sides of the body working as a team.',
    minutes: 4,
  },
  {
    id: 'b1-cloth-pull', band: 1, domain: 'processing', emoji: '🧣',
    title: 'The Magic Carpet Trick',
    noel: 'The toy is riding a magic carpet! How will those clever hands get it?',
    materials: 'A small towel with a toy placed on the far end, out of reach',
    steps: [
      'Put the toy on the cloth, just out of arm\'s reach.',
      'Wait — don\'t show the trick.',
      'Celebrate if they pull the cloth to bring the toy closer.',
    ],
    watchFor: 'Using one thing (the cloth) as a tool to get another — early problem-solving.',
    minutes: 4,
  },
  {
    id: 'b1-peekaboo-cup', band: 1, domain: 'processing', emoji: '🥤',
    title: 'Where Did Noel Go?',
    noel: 'Noel is hiding! He is SURE nobody can find him. Prove him wrong!',
    materials: 'One cup, one small toy',
    steps: [
      'Hide the toy under the cup while your child watches.',
      'Ask "where did it go?" and wait.',
      'Big cheer when they lift the cup!',
    ],
    watchFor: 'Lifting the cup to search — knowing things still exist when hidden (object permanence).',
    minutes: 4,
  },
  {
    id: 'b1-track-toy', band: 1, domain: 'sensory', emoji: '👀',
    title: 'Follow the Firefly',
    noel: 'A firefly is flying by! Can those bright eyes follow it all the way?',
    materials: 'A bright toy or a small flashlight',
    steps: [
      'Hold the toy about 30 cm from your child\'s face.',
      'Move it slowly left to right, then up and down.',
      'Watch their eyes, not the toy.',
    ],
    watchFor: 'Smooth eye-following across the middle of their vision without losing the toy.',
    minutes: 3,
  },
  {
    id: 'b1-treasure-basket', band: 1, domain: 'sensory', emoji: '🧺',
    title: 'The Treasure Basket',
    noel: 'Noel packed a basket of mystery treasures. Which one will baby love?',
    materials: 'A basket of safe household textures: wooden spoon, silky scarf, crinkly paper, rubber spatula',
    steps: [
      'Offer the basket and let your child choose freely.',
      'Name each texture as they grab it: "smooth!", "crinkly!"',
      'Let them mouth, bang, and explore safely.',
    ],
    watchFor: 'Curiosity about different textures — reaching, switching hands, exploring without distress.',
    minutes: 8,
  },
  {
    id: 'b1-sound-shake', band: 1, domain: 'sensory', emoji: '🔔',
    title: 'What Made That Sound?',
    noel: 'Something in Echo Cave went *jingle*! Where is it coming from?',
    materials: 'A rattle, bells, or a jar with rice',
    steps: [
      'Shake it gently to one side of your child, out of sight.',
      'Wait for them to turn toward the sound.',
      'Swap sides and play again.',
    ],
    watchFor: 'Turning their head to find a sound they cannot see.',
    minutes: 3,
  },
  {
    id: 'b1-name-game', band: 1, domain: 'communication', emoji: '📣',
    title: 'The Name Spell',
    noel: 'Your name is a magic word! Noel says it works from across the room.',
    materials: 'Nothing — just you',
    steps: [
      'When your child is busy playing, say their name once, warmly.',
      'Count silently to five — do they look?',
      'If not, try again a little closer.',
    ],
    watchFor: 'Turning to their own name without you touching them or clapping.',
    minutes: 2,
  },
  {
    id: 'b1-point-body', band: 1, domain: 'communication', emoji: '👃',
    title: 'Where Is Your Nose?',
    noel: 'Noel forgot where noses live! Can you show him?',
    materials: 'Nothing — just faces',
    steps: [
      'Ask "where\'s your nose?" and tap your own nose.',
      'Try tummy, ears, toes.',
      'Cheer any reach toward the right spot.',
    ],
    watchFor: 'Pointing to at least one body part when named.',
    minutes: 3,
  },
  {
    id: 'b1-babble-back', band: 1, domain: 'communication', emoji: '💬',
    title: 'The Babble Conversation',
    noel: 'Noel speaks fluent Baby! The secret: copy, wait, repeat.',
    materials: 'Nothing — just you',
    steps: [
      'When your child babbles ("ba-ba!"), copy it back exactly.',
      'Then WAIT, eyes wide, like it\'s their turn.',
      'Keep the "conversation" going as long as they will.',
    ],
    watchFor: 'Taking turns — babbling back after you, like a real conversation.',
    minutes: 5,
  },
  {
    id: 'b1-more-please', band: 1, domain: 'math', emoji: '🍌',
    title: 'More? More!',
    noel: 'Noel always wants MORE bamboo. Does baby know how to ask?',
    materials: 'Snack time, small pieces',
    steps: [
      'Give one small piece, then pause and hold the next one up.',
      'Ask "more?" while bringing your fingertips together (the sign for more).',
      'Give it the moment they reach, vocalize, or copy the sign.',
    ],
    watchFor: 'Asking for more with a gesture, sound, or sign — the very first "quantity" idea.',
    minutes: 5,
  },
  {
    id: 'b1-in-and-out', band: 1, domain: 'math', emoji: '🪣',
    title: 'The In-and-Out Game',
    noel: 'Treasures go IN the chest… and OUT again! Noel could play this all day.',
    materials: 'A container and 4–5 chunky toys',
    steps: [
      'Drop toys in one at a time, saying "in!"',
      'Dump them out: "out!"',
      'Hand your child a toy and hold out the container.',
    ],
    watchFor: 'Putting objects into a container on purpose and dumping them back out.',
    minutes: 6,
  },
  {
    id: 'b1-book-lap', band: 1, domain: 'reading', emoji: '📚',
    title: 'Lap Story Time',
    noel: 'Story time in the coziest seat in the world: your lap!',
    materials: 'A sturdy board book with big pictures',
    steps: [
      'Let your child hold the book and turn pages any way they like.',
      'Point at one picture per page and name it.',
      'Follow their pointing — read whatever page they choose.',
    ],
    watchFor: 'Patting pictures, helping turn pages, looking where you point.',
    minutes: 6,
  },
  {
    id: 'b1-pat-a-cake', band: 1, domain: 'reading', emoji: '🥮',
    title: 'Pat-a-Cake Power',
    noel: 'Noel claps along to every rhyme — rhythm is how words begin!',
    materials: 'Nothing — hands and a rhyme you like',
    steps: [
      'Do pat-a-cake (or any clapping rhyme) with their hands in yours.',
      'Repeat it the same way every time.',
      'Pause before the last word and see if they react.',
    ],
    watchFor: 'Smiling in anticipation, starting the hand motions themselves after a few days.',
    minutes: 4,
  },
  {
    id: 'b1-ball-roll', band: 1, domain: 'communication', emoji: '⚽',
    title: 'Roll It Back!',
    noel: 'Noel\'s favorite game: the ball goes away… and comes BACK!',
    materials: 'A soft ball, two people sitting on the floor',
    steps: [
      'Sit facing each other, legs wide.',
      'Roll the ball gently and hold your hands out for the return.',
      'Say "my turn… your turn!" every round.',
    ],
    watchFor: 'Pushing the ball back toward you — turn-taking before words.',
    minutes: 6,
  },
  {
    id: 'b1-mirror-faces', band: 1, domain: 'sensory', emoji: '🪞',
    title: 'Mirror Buddies',
    noel: 'There\'s another baby in the mirror — and another Noel! Say hello!',
    materials: 'A safe mirror',
    steps: [
      'Sit together facing the mirror.',
      'Make slow silly faces: big smile, surprised "O", tongue out.',
      'Name who you see: "there\'s YOU!"',
    ],
    watchFor: 'Studying faces, smiling at the reflection, trying to copy an expression.',
    minutes: 4,
  },
  {
    id: 'b1-wave-bye', band: 1, domain: 'communication', emoji: '👋',
    title: 'The Bye-Bye Wave',
    noel: 'Every adventurer needs a hello and a goodbye! Noel waves with his whole arm.',
    materials: 'Nothing — doorways and goodbyes',
    steps: [
      'Wave big and slow every single time someone leaves.',
      'Gently help their hand wave the first few times.',
      'Cheer any arm flap that means "bye!"',
    ],
    watchFor: 'Waving on their own when someone says bye-bye — gestures carry meaning.',
    minutes: 2,
  },

  // ════════ BAND 2 · Little Explorer (≈ 18 mo – 2½ yrs) ════════

  {
    id: 'b2-scribble', band: 2, domain: 'fine motor', emoji: '🖍️',
    title: 'The First Map',
    noel: 'Every explorer draws a map! Scribbles ARE maps — Noel said so.',
    materials: 'A chunky crayon and big paper (tape it to the table)',
    steps: [
      'Scribble a little yourself, then hand the crayon over.',
      'Say what you see: "big lines! round and round!"',
      'Hang the map on the fridge like treasure.',
    ],
    watchFor: 'Holding the crayon and making marks on purpose — up-down or round-and-round.',
    minutes: 6,
  },
  {
    id: 'b2-sticker-peel', band: 2, domain: 'fine motor', emoji: '⭐',
    title: 'Star Sticker Rescue',
    noel: 'The stars are stuck! Only little fingers can peel them free.',
    materials: 'Big stickers, half-peeled to start',
    steps: [
      'Start each sticker\'s corner for them.',
      'Let them peel it off and stick it anywhere on the paper.',
      'Count the rescued stars together at the end.',
    ],
    watchFor: 'Fingertip pinching, and the wrist twisting to place a sticker where they want it.',
    minutes: 4,
  },
  {
    id: 'b2-big-tower', band: 2, domain: 'fine motor', emoji: '🏰',
    title: 'The Great Tower Contest',
    noel: 'Noel bets you can\'t build a tower taller than his paw. Prove it!',
    materials: '6–8 blocks',
    steps: [
      'Build side by side, block by block.',
      'Count each block out loud as it lands.',
      'Whoever\'s tower falls first laughs hardest.',
    ],
    watchFor: 'Stacking 4–6 blocks with a steady release — watch the careful little adjustments.',
    minutes: 6,
  },
  {
    id: 'b2-playdough-snake', band: 2, domain: 'fine motor', emoji: '🐍',
    title: 'Snakes for the Dragon',
    noel: 'The baby dragon eats playdough snakes. Long ones. Wiggly ones. Lots!',
    materials: 'Playdough',
    steps: [
      'Roll a snake with both palms; let them copy.',
      'Squish, poke and pinch it flat.',
      'Feed every snake to a pretend dragon (loud munching required).',
    ],
    watchFor: 'Both palms rolling together, and finger strength in the squishing and pinching.',
    minutes: 8,
  },
  {
    id: 'b2-spoon-transfer', band: 2, domain: 'fine motor', emoji: '🥄',
    title: 'The Soup Delivery',
    noel: 'Chef Noel needs the beans moved bowl to bowl — spoon only, no paws!',
    materials: 'Two bowls, dry pasta or big beans, a spoon (always supervise)',
    steps: [
      'Fill one bowl, leave one empty.',
      'Show one slow spoonful crossing over.',
      'Let them work; spills are part of the game.',
    ],
    watchFor: 'Scooping and steering the spoon across without dumping — wrist control for self-feeding.',
    minutes: 7,
  },
  {
    id: 'b2-one-step', band: 2, domain: 'communication', emoji: '📬',
    title: 'The Little Messenger',
    noel: 'Noel has missions! "Bring the cup to the table." Can the messenger do it?',
    materials: 'Everyday objects around the room',
    steps: [
      'Give ONE clear mission: "put the sock in the basket."',
      'No pointing — words only.',
      'Stamp their hand with a pretend medal after each delivery.',
    ],
    watchFor: 'Following a one-step instruction from words alone.',
    minutes: 3,
  },
  {
    id: 'b2-animal-sounds', band: 2, domain: 'communication', emoji: '🐄',
    title: 'The Animal Chorus',
    noel: 'Noel speaks Cow, Duck AND Sheep. Moo! Quack! Baa! Join the chorus!',
    materials: 'Animal picture book or toy animals',
    steps: [
      'Point to an animal and make its sound.',
      'Ask "what does the duck say?"',
      'Sing the whole chorus together, louder each round.',
    ],
    watchFor: 'Imitating sounds, then producing the right sound for the right animal on their own.',
    minutes: 3,
  },
  {
    id: 'b2-what-happened', band: 2, domain: 'communication', emoji: '🎈',
    title: 'Tell Teddy About It',
    noel: 'Teddy missed everything! Tell him what happened at the park!',
    materials: 'A favorite stuffed animal',
    steps: [
      'After an outing, have Teddy "ask" what happened.',
      'Help with choices: "did we see a dog or a bus?"',
      'Repeat their words back, adding one more: "yes! a BIG dog!"',
    ],
    watchFor: 'Two-word combinations ("dog woof!") and adding new words week to week.',
    minutes: 5,
  },
  {
    id: 'b2-point-pictures', band: 2, domain: 'reading', emoji: '🔎',
    title: 'The Picture Hunt',
    noel: 'Somewhere in this book hides a cat. Noel can\'t find it. Help!',
    materials: 'A busy picture book',
    steps: [
      'Ask "where\'s the cat?" and wait.',
      'Take turns — they ask, you find (get it wrong sometimes!).',
      'Three finds = a victory wiggle.',
    ],
    watchFor: 'Pointing to named pictures — understanding words before saying them.',
    minutes: 3,
  },
  {
    id: 'b2-fill-blank-song', band: 2, domain: 'reading', emoji: '🎵',
    title: 'The Missing Word Song',
    noel: 'Noel forgets song endings! Twinkle twinkle little… what was it?!',
    materials: 'Any song your child knows well',
    steps: [
      'Sing it together a few times.',
      'Stop right before the last word of a line… and wait.',
      'Celebrate whatever sound fills the gap.',
    ],
    watchFor: 'Filling in the missing word or sound — memory for language and rhythm.',
    minutes: 3,
  },
  {
    id: 'b2-turn-pages', band: 2, domain: 'reading', emoji: '📖',
    title: 'The Page Turner',
    noel: 'You drive the story! Noel reads only when the page turns.',
    materials: 'A board book',
    steps: [
      'Read, then pause at each page\'s end: "turn!"',
      'Let them turn every page, one at a time.',
      'If they skip pages, follow along anyway — their book, their rules.',
    ],
    watchFor: 'Turning single pages with fingertips, front to back.',
    minutes: 6,
  },
  {
    id: 'b2-two-bowls', band: 2, domain: 'math', emoji: '🍎',
    title: 'The Great Snack Sort',
    noel: 'Disaster! The crackers and grapes got all mixed up! Sort the pantry!',
    materials: 'Two kinds of snacks or toys, two bowls',
    steps: [
      'Mix them in a pile; put one of each into its bowl to start.',
      'Hand pieces over one at a time: "where does this go?"',
      'Inspect the bowls together: "ALL crackers here!"',
    ],
    watchFor: 'Sorting into the right groups without help on most pieces.',
    minutes: 6,
  },
  {
    id: 'b2-big-small', band: 2, domain: 'math', emoji: '🐘',
    title: 'Big Thing, Small Thing',
    noel: 'Noel is BIG. A ladybug is small. What else is big around here?!',
    materials: 'Pairs of objects: big/small spoon, big/small ball',
    steps: [
      'Hold up a pair: "which one is BIG?" (use a big voice).',
      'Then whisper: "which is small?"',
      'March around finding big and small things.',
    ],
    watchFor: 'Picking the right one for "big" and "small" — first size concepts.',
    minutes: 3,
  },
  {
    id: 'b2-cup-shuffle', band: 2, domain: 'processing', emoji: '🎩',
    title: 'The Cup Shuffle',
    noel: 'The classic cave trick: which cup hides the treasure? Watch closely!',
    materials: 'Two cups, one small toy',
    steps: [
      'Hide the toy under one cup as they watch.',
      'Slide both cups around slowly, once or twice.',
      'Ask: "where is it?"',
    ],
    watchFor: 'Tracking the right cup even after it moves.',
    minutes: 3,
  },
  {
    id: 'b2-freeze-dance', band: 2, domain: 'processing', emoji: '🕺',
    title: 'Dance and FREEZE!',
    noel: 'When the music stops, even Noel turns to stone. Statue contest!',
    materials: 'Music you can pause',
    steps: [
      'Dance wildly together while the music plays.',
      'Pause it: "FREEZE!" — hold still, giggling allowed.',
      'Restart and repeat until someone falls over.',
    ],
    watchFor: 'Actually stopping on the pause — the beginnings of self-control.',
    minutes: 6,
  },
  {
    id: 'b2-water-pour', band: 2, domain: 'sensory', emoji: '🚿',
    title: 'The Waterfall Works',
    noel: 'Echo Cave has waterfalls! Build one in the bath or at the sink.',
    materials: 'Two cups, water, towels underneath (always supervise)',
    steps: [
      'Show pouring cup to cup, high and low.',
      'Add a floating toy to rain on.',
      'Narrate: "pouring… drip drip… empty!"',
    ],
    watchFor: 'Two-handed pouring with growing accuracy, and comfort with splashes.',
    minutes: 8,
  },
  {
    id: 'b2-shape-hole', band: 2, domain: 'processing', emoji: '⬛',
    title: 'The Shape Doors',
    noel: 'Round treasures only fit round doors! The square one is being stubborn.',
    materials: 'A shape sorter, or a box with a round and a square hole cut in the lid',
    steps: [
      'Offer just two shapes to start.',
      'Let them try wrong holes — wait before helping.',
      'Applaud the satisfying *clunk* of success.',
    ],
    watchFor: 'Rotating and re-trying until the shape fits — visual problem-solving.',
    minutes: 6,
  },
  {
    id: 'b2-texture-walk', band: 2, domain: 'sensory', emoji: '🦶',
    title: 'The Barefoot Trail',
    noel: 'Explorers cross grass, cushions, and bubbly towels — barefoot!',
    materials: 'Safe textures on the floor: cushion, towel, bubble wrap, rug',
    steps: [
      'Lay a short trail of different textures.',
      'Walk it together barefoot, slowly.',
      'Name each feeling: "soft… bumpy… crinkly!"',
    ],
    watchFor: 'Willingness to try each texture — note any that are always avoided.',
    minutes: 6,
  },

  // ════════ BAND 3 · Little Adventurer (≈ 2½ – 4 yrs) ════════

  {
    id: 'b3-flour-trace', band: 3, domain: 'fine motor', emoji: '✍️',
    title: 'Magic Finger Spells',
    noel: 'Wizards draw spells in flour! Circles make fireflies appear!',
    materials: 'A tray with a thin layer of flour, sand, or rice',
    steps: [
      'Draw a big slow circle with one finger; have them trace over it.',
      'Try a straight line, then a wiggly one.',
      'Shake the tray — magic eraser! — and cast again.',
    ],
    watchFor: 'One pointer finger (not the whole hand) making controlled circles and lines.',
    minutes: 7,
  },
  {
    id: 'b3-bead-string', band: 3, domain: 'fine motor', emoji: '📿',
    title: 'The Treasure Necklace',
    noel: 'String the dragon\'s beads before she wakes up! She loves necklaces.',
    materials: 'Big beads or dry penne pasta, a shoelace with a taped tip',
    steps: [
      'Show one slow threading, then hand it over.',
      'One hand holds the lace, one steers the bead.',
      'Wear the finished necklace to dinner. Mandatory.',
    ],
    watchFor: 'Two hands doing different jobs at once — threading is teamwork between them.',
    minutes: 8,
  },
  {
    id: 'b3-dough-scissors', band: 3, domain: 'fine motor', emoji: '✂️',
    title: 'The Snake Barber',
    noel: 'The playdough snakes need haircuts! Snip snip snip!',
    materials: 'Playdough snakes, child-safe scissors (always supervise)',
    steps: [
      'Roll snakes together first.',
      'Show thumb-up scissor hold: "thumb in the top hole!"',
      'Snip the snakes into tiny dragon snacks.',
    ],
    watchFor: 'Opening and closing scissors with one hand, thumb on top.',
    minutes: 8,
  },
  {
    id: 'b3-dress-up-race', band: 3, domain: 'fine motor', emoji: '🧥',
    title: 'The Adventurer Suit-Up',
    noel: 'Adventurers dress THEMSELVES. Zips, buttons, velcro — gear up!',
    materials: 'A zip-up jacket, big-buttoned shirt, or velcro shoes',
    steps: [
      'Start the zipper, let them pull it up.',
      'Try one big button through a hole together.',
      'Time the suit-up — can they beat yesterday?',
    ],
    watchFor: 'Zipping up alone; working a big button through with two hands.',
    minutes: 6,
  },
  {
    id: 'b3-first-then', band: 3, domain: 'communication', emoji: '🎯',
    title: 'The Two-Step Mission',
    noel: 'Secret mission from Noel: FIRST touch the door, THEN bring a spoon!',
    materials: 'Nothing — just the room around you',
    steps: [
      'Give a two-part mission: "first X, then Y." Say it once.',
      'Watch — no reminders if you can resist!',
      'Swap roles: let them give YOU a two-step mission.',
    ],
    watchFor: 'Both steps done in order from one telling.',
    minutes: 3,
  },
  {
    id: 'b3-tea-party', band: 3, domain: 'communication', emoji: '🫖',
    title: 'The Story Keepers\' Tea Party',
    noel: 'Kailia and Noel are invited to tea! Who pours? Who serves the cake?',
    materials: 'Toy tea set or cups, stuffed animal guests',
    steps: [
      'Set roles: they\'re the host, you\'re a very silly guest.',
      'Ask the guests questions: "Teddy, sugar or lemon?"',
      'Follow their pretend story wherever it goes.',
    ],
    watchFor: 'Full pretend sequences, talking for the toys, back-and-forth conversation turns.',
    minutes: 10,
  },
  {
    id: 'b3-today-retell', band: 3, domain: 'communication', emoji: '🌙',
    title: 'The Day Rewind',
    noel: 'Noel\'s bedtime ritual: rewind the day! What was the BEST part?',
    materials: 'Bedtime, or any cozy moment',
    steps: [
      'Ask "what did we do today?" and count moments on fingers.',
      'Prompt gently: "and THEN what happened?"',
      'Add your favorite part too — conversations go both ways.',
    ],
    watchFor: 'Telling 2–3 connected things in order ("we went park, I slide, then ice cream").',
    minutes: 5,
  },
  {
    id: 'b3-rhyme-spot', band: 3, domain: 'reading', emoji: '🎩',
    title: 'The Rhyming Spell',
    noel: 'Cat, hat, bat — rhymes are spell words! Noel giggles when they match.',
    materials: 'Nothing, or a rhyming picture book',
    steps: [
      'Say pairs: "cat… hat! Do they match?" (silly voice helps).',
      'Try a trick pair: "cat… banana?!" — giggle when it fails.',
      'Let them catch YOUR wrong answers.',
    ],
    watchFor: 'Hearing which words rhyme — a top predictor of reading readiness.',
    minutes: 3,
  },
  {
    id: 'b3-letter-hunt', band: 3, domain: 'reading', emoji: '🔠',
    title: 'Your Letter Is Everywhere',
    noel: 'The first letter of YOUR name is hiding all over town. Hunt it down!',
    materials: 'Cereal boxes, signs, books — print anywhere',
    steps: [
      'Show their letter big: "this is M — YOUR letter!"',
      'Hunt for it on boxes and signs all week.',
      'Keep a tally of every capture.',
    ],
    watchFor: 'Recognizing their letter in new places — print carries meaning.',
    minutes: 3,
  },
  {
    id: 'b3-story-ending', band: 3, domain: 'reading', emoji: '📕',
    title: 'You Finish the Story',
    noel: 'Noel lost the last page AGAIN. How does the story end? You decide!',
    materials: 'A familiar picture book',
    steps: [
      'Read together, then stop before the final page.',
      'Ask: "what happens next?"',
      'Accept every ending — dragons welcome — then read the real one.',
    ],
    watchFor: 'Predicting something sensible from the story so far.',
    minutes: 7,
  },
  {
    id: 'b3-plate-count', band: 3, domain: 'math', emoji: '🍽️',
    title: 'The Royal Feast Counter',
    noel: 'The dragon ordered EXACTLY three berries. Not two. Not four. THREE.',
    materials: 'Snack pieces and a plate',
    steps: [
      'Ask for an exact number on the plate: "give me 3."',
      'Count together touching each piece: "1… 2… 3!"',
      'Ask "how many?" at the end — see if the last number sticks.',
    ],
    watchFor: 'Touching one piece per number word, and knowing the last number IS the amount.',
    minutes: 3,
  },
  {
    id: 'b3-color-sort', band: 3, domain: 'math', emoji: '🌈',
    title: 'The Rainbow Vault',
    noel: 'The cave treasures got jumbled! Red gems here, blue gems there!',
    materials: 'Colored blocks/pompoms, bowls or colored paper "vaults"',
    steps: [
      'Sort a few together, naming colors.',
      'Speed round: can they finish before your silly song ends?',
      'Count each vault\'s treasure at the end.',
    ],
    watchFor: 'Sorting 3+ colors accurately and naming some of them.',
    minutes: 6,
  },
  {
    id: 'b3-missing-toy', band: 3, domain: 'processing', emoji: '🕵️',
    title: 'The Vanishing Toy Mystery',
    noel: 'One toy has VANISHED from the lineup! Detective, which one?!',
    materials: 'Three familiar toys and a cloth',
    steps: [
      'Line up three toys; name them together.',
      'Cover, sneak one away, reveal.',
      'Ask: "which one is missing?!" Swap roles after.',
    ],
    watchFor: 'Remembering which of three items disappeared — visual memory.',
    minutes: 3,
  },
  {
    id: 'b3-obstacle-course', band: 3, domain: 'processing', emoji: '🏔️',
    title: 'The Great Mountain Trail',
    noel: 'Over the cushion mountain, under the table cave, around the chair!',
    materials: 'Cushions, a table, a chair — living-room terrain',
    steps: [
      'Set a 3-part course and say the route out loud.',
      'Run it together, narrating: "over… under… around!"',
      'Let them redesign the course and teach it to you.',
    ],
    watchFor: 'Remembering a 3-step route, and understanding over/under/around.',
    minutes: 8,
  },
  {
    id: 'b3-smell-guess', band: 3, domain: 'sensory', emoji: '👃',
    title: 'The Sniff Detective',
    noel: 'Echo Cave\'s hardest test: eyes closed, nose ON. What is it?!',
    materials: 'Safe smelly things: orange peel, soap, cinnamon, banana',
    steps: [
      'Eyes closed (or gently covered), one sniff at a time.',
      'Offer two choices: "banana or soap?"',
      'Swap: they pick a smell to stump YOU.',
    ],
    watchFor: 'Playing with eyes closed comfortably and matching smells to names.',
    minutes: 4,
  },
  {
    id: 'b3-heavy-light', band: 3, domain: 'sensory', emoji: '🏋️',
    title: 'The Strong Explorer Test',
    noel: 'Which pack is heavier? Real explorers can tell with their arms!',
    materials: 'Two bags: one light, one heavier (books vs. socks)',
    steps: [
      'Let them lift both, one in each hand.',
      'Ask: "which is heavy? which is light?"',
      'Do a "heavy work" march carrying the big one — great before calm-down time.',
    ],
    watchFor: 'Telling heavy from light; note if they crave or avoid the heavy carrying.',
    minutes: 3,
  },
  {
    id: 'b3-draw-person', band: 3, domain: 'fine motor', emoji: '🖼️',
    title: 'Draw Your Hero',
    noel: 'Kailia needs a portrait for the Story Keepers\' wall. Draw her — or YOU!',
    materials: 'Crayons and paper',
    steps: [
      'Ask them to draw a person — any person.',
      'No fixing, no guiding. Just watch.',
      'Ask about it after: "tell me about your picture!"',
    ],
    watchFor: 'A head with some features; maybe arms or legs sticking out. Every scribble-person counts.',
    minutes: 7,
  },
];

// ── Daily quests ──
// Three activities per day from the child's band, rotating domains,
// picked deterministically from the date so the list is stable all day.

function seededRandom(seed: string): () => number {
  let h = 1779033703;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// The free daily set is deliberately small: two quick quests, the shortest
// good pair among the day's rotating candidates — so it always feels doable
// and tomorrow is worth coming back for.
export function todaysQuests(band: 1 | 2 | 3): ParentActivity[] {
  const rand = seededRandom(todayKey() + '-band' + band);
  const pool = ACTIVITIES.filter(a => a.band === band);
  const shuffled = [...pool].sort(() => rand() - 0.5);
  // consider the first six of today's shuffle, keep the quickest
  // two that exercise different skills
  const candidates = shuffled.slice(0, 6);
  let best: ParentActivity[] = [];
  let bestTotal = Infinity;
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i], b = candidates[j];
      if (a.domain === b.domain) continue;
      if (a.minutes + b.minutes < bestTotal) { best = [a, b]; bestTotal = a.minutes + b.minutes; }
    }
  }
  return best.length ? best : shuffled.slice(0, 2);
}

export function dailyMinutes(quests: ParentActivity[]): number {
  return quests.reduce((s, q) => s + q.minutes, 0);
}

// ── Parent reports (saved on this device) ──

const REPORT_KEY = 'kailia_daily_v1';

export type ReportScore = 0 | 1 | 2; // not yet / with help / did it

interface ReportLog { [date: string]: { [activityId: string]: ReportScore } }

function loadReports(): ReportLog {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(REPORT_KEY) ?? '{}'); } catch { return {}; }
}

export function getTodayReports(): { [activityId: string]: ReportScore } {
  return loadReports()[todayKey()] ?? {};
}

export function reportActivity(activity: ParentActivity, score: ReportScore) {
  const log = loadReports();
  const day = todayKey();
  log[day] = { ...(log[day] ?? {}), [activity.id]: score };
  try { localStorage.setItem(REPORT_KEY, JSON.stringify(log)); } catch { /* ignore */ }
  logQuestMetric(activity.domain, `parent-${activity.id}`, { score, band: activity.band });
}

export function streakDays(): number {
  const log = loadReports();
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (log[key] && Object.keys(log[key]).length > 0) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}
