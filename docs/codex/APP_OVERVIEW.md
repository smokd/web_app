# Application Overview

## Purpose

This application is a production management and farm operations system.

It manages agricultural production information including:

- Harvest records
- Crop varieties
- Field rejects
- Packhouse processing
- Packhouse rejects
- Weather conditions
- Daily production records
- Monthly verification
- Reports
- Dashboard information
- Administration
- Users and permissions
- Audit logging

The application is designed to provide a central system for recording operational data and producing reliable production information.

---

## Technology Stack

The application uses:

- Next.js
- Next.js App Router
- React
- TypeScript
- Prisma
- Database backend
- JWT-based sessions
- `jose`
- Server Actions
- Next.js Middleware
- CSS-based application UI

The application should use the existing project conventions rather than introducing unnecessary frameworks or patterns.

---

## Application Architecture

The application generally follows:

Browser
↓
React Client Components
↓
Server Actions / Server Components
↓
Authentication / Authorization
↓
Prisma
↓
Database

Server-rendered pages use Prisma directly where appropriate.

Interactive forms use client components and Server Actions.

---

## Major Modules

### Authentication

Responsible for:

- Login
- Session creation
- Session validation
- Session expiration
- Protected routes
- Role-based access

See:

`AUTH_SECURITY.md`

---

### Harvest

Responsible for:

- Daily harvest entry
- Multiple varieties
- Harvested quantities
- Blocks
- Field rejects
- Packhouse processing
- Packhouse rejects
- Weather
- Supervisor
- Notes
- Daily records
- Monthly verification

See:

`HARVEST.md`

---

### Packhouse

Responsible for:

- Processed quantities
- Total rejects
- Reject breakdown
- Reject percentages
- Reject kilograms
- Packhouse loads
- Packhouse reject records

See:

`PACKHOUSE.md`

---

### Dashboard

Provides operational summaries and production information.

See:

`DASHBOARD.md`

---

### Reports

Provides production reporting and historical information.

See:

`REPORTS.md`

---

### Administration

Responsible for:

- Users
- Roles
- Varieties
- Configuration
- Administrative operations

See:

`ADMIN.md`

---

### Weather

Responsible for recording weather conditions associated with harvest operations.

See:

`WEATHER.md`

---

## User Roles

The application has role-based authorization.

At minimum, the application currently distinguishes:

- Normal authenticated users
- ADMIN users

Normal users can perform normal operational data entry.

Administrators can perform additional management operations such as editing/deleting records where explicitly permitted.

Do not assume that every authenticated user is an administrator.

---

## Important Development Principle

The application contains business rules that must be preserved.

Before changing existing code:

1. Inspect the actual implementation.
2. Inspect related components.
3. Inspect Server Actions.
4. Inspect Prisma schema.
5. Inspect existing validation.
6. Inspect current Git diff.
7. Understand the data flow.
8. Make the smallest safe change.
9. Run TypeScript/lint/build checks.

Do not rewrite modules unnecessarily.

---

## Important Business Rule

Reject percentages represent the percentage of the TOTAL REJECT quantity.

Example:

Harvested:

1,000 kg

Total Reject:

200 kg

Breakdown:

Underripe = 20%
Birds = 30%
Soft = 50%

Therefore:

Underripe = 40 kg
Birds = 60 kg
Soft = 100 kg

Total = 200 kg

The overall harvest reject rate is:

200 / 1,000 × 100 = 20%

Do not confuse:

- reject breakdown percentage
- overall reject percentage

---

## Documentation

Detailed documentation is maintained in:

- `ARCHITECTURE.md`
- `DATABASE.md`
- `AUTH_SECURITY.md`
- `HARVEST.md`
- `PACKHOUSE.md`
- `REPORTS.md`
- `DASHBOARD.md`
- `ADMIN.md`
- `WEATHER.md`
- `UI_COMPONENTS.md`
- `API_ACTIONS.md`
- `VALIDATION_RULES.md`
- `CURRENT_STATE.md`
- `CHANGELOG.md`

---

## Codex Instructions

When beginning work:

1. Read this file.
2. Read `CURRENT_STATE.md`.
3. Read the module-specific documentation.
4. Inspect the actual source code.
5. Inspect the database schema if data is involved.
6. Inspect the current Git status/diff.
7. Continue existing work instead of starting over.

Never assume the documentation is newer than the source code.

The source code is authoritative.

If the documentation conflicts with the source code, inspect the implementation and update the documentation after resolving the discrepancy.
