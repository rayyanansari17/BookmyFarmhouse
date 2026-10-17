# BookMyFarmhouse

Vendor and admin portals for managing farmhouse/venue listings (Next.js 16, MongoDB, NextAuth).
There is no public site: `/` redirects to the vendor login, admins sign in at `/admin/login`.

```bash
pnpm install
pnpm dev     # http://localhost:3000
pnpm build
pnpm lint
```

See [CLAUDE.md](./CLAUDE.md) for the tech stack, routes, environment variables, and the staging → production release process.
The scraper service lives in `scraper/` (deployment bundle in `deploy/oracle/`).
