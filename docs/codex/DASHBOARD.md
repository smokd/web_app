# Dashboard Module

## Purpose

The Dashboard provides high-level operational summaries.

---

## Data

Dashboard information may depend on:

- Harvest
- Field rejects
- Packhouse processing
- Packhouse rejects
- Varieties
- Dates

Always inspect the current implementation before changing calculations.

---

## Important Calculations

Keep these concepts separate:

### Total Harvest

Sum of harvested KG.

### Total Field Rejects

Sum of resolved field reject KG.

### Field Reject Rate

Total field rejects / total harvested KG × 100.

### Good Harvest

Harvested KG - field rejects KG.

---

## Cache

Harvest mutations currently revalidate:

`/dashboard`

Any changes to data used by Dashboard must consider cache invalidation.
