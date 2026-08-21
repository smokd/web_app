# Authentication

Authentication uses a signed `session` JWT cookie, `jose`, bcrypt password verification, and `SESSION_SECRET`.

- Idle timeout: 30 minutes.
- Absolute timeout: 8 hours.
- Session helpers: `getSession`, `requireAuth`, `requireAdmin`, and `createSession` in `src/lib/auth.ts`.
- Middleware protects `/dashboard`, `/harvest`, `/reports`, `/admin`, and `/packhouse`, redirects unauthenticated users to `/login`, and refreshes activity every five minutes.

Server Actions must still use `requireAuth`/`requireAdmin`; middleware is not a replacement for mutation authorization.
