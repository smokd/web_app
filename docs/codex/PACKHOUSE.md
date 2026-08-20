# Packhouse Module

## Purpose

The Packhouse functionality records processing and packhouse quality rejects.

It is currently integrated into the Harvest form.

---

## Main Component

`src/app/harvest/components/PackhouseSection.tsx`

---

## Packhouse Entry

A packhouse entry contains:

- variety
- processedKg
- rejectKg
- rejects
- rejectInputMode
- optional notes

---

## Default Mode

Default reject input mode should be:

`PERCENT`

---

## Reject Types

The packhouse uses the same defect types:

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

## Percentage Calculation

Percentage is based on total packhouse reject KG.

Example:

Processed = 500 kg

Total Reject = 100 kg

Underripe = 20%

Birds = 30%

Soft = 50%

Results:

Underripe = 20 kg
Birds = 30 kg
Soft = 50 kg

---

## Validation

Packhouse rejects cannot exceed processed KG.

Percentage breakdown must total 100%.

Empty reject types must not be saved.

KG mode must not exceed total reject KG.

---

## UI

Reject numeric inputs should not display browser spinner arrows.

---

## Database

Packhouse processing creates:

`PackhouseLoad`

Packhouse reject breakdown creates:

`PackhouseReject`

The exact relationship must be verified against the Prisma schema.

---

## Important Bug History

An empty reject row previously caused a Server Action error.

The error was:

`Packhouse reject type is required at row 2`

The form appeared to lose selected varieties while retaining numeric values.

This behavior must not return.

Failed validation must preserve client state.
