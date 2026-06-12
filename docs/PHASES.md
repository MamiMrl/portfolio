# Phases

A chronological log of *why* each major chunk of work happened. Git log says what changed; this says what we learned.

> Phases A and C were exploratory and never merged as discrete commits — A was the initial scaffold (Vite + globe.gl + Lenis), C was a hero-typography pass folded into E.

---

## Phase B — Multi-city career journey + Mardin Easter egg

**Commit:** `1865c20` (then `b0e4a47` fixes)

**What shipped:** The first version of the scroll-driven journey. Hero, five city chapters (Istanbul → Ingolstadt → Berlin → Wuppertal → Bonn), camera-flyTo on scroll, city markers, the dot-nav rail. The "Mardin dot" is a permanent faint marker on Mami's hometown — an Easter egg, kept across all phases.

**Lessons learned:**
- `globe.gl`'s built-in `pointOfView` animation was too rigid for scroll-scrubbed flight. We use `flyTo({ duration: 0 })` and drive lat/lng/alt as plain values via GSAP scrub.
- City colors must occupy roughly the same saturation/lightness band or they look like a clown emoji together. We standardized around the Tailwind 400–500 palette.

---

## Phase D — Stripe-style arc animation with performance optimization

**Commit:** `46f4820`

**What shipped:** The custom comet-shader arcs between cities (replacing `globe.gl`'s built-in dash arcs). Inspired by GitHub's homepage globe and Stripe's arc-with-comet-head idiom. 2.5s arc draw time matches Stripe.

**The 11GB incident:** the first version of Phase D used antialiasing, an uncapped pixel ratio, and a continuous tick loop even when no arcs were present. RAM ballooned to 11GB and laptops thermal-throttled. The fix:
- `antialias: false` on the renderer.
- Pixel ratio capped at `Math.min(devicePixelRatio, 1.5)`.
- The arc loop starts only when arcs exist and stops when the last arc is removed.
- No per-frame allocations inside the loop.

**The fix is now load-bearing.** Every visual addition after Phase D respects the same constraints. See `docs/ARCHITECTURE.md` § "Performance commandments."

**Lessons learned:**
- The arc shader's comet-head + tail is just a uv-driven alpha falloff. No noise, no textures. Total cost: one ShaderMaterial per arc.
- Bloom would have given the head a beautiful glow — but it doubles fragment cost across the whole screen. Fresnel-style emission in the shader gets you ~90% of the look for ~0% of the cost. This became the rule for all subsequent "glow" needs.

---

## Phase E — Erasmus interlude chapter, UI redesign, typography

**Commit:** `e02bc31`

**What shipped:** The Erasmus chapter — an interlude between Istanbul and Ingolstadt that zooms the camera out to a Europe view, draws a Ljubljana-centered constellation of arcs to 8 travel destinations, and scrubs them in as the user scrolls. Plus a full typography pass (Space Grotesk + JetBrains Mono) and the left-side vignette `#left-veil`.

**Lessons learned:**
- A chapter doesn't have to be a city. The interlude format (single sticky scene + scrub-driven content reveal) is reusable for any "show your work" moment.
- The constellation needs a *home* dot (Ljubljana) clearly larger and brighter than the destination dots — otherwise the fan reads as eight unrelated arcs instead of "trips out from one place."
- The dot-nav benefits from including the interlude as its own stop (Erasmus violet), even though there's no single city. It gave the journey a 6-step rhythm instead of 5.

---

## Phase F — Atomic core + rainbow detonation finale

**Commit:** *(this phase — implementation log)*

**What shipped:** Two new visual systems on top of the existing journey.

1. **Atom (`Atom.js`).** A Bohr-style atom — 3 tilted orbital rings + up to 6 electron points — that lives behind the globe. The atom *builds itself* as the user progresses: each chapter adds one electron in that chapter's city color. By Bonn, the atom is complete and reads as a clean rainbow.
   - **Spectral seating, not chronological seating.** Each city has a fixed *seat* on the rings, assigned by hue (orange → green → cyan → blue → violet → pink). Electrons *arrive* in chapter order but *settle* at their spectral seat. The completed atom always reads as a harmonious rainbow regardless of how the user got there.
   - **Per-electron arrival animation:** spark → expand → overshoot → settle → ring pulse. ~690ms per arrival. The settle pulse makes existing electrons briefly brighten, so the system "reacts" to each new member.
   - **Ring tilts at 23°, 47°, 71°** — non-symmetric so the atom reads as designed, not as a schoolbook diagram.

2. **Detonation (`Detonation.js`).** A new `.detonation-stage` section between the Bonn chapter and the "Let's talk" finale fires a one-shot 1.6s timeline:
   - **Charge → dissolve → flash → shards → settle.**
   - The flash is an SVG circle whose edge is mangled by `feTurbulence` + `feDisplacementMap`. As the flash expands, `baseFrequency` is animated to "grow teeth" — the ragged anime ink-edge.
   - **6 staggered color streams** of SVG-polygon shards burst radially. Each color (one per city) owns its own angular sector and fires ~60ms after the previous one. This is what stops it from reading as a clown blob: the eye groups by color *because* each color arrives as its own gesture (research cite: mo.js burst tutorial, Animation Mentor "secondary action").
   - Fires `once: true`. Replaying a finale cheapens it.

**Lessons learned:**
- Spectral seating is the difference between "interesting" and "premium" for a multi-hue display. Even six well-chosen hues look like clown vomit if their *spatial* arrangement is random.
- The settle beat (~200–400ms after an animation peaks) is what separates Bruno-tier from amateur. The `back.out(2)` ease + ring pulse is the entire move; it costs about 8 lines of GSAP but transforms the feel.
- An anime ink-edge dissolve is achievable with pure SVG (`feTurbulence` + `feDisplacementMap`) — no shaders, no textures, no sprite sheets. We tried sprite sheets first; no CC0 anime-style impact frames exist.

**Files added:** `src/Application/World/Atom.js`, `src/Application/World/Detonation.js`
**Files touched:** `Globe.js`, `World.js`, `Chapters.js`, `index.html`, `src/styles/main.css`
