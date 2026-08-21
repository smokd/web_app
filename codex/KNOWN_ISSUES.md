# Known Issues

## Harvest percentage total is lost — confirmed

`HarvestForm.tsx` tracks each variety's `totalFieldRejectKg` in percentage mode but serializes only `variety`, `harvestedKg`, `blocks`, and rows. `actions.ts` therefore uses the entire harvested quantity as the field reject total when any percentage row exists. This violates the documented rule.

## Shelf Life compile error — confirmed, out of active scope

`src/app/shelf-life/actions.ts` uses invalid syntax in `deleteShelfLifeSample`: `await requireAdmin{};`.

## Route protection inconsistency — confirmed

`/shelf-life` and `/audit` are not included in the middleware's protected-prefix list, although their pages/actions use server-side authorization patterns.

## Historical documentation

`docs/codex/` predates this canonical directory. Its `CURRENT_SATE.md` filename is misspelled while its README points to non-existent `CURRENT_STATE.md`.
