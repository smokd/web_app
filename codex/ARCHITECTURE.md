# Architecture

The project is a Next.js 16.3 App Router application using React 19, TypeScript, Prisma 7, and SQLite (`DATABASE_URL`, with `file:./dev.db` fallback in `src/lib/prisma.ts`).

Pages are primarily Server Components that query Prisma directly. Interactive entry forms are Client Components which call Server Actions. Shared navigation is rendered by `src/app/layout.tsx`; global and module CSS are imported there.

Key routes:

- `/` — operational dashboard; `/dashboard` redirects here.
- `/harvest` — harvest entry, daily table, and monthly verification.
- `/packhouse` — standalone queue for processing harvests.
- `/reports` — weekly reporting and PDF download.
- `/shelf-life` — shelf-life tracking/prediction module.
- `/audit` — administrator audit trail.

`src/lib/prisma.ts` supplies the shared Prisma client. `src/lib/audit.ts` records audit events without failing the underlying mutation if audit insertion fails.
