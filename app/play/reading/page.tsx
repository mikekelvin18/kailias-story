'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useAssessment } from '@/context/AssessmentContext';

// ─── Reading question banks by level ─────────────────────────────────────────

interface ReadingQ {
  prompt: string;
  visual: string;     // emoji or image cue
  choices: string[];
  answer: string;
  type: 'match'|'letter'|'word'|'sentence';
}

const BANKS: ReadingQ[][] = [
  // Level 0: Picture → word match (3-4 year)
  [
    { type:'match', visual:'🐱', prompt:'What is this?', choices:['cat','dog','bird'], answer:'cat' },
    { type:'match', visual:'🍎', prompt:'What is this?', choices:['apple','orange','banana'], answer:'apple' },
    { type:'match', visual:'🌙', prompt:'What is this?', choices:['sun','moon','star'], answer:'moon' },
    { type:'match', visual:'🚗', prompt:'What is this?', choices:['car','bus','bike'], answer:'car' },
    { type:'match', visual:'🌸', prompt:'What is this?', choices:['flower','tree','leaf'], answer:'flower' },
    { type:'match', visual:'🐶', prompt:'What is this?', choices:['cat','dog','fish'], answer:'dog' },
    { type:'match', visual:'⭐', prompt:'What is this?', choices:['moon','cloud','star'], answer:'star' },
    { type:'match', visual:'🏠', prompt:'What is this?', choices:['house','school','shop'], answer:'house' },
  ],
  // Level 1: Letter sound match (5-6 year)
  [
    { type:'letter', visual:'🐱', prompt:'What letter does CAT start with?', choices:['C','D','B','F'], answer:'C' },
    { type:'letter', visual:'🍎', prompt:'What letter does APPLE start with?', choices:['A','E','O','I'], answer:'A' },
    { type:'letter', visual:'🐶', prompt:'What letter does DOG start with?', choices:['B','D','G','P'], answer:'D' },
    { type:'letter', visual:'🌟', prompt:'What letter does STAR start with?', choices:['T','P','S','R'], answer:'S' },
    { type:'letter', visual:'🦁', prompt:'What letter does LION start with?', choices:['N','M','L','K'], answer:'L' },
    { type:'letter', visual:'🐘', prompt:'What letter does ELEPHANT start with?', choices:['E','A','I','O'], answer:'E' },
    { type:'letter', visual:'🌈', prompt:'Which word rhymes with CAT?', choices:['bat','cup','pig','log'], answer:'bat' },
    { type:'letter', visual:'🎈', prompt:'Which word rhymes with FUN?', choices:['sun','cat','dog','big'], answer:'sun' },
  ],
  // Level 2: Sight word / CVC (6-8 year)
  [
    { type:'word', visual:'The 🐶 is big.', prompt:'Find the describing word (adjective):', choices:['The','dog','is','big'], answer:'big' },
    { type:'word', visual:'🏃 fast', prompt:'Which word means moving quickly?', choices:['slow','fast','jump','sit'], answer:'fast' },
    { type:'word', visual:'🌙 + ight', prompt:'What word do you make?', choices:['night','might','light','right'], answer:'night' },
    { type:'word', visual:'The cat SAT on the mat.', prompt:'What did the cat do?', choices:['ran','sat','ate','slept'], answer:'sat' },
    { type:'word', visual:'sh + ip', prompt:'Blend these sounds — what word?', choices:['ship','shop','chip','drip'], answer:'ship' },
    { type:'word', visual:'fl + ower', prompt:'What word do you make?', choices:['flower','flour','power','tower'], answer:'flower' },
    { type:'word', visual:'un + happy', prompt:'What does UN- mean here?', choices:['very happy','not happy','a little happy','too happy'], answer:'not happy' },
    { type:'word', visual:'She ____ to school.', prompt:'Which word best fills the blank?', choices:['went','go','goes','going'], answer:'went' },
  ],
  // Level 3: Reading comprehension (8-10 year)
  [
    { type:'sentence', visual:'"The sun sets in the WEST." ', prompt:'Where does the sun set?', choices:['East','West','North','South'], answer:'West' },
    { type:'sentence', visual:'"Kailia was NERVOUS before her test."', prompt:'How was Kailia feeling?', choices:['happy','nervous','angry','bored'], answer:'nervous' },
    { type:'sentence', visual:'"He ran SWIFTLY to catch the bus."', prompt:'What does SWIFTLY mean?', choices:['slowly','carefully','quickly','quietly'], answer:'quickly' },
    { type:'sentence', visual:'"The enormous elephant splashed in the mud."', prompt:'What does ENORMOUS mean?', choices:['tiny','huge','fast','slow'], answer:'huge' },
    { type:'sentence', visual:'"Every morning, she practices piano."', prompt:'How often does she practice?', choices:['never','once a week','daily','monthly'], answer:'daily' },
    { type:'sentence', visual:'"The chef prepared a delicious meal."', prompt:'What did the chef do?', choices:['ate a meal','cooked a meal','served drinks','cleaned the table'], answer:'cooked a meal' },
  ],
  // Level 4: Advanced (10-12 year)
  [
    { type:'sentence', visual:'"Despite the rain, she persevered."', prompt:'What does PERSEVERED mean?', choices:['gave up','kept going','got wet','stayed home'], answer:'kept going' },
    { type:'sentence', visual:'"The PROTAGONIST of the story was brave."', prompt:'What is a PROTAGONIST?', choices:['the villain','the main character','the author','a side character'], answer:'the main character' },
    { type:'sentence', visual:'"She spoke in a MONOTONE voice."', prompt:'What does MONOTONE mean?', choices:['very loud','no expression','very quiet','very fast'], answer:'no expression' },
    { type:'sentence', visual:'"The scientist hypothesized that plants grow faster in sunlight."', prompt:'What did the scientist do?', choices:['proved a fact','made a guess','ran an experiment','wrote a report'], answer:'made a guess' },
    { type:'sentence', visual:'"The story\'s THEME was friendship."', prompt:'What is a THEME in a story?', choices:['the setting','the main message','the characters','the plot'], answer:'the main message' },
    { type:'sentence', visual:'"The ANTONYM of happy is ___"', prompt:'Complete the sentence:', choices:['glad','joyful','sad','cheerful'], answer:'sad' },
  ],
];

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

