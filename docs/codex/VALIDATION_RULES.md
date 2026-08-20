# Validation Rules

## General

All user input must be validated on the server.

Client validation improves user experience but does not replace server validation.

---

# Harvest

## Variety

Required.

---

## Harvested KG

Must be finite.

For new harvest records:

Must be greater than zero.

---

# Field Rejects

## Reject Type

Required when a reject row exists.

---

## Reject Value

Must be finite.

Must not be negative.

---

## Percentage

Must be between:

0 and 100.

---

## Percentage Breakdown

Must total:

100%

within a small tolerance.

---

## KG Breakdown

Sum of KG rows must not exceed total reject KG.

---

# Packhouse

## Variety

Required.

---

## Processed KG

Must be finite.

Must not be negative.

---

## Reject KG

Must be finite.

Must not be negative.

Must not exceed processed KG.

---

## Packhouse Reject Type

Required when a reject row exists.

---

## Packhouse Percentage

Must be between:

0 and 100.

---

## Packhouse Percentage Breakdown

Must total 100%.

---

## Input Mode

Valid values:

- KG
- PERCENT

Do not accept arbitrary values.

---

## Mixed Modes

Do not mix KG and PERCENT rows inside the same reject breakdown.

---

# Form State

Failed validation must not reset user-entered values.

Successful submission may reset the form.
