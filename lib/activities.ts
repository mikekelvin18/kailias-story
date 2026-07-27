// ── The Parent & Baby Quest Library ──
// Real-world, OT-informed play activities for the youngest children,
// organized by developmental band and domain. Noel frames each one as a
// quest; the parent plays it with the child off-screen, then reports with
// one tap. Reports feed the quiet measurement log.
//
// Band 1 ≈ 6–18 months · Band 2 ≈ 18 mo–2½ yrs · Band 3 ≈ 2½–4 yrs

import { logQuestMetric } from './metrics';
import { scopedKey } from './family';

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
    id: 'b1-blanket-peekaboo', band: 1, domain: 'processing', emoji: '🧻',
    title: 'Blanket Peekaboo',
    noel: 'Noel LOVES hiding under his scarf — but he never stays hidden long!',
    materials: 'A light muslin blanket or scarf',
    steps: [
      'Drape the blanket loosely over your own face.',
      'Pull it off with a big "peekaboo!"',
      'Try draping it gently over your child\'s hands and let them pull it off.',
    ],
    watchFor: 'Anticipating the reveal — reaching to pull the blanket off themselves.',
    minutes: 4,
  },
  {
    id: 'b1-toy-swap', band: 1, domain: 'processing', emoji: '🔄',
    title: 'Which Hand?',
    noel: 'Noel hid a berry in one paw — can baby figure out which one?',
    materials: 'One small toy or snack',
    steps: [
      'Show the toy, then close both hands slowly while they watch.',
      'Hold both fists out and let them pick a hand.',
      'Open it together — celebrate a find or a miss the same way.',
    ],
    watchFor: 'Reaching for or pointing to one hand instead of grabbing at both randomly.',
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
    id: 'b1-one-more-tower', band: 1, domain: 'math', emoji: '🧩',
    title: "Noel's One-More Tower",
    noel: 'Noel counts every block he gets — even if it is just to "one"!',
    materials: '3 large soft blocks',
    steps: [
      'Hand your child one block, saying "one!"',
      'Hand a second, saying "one more!"',
      'Let them add, drop, or knock it — celebrate either way.',
    ],
    watchFor: 'Noticing a new object joins the pile, even without saying a number yet.',
    minutes: 5,
  },
  {
    id: 'b1-empty-full-cup', band: 1, domain: 'math', emoji: '🥛',
    title: 'Empty Cup, Full Cup',
    noel: 'Noel likes his bamboo cup very full — or very empty. Never in between!',
    materials: 'Two small cups and dry cereal or pom-poms',
    steps: [
      'Show one empty cup and one full cup side by side.',
      'Say "empty" and "full" while tipping each one toward them.',
      'Let your child dump the full one into the empty one.',
    ],
    watchFor: 'Noticing the difference between a full and an empty container — an early quantity concept.',
    minutes: 5,
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
    id: 'b1-flap-book-touch', band: 1, domain: 'reading', emoji: '🐾',
    title: 'Touch-and-Feel Pages',
    noel: 'Noel loves the fuzzy page best — his favorite part of any story!',
    materials: 'Any board or touch-and-feel book',
    steps: [
      'Sit them on your lap, book open flat.',
      'Guide their hand to touch each textured spot as you name it.',
      'Let them turn (or flap) the page themselves.',
    ],
    watchFor: 'Reaching toward the book on their own, patting a textured page.',
    minutes: 5,
  },
  {
    id: 'b1-point-picture-book', band: 1, domain: 'reading', emoji: '🐶',
    title: "Where's the Puppy?",
    noel: 'Noel spots his friends hiding on every page — can baby find them too?',
    materials: 'A simple picture book with one clear image per page',
    steps: [
      'Open to a page with one easy-to-name object or animal.',
      'Point and name it slowly: "puppy!"',
      'Ask "where\'s the puppy?" on the next read and wait for a point or a look.',
    ],
    watchFor: 'Looking at or pointing to the named picture — connecting a word to an image.',
    minutes: 5,
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
  {
    id: 'b1-nesting-cups', band: 1, domain: 'fine motor', emoji: '🥤',
    title: 'Nesting Cup Discovery',
    noel: 'Noel found cups that hide inside each other — how curious is that?!',
    materials: '3-4 stacking/nesting cups of different sizes',
    steps: [
      'Show how the small cup disappears inside the big one.',
      'Let them try fitting one cup into another, any order.',
      'Dump them all out together and start again.',
    ],
    watchFor: 'Turning or rotating a cup to try to make it fit — early problem-solving with shapes.',
    minutes: 6,
  },
  {
    id: 'b1-tear-crinkle', band: 1, domain: 'fine motor', emoji: '📰',
    title: 'Tear and Crinkle',
    noel: 'Noel loves the crinkly sound old maps make when you scrunch them!',
    materials: 'Scrap paper or a paper bag (safe, supervised)',
    steps: [
      'Show them how to tear a strip and scrunch it into a ball.',
      'Let their fingers pull and crumple at their own pace.',
      'Toss the paper balls into a basket together.',
    ],
    watchFor: 'Using both hands together, pulling apart with fingers instead of just fisting the paper.',
    minutes: 5,
  },
  {
    id: 'b1-copy-my-sound', band: 1, domain: 'communication', emoji: '🗨️',
    title: 'Copy My Sound',
    noel: 'Noel makes a silly sound — can baby copy it back?',
    materials: 'Nothing — just your voice',
    steps: [
      'Make a simple sound close to their face: "ba-ba" or "ah-ah."',
      'Pause and wait a few seconds for any response.',
      'Copy back whatever sound THEY make, even if it is new.',
    ],
    watchFor: 'Attempting to repeat a sound back, or repeating a sound you copied from them.',
    minutes: 4,
  },
  {
    id: 'b1-wheres-kailia', band: 1, domain: 'communication', emoji: '🙈',
    title: "Where's Kailia?",
    noel: 'Noel keeps asking "where did she go?" — can baby help him look?',
    materials: 'Nothing, or a favorite toy',
    steps: [
      'Hide your face behind your hands and ask "where did I go?"',
      'Pop out with a big smile: "there I am!"',
      'Try hiding a toy behind your back and asking "where is it?"',
    ],
    watchFor: 'Looking toward where you disappeared, or vocalizing when you pop back out.',
    minutes: 3,
  },
  {
    id: 'b1-point-and-name', band: 1, domain: 'reading', emoji: '👆',
    title: 'Point and Name',
    noel: 'Noel points at everything he sees — trees, cups, doggies!',
    materials: 'Nothing — your everyday surroundings',
    steps: [
      'Point at something nearby and say its name clearly.',
      'Take their hand gently and help them point too.',
      'Take turns pointing at different things on a walk or at home.',
    ],
    watchFor: 'Following your point with their eyes, or starting to point at things themselves.',
    minutes: 4,
  },
  {
    id: 'b1-board-book-time', band: 1, domain: 'reading', emoji: '📕',
    title: 'Sturdy Book Time',
    noel: 'Noel has a favorite board book he chews on the corner of — every page is an adventure!',
    materials: 'Any sturdy board book',
    steps: [
      'Let them hold and explore the book however they want — mouthing is normal.',
      'Turn a page together, narrating one simple word per page.',
      'Follow their lead if they want to flip back and forth.',
    ],
    watchFor: 'Reaching for the book on their own, or holding attention on a page for a few seconds.',
    minutes: 5,
  },
  {
    id: 'b1-one-block-two', band: 1, domain: 'math', emoji: '🧊',
    title: 'One Block, Two Blocks',
    noel: 'Noel counts his blocks super slowly: "one... two!"',
    materials: '2-3 large blocks',
    steps: [
      'Hand over one block, counting "one!" out loud.',
      'Hand a second, counting "two!"',
      'Let them bang the blocks together — celebrate the sound.',
    ],
    watchFor: 'Watching each block as it is added, showing they notice the collection growing.',
    minutes: 4,
  },
  {
    id: 'b1-fill-the-cup', band: 1, domain: 'math', emoji: '🥣',
    title: 'Fill the Cup',
    noel: 'Noel wants his bamboo cup filled all the way to the top!',
    materials: 'A cup and dry cereal, pom-poms, or water at bath time',
    steps: [
      'Drop items in one at a time, counting as you go.',
      'Let them dump it all out when it is "full."',
      'Start again — repetition is the whole game.',
    ],
    watchFor: 'Anticipating the dump, or trying to add items in themselves.',
    minutes: 5,
  },
  {
    id: 'b1-squishy-bag', band: 1, domain: 'sensory', emoji: '🧴',
    title: 'Squishy Bag Discovery',
    noel: 'Noel made a squishy bag that squelches when you press it!',
    materials: 'A sealed zip-top bag with hair gel or water beads (taped shut, supervised)',
    steps: [
      'Let them press and squish the sealed bag with open palms.',
      'Name what they feel: "squishy! squashy!"',
      'Try tracing a shape on top of the bag with one finger.',
    ],
    watchFor: 'Willingness to touch and press the bag; note if they pull away and try again later instead.',
    minutes: 5,
  },
  {
    id: 'b1-shaker-along', band: 1, domain: 'sensory', emoji: '🪇',
    title: 'Shaker Along',
    noel: 'Noel made a shaker from a bottle — shake shake shake!',
    materials: 'A small sealed bottle with rice or beans inside (taped shut)',
    steps: [
      'Shake the bottle near them and let them watch and listen.',
      'Guide their hand to shake it themselves.',
      'Shake fast and slow, naming each speed.',
    ],
    watchFor: 'Shaking with purpose to make the sound again, not just holding it still.',
    minutes: 4,
  },
  {
    id: 'b1-find-it-under', band: 1, domain: 'processing', emoji: '🧦',
    title: 'Find It Under There',
    noel: 'Noel hides his favorite toy under a cloth — can you find it?',
    materials: 'A cloth or towel and one favorite toy',
    steps: [
      'Show the toy, then slowly cover half of it with the cloth.',
      'Ask "where is it?" and wait for them to reach.',
      'Once easy, cover the toy completely.',
    ],
    watchFor: 'Reaching to uncover a PARTIALLY hidden toy, then eventually a fully hidden one.',
    minutes: 4,
  },
  {
    id: 'b1-push-the-button', band: 1, domain: 'processing', emoji: '🔘',
    title: 'Push the Button',
    noel: 'Noel found a button that makes a sound every time you press it!',
    materials: 'Any push-button toy, light switch, or simple cause-effect toy',
    steps: [
      'Press it once and react with delight at the sound/light.',
      'Guide their finger to press it themselves.',
      'Wait to see if they try pressing it again on their own.',
    ],
    watchFor: 'Repeating the press themselves to make the effect happen again — understanding cause and effect.',
    minutes: 4,
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
    id: 'b2-count-steps', band: 2, domain: 'math', emoji: '🪜',
    title: 'Counting Steps with Noel',
    noel: 'Noel counts every single step on his walk — join in and count together!',
    materials: 'None — just a hallway or a few stairs',
    steps: [
      'Walk together saying "one, two, three…" on each step.',
      'Pause and ask "how many was that?" — any answer counts.',
      'Repeat on the way back, a little faster.',
    ],
    watchFor: 'Joining in on some of the counting words, even out of order.',
    minutes: 5,
  },
  {
    id: 'b2-two-groups', band: 2, domain: 'math', emoji: '🧸',
    title: 'Two Piles for Two Friends',
    noel: 'Noel and Kailia both need toys — can you share them evenly?',
    materials: '6–8 small toys and two baskets or hoops',
    steps: [
      'Line up the toys and the two baskets.',
      'Hand toys one at a time: "one for Noel, one for Kailia."',
      'Let your child take over handing them out once they get the pattern.',
    ],
    watchFor: 'Alternating between the two baskets instead of dumping everything in one.',
    minutes: 6,
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
  {
    id: 'b2-scent-jars', band: 2, domain: 'sensory', emoji: '🌼',
    title: "Noel's Sniff Jars",
    noel: 'Noel keeps his favorite smells in little jars — lemon, mint, and flowers!',
    materials: '2–3 small lidded jars with cotton dabbed in mild safe scents (vanilla, orange peel, mint leaf)',
    steps: [
      'Hold one jar near their nose (never touching skin) and say the scent name.',
      'Let them react — a smile, a scrunch, a turn away all count.',
      'Try the next jar and see if the reaction changes.',
    ],
    watchFor: 'Different reactions to different smells — an early sense-discrimination sign.',
    minutes: 5,
  },
  {
    id: 'b2-sound-guess', band: 2, domain: 'sensory', emoji: '🔊',
    title: 'What Made That Sound?',
    noel: 'Noel hears something behind him — a bell? a crinkle? Help him guess!',
    materials: 'Two very different noisy objects (bell, crinkly bag, jingling keys)',
    steps: [
      'Sit back to back or have them close their eyes.',
      'Make one sound and ask "what was that?"',
      'Show the object, then try the other sound.',
    ],
    watchFor: 'Turning toward the sound, or naming/pointing to the right object afterward.',
    minutes: 5,
  },
  {
    id: 'b2-tape-peel', band: 2, domain: 'fine motor', emoji: '🩹',
    title: 'Peel the Tape',
    noel: 'Noel got stickers stuck all over his paws — help peel them off!',
    materials: 'Painter\'s tape or large stickers stuck to a table edge',
    steps: [
      'Stick a few pieces of tape with an edge sticking up.',
      'Show them how to pinch the edge and peel slowly.',
      'Stick them back down and let them peel again and again.',
    ],
    watchFor: 'Using a pincer grip (thumb + finger) to lift the edge instead of a whole-hand swipe.',
    minutes: 6,
  },
  {
    id: 'b2-lace-cards', band: 2, domain: 'fine motor', emoji: '🧵',
    title: 'Big Bead Threading',
    noel: 'Noel is making a necklace for Kailia — big beads on a shoelace!',
    materials: 'Large beads (or pasta wheels) and a shoelace or thick string',
    steps: [
      'Tie a knot at one end so beads don\'t fall off.',
      'Show them threading one bead onto the string.',
      'Let them keep going at their own pace — a few beads is a win.',
    ],
    watchFor: 'Holding the string steady with one hand while guiding the bead with the other.',
    minutes: 7,
  },
  {
    id: 'b2-two-word-phrase', band: 2, domain: 'communication', emoji: '💬',
    title: 'Two Words Together',
    noel: 'Noel is learning to put two whole words together — "more bamboo!"',
    materials: 'Nothing — everyday moments',
    steps: [
      'Model simple two-word phrases during play: "big ball," "go car."',
      'Pause expectantly after an action, giving them a chance to comment.',
      'Repeat back and expand anything they say: "ball" becomes "big ball!"',
    ],
    watchFor: 'Combining two words on their own, even if pronunciation is unclear.',
    minutes: 5,
  },
  {
    id: 'b2-phone-pretend', band: 2, domain: 'communication', emoji: '📞',
    title: 'Pretend Phone Call',
    noel: 'Ring ring! Noel wants to talk to someone on his banana phone.',
    materials: 'A toy phone, banana, or block held to the ear',
    steps: [
      'Hold a "phone" to your ear and say "hello!"',
      'Hand it over and ask them to say hello too.',
      'Have a silly back-and-forth pretend conversation.',
    ],
    watchFor: 'Taking conversational turns — waiting for their "turn" to talk after yours.',
    minutes: 5,
  },
  {
    id: 'b2-same-picture', band: 2, domain: 'reading', emoji: '🖼️',
    title: 'Find the Same Picture',
    noel: 'Noel has two of everything — can you find the matching pair?',
    materials: 'Two identical simple picture books or two sets of picture cards',
    steps: [
      'Show one picture and ask "can you find one like this?"',
      'Let them search and point among a few choices.',
      'Celebrate any match, close or exact.',
    ],
    watchFor: 'Comparing images and picking a matching one instead of a random pick.',
    minutes: 6,
  },
  {
    id: 'b2-name-the-animal', band: 2, domain: 'reading', emoji: '🐘',
    title: 'Name That Animal',
    noel: 'Noel is quizzing every animal in the picture book today!',
    materials: 'Any animal picture book',
    steps: [
      'Point to an animal and ask "what is this?"',
      'If unsure, say the name and the sound it makes together.',
      'Let them flip to pick which animal to name next.',
    ],
    watchFor: 'Naming a familiar animal correctly, or attempting the animal\'s sound.',
    minutes: 5,
  },
  {
    id: 'b2-sort-by-color', band: 2, domain: 'math', emoji: '🔴',
    title: 'Sort by Color',
    noel: 'Noel wants his blocks in color piles — red here, blue there!',
    materials: 'Blocks, toys, or pom-poms in 2-3 colors',
    steps: [
      'Start two small piles by color, naming each one.',
      'Hand over one item at a time: "where does this go?"',
      'Let them sort the rest, checking in only if asked.',
    ],
    watchFor: 'Placing an item in the matching-color pile more often than not.',
    minutes: 6,
  },
  {
    id: 'b2-how-many-fingers', band: 2, domain: 'math', emoji: '✋',
    title: 'How Many Fingers?',
    noel: 'Noel holds up his paw — how many fingers is that?!',
    materials: 'Nothing — just hands',
    steps: [
      'Hold up 1 finger, count "one!"',
      'Hold up 2, count "one, two!"',
      'Ask them to hold up fingers too and count together.',
    ],
    watchFor: 'Holding up a matching number of fingers, or joining in on the counting words.',
    minutes: 4,
  },
  {
    id: 'b2-mystery-bag', band: 2, domain: 'sensory', emoji: '👜',
    title: 'What\'s in the Bag?',
    noel: 'Noel filled a bag with mystery objects — feel and guess!',
    materials: 'A cloth bag and 3-4 familiar objects (spoon, ball, block)',
    steps: [
      'Let them reach in and feel one object without looking.',
      'Ask "what do you think it is?" before pulling it out.',
      'Reveal it together and try the next object.',
    ],
    watchFor: 'Describing the object by feel (round, hard, soft) before seeing it.',
    minutes: 6,
  },
  {
    id: 'b2-hot-cold-game', band: 2, domain: 'sensory', emoji: '🌡️',
    title: 'Warm or Cool?',
    noel: 'Noel likes his bamboo warm, but his ice pop cool — can you tell the difference?',
    materials: 'A warm (not hot) washcloth and a cool washcloth or ice pack',
    steps: [
      'Let them touch the warm cloth first, naming "warm!"',
      'Then the cool one: "cool!"',
      'Swap back and forth, asking them to guess before touching.',
    ],
    watchFor: 'Correctly telling warm from cool by touch, or guessing before confirming.',
    minutes: 5,
  },
  {
    id: 'b2-what-goes-together', band: 2, domain: 'processing', emoji: '🧦',
    title: 'What Goes Together?',
    noel: 'Noel mixed up his socks and shoes — help him match the pairs!',
    materials: 'A few matching pairs (socks, mittens, cups and lids)',
    steps: [
      'Lay out mixed-up pairs and pick up one item.',
      'Ask "which one goes with this?"',
      'Let them search and match the rest.',
    ],
    watchFor: 'Matching by an obvious feature (color, size) rather than randomly.',
    minutes: 6,
  },
  {
    id: 'b2-simple-puzzle', band: 2, domain: 'processing', emoji: '🧩',
    title: 'First Big Puzzle',
    noel: 'Noel found a puzzle with just a few big pieces — can you fit them in?',
    materials: 'A 2-4 piece chunky knob puzzle',
    steps: [
      'Take a piece out and hold it up to show its matching hole.',
      'Let them try placing it, turning if needed.',
      'Take turns taking pieces out and putting them back.',
    ],
    watchFor: 'Rotating a piece to try to make it fit, rather than forcing it in one orientation.',
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
    id: 'b3-dragon-toll', band: 3, domain: 'math', emoji: '🐲',
    title: "Pay the Dragon's Toll",
    noel: 'The dragon only lets you pass if you count out the EXACT toll!',
    materials: '10+ small counters (coins, buttons, blocks) and a bowl "toll box"',
    steps: [
      'Ask for a toll: "the dragon wants 3!"',
      'Let them count out and drop in exactly that many.',
      'Raise the number each round as long as it stays fun.',
    ],
    watchFor: 'Counting out an exact quantity on request, not just counting aloud.',
    minutes: 6,
  },
  {
    id: 'b3-more-or-less', band: 3, domain: 'math', emoji: '⚖️',
    title: 'More, Less, or the Same?',
    noel: 'Noel wants to know — does Kailia have more gems, or does he?',
    materials: 'Two small piles of the same object (5–8 each), slightly different counts',
    steps: [
      'Set two piles side by side, uneven amounts.',
      'Ask "which pile has more? which has less?"',
      'Make them equal together and ask again: "same now?"',
    ],
    watchFor: 'Comparing pile sizes correctly, and noticing when they become equal.',
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
    id: 'b3-simon-says-two', band: 3, domain: 'processing', emoji: '🙌',
    title: 'Two-Step Simon Says',
    noel: 'Noel gives TWO instructions at once now — can you catch them both?',
    materials: 'None',
    steps: [
      'Give a two-part instruction: "touch your nose, then clap!"',
      'Let them try before repeating it.',
      'Add a silly third step once two feels easy.',
    ],
    watchFor: 'Completing both steps, in the right order, from a single instruction.',
    minutes: 5,
  },
  {
    id: 'b3-pattern-blocks', band: 3, domain: 'processing', emoji: '🔺',
    title: "Owl's Pattern Puzzle",
    noel: 'The wise owl loves patterns — red, blue, red, blue… what comes next?',
    materials: 'Blocks or beads in 2 alternating colors/shapes',
    steps: [
      'Lay out a simple pattern: red, blue, red, blue.',
      'Ask "what comes next?" and let them place it.',
      'Try a trickier pattern (red, red, blue) once that clicks.',
    ],
    watchFor: 'Predicting and continuing a simple repeating pattern.',
    minutes: 6,
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
    id: 'b3-texture-sort', band: 3, domain: 'sensory', emoji: '🧦',
    title: 'The Feely Sock Sort',
    noel: 'Noel keeps his socks in a mystery bag — soft, rough, bumpy, smooth!',
    materials: 'A bag or pillowcase, 4–5 small items with different textures (sponge, spoon, cotton ball, brush)',
    steps: [
      'Let them feel one item outside the bag first and name the texture.',
      'Hide it in the bag with the others.',
      'Ask them to find it again by feel alone.',
    ],
    watchFor: 'Identifying an object by touch without looking — tactile discrimination.',
    minutes: 6,
  },
  {
    id: 'b3-loud-quiet', band: 3, domain: 'sensory', emoji: '🥁',
    title: 'Loud Noel, Quiet Noel',
    noel: 'Sometimes Noel stomps like a giant — sometimes he tiptoes like a mouse!',
    materials: 'None, or a drum/pot and spoon',
    steps: [
      'Demonstrate a loud stomp/bang, then a quiet tiptoe/tap.',
      'Call out "loud!" or "quiet!" and have them respond with the matching action.',
      'Let them call the instructions for you.',
    ],
    watchFor: 'Adjusting movement or sound volume correctly to match the word.',
    minutes: 5,
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
  {
    id: 'b3-scissor-snips', band: 3, domain: 'fine motor', emoji: '✂️',
    title: 'Snip the Strips',
    noel: 'Noel needs paper strips cut for his banner — snip snip snip!',
    materials: 'Child-safe scissors and 1-inch-wide paper strips',
    steps: [
      'Show how to open and close the scissors on a strip.',
      'Draw a thick line for them to try cutting toward.',
      'Let them snip strips into confetti — supervised the whole time.',
    ],
    watchFor: 'Opening and closing the scissors with one continuous snip, not several small chomps.',
    minutes: 7,
  },
  {
    id: 'b3-clothespin-pinch', band: 3, domain: 'fine motor', emoji: '📎',
    title: 'Clothespin Clip Race',
    noel: 'Noel is hanging up his laundry — help clip the clothespins on!',
    materials: 'A few clothespins and the edge of a box or basket',
    steps: [
      'Show how to squeeze a clothespin open and clip it on.',
      'Let them try clipping several around the edge.',
      'Race to unclip them all just as fast.',
    ],
    watchFor: 'Using thumb and fingers together to squeeze the spring, building hand strength.',
    minutes: 6,
  },
  {
    id: 'b3-retell-the-day', band: 3, domain: 'communication', emoji: '📅',
    title: 'Tell Me About Today',
    noel: 'Noel wants to hear the WHOLE story of your day, start to finish!',
    materials: 'Nothing — a quiet moment, like bedtime',
    steps: [
      'Ask an open question: "what did you do today?"',
      'Wait through the pause — resist filling in for them.',
      'Ask one gentle follow-up: "then what happened?"',
    ],
    watchFor: 'Retelling 2-3 events in roughly the order they happened.',
    minutes: 5,
  },
  {
    id: 'b3-opposite-game', band: 3, domain: 'communication', emoji: '⚖️',
    title: 'Opposite Day',
    noel: 'Noel says a word — can you say the total opposite?',
    materials: 'Nothing',
    steps: [
      'Say a simple word: "big!" and wait for "small!"',
      'Try a few easy pairs: hot/cold, up/down, fast/slow.',
      'Let them give YOU a word to find the opposite of.',
    ],
    watchFor: 'Producing a correct or reasonable opposite, showing they grasp the concept of contrast.',
    minutes: 5,
  },
  {
    id: 'b3-what-comes-next', band: 3, domain: 'reading', emoji: '📖',
    title: 'What Happens Next?',
    noel: 'Noel stops mid-story — what do YOU think happens next?',
    materials: 'A familiar picture book',
    steps: [
      'Read partway through a page, then pause before turning.',
      'Ask "what do you think happens next?"',
      'Turn the page and compare to their guess — celebrate any idea.',
    ],
    watchFor: 'Offering a guess connected to the story so far, showing they are following along.',
    minutes: 6,
  },
  {
    id: 'b3-first-letter-hunt', band: 3, domain: 'reading', emoji: '🔤',
    title: "Letter Hunt Around the House",
    noel: 'Noel is looking for the letter that starts YOUR name — help him find it!',
    materials: 'Magnetic letters, alphabet cards, or just your eyes',
    steps: [
      'Show the first letter of their name and say its sound.',
      'Go on a hunt to find that same letter on labels, books, or signs.',
      'Celebrate every match, near or exact.',
    ],
    watchFor: 'Recognizing the same letter shape in a new place, not just where it was first shown.',
    minutes: 7,
  },
  {
    id: 'b3-store-pretend', band: 3, domain: 'math', emoji: '🛒',
    title: 'Pretend Grocery Store',
    noel: 'Noel opened a pretend shop — how many snacks would you like to buy?',
    materials: 'A few pretend or real food items, pretend coins optional',
    steps: [
      'Set up a few items as a "store."',
      'Ask them to buy an exact number: "get me 3 apples!"',
      'Take turns being the shopper and the shopkeeper.',
    ],
    watchFor: 'Counting out the exact requested amount instead of guessing a handful.',
    minutes: 7,
  },
  {
    id: 'b3-taller-shorter', band: 3, domain: 'math', emoji: '📏',
    title: 'Taller or Shorter?',
    noel: 'Noel wants to know — is the tower taller than YOU, or shorter?',
    materials: 'Blocks or stackable cups',
    steps: [
      'Build two towers of different heights together.',
      'Ask "which one is taller? which is shorter?"',
      'Compare a tower to their own height for extra fun.',
    ],
    watchFor: 'Correctly identifying taller/shorter between two clearly different heights.',
    minutes: 6,
  },
  {
    id: 'b3-guess-the-texture', band: 3, domain: 'sensory', emoji: '🧶',
    title: 'Guess by Touch Alone',
    noel: 'Eyes closed, hands ready — can you name what you\'re touching?',
    materials: '4-5 household items with different textures (sponge, spoon, cotton ball, key)',
    steps: [
      'With eyes closed, place one item in their hands.',
      'Ask them to describe or guess what it is.',
      'Reveal it, then try the next texture.',
    ],
    watchFor: 'Using descriptive words (bumpy, smooth, cold) before guessing the object.',
    minutes: 6,
  },
  {
    id: 'b3-balance-beam', band: 3, domain: 'sensory', emoji: '🤸',
    title: 'Balance Beam Adventure',
    noel: 'Noel made a wobbly bridge across the living room — can you cross it?',
    materials: 'A line of tape on the floor, or a low balance beam/curb',
    steps: [
      'Walk the line together first, arms out for balance.',
      'Let them try alone, offering a hand only if needed.',
      'Try walking backward or heel-to-toe once it feels easy.',
    ],
    watchFor: 'Staying on the line for several steps, and self-correcting a wobble rather than falling off.',
    minutes: 6,
  },
  {
    id: 'b3-whats-missing-tray', band: 3, domain: 'processing', emoji: '🍽️',
    title: "What's Missing From the Tray?",
    noel: 'Noel lined up 4 treasures — now one has vanished! Which one?',
    materials: '4-5 small familiar objects and a cloth',
    steps: [
      'Lay out the objects and name each one together.',
      'Cover with the cloth, secretly remove one, then reveal.',
      'Ask "what\'s missing?" — swap roles so they can hide one from you.',
    ],
    watchFor: 'Correctly naming the missing item from a set of 4-5 — a bigger memory span than the 3-item version.',
    minutes: 6,
  },
  {
    id: 'b3-follow-three-steps', band: 3, domain: 'processing', emoji: '📋',
    title: 'The Three-Step Mission',
    noel: 'Noel has a THREE part mission for you today — can you remember them all?',
    materials: 'Nothing, or simple props around the house',
    steps: [
      'Give a three-step instruction: "touch the door, clap twice, then sit down."',
      'Let them attempt all three in order before helping.',
      'Make up a new silly three-step mission each round.',
    ],
    watchFor: 'Completing all three steps in the correct order from a single telling.',
    minutes: 6,
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

// ── No-repeat rotation ──
// Rather than a plain per-day reshuffle (which can hand back an activity
// the child saw last week purely by chance), each band keeps a small
// history of recently-shown activity ids on this device. Today's pair is
// chosen preferring ids NOT in that history, so nothing repeats until the
// whole band's pool has been cycled through once — the history then
// clears and a fresh cycle (in a different order) begins. A pool of ~20
// gives ~10 repeat-free days; growing the pool is what stretches that
// toward a full year, not writing 365 literal unique days by hand.
const HISTORY_KEY = 'kailia_daily_history_v1';

// seenBefore: ids shown on any PRIOR day, frozen until this function
// itself advances it — never touched mid-day. cache: today's already-
// resolved pick, so calling this 50 times in one day (re-renders, re-
// navigations) always returns the exact same pair instead of drifting.
interface BandHistory { seenBefore: string[]; cacheDate: string; cacheIds: string[] }

function loadDailyHistory(): Record<string, BandHistory> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(scopedKey(HISTORY_KEY)) ?? '{}'); } catch { return {}; }
}

function saveDailyHistory(h: Record<string, BandHistory>) {
  try {
    const fam = JSON.parse(localStorage.getItem('kailia_family_v1') ?? 'null');
    if (!fam?.consent) return;
    localStorage.setItem(scopedKey(HISTORY_KEY), JSON.stringify(h));
  } catch { /* ignore */ }
}

// The free daily set is deliberately small: two quick quests, the shortest
// good pair among the day's rotating candidates — so it always feels doable
// and tomorrow is worth coming back for.
export function todaysQuests(band: 1 | 2 | 3): ParentActivity[] {
  const pool = ACTIVITIES.filter(a => a.band === band);
  const bandKey = String(band);
  const history = loadDailyHistory();
  const entry = history[bandKey];
  const today = todayKey();

  // Already resolved today — return the cached pair verbatim, no
  // recomputation, so repeated calls the same day never drift.
  if (entry?.cacheDate === today && entry.cacheIds.length) {
    const cached = entry.cacheIds.map(id => pool.find(a => a.id === id)).filter(Boolean) as ParentActivity[];
    if (cached.length === entry.cacheIds.length) return cached;
  }

  const seenBefore = new Set(entry?.seenBefore ?? []);
  const rand = seededRandom(today + '-band' + band);
  const shuffled = [...pool].sort(() => rand() - 0.5);
  // Prefer ids not shown on any prior day; once the pool is mostly
  // exhausted, fall back to the full shuffle so there's always a pair.
  const fresh = shuffled.filter(a => !seenBefore.has(a.id));
  const ordered = fresh.length >= 2 ? fresh : shuffled;

  const candidates = ordered.slice(0, 6);
  let best: ParentActivity[] = [];
  let bestTotal = Infinity;
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i], b = candidates[j];
      if (a.domain === b.domain) continue;
      if (a.minutes + b.minutes < bestTotal) { best = [a, b]; bestTotal = a.minutes + b.minutes; }
    }
  }
  const picked = best.length ? best : ordered.slice(0, 2);

  // Fold today's pair into seenBefore for TOMORROW's call; once
  // everything in the pool has been seen, start the next cycle fresh
  // instead of growing forever.
  const nextSeen = new Set(seenBefore);
  picked.forEach(a => nextSeen.add(a.id));
  const rolledOver = pool.length > 0 && nextSeen.size >= pool.length;
  saveDailyHistory({
    ...history,
    [bandKey]: {
      seenBefore: rolledOver ? [] : Array.from(nextSeen),
      cacheDate: today,
      cacheIds: picked.map(a => a.id),
    },
  });

  return picked;
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
  try { return JSON.parse(localStorage.getItem(scopedKey(REPORT_KEY)) ?? '{}'); } catch { return {}; }
}

export function getTodayReports(): { [activityId: string]: ReportScore } {
  return loadReports()[todayKey()] ?? {};
}

export function reportActivity(activity: ParentActivity, score: ReportScore) {
  // COPPA: reports are child data — no parental consent, no saving.
  try {
    const fam = JSON.parse(localStorage.getItem('kailia_family_v1') ?? 'null');
    if (!fam?.consent) return;
  } catch { return; }
  const log = loadReports();
  const day = todayKey();
  log[day] = { ...(log[day] ?? {}), [activity.id]: score };
  try { localStorage.setItem(scopedKey(REPORT_KEY), JSON.stringify(log)); } catch { /* ignore */ }
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
