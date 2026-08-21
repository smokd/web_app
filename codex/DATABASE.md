# Database

Prisma schema: `prisma/schema.prisma`. Database provider: SQLite.

Operational entities:

- `Harvest` stores a single variety's harvest, aggregate field reject KG/percent, weather, notes, user, and child `FieldReject` rows.
- `FieldReject` stores raw input mode/value plus resolved KG and percent. It cascades on harvest deletion.
- `PackhouseLoad` stores processed KG and optionally links to `Harvest` (`onDelete: SetNull`).
- `PackhouseReject` stores raw input mode/value plus resolved KG and percent, and cascades on load deletion.
- `Variety`, `RejectType`, `WeatherOption`, `User`, and `AuditLog` support configuration and auditability.

Shelf-life uses `ShelfLifeSample`, observations, weight readings, profiles, temperature impacts, and weight curves.

Generated Prisma client output is `src/generated/prisma` and is ignored by Git. Migrations reside in `prisma/migrations/`.
