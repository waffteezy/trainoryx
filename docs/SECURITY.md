# Trainoryx — Security Standards

**Document:** Security Reference  
**Project:** Trainoryx  
**Version:** 1.0  
**Status:** Security Baseline  
**Application Type:** Coach-only Fitness Management Platform

---

## 1. Purpose

This document defines the security requirements for Trainoryx.

It establishes standards for:

- Authentication.
- Authorization.
- Data ownership.
- Database access.
- Input validation.
- API protection.
- Secret management.
- Personal information protection.
- File storage.
- Testing and deployment security.

Security requirements apply throughout development, testing, and production.

---

## 2. Security Principles

Trainoryx follows these principles:

1. Deny access by default.
2. Verify authentication on the server.
3. Authorize every protected operation.
4. Never trust client-supplied ownership identifiers.
5. Validate all external input.
6. Keep privileged credentials server-only.
7. Expose only the information required by the interface.
8. Preserve the confidentiality of client records.
9. Use secure defaults.
10. Test security behavior before shipping.

Security must not depend solely on frontend restrictions.

---

## 3. Authentication

Firebase Authentication is responsible for coach authentication.

### 3.1 Authentication Requirements

- Coaches must authenticate before accessing protected application features.
- Firebase ID tokens must be verified on the server.
- Use Firebase Admin SDK for privileged server-side verification.
- Never trust a UID supplied directly by the browser.
- Invalid, expired, or revoked tokens must not authorize protected operations.
- Unauthenticated requests must be rejected.

### 3.2 Authentication Flow

1. Coach signs in using Firebase Authentication.
2. Firebase issues an ID token.
3. The browser sends the token through the approved authentication mechanism.
4. The server verifies the token.
5. The verified Firebase UID is matched to a database User record.
6. The server establishes the authenticated coach context.
7. Protected operations proceed only after authentication succeeds.

### 3.3 Session Handling

The implementation must use secure session handling.

If cookie-based sessions are used:

- Use HttpOnly cookies.
- Use Secure cookies in production.
- Apply an appropriate SameSite policy.
- Set an appropriate expiration.
- Clear sessions during sign-out.
- Protect state-changing operations against CSRF where applicable.

Do not store privileged credentials or long-lived administrative tokens in browser storage.

### 3.4 User Provisioning

The application must not allow arbitrary browser input to create privileged coach accounts.

Coach account provisioning must follow an explicitly approved registration or administrative process.

The database User record must correspond to a verified Firebase identity.

---

## 4. Authorization and Ownership

Authentication confirms identity.

Authorization determines what that identity is allowed to access.

Every protected operation must enforce both.

### 4.1 Coach Ownership

Each client belongs to one coach through ClientProfile.coachId.

The authenticated coach ID must be resolved from the verified Firebase identity and database User record.

Never accept coachId from the browser as proof of ownership.

### 4.2 Required Ownership Checks

The server must verify ownership for:

- Client profiles.
- Training programs.
- Workout program assignments.
- Nutrition profiles.
- Food items.
- Meal plans.
- Meal plan assignments.
- Measurements.
- Check-ins.
- Schedule events.
- Coach notes.
- Coaching adjustments.

### 4.3 Related Record Validation

When an operation involves multiple records, verify that all records belong to the same coach.

Examples:

- A training program must belong to the coach assigning it.
- The client receiving the program must belong to that coach.
- Food items must belong to the coach managing the meal plan.
- A schedule event's associated client must belong to the event owner.
- A check-in's measurement must belong to the same client.
- A coach note must reference a client owned by its author.

### 4.4 Cross-Coach Access Protection

A coach must never be able to:

- View another coach's clients.
- Edit another coach's client records.
- Assign another coach's training programs.
- Use another coach's food library.
- Read another coach's private notes.
- Modify another coach's schedule.
- Access another coach's measurements or progress history.

Unauthorized access must fail even when the requesting user knows a valid record UUID.

---

## 5. Database Security

Prisma and database access must remain server-side.

### 5.1 Database Access Rules

- Never import Prisma Client into browser-facing components.
- Never expose database connection strings to the browser.
- Never expose database credentials through API responses.
- Use authenticated server-side operations.
- Scope database queries to the authenticated coach.
- Use explicit data selection to avoid exposing unnecessary fields.
- Validate input before database writes.

### 5.2 Query Ownership

Every relevant database query must include an ownership condition.

Conceptual example:

```ts
const client = await prisma.clientProfile.findFirst({
  where: {
    id: clientId,
    coachId: authenticatedCoach.id,
  },
});
```

Do not fetch arbitrary records and rely on frontend filtering to enforce access control.

### 5.3 Transactions

Use database transactions when multiple operations must remain consistent.

Examples:

- Promoting a primary training assignment.
- Promoting a primary nutrition assignment.
- Creating related check-in and measurement records.
- Updating multiple related records.

Transactions do not replace ownership checks.

---

## 6. Input Validation

All external input must be validated on the server using Zod.

Frontend validation improves usability but is not a security boundary.

### 6.1 Validation Requirements

Validate:

