# Care pet module

`engine.ts` is the daily care pet with no app-specific code: pet stages, the one-task-a-day scheduler, and the difficulty steps. It has no imports, so another app (for example Pip, the older-adult version) can copy or share this folder and plug in its own:

- **Storage**: save and load the `CarePetState` object however the app stores data.
- **Activities**: decide which activity fills `feed`, `play` or `care` at a given difficulty step.
- **Numbers**: pass a different `CarePetConfig` (growth pace, number of steps, free days).

Kailia's adapter is `lib/kailiaPet.ts`.

Run the engine's checks with `node scripts/carepet.test.mjs` (Node 22.18 or newer).
