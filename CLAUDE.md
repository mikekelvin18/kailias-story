@AGENTS.md

# Kailia's Story — Project Guide

## What this app is
Kailia's Story is a developmental assessment app disguised as an adventure game. Parents or kids complete quests with Kailia, and the app quietly measures performance to estimate a child's developmental age across six domains: fine motor skills, communication, math, sensory, reading, and processing.

**Core design rule: it must never feel like homework or a test.** The child experiences a story and quests. All measurement happens invisibly in the background.

## Characters
Two characters appear throughout the whole adventure — every land, every quest, every screen:

- **Kailia** — the main character and the child's avatar on the adventure. A chibi-style girl, about 6 years old, with short brown hair and bangs. Brave, curious, and kind. She travels through the world map, and the child helps her complete quests.
- **Noel** — a giant panda, Kailia's companion and adventure partner. Warm, gentle, a little goofy. Noel is the "guide" character: he explains every quest in short simple words, gives hints when the child struggles, celebrates every attempt with big reactions, and NEVER says anything is wrong — a miss is always "let's try again together!" Noel also appears in parent-assist moments.

**Placeholder art today:** Kailia and Noel are currently drawn as code-based cartoon (SVG) sprites — no image files needed, so the app works right now without final artwork.
- All character art/code lives in one folder: `components/characters/`
- All swap-in logic lives in one config file: `components/characters/characters.config.ts`

**How to swap in real artwork later (plain English, no coding needed beyond dropping files in):**
1. Export final character images (PNG or SVG, transparent background works best) for whichever character/expression you're replacing — e.g. `kailia-happy.png`, `noel-excited.png`.
2. Drop those image files into the `public/characters/` folder.
3. Open `components/characters/characters.config.ts` and add one line pointing that character/expression at your file's path (there's a comment in the file showing exactly how — it's just uncommenting/filling in a line).
4. Save. The app automatically uses your image instead of the placeholder drawing for that expression — nothing else needs to change.

Any expression you don't fill in keeps using the placeholder drawing, so you can swap art in gradually, one image at a time.

## The adventure structure
The child travels with Kailia through a world map. Each region assesses one domain:

1. **Firefly Forest (fine motor)** — trace glowing paths with finger/mouse, tap moving fireflies, drag stones to build a bridge. Measure: tracing deviation from path, tap accuracy on moving targets, drag steadiness, completion time.
2. **Dragon's Treasure Cave (math)** — count gems to pay the dragon's toll, share berries equally among baby dragons, continue stepping-stone patterns. Measure: accuracy, highest difficulty reached, response time.
3. **Whispering Signposts (reading)** — match words to pictures to reveal paths, find rhyming spell words, read short signs and choose the correct fork. Measure: accuracy by reading level, decoding speed.
4. **Village of the Story Keepers (communication)** — retell the previous chapter, describe a picture to unlock a door, choose what a character should say next. Includes a parent-assist mode where the parent rates verbal responses with simple taps (clear sentence / a few words / gestures only, etc.).
5. **Echo Caves (sensory)** — match sounds to creatures, spot the crystal that differs in color or texture, find the hidden creature in a scene. Measure: auditory and visual discrimination accuracy.
6. **Owl's Tower (processing)** — memory riddles ("which door did the owl fly through?"), follow the owl's multi-step instructions, quickly sort falling potion bottles. Measure: memory span, instruction-following steps completed, sorting speed and accuracy.

Kailia and Noel travel together through every one of these lands — Kailia attempts the quests, Noel introduces them and reacts to every attempt.

## Measurement & adaptivity rules
- Every mini-quest logs: domain, task id, difficulty level, accuracy, attempts, response time, and (where relevant) precision metrics like tracing deviation.
- Tasks are adaptive: get harder after success, gently easier after struggle. Never show failure states — a miss is "Kailia needs a little more light, try again!" not "Wrong."
- Each difficulty level maps to an approximate developmental age band per domain. Store this mapping in a single config file (e.g. `lib/milestones.ts`) so it is easy to review and adjust with real data.
- Kids see only story rewards: map regions unlocked, companion creatures collected, badges. No scores, timers, or grades on the child-facing screens.
- Parents get a separate dashboard: per-domain developmental-age estimate, trend over time, and plain-language notes. Include a disclaimer that this is a screening/guidance tool, not a clinical diagnosis.

## Tone & UX conventions
- Warm, encouraging narrator voice. Kailia speaks in short, simple sentences.
- Big touch targets, minimal text for pre-readers, audio narration for all instructions.
- Sessions are short: each land is completable in 3–5 minutes.
- Celebrate effort, not just correctness (animations, sounds, companion reactions).
- Accessible: works with touch and mouse, high-contrast friendly, no rapid flashing.

## Engineering conventions
- Build on the existing app and its current `/play` route — extend, don't rewrite, unless a rewrite is clearly justified and approved first.
- Keep game logic separate from measurement logic: games emit events; a scoring module interprets them.
- One reusable "quest engine" component; each mini-game is a plugin conforming to a shared interface (start, onEvent, complete → metrics payload).
- Write metrics to whatever persistence the app already uses; if none exists, propose the simplest option first.
- Ask before adding heavy dependencies. Prefer plain React/canvas/SVG for mini-games before reaching for a game engine.

---

# Build prompts (paste into Claude Code one at a time)

## Prompt 1 — Audit
"Read this CLAUDE.md, then explore the existing codebase, especially the /play route. Summarize the current architecture, what assessment tasks already exist, how data is stored, and propose a plan to evolve it into the adventure structure described above — reusing as much existing code as possible. Don't change any code yet."

## Prompt 2 — World map & quest engine
"Implement the world map screen showing the six lands (locked/unlocked states) and a reusable quest engine component with the shared mini-game interface described in CLAUDE.md. Wire one placeholder quest so I can click a land, play a stub task, and return to the map with a reward animation."

## Prompt 3 — First land: Firefly Forest
"Build the Firefly Forest fine-motor land with three mini-quests: path tracing, firefly tapping (moving targets), and bridge-stone dragging. Emit precision and timing metrics through the quest engine. Include Kailia's story framing, audio-friendly instructions, and adaptive difficulty."

## Prompt 4 — Scoring & milestones
"Create the scoring module and lib/milestones config that map quest metrics to developmental age bands per domain. Persist results per child profile. Show me the milestone mapping for review before finalizing."

## Prompt 5 — Parent dashboard
"Build the parent dashboard: per-domain developmental-age estimates, progress over time, and plain-language summaries, with the screening-not-diagnosis disclaimer. Keep it on a separate route from all child-facing screens."

## Prompts 6+ — Remaining lands
Repeat the Prompt 3 pattern for Dragon's Treasure Cave (math), Whispering Signposts (reading), Village of the Story Keepers (communication, with parent-assist mode), Echo Caves (sensory), and Owl's Tower (processing) — one land per prompt, testing each before moving on.
