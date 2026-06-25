# Web Security Resources

## Knowledge

- [MDN: Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
  The canonical reference. Covers integrity attribute syntax, hash algorithms, and CSP enforcement. Reach for this first on any SRI question.

- [MDN: Security on the web](https://developer.mozilla.org/en-US/docs/Web/Security)
  MDN's full security hub — links to CSP, mixed content, clickjacking, HTTPS. Use as a map of topics to explore.

- [OWASP: Subresource Integrity](https://owasp.org/www-community/controls/SubresourceIntegrity)
  OWASP's framing of SRI as a supply-chain control. Useful for understanding the attacker's perspective.

- [OWASP: Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
  Practical CSP reference with copy-paste examples. Use for Lesson 2 (CSP headers).

- [OWASP Top 10:2025](https://owasp.org/Top10/2025/en/)
  Authoritative list of the most critical web risks. Useful for scoping what matters vs. what doesn't for a static site.

- [Mozilla Observatory](https://observatory.mozilla.org)
  Free scanner — grades a live URL on HTTP headers, CSP, SRI coverage. Use this after deployment to measure progress.

## Wisdom (Communities)

- [OWASP Slack](https://owasp.org/slack/invite)
  Active community of security practitioners. Good for specific questions once you have some fundamentals.

- [r/netsec](https://www.reddit.com/r/netsec/)
  High-signal subreddit, news-oriented. Good for staying current on real supply chain incidents.

## Gaps

- No good resource found yet on GitHub Pages–specific security constraints (header limitations). Worth searching before Lesson 2.
