'use client';

// ── Kailia's Garden (/play/garden) ──
// The app side of the adventure world's first place. It picks the pet,
// works out the task demands from the adventure check plus the grown-up
// settings, loads and saves progress, awards starlight, and passes the
// game's events to the quiet observer. The game itself
// (components/world/garden/GardenGame.tsx) only plays.
//
// Sits under /play, so the assessment gate covers it. No child data in
// the URL; everything is saved per child and only with parent consent.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import GardenGame from '@/components/world/garden/GardenGame';
import { useAssessment } from '@/context/AssessmentContext';
import { difficultyTier } from '@/lib/difficulty';
import { applyA11y, loadA11y, saveA11y } from '@/lib/accessibility';
import { awardStarlight, COMPANIONS, getFocusCompanion, loadRewards, unlockedCompanions } from '@/lib/rewards';
import { demandsFor, type ChallengeChoice, type GrownUpSettings, type HintChoice } from '@/lib/world/demands';
import type { Demands, PetInfo, WorldEvent } from '@/lib/world/events';
import { createObserver } from '@/lib/world/observe';
import { OT_ACTIVITIES } from '@/lib/world/otActivities';
import { currentStep, freshProgress, LOST_STAR_BALL } from '@/lib/world/quest';
import { loadWorld, updateWorld, type WorldSave } from '@/lib/world/save';
import { INK, PALETTE as P } from '@/lib/world/artBible';

const QUEST = LOST_STAR_BALL;
const LADYBUG_STARLIGHT = 3;

/** the friend who joins: the one picked as focus, else the newest unlocked, else Flick */
function pickPet(): PetInfo {
  const focus = getFocusCompanion();
  const unlocked = unlockedCompanions(loadRewards().starlight);
  const c = COMPANIONS.find(x => x.name === focus) ?? unlocked.at(-1) ?? COMPANIONS.find(x => x.name === 'Flick')!;
  return { name: c.name, art: c.art, kind: c.kind };
}

interface Loaded { save: WorldSave; pet: PetInfo; soundOn: boolean }

export default function GardenPage() {
  const router = useRouter();
  const { state, totalScore } = useAssessment();
  const tier = difficultyTier(state.ageGroup, totalScore);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [paused, setPaused] = useState(false);
  const [run, setRun] = useState(0);

  // storage is only readable in the browser
  useEffect(() => {
    const id = requestAnimationFrame(() => setLoaded({ save: loadWorld(), pet: pickPet(), soundOn: !loadA11y().reducedSound }));
    return () => cancelAnimationFrame(id);
  }, []);

  const grownUp = loaded?.save.grownUp;
  const demands: Demands | null = useMemo(() => (grownUp ? demandsFor(tier, grownUp) : null), [tier, grownUp]);

  // starlight for finishing: full the first time, a smaller thank-you after
  const reward = loaded?.save.garden.finished ? QUEST.reward.replayStarlight : QUEST.reward.starlight;
  const [observe] = useState(() => createObserver(QUEST));

  const onEvent = useCallback((e: WorldEvent) => {
    if (demands) observe(e, demands);
    if (e.type === 'progress') {
      updateWorld(s => ({ ...s, garden: { ...s.garden, quest: e.quest, ladybugs: e.ladybugs } }));
    } else if (e.type === 'quest-complete') {
      updateWorld(s => ({ ...s, garden: { ...s.garden, finished: s.garden.finished + 1,
        stickers: s.garden.stickers.includes(QUEST.reward.sticker) ? s.garden.stickers : [...s.garden.stickers, QUEST.reward.sticker] } }));
      awardStarlight(reward);
    } else if (e.type === 'ladybug') {
      awardStarlight(LADYBUG_STARLIGHT);
    }
  }, [observe, reward, demands]);

  const exit = useCallback(() => router.push('/play'), [router]);

  const setGrownUp = (g: GrownUpSettings) => {
    const save = updateWorld(s => ({ ...s, grownUp: g }));
    setLoaded(l => (l ? { ...l, save: { ...save, grownUp: g } } : l));
  };
  const setSound = (on: boolean) => {
    const a = { ...loadA11y(), reducedSound: !on };
    saveA11y(a);
    applyA11y(a);
    setLoaded(l => (l ? { ...l, soundOn: on } : l));
  };
  const playAgain = () => {
    const save = updateWorld(s => ({ ...s, garden: { ...s.garden, quest: freshProgress(QUEST) } }));
    setLoaded(l => (l ? { ...l, save } : l));
    setRun(r => r + 1);
    setPaused(false);
  };

  if (!loaded || !demands) {
    return <main className="fixed inset-0" style={{ background: `linear-gradient(180deg, ${P.skyDeep}, ${P.sky})` }} />;
  }

  const g = loaded.save.garden;
  const step = currentStep(QUEST, g.quest ?? freshProgress(QUEST));
  const activity = step?.activity ? OT_ACTIVITIES[step.activity] : OT_ACTIVITIES['garden-sequence'];

  return (
    <main>
      <GardenGame
        // a new key restarts the place: after "play again" or new grown-up settings
        key={`${run}-${demands.level}-${demands.hintAfter}-${demands.tapToMove}`}
        pet={loaded.pet}
        demands={demands}
        initialQuest={g.quest}
        initialLadybugs={g.ladybugs}
        rewardStarlight={reward}
        paused={paused}
        soundOn={loaded.soundOn}
        onEvent={onEvent}
        onPause={() => setPaused(true)}
        onExit={exit}
      />
      {paused && (
        <PauseSheet
          soundOn={loaded.soundOn} onSound={setSound}
          onResume={() => setPaused(false)} onExit={exit}
          canRestart={!!g.quest?.done.length} onRestart={playAgain}
          grownUp={loaded.save.grownUp} onGrownUp={setGrownUp}
          demands={demands} activity={activity} stepName={step ? step.objective.replace('{pet}', loaded.pet.name) : 'Free play'}
        />
      )}
    </main>
  );
}

