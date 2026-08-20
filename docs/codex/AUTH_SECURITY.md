# Authentication and Security

## Session

The application uses a session cookie.

Current session cookie:

`session`

The session contains a signed JWT.

The JWT is verified using `jose`.

---

## Session Secret

The application expects:

`SESSION_SECRET`

The secret must come from the environment.

Never hard-code the session secret.

Never expose the secret to the browser.

---

## Session Timeout

The current session architecture uses:

### Idle timeout

30 minutes.

### Absolute timeout

8 hours.

### Clock tolerance

60 seconds.

`lastSeen` is used to determine idle activity.

`iat` is used to determine absolute session age.

---

## Middleware

The middleware protects application routes.

Protected routes currently include:

- `/dashboard`
- `/harvest`
- `/reports`
- `/admin`
- `/packhouse`

The login page is:

`/login`

Authenticated users visiting `/login` are redirected to `/dashboard`.

---

## Authentication Helpers

The application uses authentication helpers such as:

- `requireAuth`
- `requireAdmin`
- `getSession`

Always inspect their current implementation before modifying authorization behavior.

---

## Authorization

Authentication and authorization are different.

A logged-in user is not automatically an administrator.

Administrative Server Actions must explicitly require admin privileges.

---

## Security Rules

Do not:

- expose JWT secrets
- trust client-provided roles
- remove server-side authorization
- rely solely on client-side validation
- disable HTTP-only cookies
- unnecessarily disable secure cookies
- bypass authentication in Server Actions

---

## Session Preservation

If a form submission fails validation, the UI should preserve user-entered state.

Do not reset the form after failed Server Action execution.

Only reset sensitive/temporary state after a confirmed successful operation.