function getLevelFromAge(stage: string, age: number | null): number {
  const a = age ?? 8;
  if (a <= 4) return 0;
  if (a <= 6) return 1;
  if (a <= 8) return 2;
  if (a <= 10) return 3;
  return 4;
}

const LEVEL_LABELS = ['Starter', 'Junior', 'Reader', 'Explorer', 'Wizard'];
const COLORS = ['#2563EB','#7C3AED','#059669','#D97706','#EC4899'];

export default function ReadingGamePage() {
  const { state, learningStage } = useAssessment();
  const defaultLevel = getLevelFromAge(learningStage, state.childAge);
  const [level, setLevel] = useState(defaultLevel);
  const [bank, setBank] = useState<ReadingQ[]>(() => shuffle(BANKS[defaultLevel]));
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string|null>(null);
  const [phase, setPhase] = useState<'q'|'correct'|'wrong'>('q');
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [xp, setXp] = useState(0);

  const question = bank[idx % bank.length];
  const color = COLORS[level];

  const handleAnswer = (choice: string) => {
    if (phase !== 'q') return;
    setSelected(choice);
    const correct = choice === question.answer;
    setTotal(t => t + 1);
    if (correct) { setScore(s => s + 1); setXp(x => x + 10); setPhase('correct'); }
    else { setPhase('wrong'); }
    setTimeout(() => {
      setIdx(i => i + 1);
      setSelected(null);
      setPhase('q');
    }, 1500);
  };

  const handleLevel = (l: number) => {
    setLevel(l); setBank(shuffle(BANKS[l]));
    setIdx(0); setSelected(null); setPhase('q');
    setScore(0); setTotal(0); setXp(0);
  };

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 100;
  const stars = xp >= 100 ? 3 : xp >= 50 ? 2 : xp >= 20 ? 1 : 0;

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: `linear-gradient(135deg, #1e3a8a, ${color}66, #1e3a8a)` }}>
      <div className="max-w-lg mx-auto">

        <div className="flex items-center justify-between mb-4">
          <Link href="/play" className="text-blue-200 text-sm font-bold hover:text-white">← Games</Link>
          <h1 className="text-2xl font-extrabold text-white">📖 Word Wizard</h1>
          <div className="text-yellow-300 text-xl">{'⭐'.repeat(stars)}{'☆'.repeat(3-stars)}</div>
        </div>

        {/* Level tabs */}
        <div className="flex gap-2 mb-4 justify-center flex-wrap">
          {LEVEL_LABELS.map((l, i) => (
            <button key={i} onClick={() => handleLevel(i)}
              className="px-3 py-1 rounded-full text-xs font-bold transition-all hover:scale-105"
              style={{
                background: i === level ? color : 'rgba(255,255,255,0.15)',
                color: i === level ? 'white' : 'rgba(255,255,255,0.7)',
                border: `1.5px solid ${i === level ? color : 'rgba(255,255,255,0.2)'}`,
              }}>
              {l}
            </button>
          ))}
        </div>

        {/* XP bar */}
        <div className="rounded-2xl p-3 mb-4 flex items-center gap-4"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)' }}>
          <div className="text-center">
            <p className="text-xl font-extrabold text-yellow-300">{xp} XP</p>
            <p className="text-white text-xs">Points</p>
          </div>
          <div className="flex-1">
            <div className="h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <div className="h-3 rounded-full transition-all" style={{ width: `${Math.min(xp, 100)}%`, background: 'linear-gradient(90deg, #F59E0B, #EC4899)' }} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold text-green-300">{accuracy}%</p>
            <p className="text-white text-xs">Accuracy</p>
          </div>
        </div>

        {/* Question card */}
        <div key={idx} className="rounded-3xl p-7 shadow-2xl drop-in"
          style={{ background: 'rgba(255,255,255,0.95)', border: `3px solid ${color}` }}>

          {/* Visual / prompt */}
          <div className="text-center mb-4">
            <div className="inline-block px-4 py-2 rounded-2xl mb-3" style={{ background: `${color}15`, border: `2px solid ${color}33` }}>
              <p className="text-lg font-bold text-gray-800 leading-relaxed">{question.visual}</p>
            </div>
            <p className="text-gray-700 font-bold text-base">{question.prompt}</p>
          </div>

          {/* Choices */}
          <div className="grid grid-cols-2 gap-3">
            {question.choices.map(ch => {
              let bg = '#F9FAFB', border = '#E5E7EB', textCol = '#374151';
              if (selected !== null) {
                if (ch === question.answer) { bg = '#D1FAE5'; border = '#059669'; textCol = '#065F46'; }
                else if (ch === selected) { bg = '#FEE2E2'; border = '#DC2626'; textCol = '#991B1B'; }
              } else if (selected === ch) { bg = `${color}15`; border = color; textCol = color; }
              return (
                <button key={ch} onClick={() => handleAnswer(ch)} disabled={phase !== 'q'}
                  className="py-4 px-3 rounded-2xl font-bold text-sm text-center transition-all hover:scale-105 disabled:opacity-80"
                  style={{ background: bg, border: `2px solid ${border}`, color: textCol }}>
                  {ch}
                  {selected !== null && ch === question.answer && ' ✅'}
                  {selected === ch && ch !== question.answer && ' ❌'}
                </button>
              );
            })}
          </div>

          {phase === 'correct' && <p className="text-center mt-4 font-extrabold text-green-600 text-lg bounce-in">Magical! ✨ +10 XP</p>}
          {phase === 'wrong' && (
            <p className="text-center mt-4 font-bold text-red-500 text-sm bounce-in">
              The answer is <strong style={{ color }}>{question.answer}</strong>. Keep practicing! 💪
            </p>
          )}
        </div>

        {/* Question counter */}
        <div className="flex gap-1.5 mt-4 justify-center">
          {bank.slice(0, 8).map((_, i) => (
            <div key={i} className="h-2 rounded-full transition-all"
              style={{ width: 20, background: i < idx % bank.length ? color : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>

        <p className="text-center text-blue-200 text-xs mt-3">
          💡 Read each word carefully — take your time!
        </p>
      </div>
    </main>
  );
}
