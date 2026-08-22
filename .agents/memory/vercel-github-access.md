---
name: Vercel and GitHub access
description: Notes about validating deployments and pushing repository repairs
---

Repository pushes may require an authenticated remote URL even when the configured Git remote rejects credentials; preserve the remote history before retrying a push when local and remote histories differ.

**Why:** The workspace starter history and the user's repository history were unrelated, while the authenticated push path succeeded only after preserving the upstream commit as a merge parent.

**How to apply:** Fetch the target branch first, avoid rewriting it without consent, and confirm the pushed commit with `git ls-remote`.