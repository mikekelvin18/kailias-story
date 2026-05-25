'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';

type Answer = string | null;

// Each question: { text, options: [{label, correct}], hint, points: full|partial|none }
interface Question {
  text: string;
  image?: string; // emoji
  type: 'choice' | 'input' | 'count';
  options?: { label: string; correct: boolean }[];
  correctAnswer?: string;
  points: { correct: number; partial?: number; wrong: number };
}

interface DomainGame {
  key: 'reading' | 'writing' | 'communication' | 'math';
  label: string;
  emoji: string;
  scenario: string;
  color: string;
  light: string;
  questions: Question[];
}

const GAMES: DomainGame[] = [
  {
    key: 'reading',
    label: "Kailia's Treasure Hunt",
    emoji: '📖',
    scenario: 'Kailia is packing her backpack for a treasure hunt. Help her find the right things!',
    color: '#2563EB',
    light: '#EFF6FF',
    questions: [
      {
        text: 'Kailia found three things: an 🍎 apple, a ⚽ ball, and a 🐱 cat. Can you tap the BALL?',
        type: 'choice',
        options: [
          { label: '🍎 Apple', correct: false },
          { label: '⚽ Ball', correct: true },
          { label: '🐱 Cat', correct: false },
        ],
        points: { correct: 2, wrong: 0 },
      },
      {
        text: 'Which word starts with the same sound as "ball"?',
        type: 'choice',
        options: [
          { label: '🦁 Lion', correct: false },
          { label: '🦋 Butterfly', correct: true },
          { label: '🐠 Fish', correct: false },
        ],
        points: { correct: 2, partial: 1, wrong: 0 },
      },
      {
        text: 'Read this sentence: "The dog runs fast." What is the dog doing?',
        type: 'choice',
        options: [
          { label: 'Sleeping 😴', correct: false },
          { label: 'Running 🏃', correct: true },
          { label: 'Eating 🍖', correct: false },
        ],
        points: { correct: 2, wrong: 0 },
      },
      {
        text: 'Kailia wrote her favorite word. It has 3 letters and says "meow." What animal is it?',
        type: 'choice',
        options: [
          { label: '🐶 Dog', correct: false },
          { label: '🐱 Cat', correct: true },
          { label: '🐟 Fish', correct: false },
        ],
        points: { correct: 2, wrong: 0 },
      },
      {
        text: 'Kailia reads: "The sky is blue. The grass is green." What color is the sky?',
        type: 'choice',
        options: [
          { label: '🟢 Green', correct: false },
          { label: '🔵 Blue', correct: true },
          { label: '🟡 Yellow', correct: false },
        ],
        points: { correct: 2, wrong: 0 },
      },
    ],
  },
  {
    key: 'writing',
    label: "Magic Tracing Path",
    emoji: '✍️',
    scenario: "Help Kailia draw her treasure map! She needs to trace the path to find the hidden gems.",
    color: '#059669',
    light: '#ECFDF5',
    questions: [
      {
        text: 'Kailia needs to write her name. Can you spell your first name? (Type it below)',
        type: 'input',
        correctAnswer: '__name__',
        points: { correct: 2, partial: 1, wrong: 0 },
      },
      {
        text: 'Which letter comes after "A" in the alphabet?',
        type: 'choice',
        options: [
          { label: 'Z', correct: false },
          { label: 'B', correct: true },
          { label: 'C', correct: false },
        ],
        points: { correct: 2, wrong: 0 },
      },
      {
        text: 'Kailia wants to label her map. She draws a ⭕. What shape is this called?',
        type: 'choice',
        options: [
          { label: 'Square', correct: false },
          { label: 'Triangle', correct: false },
          { label: 'Circle', correct: true },
        ],
        points: { correct: 2, wrong: 0 },
      },
      {
        text: 'Copy this word: CAT. Type it in the box below.',
        type: 'input',
        correctAnswer: 'cat',
        points: { correct: 2, partial: 1, wrong: 0 },
      },
      {
        text: 'Kailia wants to write a sentence about her dog. Which is correct?',
        type: 'choice',
        options: [
          { label: 'my dog is fluffy', correct: false },
          { label: 'My dog is fluffy.', correct: true },
          { label: 'my Dog is Fluffy', correct: false },
        ],
        points: { correct: 2, wrong: 0 },
      },
    ],
  },
  {
    key: 'communication',
    label: "Kailia's Talking Friend",
    emoji: '🗣️',
    scenario: "Kailia loves to chat! She has some questions for you. Help her understand the world.",
    color: '#7C3AED',
    light: '#F3E8FF',
    questions: [
      {
        text: 'Kailia shows you a picture of someone with tears on their face. How is this person feeling?',
        type: 'choice',
        options: [
          { label: '😄 Happy', correct: false },
          { label: '😢 Sad', correct: true },
          { label: '😠 Angry', correct: false },
        ],
        points: { correct: 2, wrong: 0 },
      },
      {
        text: 'Kailia lost her backpack. What would you say to help her?',
        type: 'choice',
        options: [
          { label: '"That\'s funny!"', correct: false },
          { label: '"Where did you last see it? I can help you look!"', correct: true },
          { label: '"I don\'t know."', correct: false },
        ],
        points: { correct: 2, partial: 1, wrong: 0 },
      },
      {
        text: 'Put these in order: First Kailia woke up. Then she ate breakfast. Finally she went to school. What did she do SECOND?',
        type: 'choice',
        options: [
          { label: 'Went to school 🏫', correct: false },
          { label: 'Woke up 😴', correct: false },
          { label: 'Ate breakfast 🥣', correct: true },
        ],
        points: { correct: 2, wrong: 0 },
      },
      {
        text: 'Kailia says "I went to the park and I saw a..." Finish the story! Which ending makes the most sense?',
        type: 'choice',
        options: [
          { label: 'flying car going to the moon', correct: false },
          { label: 'puppy playing with a ball', correct: true },
          { label: 'sandwich jumping', correct: false },
        ],
        points: { correct: 2, partial: 1, wrong: 0 },
      },
      {
        text: 'Kailia\'s friend says "I feel scared." What\'s the best thing to do?',
        type: 'choice',
        options: [
          { label: 'Laugh at them', correct: false },
          { label: 'Walk away', correct: false },
          { label: 'Say "I\'m here for you. Do you want to talk about it?"', correct: true },
        ],
        points: { correct: 2, wrong: 0 },
      },
    ],
  },
  {
    key: 'math',
    label: "Kailia's Cookie Quest",
    emoji: '🍪',
    scenario: "Kailia is sharing snacks with her friends! Help her count, add, and share fairly.",
    color: '#D97706',
    light: '#FFFBEB',
    questions: [
      {
        text: 'Kailia has these cookies: 🍪🍪🍪. How many cookies does she have?',
        type: 'choice',
        options: [
          { label: '2', correct: false },
          { label: '3', correct: true },
          { label: '4', correct: false },
        ],
        points: { correct: 2, wrong: 0 },
      },
      {
        text: 'Kailia has 2 cookies 🍪🍪. She gets 3 more 🍪🍪🍪. How many does she have now?',
        type: 'choice',
        options: [
          { label: '4', correct: false },
          { label: '5', correct: true },
          { label: '6', correct: false },
        ],
        points: { correct: 2, wrong: 0 },
      },
      {
        text: 'Kailia has 10 cookies. She eats 4. How many are left?',
        type: 'choice',
        options: [
          { label: '5', correct: false },
          { label: '6', correct: true },
          { label: '7', correct: false },
        ],
        points: { correct: 2, wrong: 0 },
      },
      {
        text: 'Kailia wants to share 12 cookies equally with 3 friends (including herself). How many cookies does each person get?',
        type: 'choice',
        options: [
          { label: '3', correct: true },
          { label: '4', correct: false },
          { label: '6', correct: false },
        ],
        points: { correct: 2, wrong: 0 },
      },
      {
        text: 'Kailia baked 2 trays of cookies. Each tray has 8 cookies. How many cookies in total?',
        type: 'choice',
        options: [
          { label: '10', correct: false },
          { label: '14', correct: false },
          { label: '16', correct: true },
        ],
        points: { correct: 2, wrong: 0 },
      },
    ],
  },
];

