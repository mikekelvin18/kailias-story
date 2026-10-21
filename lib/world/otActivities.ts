// ── OT activity descriptions for the adventure world ──
// Every interactive step of a quest belongs to one activity here. This is
// what a therapist or parent reads in the grown-ups panel, and what ties
// the play to an OT goal. It describes the activity only: it never judges
// a child, and nothing here turns play into an age or a score.
//
// `domain` is the app's existing skill domain (the land the skill lives
// in), so observations line up with the rest of the app's records.

export type OtActivityId = 'garden-water' | 'garden-bridge' | 'garden-search' | 'garden-give' | 'garden-sequence';

export interface OtActivity {
  id: OtActivityId;
  /** the app's domain, matching LANDS and the measurement log */
  domain: 'fine motor' | 'sensory' | 'processing' | 'communication';
  /** OT skill areas, in plain words */
  skills: string[];
  /** the play-based objective */
  objective: string;
  mechanics: string;
  prerequisites: string;
  /** what the grown-up settings change */
  adjustable: string[];
  accommodations: string[];
  prompting: string;
  /** what is noted, as numbers only */
  observed: string[];
  success: string;
  /** how demands move between visits (the grown-up settings override this) */
  progression: string;
}

export const OT_ACTIVITIES: Record<OtActivityId, OtActivity> = {
  'garden-water': {
    id: 'garden-water',
    domain: 'fine motor',
    skills: ['Motor planning', 'Grasp and release', 'Sustained hold'],
    objective: 'Carry the watering can to the sunflower and keep it there while it pours.',
    mechanics: 'Press and drag an object to a target, then hold still.',
    prerequisites: 'Can press and move one finger (or a mouse) on the screen.',
    adjustable: ['How long to hold (0.6 to 2 seconds)', 'How close counts as "at the flower"'],
    accommodations: ['Tap the can instead of dragging', 'No time limit', 'Letting go early just pauses the pour'],
    prompting: 'Noel repeats the step after a quiet spell; the pet sniffs at the can.',
    observed: ['Drops before reaching the flower', 'Seconds to finish', 'Dragged or tapped'],
    success: 'The sunflower is watered.',
    progression: 'Holds get longer and the target smaller at higher levels.',
  },
  'garden-bridge': {
    id: 'garden-bridge',
    domain: 'fine motor',
    skills: ['Visual-motor integration', 'Grasp and release', 'Precision placement'],
    objective: 'Pick up stepping stones and place each one into a gap in the stream.',
    mechanics: 'Drag and drop to a marked spot; stones snap in when close.',
    prerequisites: 'Can drag an object a short way.',
    adjustable: ['Number of stones (2 to 4)', 'How forgiving the snap is'],
    accommodations: ['Tap a stone to place it', 'A missed stone floats back to the bank', 'No time limit'],
    prompting: 'Empty gaps glow; Noel repeats the step after a quiet spell.',
    observed: ['Stones placed', 'Drops that missed a gap', 'Seconds to finish', 'Dragged or tapped'],
    success: 'Every gap has a stone and Kailia can cross.',
    progression: 'More stones and a tighter snap at higher levels.',
  },
  'garden-search': {
    id: 'garden-search',
    domain: 'sensory',
    skills: ['Visual scanning', 'Figure-ground', 'Persistence'],
    objective: 'Look across the back garden and find the bush hiding the star ball.',
    mechanics: 'Tap to search; a little of the ball peeks out of the right bush.',
    prerequisites: 'Can tap a large target.',
    adjustable: ['Number of hiding spots (3 to 6)', 'How much of the ball peeks out'],
    accommodations: ['Every bush hides something fun, so a miss is a discovery', 'The pet shows the way after a few tries'],
    prompting: 'After a set number of searches the pet walks to the right bush and sniffs.',
    observed: ['Searches before finding', 'Whether the pet had to show the way', 'Seconds to find'],
    success: 'The star ball is found.',
    progression: 'More bushes and less of the ball showing at higher levels.',
  },
  'garden-give': {
    id: 'garden-give',
    domain: 'communication',
    skills: ['Grasp and release', 'Giving to a friend (social play)'],
    objective: 'Hand the star ball back to the pet.',
    mechanics: 'Drag the ball to the pet, or tap the pet.',
    prerequisites: 'None beyond tapping.',
    adjustable: ['Drag or tap'],
    accommodations: ['Tapping the pet works after one reminder'],
    prompting: 'Noel names the pet and the action.',
    observed: ['Dragged or tapped', 'Drops away from the pet'],
    success: 'The pet has its ball back.',
    progression: 'Stays the same; it is the story\'s happy ending.',
  },
  'garden-sequence': {
    id: 'garden-sequence',
    domain: 'processing',
    skills: ['Sequencing', 'Following a multi-step plan'],
    objective: 'Follow the four-step plan from a problem to its solution.',
    mechanics: 'Each step opens the next: water, cross, search, give.',
    prerequisites: 'None.',
    adjustable: ['How often Noel reminds (more or fewer hints)'],
    accommodations: ['Pause any time', 'Progress is saved after every step'],
    prompting: 'The objective pill always shows the next step; Noel repeats it when idle.',
    observed: ['Steps finished', 'Reminders given', 'Total minutes'],
    success: 'The quest is finished.',
    progression: 'Later quests add steps and choices.',
  },
};