function PauseSheet({ soundOn, onSound, onResume, onExit, canRestart, onRestart, grownUp, onGrownUp, demands, activity, stepName }: {
  soundOn: boolean; onSound: (on: boolean) => void; onResume: () => void; onExit: () => void;
  canRestart: boolean; onRestart: () => void;
  grownUp: GrownUpSettings; onGrownUp: (g: GrownUpSettings) => void;
  demands: Demands; activity: (typeof OT_ACTIVITIES)[keyof typeof OT_ACTIVITIES]; stepName: string;
}) {
  const card = { background: P.paper, border: `3px solid ${INK}`, color: INK };
  const btn = 'w-full rounded-full py-3 text-lg font-extrabold';
  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center p-3" style={{ zIndex: 60, background: 'rgba(59,36,22,0.4)' }}
      role="dialog" aria-label="Paused" onKeyDown={e => { if (e.key === 'Escape') onResume(); }}>
      <div className="w-full max-w-md rounded-[28px] p-5 max-h-[92dvh] overflow-y-auto bounce-in" style={{ ...card, boxShadow: `0 8px 0 ${INK}` }}>
        <h2 className="text-2xl font-extrabold text-center mb-4">Paused</h2>
        <div className="flex flex-col gap-3">
          <button type="button" autoFocus className={btn} style={{ background: P.starGold, border: `3px solid ${INK}`, boxShadow: `0 4px 0 ${INK}`, minHeight: 56 }} onClick={onResume}>
            Keep playing
          </button>
          <button type="button" className={btn} style={{ background: '#FFFFFF', border: `3px solid ${INK}`, minHeight: 56 }} onClick={() => onSound(!soundOn)}
            aria-pressed={soundOn}>
            Sound: {soundOn ? 'on' : 'off'}
          </button>
          {canRestart && (
            <button type="button" className={btn} style={{ background: '#FFFFFF', border: `3px solid ${INK}`, minHeight: 56 }} onClick={onRestart}>
              Play the quest again
            </button>
          )}
          <button type="button" className={btn} style={{ background: '#FFFFFF', border: `3px solid ${INK}`, minHeight: 56 }} onClick={onExit}>
            Back to the map
          </button>
        </div>

        <details className="mt-5 rounded-2xl p-3" style={{ background: '#FFFFFF', border: `2px solid ${P.paperEdge}` }}>
          <summary className="font-extrabold cursor-pointer">For grown-ups: goals and settings</summary>
          <div className="mt-3 text-sm leading-relaxed">
            <p className="font-bold">Now: {stepName}</p>
            <p className="mt-1"><b>Builds:</b> {activity.skills.join(', ')}.</p>
            <p className="mt-1">{activity.objective}</p>
            <p className="mt-1"><b>Help built in:</b> {activity.accommodations.join('; ')}.</p>
            <p className="mt-1"><b>Noticed quietly:</b> {activity.observed.join(', ').toLowerCase()} (numbers only, saved in the Parent Zone).</p>

            <SettingRow label="Challenge" hint={`Now: ${demands.stones} stones, ${demands.spots} bushes, ${(demands.holdMs / 1000).toFixed(1)} s pour.`}
              value={grownUp.challenge} options={[['easier', 'Easier'], ['auto', 'From the check'], ['harder', 'Harder']]}
              onChange={v => onGrownUp({ ...grownUp, challenge: v as ChallengeChoice })} />
            <SettingRow label="Hints" hint="How soon Noel reminds and the pet shows the way."
              value={grownUp.hints} options={[['more', 'More'], ['auto', 'Normal'], ['fewer', 'Fewer']]}
              onChange={v => onGrownUp({ ...grownUp, hints: v as HintChoice })} />
            <label className="mt-3 flex items-center gap-3 font-bold">
              <input type="checkbox" checked={grownUp.tapToMove} onChange={e => onGrownUp({ ...grownUp, tapToMove: e.target.checked })}
                style={{ width: 22, height: 22 }} />
              Tap to move things instead of dragging
            </label>
            <p className="mt-3 text-xs" style={{ color: '#6B5443' }}>
              These settings change the task, not the story. Changing them restarts the current step; finished steps stay finished.
              The garden only notes what happened, never an age or a score. This is play, not a test or a diagnosis.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}

function SettingRow({ label, hint, value, options, onChange }: {
  label: string; hint: string; value: string; options: [string, string][]; onChange: (v: string) => void;
}) {
  return (
    <fieldset className="mt-3">
      <legend className="font-bold">{label}</legend>
      <div className="flex gap-1.5 mt-1" role="radiogroup">
        {options.map(([v, l]) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
            className="flex-1 rounded-full px-2 py-2 text-sm font-extrabold"
            style={{ minHeight: 44, border: `2px solid ${INK}`, background: value === v ? P.starGold : '#FFFFFF', color: INK }}>
            {l}
          </button>
        ))}
      </div>
      <p className="text-xs mt-1" style={{ color: '#6B5443' }}>{hint}</p>
    </fieldset>
  );
}
