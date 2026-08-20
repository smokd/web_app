# Server Actions

## Harvest

Main file:

`src/app/harvest/actions.ts`

Known actions:

- `createHarvestRecord`
- `updateHarvestRecord`
- `deleteHarvestRecord`

---

## createHarvestRecord

Purpose:

Creates harvest and related operational records.

Flow:

Authentication
↓
Parse FormData
↓
Parse Harvest Entries
↓
Validate Harvest
↓
Resolve Field Rejects
↓
Parse Packhouse
↓
Resolve Packhouse Rejects
↓
Prisma Transaction
↓
Audit Log
↓
Revalidate

---

## updateHarvestRecord

Requires administrator authorization.

Updates an existing Harvest record.

---

## deleteHarvestRecord

Requires administrator authorization.

Deletes an existing Harvest record.

---

## Validation

Server Actions are the final validation layer.

Never assume client-side validation is sufficient.

---

## Transactions

Related database writes should remain atomic where possible.

---

## Audit

Creation, updates, and deletion should use:

`createAuditLog`

where the existing implementation expects it.

---

## Revalidation

After Harvest changes:

`/harvest`

and:

`/dashboard`

are revalidated.
