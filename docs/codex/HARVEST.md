# Harvest Module

## Purpose

The Harvest module records daily agricultural production.

It supports multiple varieties in one submission.

---

## Main Page

Current page:

`src/app/harvest/page.tsx`

The page:

- authenticates the user
- loads active varieties
- loads weather options
- loads today's records
- loads monthly records
- renders HarvestForm
- renders HarvestTable
- renders MonthlyHarvestVerification

---

## Main Form

Current component:

`src/app/harvest/components/HarvestForm.tsx`

The form supports:

- date
- supervisor
- multiple varieties
- harvested KG
- blocks
- field rejects
- packhouse
- weather
- notes

---

## Multiple Varieties

Each variety is represented as a local state entry.

Each entry contains:

- id
- variety
- harvestedKg
- blocks
- fieldRejectInputMode
- totalFieldRejectKg
- fieldRejects

New varieties should be initialized consistently.

---

## Variety State

A new variety should:

- have no selected variety
- have empty harvested quantity
- have empty blocks
- default field reject mode to PERCENT
- contain all defect rows
- have empty reject values

---

## Defect Types

Current defect types:

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

## Field Reject Rule

PERCENT mode means percentage of total field rejects.

Example:

Harvested = 1,000 kg

Total field reject = 200 kg

20% Underripe = 40 kg

30% Birds = 60 kg

50% Soft = 100 kg

---

## Overall Reject Rate

Overall reject rate is calculated against harvested KG.

Example:

200 kg rejects / 1,000 kg harvested = 20%

---

## Validation

Field reject percentages must total 100%.

Empty reject rows must not save.

Server-side validation is authoritative.

---

## Save Failure

A failed save must preserve:

- varieties
- harvested quantities
- blocks
- reject rows
- reject values
- packhouse state
- supervisor
- notes
- weather

The form should only reset after successful save.

---

## Success Message

After successful save:

`Record saved successfully.`

The success message should disappear when the user starts modifying a new record.

It must not persist indefinitely.

---

## Server Action

Current file:

`src/app/harvest/actions.ts`

Main creation action:

`createHarvestRecord`

It:

1. authenticates user
2. reads form data
3. parses harvest entries
4. validates harvest data
5. resolves field reject breakdown
6. parses packhouse
7. resolves packhouse rejects
8. creates database records in a transaction
9. creates audit log
10. revalidates pages

---

## Important

Do not change reject calculations without preserving the business rule:

Reject breakdown percentages are percentages of total rejects.
