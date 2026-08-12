# CanFiyat Project Rules & System Directives

## 🚀 STRICT VERSION BUMP RULE (MANDATORY ON EVERY CHANGE)
Whenever ANY code, layout, style, script, or logic edit is made to this codebase:
1. **BUMP VERSION IN FOOTER ASSETS:** Always increment the version parameter for all JS and CSS asset URLs in `index.html` (e.g. `js/app.js?v=3.43`, `css/styles.css?v=3.43`).
2. **BUMP HEADER BADGE VERSION:** Always update the visible purple version badge in the `index.html` header to match the new version number (e.g. `v3.43 (...)`).
3. **COMMIT & DEPLOY WITH VERSION IN MESSAGE:** Always include the exact version string in git commit messages (e.g. `git commit -m "v3.43: ..."`).
4. **NEVER DEPLOY WITHOUT BUMPING VERSION:** Deploying without incrementing the version string is strictly forbidden to prevent browser cache invalidation failures.
