# Inspiration

Sites and articles to study while building this portfolio. Grouped by what each one is good for.

---

## 1. Animated globes (the closest direct references)

These are the projects whose *globe* itself is worth dissecting — the textures, the motion, the arcs, the camera language.

| Site | What to study |
|---|---|
| **github.com** (logged-out homepage) | The gold standard. Zoom in close: WebGL globe with PR/commit arcs streaming between cities, a continuous slow auto-rotate, and *very* careful atmospheric glow. The arc tails fade with a comet head — exactly the look this project is going for. |
| **stripe.com** (and stripe.com/sessions older builds) | Stripe's globe uses the same arc-with-comet-head idiom. Watch how short the arc lifetime is and how restrained the colors are. |
| **linear.app** / **family.co** / **vercel.com** | All ship the small "Cobe" canvas globe. Useful to study the *minimum viable* tasteful globe — slow drift, single dot, ambient glow. Notice how they don't overdo it. |
| **flightradar24.com** & **wind.tagomago.com** | Reference for *legibility* at high arc density. If you ever decide to add many arcs, these show what readable density looks like. |
| **globe.gl examples** (vasturiano.github.io/globe.gl) | The library this project uses. Browse every example — the arcs / rings / HTML labels / points demos are all directly applicable patterns. |
| **observablehq.com/@d3/world-tour** | D3 globe with orthographic projection. Not WebGL, but a great study in *camera narrative*: how to fly from country to country and what timing feels natural. |

### Articles & case studies on these globes

- **"Inside GitHub's new homepage" / "A new look for GitHub.com"** on the GitHub Blog (`github.blog`). Walks through how the GitHub globe was built: WebGL + custom shaders, the arc data pipeline, performance trade-offs, accessibility. Search the blog for "globe" — there are at least two posts (the launch post and a deeper engineering retrospective).
- **Vladimir Agafonkin's writing** at `mourner.github.io` and on Twitter/X. He led mapping work used as reference for the GitHub globe; his posts on map shaders and projection math are gold.
- **Shu Ding's Cobe** (`github.com/shuding/cobe`). The README and source are short. Read the shader directly — it's a single fragment-shader globe, no Three.js, ~5KB. Excellent example of "less is more."
- **vasturiano's globe.gl source** (`github.com/vasturiano/globe.gl`). Read `src/globe.js` to understand how arcs, rings, and HTML elements are layered.

---

## 2. Scroll-driven storytelling (the camera language)

The hard part of this portfolio isn't the globe — it's the *scroll choreography*. These sites teach the pacing.

| Site | What to study |
|---|---|
| **apple.com** product pages (AirPods Pro, Vision Pro, MacBook Pro launches) | The canonical reference for scroll-pinning a hero 3D scene and walking the user through it. Note how long they *dwell* on each beat before moving the camera. |
| **stripe.com/payments**, **stripe.com/atlas** | Scroll-linked SVG/Canvas reveals. Subtle, never jumpy. Watch the easing on every animated property — it's almost always `cubic-bezier` or `power2.inOut`, never linear. |
| **pitch.com** | Smooth scroll feel + scene transitions that feel cinematic without being heavy. |
| **arc.net** | Scroll + microinteractions calibrated very carefully. Polish reference. |
| **nuro.ai** / **waymo.com** | Auto industry sites that use scroll-driven 3D scenes well. Camera-as-narrator. |
| **igloo.inc** / **bonhomme.lol** | Award-winning scroll narratives. Heavier than this portfolio should be, but useful as a "what's possible" yardstick. |

### Articles on scroll choreography

- **GSAP ScrollTrigger docs** (`gsap.com/docs/v3/Plugins/ScrollTrigger`) — the official examples page is dense with patterns directly applicable to chapter-pinning and scrub timelines.
- **Codrops** (`tympanus.net/codrops`) — search "ScrollTrigger" and "scroll-driven." Tutorials with full source. Their case studies of award sites also explain timing decisions.
- **Locomotive's blog** (`locomotive.ca`) — they wrote `locomotive-scroll` and have written about smooth-scroll vs native, accessibility, and pacing.

