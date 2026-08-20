# Current Development State

## Last Updated

2026-08-19

---

## Active Module

Harvest

---

## Current Focus

Multi-variety harvest and reject-entry workflow.

---

## Current Requirements

- Multiple varieties can be entered in one submission.
- New varieties should display all defect rows.
- Default reject mode is PERCENT.
- Reject percentages represent percentages of total rejects.
- Field reject percentages must total 100%.
- Packhouse reject percentages must total 100%.
- Empty reject rows must not save.
- Failed submissions must preserve all form state.
- Successful-save message must disappear when a new entry is started.
- Reject numeric spinner controls should be hidden.
- Server-side validation remains authoritative.

---

## Defect Types

- Underripe
- Birds
- Soft
- Soft point
- Picking Scars
- Frost
- Stem Retention
- Fallen Berries
- Undersize

---

## Critical Business Example

Harvested:

1,000 kg

Total Field Reject:

200 kg

Breakdown:

Underripe = 20%
Birds = 30%
Soft = 50%

Calculated:

Underripe = 40 kg
Birds = 60 kg
Soft = 100 kg

Total = 200 kg

Overall field reject rate:

20%

Good harvest:

800 kg

---

## Relevant Files

- `src/app/harvest/page.tsx`
- `src/app/harvest/actions.ts`
- `src/app/harvest/components/HarvestForm.tsx`
- `src/app/harvest/components/FieldRejectSection.tsx`
- `src/app/harvest/components/PackhouseSection.tsx`
- `src/app/harvest/components/HarvestTable.tsx`
- `src/app/harvest/components/MonthlyHarvestVerification.tsx`

---

## Known Historical Bug

An empty packhouse reject row caused:

`Packhouse reject type is required at row 2`

After the failed submission, selected variety fields appeared to reset while entered KG values remained.

Removing the empty row allowed the record to save.

The desired behavior is now:

Failed validation → preserve the entire form.

---

## Next Work

Inspect the current repository implementation and implement the outstanding Harvest requirements without disturbing unrelated functionality.

---

## Testing Required

- TypeScript
- ESLint
- Production build where practical
- Single variety
- Three varieties
- All defect rows
- Empty defect row
- 90% breakdown
- 100% breakdown
- Percentage-to-KG calculation
- KG mode
- Packhouse percentage mode
- Failed-save state preservation
- Success message lifecycle
- Numeric spinner removal