- UUIDs and identifiers.
- Required fields.
- String lengths.
- Numeric ranges.
- Decimal precision.
- Dates and timestamps.
- Enum values.
- Related record ownership.
- JSON snapshot structures.
- File metadata when uploads are introduced.

### 6.2 Numeric Validation

Examples of validation requirements:

- Body-fat percentage: 0–100.
- Weight: positive and within approved application limits.
- Height: positive and within approved application limits.
- Muscle mass: non-negative.
- Calories: non-negative.
- Macronutrients: non-negative.
- Exercise sets: positive integers.
- Repetitions: positive integers.
- Food quantity: greater than zero.

The exact accepted ranges must be maintained in shared validation rules.

### 6.3 Validation Failure

Invalid requests must:

- Be rejected before database writes.
- Return a safe validation response.
- Avoid exposing database internals.
- Avoid leaking sensitive input in logs.

---

## 7. API and Server Action Security

All protected API routes and server actions must enforce authentication and authorization.

### 7.1 Request Protection

- Reject unauthenticated requests.
- Verify ownership before reading or modifying records.
- Validate request bodies and parameters.
- Avoid mass assignment.
- Allow only explicitly supported fields to be modified.
- Do not trust role, coach ID, or ownership information from the browser.
- Use appropriate HTTP status codes.
- Return safe error messages.

### 7.2 Error Handling

Do not expose:

- Database connection strings.
- SQL queries.
- Stack traces.
- Firebase service credentials.
- Internal infrastructure details.
- Sensitive personal information.

Detailed errors may be recorded in protected server logs.

### 7.3 Rate Limiting

Introduce rate limiting where appropriate, especially for:

- Authentication-sensitive endpoints.
- Session operations.
- Publicly accessible endpoints.
- Resource-intensive operations.

Do not add complex rate-limiting infrastructure without a demonstrated need.

---

## 8. Secret and Environment Management

Secrets must never be committed to GitHub.

### 8.1 Protected Values

The following must remain server-only:

- DATABASE_URL.
- DIRECT_URL.
- Firebase Admin private key.
- Firebase Admin client email.
- Service account credentials.
- Private API keys.
- Signing secrets.
- Other privileged credentials.

### 8.2 Public Configuration

Only values explicitly intended for browser use may use the NEXT_PUBLIC_ prefix.

Examples include the Firebase web application configuration required by the client SDK.

Public Firebase configuration is not a replacement for server-side security rules.

### 8.3 Environment Files

Expected local files:

- `.env` (or `.env.local`)
- `.env.example`

Rules:

- `.env` and `.env.*` files must be ignored by Git, except `.env.example`.
- `.env.example` must contain placeholders only.
- Never copy real production secrets into documentation.
- Use hosting-provider secret management for deployed environments.
- Rotate credentials if they are accidentally exposed.

The local foundation uses Neon `trainoryx_v2`, with `DATABASE_URL` for pooled runtime connections and `DIRECT_URL` for migration tooling. The Firebase client and Admin SDK foundation is configured; authentication flows are not implemented. The Admin service-account JSON remains outside the repository and is referenced by `FIREBASE_SERVICE_ACCOUNT_PATH`.

### 8.4 GitHub Protection

Before every commit:

- Check staged files.
- Confirm no secret values are included.
- Keep generated credentials outside the repository.
- Review dependency and configuration changes.

If a secret is committed, deleting it in a later commit is not sufficient. Treat it as exposed and rotate it.

---

## 9. Client Data Protection

Trainoryx stores personal and coaching-related information.

This includes:

- Client contact information.
- Date of birth, when provided.
- Height and body measurements.
- Weight and body-fat records.
- Nutrition targets.
- Training programs.
- Progress check-ins.
- Private coach notes.
- Coaching adjustments.

### 9.1 Data Minimization

Only collect information necessary for coaching workflows.

Optional personal information should remain optional unless a feature requires it.

### 9.2 Data Exposure

- Return only fields needed by the requesting interface.
- Do not expose private notes through unrelated endpoints.
- Do not include full client records in dashboard responses unnecessarily.
- Avoid placing personal information in URLs.
- Do not log complete sensitive request bodies.

### 9.3 Retention

Client deactivation should preserve historical coaching information.

Historical records must remain protected by the same ownership checks as active client records.

Deletion and retention behavior must be deliberate rather than accidental.

---

## 10. File and Image Storage

Progress photo storage is deferred until a storage provider is selected.

When implemented, the following requirements apply:

- Use private storage by default.
- Do not expose unrestricted public image URLs.
- Verify coach ownership before uploads, downloads, and deletions.
- Use server-generated storage identifiers.
- Do not trust browser-supplied storage paths or deletion identifiers.
- Restrict file types and file sizes.
- Validate actual file content where appropriate.
- Use short-lived signed URLs for authorized access.
- Avoid storing image binaries in PostgreSQL.
- Never allow one coach to access another coach's private images.

The provider must be reviewed for commercial-use permission, cost, storage limits, and access-control capabilities.

---

## 11. Scheduling and Timezone Security

Scheduling information must be handled consistently.

