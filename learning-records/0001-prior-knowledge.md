# Prior knowledge: software engineer deploying a static portfolio

Mami is a software engineer with production experience. The security learning
is grounded in a real project (a static globe portfolio deploying to GitHub
Pages) rather than abstract study. He can handle technical depth but is not
a security specialist.

**Implications:** Skip introductory "what is the internet" framing. Go
straight to concepts, show real code from the actual codebase, and explain
the attacker's motive alongside the defense.

---

# Supply chain attacks and SRI: concept established

From the grilling session, Mami understood and accepted the supply chain
attack threat model and the SRI defense before any formal lesson was taught.
He knows: CDN scripts run with full page trust; a compromised CDN can inject
arbitrary code; SRI hashes lock a script to its known content at a specific
version.

**Implications:** Lesson 1 can skip the motivational framing and go straight
to the mechanics of how to generate and apply hashes. Focus on the hands-on
skill, not re-explaining why it matters.
