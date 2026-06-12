# Mami Maral — Portfolio

A scroll-driven, single-page WebGL portfolio built around a slowly-spinning globe and a Bohr-style atom that *assembles itself* as you read through the chapters of a six-city career journey. The journey climaxes with the globe and atom detonating into a rainbow ink-burst, revealing the final "Let's talk" section.

> **Quality bar:** Bruno-tier craft, "subtle > showy." Many small polished details beat a few loud effects. See [`INSPIRATION.md`](./INSPIRATION.md) for the references this is calibrated against.

---

## Stack

- **Vite 6** — dev server + bundler
- **three.js** — underlying WebGL renderer
- **globe.gl** — high-level globe primitives (arcs, rings, HTML labels, atmosphere)
- **GSAP + ScrollTrigger** — scroll-linked timelines and easing
- **Lenis** — smooth scroll
- No framework, no TypeScript, no JSX. Plain ES modules.

## Run

```bash
npm install
npm run dev         # http://localhost:5173
npm run build       # production bundle into ./dist
npm run preview     # preview the production bundle
```

## What's where

```
.
├── index.html                  # markup for hero, chapters, dot-nav, detonation overlay
├── main.js                     # entry — instantiates Application
├── public/textures/            # earth-night.jpg, earth-topology.png
├── src/
│   ├── styles/main.css         # one CSS file, design tokens at the top
│   └── Application/
│       ├── Application.js      # composes Sizes, World, Scroll, Chapters
│       ├── Sizes.js            # responsive viewport observer (emits 'resize')
│       ├── Scroll.js           # Lenis smooth-scroll wrapper
│       ├── Chapters.js         # ScrollTrigger choreography for every scroll beat
│       ├── Utils/
│       │   └── EventEmitter.js
│       └── World/
│           ├── World.js        # owns Globe + Detonation
│           ├── Globe.js        # globe.gl wrapper + custom comet-shader arcs + atom
│           ├── Atom.js         # Bohr-style atom: 3 tilted rings + Points electrons
│           └── Detonation.js   # one-shot finale: dissolve + flash + rainbow shards
├── INSPIRATION.md              # reference sites & articles, grouped by what they teach
└── docs/
    ├── ARCHITECTURE.md         # mental model, dataflow, "how to add a chapter"
    └── PHASES.md               # what shipped in each phase and why
```

## Design principles

Before changing anything, internalize these — they guide every decision in the codebase:

1. **Subtle, not overkill.** Many small polished details beat a few showy effects. The atom is 25–30% opacity; the camera moves are slow; the explosion is the *only* loud moment in the whole site.
2. **Plan before code.** Every visual beat is decided up-front. We do not refactor by spelunking.
3. **Performance is a feature.** No `EffectComposer`, no `UnrealBloomPass`, no `antialias: true`. Pixel ratio is capped at 1.5. No per-frame allocations. (See `docs/ARCHITECTURE.md` for the full performance commandments.)
4. **The globe is the stage; chapters are the script; scroll is the projector.** Anything that breaks this metaphor needs a very good reason.

## Reading order for a new collaborator

1. This README — what is this, how to run.
2. [`INSPIRATION.md`](./INSPIRATION.md) — *why* it looks the way it does.
3. [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — the mental model and file map.
4. [`docs/PHASES.md`](./docs/PHASES.md) — what shipped when, and the lessons each phase taught.
5. Open `src/Application/Chapters.js` — every scroll beat is bound there. It's the script.