- Store timestamps in UTC.
- Preserve IANA timezone identifiers.
- Validate event start and end times.
- Validate availability rules on the server.
- Do not trust browser timezone information as the sole source of truth.
- Prevent unauthorized users from changing another coach's schedule.

The initial default timezone is Asia/Manila.

---

## 12. Dependency and Application Security

Dependencies are part of the application's security boundary.

Requirements:

- Prefer stable package releases.
- Review major dependency updates.
- Avoid unnecessary dependencies.
- Monitor security advisories.
- Review packages before introducing them.
- Keep lockfiles committed.
- Remove unused dependencies.
- Run available dependency audits periodically.

Do not blindly apply automated dependency upgrades to production without reviewing compatibility and security implications.

---

## 13. Deployment Security

Development, preview, and production environments must be separated.

### 13.1 Production Requirements

- Use production-only credentials.
- Keep secrets in hosting-provider environment settings.
- Verify Firebase authentication configuration.
- Verify database connection configuration.
- Use HTTPS.
- Restrict administrative access.
- Keep database credentials private.
- Review deployment logs for accidental secret exposure.
- Ensure production migrations are controlled.

### 13.2 Migration Protection

- Never run production reset commands.
- Never point development migration tooling at production accidentally.
- Review migration SQL before execution.
- Maintain an independent backup/export strategy.
- Verify the target database before every production migration.

### 13.3 Hosting Provider Review

The hosting provider must support:

- Next.js compatibility.
- Server-side execution.
- Environment variables.
- Secure authentication flows.
- Commercial use under the selected plan.
- Appropriate deployment and resource limits.

A free hosting tier must not be assumed to permit commercial use.

---

## 14. Security Testing Requirements

Security tests are required before shipping protected functionality.

### 14.1 Authentication Tests

- Unauthenticated requests are rejected.
- Invalid tokens are rejected.
- Expired tokens are rejected.
- Revoked tokens are rejected where revocation checking is required.
- Authenticated coaches resolve to the correct database User.

### Public Coach Registration

- Registration is open to anyone.
- Firebase Authentication handles email/password registration.
- Email verification is required before protected application access.
- Only verified Firebase identities may be provisioned as database Users.
- Never accept coach IDs or ownership claims from browser input.
- Each coach's records must remain isolated from other coaches.
- Use Firebase's built-in authentication protections where practical.
- Avoid custom approval, invitation, or account-management infrastructure.

### 14.2 Authorization Tests

- Coach A cannot access Coach B's clients.
- Coach A cannot update Coach B's client records.
- Coach A cannot access Coach B's programs.
- Coach A cannot assign another coach's programs.
- Coach A cannot access another coach's food items.
- Coach A cannot read another coach's notes.
- Coach A cannot access another coach's measurements.
- Related records must belong to the same coach.

### 14.3 Input Validation Tests

- Invalid UUIDs are rejected.
- Invalid numeric values are rejected.
- Invalid dates are rejected.
- Unsupported enum values are rejected.
- Malformed snapshots are rejected.
- Invalid related-record references are rejected.

### 14.4 Secret Exposure Tests

- No environment secrets are included in client bundles.
- No Firebase Admin credentials are exposed.
- No database connection strings are returned through APIs.
- No local secret files are tracked by Git.

### 14.5 Release Security Gate

A feature cannot be considered production-ready if its authentication, authorization, validation, and relevant security tests are incomplete.

---

## 15. Security Incident Handling

If a security issue is discovered:

1. Stop the affected operation if necessary.
2. Identify the affected credentials, data, and functionality.
3. Revoke or rotate exposed credentials.
4. Review access logs where available.
5. Determine whether unauthorized access occurred.
6. Fix the underlying vulnerability.
7. Add a regression test.
8. Document the incident and corrective action.
9. Follow applicable notification and legal obligations when required.

Do not assume removing exposed information from the current codebase eliminates the risk.

---

## 16. Explicit Security Exclusions

The current release does not include:

- Client authentication.
- Client portal permissions.
- Client-submitted records.
- Payment processing.
- Multi-coach organization roles.
- Public progress photo hosting.
- Real-time messaging.
- Push notification infrastructure.

These features require a separate security review if introduced later.

---

## 17. Security Review Checklist

Before shipping a feature:

- [ ] Authentication is enforced where required.
- [ ] Firebase tokens are verified server-side.
- [ ] Coach identity is derived from verified authentication.
- [ ] Ownership is checked for every protected operation.
- [ ] Related records are checked for consistent ownership.
- [ ] Zod validation is applied to external input.
- [ ] Sensitive fields are not unnecessarily exposed.
- [ ] Database operations remain server-side.
- [ ] Errors do not leak internal details.
- [ ] No secrets are committed.
- [ ] Relevant authorization tests pass.
- [ ] Relevant validation tests pass.
- [ ] Production configuration is reviewed.

---

## 18. Source of Truth

This document defines the security standards for Trainoryx.

Supporting references:

- ARCHITECTURE.md — Overall application architecture.
- DATABASE.md — Database structure, relationships, and integrity rules.
- Future testing documentation — Detailed testing strategy and execution requirements.

Security requirements must be reviewed whenever authentication, data ownership, storage, or deployment architecture changes.

**End of Security Reference**
