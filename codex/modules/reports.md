# Reports Module

`src/app/reports/page.tsx` builds a Monday-to-Sunday weekly report from Harvest records and their field rejects and packhouse loads/rejects. It renders `WeeklyReport` and a PDF export button.

The report uses `Harvest.fieldRejectsKg` as its field-reject aggregate and sums resolved child packhouse reject KG for packhouse aggregates.
