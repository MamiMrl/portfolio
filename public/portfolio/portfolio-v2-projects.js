/* portfolio-v2-projects.js — content-as-code: the "CMS" is this array.
   Add a project = add an object here. Renders synchronously into
   #work-projects so the globe/UI scripts (which run after) can wire
   up ScrollTriggers, scramble, and magnetic links as usual. */

(function () {
  'use strict';

  // ── Edit this. That's the whole workflow. ──────────────────
  const PROJECTS = [
    {
      id: 'lightweight',
      color: '#facc15',
      eyebrow: 'W1 · In production',
      name: 'Light Weight.',
      copy: `A weekly strength-training newsletter that turns sports-science
             papers into advice you can use under a barbell. Designed, written,
             built, and shipped solo — issue 014 and counting.`,
      chips: ['Newsletter · weekly', 'Solo: design → copy → code'],
      links: [
        { label: 'Read an issue ↗', href: '#' }, // TODO: real URL
      ],
      media: {
        type: 'image',
        src: 'assets/lightweight-screenshot.png',
        alt: 'Light Weight newsletter, issue 014',
      },
    },
    {
      id: 'thissite',
      color: '#9a7bff',
      eyebrow: "W2 · You're looking at it",
      name: 'This website.',
      copy: `A scroll-driven WebGL globe with custom shader arcs, built from
             scratch under a real performance budget. No templates, no UI
             frameworks. View source — that's the point.`,
      chips: [],
      links: [
        { label: 'Source on GitHub ↗', href: 'https://github.com/MamiMrl' },
      ],
      media: {
        type: 'terminal',
        lines: [
          { prompt: true,  text: 'npm ls --depth=0' },
          { text: '├── three' },
          { text: '├── gsap' },
          { text: '└── lenis' },
          { dim: true, text: 'frameworks: none' },
          { dim: true, text: 'pixel ratio: capped at 1.5' },
          { dim: true, text: 'post-processing: refused' },
        ],
      },
    },
  ];

  // ── Render (escape-by-default; structure mirrors the hand-written v2 markup) ──
  const esc = s => String(s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const squish = s => s.replace(/\s+/g, ' ').trim();

  function mediaHTML(m) {
    if (m.type === 'image') {
      return `<figure class="work-project__media">
        <img src="${esc(m.src)}" alt="${esc(m.alt || '')}" loading="lazy" />
      </figure>`;
    }
    if (m.type === 'terminal') {
      const lines = m.lines.map(l => {
        const cls = 'terminal-card__line' + (l.dim ? ' terminal-card__line--dim' : '');
        const prompt = l.prompt ? '<span class="terminal-card__prompt">$</span> ' : '';
        return `<p class="${cls}">${prompt}${esc(l.text)}</p>`;
      }).join('\n');
      return `<figure class="work-project__media work-project__media--terminal">
        <div class="terminal-card">${lines}</div>
      </figure>`;
    }
    return '';
  }

  function projectHTML(p) {
    const chips = p.chips.length
      ? `<div class="chips">${p.chips.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div>`
      : '';
    const links = p.links.map(l => {
      const ext = /^https?:/.test(l.href) ? ' target="_blank" rel="noopener"' : '';
      return `<a class="work-link magnetic" href="${esc(l.href)}"${ext}>${esc(l.label)}</a>`;
    }).join('');

    return `<section class="work-project" data-project="${esc(p.id)}"
      style="--city-color:${esc(p.color)}" data-screen-label="Work: ${esc(p.name)}">
      <div class="work-project__inner">
        <div class="work-project__text">
          <p class="eyebrow">${esc(p.eyebrow)}</p>
          <h3 class="work-project__name" data-scramble>${esc(p.name)}</h3>
          <p class="copy">${esc(squish(p.copy))}</p>
          ${chips}
          <div class="work-project__links">${links}</div>
        </div>
        ${mediaHTML(p.media)}
      </div>
    </section>`;
  }

  const mount = document.getElementById('work-projects');
  if (mount) mount.innerHTML = PROJECTS.map(projectHTML).join('\n');

  window._portfolioProjects = PROJECTS;
})();
