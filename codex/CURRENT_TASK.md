# Current Task

Status: IMPLEMENTED — verification/handover pending

Repair the Harvest multi-variety field reject flow only after the new memory baseline.

Exact verified problem: percentage-mode UI captured total field reject KG per variety, but the Harvest payload omitted it. The implementation now carries the total and input mode to the server; checks are pending.

Completed check: `npm run lint` passed. A production build was started but interrupted before a final result; it must be rerun.

Next action: manually verify 1,000 kg harvested, 200 kg total field rejects, and 20/30/50 percentage rows save resolved values 40/60/100 kg. Then rerun `npm run build` to completion. Preserve the existing error-state behavior while doing so.
