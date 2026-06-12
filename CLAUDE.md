# CLAUDE.md

Operating context for AI assistants on this repo.

## Identity (do not change)

The owner of this portfolio is **Mami Maral**. The hero greeting is **"Hi, I'm Mami"**.

- Any "Berke Çelik" → use **Mami Maral**.
- Any standalone "Berke" → use **Mami**.
- Contact: `mami.maral@proton.me` · LinkedIn `https://www.linkedin.com/in/muhammedmaral/` · GitHub `MamiMrl`.
- Older docs (README, docs/, INSPIRATION) and the `design-brief/` drop still contain "Berke" as a leftover from the design brief — when you touch those files for any reason, replace it; don't keep adding fresh references.

## Project Overview

Scroll-driven single-page WebGL portfolio. Earth globe with a six-city career journey, an Erasmus constellation interlude, a Selected Work act (project list in `public/portfolio/portfolio-v2-projects.js` — "content-as-code CMS"), and a contact end-stage. Built on globe.gl + GSAP via CDN, with three small IIFE scripts; Vite is used only as a build/dev server.

> **Note:** the rest of this file plus `docs/ARCHITECTURE.md`, `docs/PHASES.md`, and `INSPIRATION.md` still describe the **legacy v1 architecture** (Bohr-style Atom, three.js Points, comet-arc shader). That design was retired when the v2 brief landed; the Atom-related rules below no longer apply. Treat them as historical until those docs are rewritten.

→ [`README.md`](./README.md) · [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) · [`docs/PHASES.md`](./docs/PHASES.md) · [`INSPIRATION.md`](./INSPIRATION.md)

## Code Style

- Plain ES modules. No TypeScript, no JSX, no framework, no JSDoc.
- 2-space indent. Single quotes. No semicolons.
- Private class fields use `#`. Identifiers do the explaining.
- Comments only for non-obvious *why*. No "what" comments.

## Architecture Notes

Globe = stage · `Chapters.js` = script · scroll = projector. Full diagram in `docs/ARCHITECTURE.md`.

- `Chapters.js` — all ScrollTrigger bindings; source of truth for timing.
- `Globe.js` — globe.gl wrapper + comet-arc shader, owns the Atom.
- `Atom.js` — 3 tilted rings + `THREE.Points` electrons at spectral seats (hue-ordered).

## Don'ts

**Performance (11GB rule)** — full reasoning in `docs/ARCHITECTURE.md` § "Performance commandments":
- No `EffectComposer`, bloom, or post-processing. No `antialias: true`. Pixel ratio ≤ 1.5.
- No per-frame allocations. `depthWrite: false` on all transparent additive materials.
- One `THREE.Points` for N electrons. Max 3 tick loops (globe.gl internal, Atom, Globe arc).

**Code:**
- Don't touch comet-arc shader constants in `Globe.js#buildArcMesh` — see `INSPIRATION.md` § 1.
- Don't reorder `SEATS` in `Atom.js` — it defines the spectral rainbow.
- Don't write JSDoc or multi-line comment blocks.
- Don't refactor code outside the current task's scope.

**Process:**
- Plan before code. Lock visual direction before touching any file.
- When given a sub-decision, pick + state reason in one sentence + proceed.
- Commit as `MamiMrl / mami.maral@icloud.com`. Run `npm run build` after non-trivial changes.
