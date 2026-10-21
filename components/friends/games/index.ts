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
    intro: 'Hoo! My moon-light will fly across the stars. Watch where it goes, then fly the same way!',
    cheers: ['Hoo-hoo! You remembered every star!', 'What a memory! The sky is glowing!', 'Perfect flight, little owl!'],
    tryAgain: ['That star was a tricky one. Let’s watch a new flight together!', 'Ooh, so close! Let’s fly again.', 'The stars are twinkly tonight. One more try!'],
    giggles: ['Hoo-hoo-hoo! My feathers are ticklish!', 'Hoo! You found my wing!', 'Again! Hoo hoo!'],
  },
  {
    id: 'vine-weave', slug: 'flick', title: 'Vine Weave', Round: VineWeave,
    intro: 'Help my vine grow to the flower! Drag the green tip through each gap in the branches.',
    cheers: ['Smooth as a fox tail! Look at it grow!', 'Steady paws! The flower loves it!', 'Right through the gaps. Wow!'],
    tryAgain: ['The branches tickled the vine. Let’s grow a new one!', 'Nice try! Slow and steady, let’s go again.', 'Wiggly vine! We can do it again together.'],
    giggles: ['Hee hee! Not my fluffy tail!', 'That tickles my ears!', 'Yip yip! Again!'],
  },
  {
    id: 'gem-scales', slug: 'ember', title: 'Gem Scales', Round: GemScales,
    intro: 'Make my treasure scale level! Put gems on your side until both sides are the same.',
    cheers: ['Perfectly balanced! You count like a dragon!', 'Level! My treasure is happy!', 'Just right! Roar-some counting!'],
    tryAgain: ['We got there! Next time let’s count first.', 'Balanced in the end! Let’s try another pile.', 'Phew, gems are tricky! One more?'],
    giggles: ['Rawr-ha-ha! That tickles!', 'My tummy is ticklish!', 'Hee hee, little sparks came out!'],
  },
  {
    id: 'star-letters', slug: 'nova', title: 'Star Letters', Round: StarLetters,
    intro: 'Let’s join the stars and draw a letter in the sky. Then find the word that starts with it!',
    cheers: ['Sparkly! You found the letter and the word!', 'A rainbow letter! Magic reading!', 'Yes! That word starts just right!'],
    tryAgain: ['Good drawing! Let’s listen to the sound again next time.', 'Ooh, letters can be sneaky. Another one!', 'Nice stars! Let’s try a new letter.'],
    giggles: ['Tee-hee! Sparkly giggles!', 'My mane goes swish!', 'Again, again! Neigh-hee!'],
  },
  {
    id: 'slow-waves', slug: 'shelly', title: 'Slow Waves', Round: SlowWaves, rounds: 3,
    intro: 'Let’s float on the waves together. In with the tide, out with the tide.',
    cheers: ['So calm and slow. Just like a turtle!', 'Beautiful breathing. The sea feels peaceful.', 'You and the waves moved together!'],
    tryAgain: ['That’s okay. Waves go up and down. Let’s float again.', 'Nice and easy. Let’s try one more wave.', 'Slow is perfect. One more together.'],
    giggles: ['Hee hee, slow tickles are the best.', 'My shell is giggly!', 'Ooh, that was a gentle tickle.'],
  },
  {
    id: 'kiko-says', slug: 'kiko', title: 'Kiko Says', Round: KikoSays,
    intro: 'Listen to my words, then tap what I say! You can ask me to say it again.',
    cheers: ['Squawk! You listened so well!', 'Exactly what I said! Great ears!', 'You heard every word!'],
    tryAgain: ['Hmm, Kiko talks fast! Let’s listen again.', 'Good try! Ears ready for another?', 'Let’s play again. I’ll say it slowly!'],
    giggles: ['Squawk! Hee hee!', 'Ticklish feathers! Squawk!', 'Kiko giggles! Kiko giggles!'],
  },
];

export function findFriendGame(id: string) {
  return FRIEND_GAMES.find(g => g.id === id);
}
