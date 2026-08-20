# Administration Module

## Purpose

Administration provides privileged management functionality.

---

## Authorization

Administrative operations must require admin authorization.

Existing helper:

`requireAdmin`

Do not replace server-side admin checks with client-side checks.

---

## Typical Responsibilities

Depending on the current implementation:

- User management
- Variety management
- Configuration
- Record correction
- Record deletion
- Administrative verification

Inspect the current source before assuming a particular feature exists.

---

## Audit Logging

Administrative mutations should use the existing audit logging mechanism where applicable.

---

## Safety

Do not expose destructive actions to unauthorized users.

Deletion should be deliberate and server-authorized.
