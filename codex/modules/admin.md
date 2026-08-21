# Admin Module

There is no `src/app/admin` directory in the inspected repository, even though middleware lists `/admin` as protected. The implemented administrator-facing routes are `/audit` (via `requireAdmin` in its data action) and administrator-only Harvest update/delete actions.

Do not infer an Admin UI exists until source is added or restored.
