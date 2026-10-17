# CLAUDE.md — BookMyFarmhouse Next.js App

This is the **Next.js 16 version** of BookMyFarmhouse, fully migrated from a 3-repo Vite/React + Express monorepo at `/home/rayyan/BookmyFarmhouse.app`.

## What this app is

A farmhouse/venue management app for India with **two portals only**: vendors list properties and manage their profile/leads,
admins review and approve listings and manage the platform. There is **no public/customer-facing site**: `/` redirects to the
vendor login (admins sign in at `/admin/login`). Brand color: `#ff914d` (orange). Currency: INR.

## Project status: COMPLETE — ready for deployment

Build passes with 0 TypeScript errors. All 33 pages compiled. Run `pnpm build` to verify.

## Tech stack

- **Next.js 16.2.9** — App Router, TypeScript, route groups
- **Tailwind CSS v4** + **shadcn/ui** using `@base-ui/react` (NOT `@radix-ui`)
- **NextAuth v5 (beta)** — JWT strategy, CredentialsProvider + GoogleProvider
- **Mongoose 9** — MongoDB models in `lib/db/models/`
- **Zod v4** — Validation in `lib/validators.ts`
- **Framer Motion** — Page animations, shared variants in `lib/motion.ts`
- **Recharts** — Admin analytics charts
- **Cloudinary** — Image storage

## CRITICAL: Known library quirks — don't repeat these mistakes

### shadcn/ui uses @base-ui/react (not @radix-ui)
- `asChild` prop does NOT exist on any component
- `Select.onValueChange` returns `string | null` — always guard: `if (v) handler(v)`
- For navigation inside DropdownMenuItem: use `onClick={() => router.push(...)}` not `asChild`

### Zod v4
- `.issues` not `.errors`: `parsed.error.issues[0].message`
- `zodResolver(schema as any)` needed for `z.coerce.number()` fields

### NextAuth v5
- JWT type augmentation: `declare module "next-auth"` (NOT `"next-auth/jwt"`)
- `user.image` / `user.email` can be `null` from Google — use `?? undefined` / `?? ""`
- Cast: `user as unknown as Record<string, unknown>` (not just `as Record`)

### Mongoose 9
- Pre-save hooks: `schema.pre("save", async function() { ... })` — NO `next` parameter

### Framer Motion TypeScript
- Type variants as `Variants` from framer-motion — `import type { Variants } from "framer-motion"`

### Next.js 16
- Middleware: `proxy.ts` (not `middleware.ts` — deprecated in v16)
- `useSearchParams()` needs `<Suspense>` wrapper or build fails

## Routes

### Vendor portal — `app/(vendor)/vendor/` (requires vendor role)
| Route | Description |
|---|---|
| `/vendor` | Dashboard — stats, recent listings, recent leads |
| `/vendor/listings` | Listings table with status filter |
| `/vendor/listings/new` | Multi-step add listing form + Cloudinary upload |
| `/vendor/listings/[id]/edit` | Edit listing + manage images |
| `/vendor/leads` | Inquiry management (inquiries came from the removed public form, so no new leads arrive) |
| `/vendor/profile` | Edit vendor profile |
| `/vendor/login` `/vendor/register` `/vendor/onboarding` | Auth flow |

### Admin panel — `app/(admin)/admin/` (requires admin role)
| Route | Description |
|---|---|
| `/admin` | Dashboard — stats, pending quick-action, recent leads |
| `/admin/pending` | Card review with approve/reject/star-rating |
| `/admin/listings` | Full table with search, status filter, delete |
| `/admin/users` | Vendor management, suspend/activate |
| `/admin/leads` | Read-only platform-wide leads |
| `/admin/analytics` | Recharts: monthly bar, funnel, pie status, line growth |
| `/admin/settings/locations` | Add/toggle active cities |
| `/admin/login` | Credentials-only login |

## Environment variables

`.env.local` exists at project root with placeholders. Fill in real values:

```
MONGODB_URI=
NEXTAUTH_SECRET=          # generate: openssl rand -base64 32
NEXTAUTH_URL=             # http://localhost:3000 for dev, domain for prod
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_GA_ID=        # optional — Google Analytics
```

## Development commands

```bash
pnpm dev      # http://localhost:3000
pnpm build    # production build
pnpm lint     # ESLint
```

## Deployment to Vercel

1. Fill `.env.local` with real credentials
2. Push this folder to a new GitHub repo
3. Import to Vercel → set all env vars in dashboard
4. Set `NEXTAUTH_URL` to production domain
5. Add production domain to Google OAuth redirect URIs (Google Cloud Console)
6. MongoDB Atlas → Network Access → allow Vercel IPs (or `0.0.0.0/0`)
7. Seed admin user in Atlas directly: create a User document with `role: "admin"` and bcrypt-hashed password

## Release process (staging → production)

Vercel project `bookmyfarmhouse` (team `rayyab`, Hobby plan). Two long-lived branches:

| Branch | Deploys to | Database | Access |
|---|---|---|---|
| `main` | Production: https://bookmyfarmhouse.vercel.app | `bookmyfarmhouse` | Open (login-gated portals) |
| `staging` | Staging: https://bookmyfarmhouse-git-staging-rayyab.vercel.app | `bookmyfarmhouse_staging` | Vercel team login |
| any other branch | Preview URL per push | `bookmyfarmhouse_staging` | Vercel team login |

Flow: feature branch → PR into `staging` → test on the staging URL → PR `staging` → `main` → production.
Never commit straight to `main`.

Env vars:
- `MONGODB_URI` is production-only for the `bookmyfarmhouse` DB; every preview (incl. staging) gets the staging DB.
- `NEXTAUTH_URL`, `SITE_URL` and `NEXTAUTH_SECRET` have `staging` branch overrides.
- `SCRAPER_SERVICE_URL` is production-only, because the Render scraper writes to the production DB.
  So scraping is unavailable on staging and previews.

Refresh staging data from production (copies properties, locations, users; never inquiries/logs):
```bash
SOURCE_MONGODB_URI=".../bookmyfarmhouse" TARGET_MONGODB_URI=".../bookmyfarmhouse_staging" \
  npx tsx scripts/copy-db-to-staging.ts            # add --verify to only compare counts
```
The script refuses any target whose database name doesn't contain `staging`. Atlas must be reachable from where it runs.

## Key files reference

| File | Purpose |
|---|---|
| `lib/auth/config.ts` | NextAuth providers + callbacks |
| `lib/db/mongoose.ts` | Serverless MongoDB singleton |
| `lib/motion.ts` | Shared Framer Motion variants |
| `lib/validators.ts` | All Zod schemas |
| `types/index.ts` | TypeScript interfaces + NextAuth augmentation |
| `proxy.ts` | Route protection middleware |
| `components/vendor/ListingForm.tsx` | Multi-step add/edit form |
| `components/admin/AdminShell.tsx` | Admin layout |
| `components/vendor/VendorShell.tsx` | Vendor layout |
| `components/common/GoogleAnalytics.tsx` | GA4 SPA tracker |