---

## 3. Bruno-tier 3D portfolios (the craft bar)

The "north star" tier. Most of these are studios, not individuals, but the craft is the target.

| Site | What to study |
|---|---|
| **bruno-simon.com** | The reference. Note how *much* is happening, but how each element earns its place. Toy-like, playful, never gratuitous. |
| **threejs-journey.com** | Bruno's course site. Less playful, more refined — closer to what a "professional portfolio" version of Bruno's craft looks like. This is probably closer to the right register for this portfolio. |
| **lusion.co** | Sumptuous WebGL. Pay attention to material design and post-processing (bloom, color grading). |
| **active-theory.com** | Long-form case studies. Their write-ups of the work explain decisions, not just outputs. |
| **14islands.com** | Studio behind several award sites; their blog posts about performance budgets on Three.js sites are practical. |
| **exp-points.com** | High-craft personal-feeling work. |
| **ueno.co** | Tasteful WebGL with strong typography (which this portfolio currently does *not* have — borrow from here). |
| **awwwards.com / siteinspire.com / godly.website** | Galleries. Don't browse for hours — use them to find one or two sites per week to study deeply. |

### Articles & courses

- **Three.js Journey** (`threejs-journey.com`) — Bruno's course. The lessons on shaders, scroll-driven scenes, and the "Portfolio" lesson specifically are directly applicable. If you only buy one resource for this project, this is it.
- **Maxime Heckel's blog** (`blog.maximeheckel.com`) — long-form articles on Three.js, shaders, React Three Fiber. Excellent shader explainers.
- **The Discover Three.js book** (`discoverthreejs.com`) — free online. Good fundamentals reference when something in `globe.gl` breaks and you need to drop into raw Three.js.

---

## 4. The "subtle polish" tier (small detail studies)

Since the brief is "many small polished details > a few showy effects," these sites are valuable for *one specific thing each*.

| Site | Study this one thing |
|---|---|
| **stripe.com** | Gradient backgrounds, button states, micro-shadows. |
| **linear.app** | Type rhythm, dark-mode palette, cursor states. |
| **vercel.com** | Code-style typography, dotted patterns, hover states on cards. |
| **rauno.me** (Rauno Freiberg's portfolio) | Truly tiny details — focus rings, transitions on selection, keyboard interactions. Closer to "personal portfolio" energy than the studio sites. |
| **paco.me** (Paco Coursey) | Another excellent personal portfolio. Mostly 2D, but the polish on every transition is at Bruno-tier care. |
| **emilkowal.ski** / **buildui.com** | Emil Kowalski's animation studies. Library of "how should this transition feel" examples. |

---

## 5. Reading list — performance & WebGL hygiene

Once the visuals are right, these are the resources that keep it from melting laptops (which already bit this project once at 11GB RAM).

- **discoverthreejs.com/tips-and-tricks** — concise list of perf pitfalls.
- **Maxime Heckel: "Refraction, dispersion, and other shader light effects"** and his other Three.js posts. Real-world perf notes throughout.
- **WebGL Best Practices** on MDN — the official checklist. Pixel ratio, texture sizing, draw call budgets.
- **Cobe README** — Shu Ding explicitly explains why Cobe doesn't use Three.js (bundle size + cost). Useful counter-argument to keep in mind.
- **Bruno Simon's "Portfolio" lesson in Three.js Journey** — covers the exact failure modes this project just hit (over-rendering, off-screen draw cost, dPR misuse).

---

## How to use this list

Don't browse it like a feed. Pick *one* site per work session, open devtools, and answer three questions:

1. **What is the camera doing on scroll?** (Position, zoom, rotation curves.)
2. **What is *not* moving?** (Stillness is half the craft.)
3. **What would I steal from this?** (One specific thing — a color, a timing, a transition.)

Write the answer down. Apply one of them before the next session.
