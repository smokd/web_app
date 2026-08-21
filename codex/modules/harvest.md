# Harvest Module

Primary files: `src/app/harvest/page.tsx`, `actions.ts`, and `components/HarvestForm.tsx` / `FieldRejectSection.tsx` / `PackhouseSection.tsx`.

The form holds an array of per-variety entries with independent variety, harvested KG, blocks, reject input mode, total field reject KG, and defect rows. It defaults new varieties to percentage mode but currently starts with no defect rows.

IMPLEMENTED: client-side `totalFieldRejectKg` and mode are now included in `harvestEntries`; server percentage logic uses that explicit total. `npm run lint` passed; manual scenario and completed production-build verification remain pending. Do not change the percentage rule: percentages divide total field reject KG.

The client validates empty reject types and invalid/non-100% percentage breakdowns before calling the action, retains state on failure, and resets only on successful action completion.
