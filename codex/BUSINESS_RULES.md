# Business Rules

- A Harvest submission may contain several independent varieties. Each becomes its own `Harvest` row.
- Field/packhouse reject breakdown percentages divide the entry's total reject KG. Example: 200 kg total rejects with 20%, 30%, and 50% rows resolves to 40, 60, and 100 kg.
- Nonempty percentage breakdowns must total 100% within 0.1. Mixed KG and percentage rows are rejected by Harvest server validation.
- Field reject totals may not exceed harvested KG; packhouse reject totals may not exceed processed KG.
- A rejected Harvest submission must keep all controlled React state. Reset happens only after a successful save.
- Administrative Harvest update/delete operations require `ADMIN`; operational entry requires an authenticated user.
