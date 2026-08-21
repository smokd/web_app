# Packhouse Module

Two workflows exist:

- The Harvest form has an integrated multi-entry `PackhouseSection`; its entries default to percentage mode and create unlinked `PackhouseLoad` rows in `createHarvestRecord`.
- `/packhouse` has a standalone `PackhouseForm` that creates one load linked to a selected Harvest through `createPackhouseLoad`.

For percentage rows, percentages divide each entry's `rejectKg`. The Harvest action requires percentage rows to total 100%; the standalone workflow accepts only KG reject rows.
