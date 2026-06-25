# Secrets hygiene: .env / .gitignore pattern already understood

Mami already knows API keys must live in .env and .env must be in .gitignore
before any commit. No need to teach this from scratch.

**Implications:** Skip .env fundamentals in future sessions. If a service
integration comes up, go straight to the specific key management pattern for
that service (e.g. GitHub Actions secrets for CI, Netlify env vars for deploy).
