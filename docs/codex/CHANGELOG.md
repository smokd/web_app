# Development Changelog

This file records important architectural and business-rule changes.

---

## Harvest Reject System

### Business Rule

Reject percentages represent percentages of the total reject quantity.

Example:

1,000 kg harvested
200 kg total rejects

20% Underripe = 40 kg
30% Birds = 60 kg
50% Soft = 100 kg

The overall harvest reject rate remains:

20%.

---

## Multi-Variety Harvest

The Harvest form supports multiple varieties in one submission.

Each variety has independent:

- harvested quantity
- blocks
- field reject mode
- field reject breakdown

---

## Packhouse

Packhouse processing supports:

- variety
- processed KG
- total reject KG
- reject breakdown

---

## Validation

Server-side validation is authoritative.

Empty reject rows must be rejected.

Percentage breakdowns must total 100%.

---

## Form State

Failed saves must preserve user-entered state.

Forms should only reset after successful submission.

---

## Documentation Rule

Whenever a significant business rule or architectural behavior changes:

1. Update the relevant module documentation.
2. Update `CURRENT_STATE.md`.
3. Add an entry here.
4. Include the relevant source files.
5. Record important testing performed.
