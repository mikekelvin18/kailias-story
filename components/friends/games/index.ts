// ── The friends' signature games ──
// One genuinely new game per friend, each a Round plugged into the shared
// FriendGameShell. Played at /play/friend-games/<id> and placed as a stop
// on that friend's trail (lib/companionTrails.ts).

import type { FriendGameDef } from '../FriendGameShell';
import NightFlight from './NightFlight';
import VineWeave from './VineWeave';
import GemScales from './GemScales';
import StarLetters from './StarLetters';
import SlowWaves from './SlowWaves';
import KikoSays from './KikoSays';

export const FRIEND_GAMES: FriendGameDef[] = [
  {
    id: 'night-flight', slug: 'sage', title: 'Night Flight', Round: NightFlight,
    // a new little story every level (Kelvin 2026-11-23), dealt fairly
    stories: [
      'Hoo! I want to fly all the way across the sky tonight.',
      'The baby stars are playing follow the leader. Let\'s join in!',
      'I dropped my moon-light, and it\'s flying home on its own!',
      'Tonight is the big owl flying race!',
      'The fireflies want me to show them the way to the pond.',
      'A shooting star wants to play tag with us!',
      'I\'m practicing a brand-new flying path.',
      'The moon is lonely. Let\'s fly a happy path for her!',
    ],
    intro: 'Hoo! My moon-light will fly across the stars. Watch where it goes, then fly the same way!',
    cheers: ['Hoo-hoo! You remembered every star!', 'What a memory! The sky is glowing!', 'Perfect flight, little owl!'],
    tryAgain: ['That star was a tricky one. Let’s watch a new flight together!', 'Ooh, so close! Let’s fly again.', 'The stars are twinkly tonight. One more try!'],
    giggles: ['Hoo-hoo-hoo! My feathers are ticklish!', 'Hoo! You found my wing!', 'Again! Hoo hoo!'],
  },
  {
    id: 'vine-weave', slug: 'flick', title: 'Vine Weave', Round: VineWeave,
    // a new little story every level (Kelvin 2026-11-23), dealt fairly
    stories: [
      'My little flower is thirsty, and the vine can bring her water!',
      'Let\'s grow a vine bridge across the branches!',
      'Let\'s grow a vine swing for the forest friends!',
      'My vine wants to reach the sweetest flower.',
      'My vine wants to say hello to the sunflower.',
      'Let\'s grow a vine ladder all the way up!',
      'The forest is having a garden party. Let\'s grow decorations!',
      'Let\'s grow the longest vine ever!',
    ],
    intro: 'Help my vine grow to the flower! Drag the green tip through each gap in the branches.',
    cheers: ['Smooth as a fox tail! Look at it grow!', 'Steady paws! The flower loves it!', 'Right through the gaps. Wow!'],
    tryAgain: ['The branches tickled the vine. Let’s grow a new one!', 'Nice try! Slow and steady, let’s go again.', 'Wiggly vine! We can do it again together.'],
    giggles: ['Hee hee! Not my fluffy tail!', 'That tickles my ears!', 'Yip yip! Again!'],
  },
  {
    id: 'gem-scales', slug: 'ember', title: 'Gem Scales', Round: GemScales,
    // a new little story every level (Kelvin 2026-11-23), dealt fairly
    stories: [
      'Is one pile bigger? Let\'s check!',
      'The dragon market opens today, and every trade must be fair!',
      'I\'m sharing my treasure with my best friend, fair and square.',
      'I got gems for my birthday! Let\'s sort them.',
      'The treasure cave is getting tidy, one fair pile at a time.',
      'I\'m trading gems for cookies today!',
      'My crown needs the same number of gems on each side.',
      'Let\'s show everyone how a fair trade works!',
    ],
    intro: 'Make my treasure scale level! Put gems on your side until both sides are the same.',
    cheers: ['Perfectly balanced! You count like a dragon!', 'Level! My treasure is happy!', 'Just right! Roar-some counting!'],
    tryAgain: ['We got there! Next time let’s count first.', 'Balanced in the end! Let’s try another pile.', 'Phew, gems are tricky! One more?'],
    giggles: ['Rawr-ha-ha! That tickles!', 'My tummy is ticklish!', 'Hee hee, little sparks came out!'],
  },
  {
    id: 'star-letters', slug: 'nova', title: 'Star Letters', Round: StarLetters,
    // a new little story every level (Kelvin 2026-11-23), dealt fairly
    stories: [
      'The night sky wants to spell a secret message!',
      'I\'m writing a sky letter to my friend the moon.',
      'The stars are playing a letter game. Ready?',
      'I\'m learning my letters tonight!',
      'A comet zoomed by and scrambled the sky letters!',
      'Let\'s write a star story before bed.',
      'The sky library needs new letters on its books.',
      'I\'m making a rainbow alphabet in the sky!',
    ],
    intro: 'Let’s join the stars and draw a letter in the sky. Then find the word that starts with it!',
    cheers: ['Sparkly! You found the letter and the word!', 'A rainbow letter! Magic reading!', 'Yes! That word starts just right!'],
    tryAgain: ['Good drawing! Let’s listen to the sound again next time.', 'Ooh, letters can be sneaky. Another one!', 'Nice stars! Let’s try a new letter.'],
    giggles: ['Tee-hee! Sparkly giggles!', 'My mane goes swish!', 'Again, again! Neigh-hee!'],
  },
  {
    id: 'slow-waves', slug: 'shelly', title: 'Slow Waves', Round: SlowWaves,
    // a new little story every level (Kelvin 2026-11-23), dealt fairly
    stories: [
      'The sea is sleepy tonight. Let\'s breathe slowly with it.',
      'I\'m learning to float on my back.',
      'The moon is watching the waves. Let\'s be calm and quiet.',
      'We\'re floating to a little island far away.',
      'The sea is taking a nap. Let\'s be gentle waves.',
      'A soft breeze is blowing over the water today.',
      'Let\'s float like clouds on the water.',
      'The seashells are humming a slow song.',
    ], rounds: 3,
    intro: 'Let’s float on the waves together. In with the tide, out with the tide.',
    cheers: ['So calm and slow. Just like a turtle!', 'Beautiful breathing. The sea feels peaceful.', 'You and the waves moved together!'],
    tryAgain: ['That’s okay. Waves go up and down. Let’s float again.', 'Nice and easy. Let’s try one more wave.', 'Slow is perfect. One more together.'],
    giggles: ['Hee hee, slow tickles are the best.', 'My shell is giggly!', 'Ooh, that was a gentle tickle.'],
  },
  {
    id: 'kiko-says', slug: 'kiko', title: 'Kiko Says', Round: KikoSays,
    // a new little story every level (Kelvin 2026-11-23), dealt fairly
    stories: [
      'Let\'s play a listening game together!',
      'I\'m sending you secret messages!',
      'I\'m having a party, and you\'re my helper!',
      'I\'m learning brand-new words today. Squawk!',
      'The jungle radio is on. Listen carefully!',
      'Let\'s play my favorite game!',
      'I\'m the captain today. Listen to my orders!',
      'The rain is so loud! Let\'s listen extra carefully.',
    ],
    intro: 'Listen to my words, then tap what I say! You can ask me to say it again.',
    cheers: ['Squawk! You listened so well!', 'Exactly what I said! Great ears!', 'You heard every word!'],
    tryAgain: ['Hmm, Kiko talks fast! Let’s listen again.', 'Good try! Ears ready for another?', 'Let’s play again. I’ll say it slowly!'],
    giggles: ['Squawk! Hee hee!', 'Ticklish feathers! Squawk!', 'Kiko giggles! Kiko giggles!'],
  },
];

export function findFriendGame(id: string) {
  return FRIEND_GAMES.find(g => g.id === id);
}