const ENCOURAGEMENTS = [
  "Great thinking! 🌟",
  "Kailia loves your answer! ✨",
  "You're amazing! 🎉",
  "Keep it up, explorer! 🚀",
  "Wonderful! 🌈",
];

export default function GamesPage() {
  const { state, setDomainScore } = useAssessment();
  const router = useRouter();

  const [gameIdx, setGameIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [domainScore, setLocalDomainScore] = useState(0);
  const [encourage, setEncourage] = useState('');

  const game = GAMES[gameIdx];
  const question = game.questions[questionIdx];
  const isLastQuestion = questionIdx === game.questions.length - 1;
  const isLastGame = gameIdx === GAMES.length - 1;

  const getScore = (): number => {
    if (question.type === 'choice') {
      const opt = question.options?.find(o => o.label === selectedAnswer);
      return opt?.correct ? question.points.correct : question.points.wrong;
    }
    if (question.type === 'input') {
      if (question.correctAnswer === '__name__') {
        return inputValue.trim().length >= 1 ? question.points.correct : question.points.wrong;
      }
      const correct = inputValue.trim().toLowerCase() === question.correctAnswer?.toLowerCase();
      return correct ? question.points.correct : (question.points.partial ?? 0);
    }
    return 0;
  };

  const handleSubmit = () => {
    const s = getScore();
    setLocalDomainScore(prev => prev + s);
    setEncourage(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setDomainScore(game.key, domainScore);
      if (isLastGame) {
        router.push('/results');
      } else {
        setGameIdx(g => g + 1);
        setQuestionIdx(0);
        setLocalDomainScore(0);
        setSelectedAnswer(null);
        setInputValue('');
        setSubmitted(false);
        setEncourage('');
      }
    } else {
      setQuestionIdx(q => q + 1);
      setSelectedAnswer(null);
      setInputValue('');
      setSubmitted(false);
      setEncourage('');
    }
  };

  const canSubmit = question.type === 'choice' ? !!selectedAnswer : inputValue.trim().length > 0;

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-start px-4 py-10"
      style={{ background: '#FFF9F0' }}
    >
      <div className="max-w-2xl w-full">
        {/* Game header */}
        <div
          className="rounded-3xl p-6 mb-6 text-center shadow-lg"
          style={{ background: game.light, border: `3px solid ${game.color}` }}
        >
          <span style={{ fontSize: 52 }}>{game.emoji}</span>
          <h1 className="text-2xl font-extrabold mt-2" style={{ color: game.color }}>
            {game.label}
          </h1>
          <p className="text-gray-600 mt-1 text-sm">{game.scenario}</p>
        </div>

        {/* Progress bars */}
        <div className="flex gap-2 mb-4">
          {GAMES.map((g, i) => (
            <div
              key={g.key}
              className="h-2.5 flex-1 rounded-full transition-all"
              style={{ background: i < gameIdx ? game.color : i === gameIdx ? `${game.color}88` : '#E5E7EB' }}
            />
          ))}
        </div>
        <div className="flex gap-1 mb-6">
          {game.questions.map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all"
              style={{ background: i < questionIdx ? game.color : i === questionIdx ? `${game.color}66` : '#E5E7EB' }}
            />
          ))}
        </div>

        {/* Question card */}
        <div
          className="rounded-3xl p-8 shadow-xl mb-6 bounce-in"
          key={`${gameIdx}-${questionIdx}`}
          style={{ background: 'white' }}
        >
          <div className="flex items-start gap-3 mb-6">
            <span
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-base"
              style={{ background: game.color }}
            >
              {questionIdx + 1}
            </span>
            <p className="text-gray-800 font-semibold text-lg leading-relaxed">{question.text}</p>
          </div>

          {/* Choice type */}
          {question.type === 'choice' && question.options && (
            <div className="space-y-3">
              {question.options.map((opt, i) => {
                const isSelected = selectedAnswer === opt.label;
                const showResult = submitted;
                let bg = '#F9FAFB';
                let border = '#E5E7EB';
                let textCol = '#374151';
                if (isSelected && !showResult) { bg = game.light; border = game.color; textCol = game.color; }
                if (showResult && opt.correct) { bg = '#D1FAE5'; border = '#059669'; textCol = '#065F46'; }
                if (showResult && isSelected && !opt.correct) { bg = '#FEE2E2'; border = '#DC2626'; textCol = '#991B1B'; }

                return (
                  <button
                    key={i}
                    onClick={() => !submitted && setSelectedAnswer(opt.label)}
                    disabled={submitted}
                    className="w-full text-left px-5 py-4 rounded-2xl font-semibold text-base transition-all hover:scale-[1.02]"
                    style={{ background: bg, border: `2px solid ${border}`, color: textCol }}
                  >
                    {opt.label}
                    {showResult && opt.correct && ' ✅'}
                    {showResult && isSelected && !opt.correct && ' ❌'}
                  </button>
                );
              })}
            </div>
          )}

          {/* Input type */}
          {question.type === 'input' && (
            <div>
              <input
                type="text"
                value={inputValue}
                onChange={e => !submitted && setInputValue(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full border-2 rounded-2xl px-5 py-3 text-lg text-gray-800 focus:outline-none transition-colors"
                style={{
                  borderColor: submitted ? (getScore() > 0 ? '#059669' : '#DC2626') : game.color,
                  background: submitted ? (getScore() > 0 ? '#D1FAE5' : '#FEE2E2') : game.light,
                }}
              />
              {submitted && (
                <p className="mt-2 text-sm font-semibold" style={{ color: getScore() > 0 ? '#059669' : '#DC2626' }}>
                  {getScore() > 0 ? '✅ Great job!' : question.correctAnswer === '__name__' ? '✅ Any answer counts — we just want to see if you can write your name!' : `The answer was: ${question.correctAnswer}`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Encouragement */}
        {submitted && encourage && (
          <div
            className="rounded-2xl p-4 text-center mb-4 font-bold text-lg bounce-in"
            style={{ background: game.light, color: game.color }}
          >
            {encourage}
          </div>
        )}

        {/* Buttons */}
        <div className="text-center">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-10 py-4 rounded-full font-extrabold text-xl text-white shadow-lg transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: canSubmit ? `linear-gradient(135deg, ${game.color}, #EC4899)` : '#D1D5DB' }}
            >
              Check My Answer! 🎯
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-10 py-4 rounded-full font-extrabold text-xl text-white shadow-lg transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${game.color}, #EC4899)` }}
            >
              {isLastQuestion && isLastGame ? 'See My Results! 🎉' : isLastQuestion ? 'Next Adventure! 🚀' : 'Next Question →'}
            </button>
          )}
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Game {gameIdx + 1} of {GAMES.length} • Question {questionIdx + 1} of {game.questions.length}
        </p>
      </div>
    </main>
  );
}
