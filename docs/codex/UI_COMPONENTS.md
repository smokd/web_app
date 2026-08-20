# UI Components

## General

The application uses React components with CSS classes defined by the project.

Avoid replacing existing UI patterns unnecessarily.

---

## Harvest Components

Current known components include:

- HarvestForm
- HarvestTable
- FieldRejectSection
- PackhouseSection
- WeatherInput
- MonthlyHarvestVerification

---

## Client State

Interactive form components generally maintain state locally.

Important rule:

A failed save must not reset client state.

Only successful saves should reset the form.

---

## Dynamic Rows

Dynamic rows should have stable React keys.

Where possible, use a unique ID for entries rather than array indexes.

Reject rows can use indexes where the current architecture requires them, but changing row identity should be handled carefully.

---

## Number Inputs

Numeric inputs should remain numeric.

For reject inputs, browser spinner controls should be hidden using CSS rather than changing the input type.

---

## Select Inputs

Select controls must preserve selected state across failed submissions.

Avoid changing a controlled select into an uncontrolled input accidentally.

---

## Success/Error Messages

Success and error messages should reflect the current form operation.

An old success message should not remain visible while a new record is being entered.
