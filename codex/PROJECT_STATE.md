# Current Project State

## Current branch

`version-2.0`

## Current development objective

IN PROGRESS — establish repository-local handoff documentation, then repair the Harvest multi-variety reject workflow from verified source.

## What has been completed

- DONE — repository structure, primary App Router pages, Prisma schema, session handling, middleware, server actions, styles, and the existing `docs/codex` handoff set were inspected.
- DONE — this canonical `codex/` handoff system was created.

## What is currently being worked on

- IMPLEMENTED — Harvest percentage-mode field reject data flow now includes each variety's explicit total reject KG and mode in the client payload. No further work was started before handover.

## What remains to be done

1. TODO — verify the intended automatic defect-row behavior for a newly added Harvest variety before changing it; current source creates no rows.
2. TODO — run targeted manual workflow checks after changes.
3. TODO — rerun `npm run build` and capture its final result; an initial build began successfully but this session was interrupted before it reported completion.

## Known bugs

- `src/app/harvest/actions.ts`: percentage-mode field rejects resolve against `harvestedKg`, not the UI's total reject KG.
- `src/app/shelf-life/actions.ts`: `deleteShelfLifeSample` contains `await requireAdmin{};`, which is invalid TypeScript syntax and likely blocks a production build. It is outside the active Harvest scope.
- Middleware does not include `/shelf-life` or `/audit` in its protected matcher list; those pages perform server-side checks (audit through its action), but route-level protection is inconsistent.

## Recent fixes

- IMPLEMENTED — `HarvestForm` serializes `fieldRejectInputMode` and `totalFieldRejectKg` for each variety.
- IMPLEMENTED — `createHarvestRecord` validates this total and uses it for percentage row resolution instead of harvested KG.

## Important architectural decisions

- Next.js 16 App Router with server-rendered pages, client form components, Server Actions, Prisma 7, and SQLite.
- The dashboard implementation is `/`; `/dashboard` redirects to it.
- Harvest creates one `Harvest` record per variety in a transaction. The integrated Harvest form creates unlinked `PackhouseLoad` records; the standalone Packhouse screen creates loads linked to a single harvest.

## Important business rules

- Reject breakdown percentages are percentages of that entry's total reject KG, not harvested/processed KG.
- A nonempty percentage breakdown must total 100% (tolerance currently 0.1).
- Reject KG must not exceed harvested KG for field rejects or processed KG for packhouse rejects.
- Failed Harvest submissions must preserve client state; only successful saves reset it.

## Files recently modified

- `codex/README.md`
- `codex/PROJECT_STATE.md`
- `codex/ARCHITECTURE.md`
- `codex/DATABASE.md`
- `codex/AUTHENTICATION.md`
- `codex/BUSINESS_RULES.md`
- `codex/KNOWN_ISSUES.md`
- `codex/CURRENT_TASK.md`
- `codex/CHANGELOG.md`
- `codex/modules/*.md`

## Files that still need modification

- `src/app/harvest/components/FieldRejectSection.tsx`, only after confirming the automatic-row requirement.

## Tests/checks performed

- DONE — read-only code and schema inspection.
- DONE — `npm run lint` completed successfully.
- INCOMPLETE — `npm run build` started, loaded `.env`, compiled production output, and emitted only the Next.js middleware-to-proxy deprecation warning before the command/session was interrupted. Do not record this as a passing build.
- NOT RUN — manual browser workflow checks for the implementation.

## Things that must NOT be changed

- Do not reset Harvest state after a rejected server action.
- Do not treat a defect-row percentage as a percentage of harvested/processed KG.
- Do not remove server-side authentication, authorization, or validation.
- Do not modify unrelated Shelf Life issues as part of the Harvest fix.

## Next recommended action

Implement the explicit `totalFieldRejectKg` payload and server calculation, then validate a 1,000 kg harvest with 200 kg total rejects and a 20/30/50 breakdown resolves to 40/60/100 kg.

## Last updated

2026-08-21 22:04 +02:00
