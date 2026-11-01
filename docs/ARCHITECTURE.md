# Trainoryx — System Architecture

**Document:** Architecture Reference  
**Project:** Trainoryx  
**Version:** 1.0  
**Status:** Approved Architecture Baseline  
**Application Type:** Coach-only Fitness Management Platform

---

## 1. Project Overview

Trainoryx is a modern fitness coaching management platform designed to help coaches manage their clients, training programs, nutrition plans, schedules, measurements, progress records, and coaching decisions in one place.

The application prioritizes:

- Simple and efficient coaching workflows.
- Reliable and secure client data management.
- Clean, responsive user interfaces.
- Maintainable application architecture.
- Minimal infrastructure costs.
- A straightforward development and deployment process.

### 1.1 Product Scope

Trainoryx is a coach-only application.

Coaches are authenticated application users. Clients are managed profiles and do not have application accounts.

The coach manages all client information and coaching activities.

### 1.2 Core Modules

1. Dashboard
2. Client Management
3. Training Programs
4. Nutrition Management
5. Schedule and Calendar
6. Check-ins and Progress
7. Coach Notes and Adjustments
8. Account Settings

---

## 2. Technology Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Framework | Next.js App Router | Application framework and routing |
| UI | React | User interface |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Responsive styling |
| Authentication | Firebase Authentication | Coach authentication |
| Database | Neon PostgreSQL | Persistent application data |
| ORM | Prisma ORM 7 | Database access and migrations |
| Validation | Zod | Input and data validation |
| Version Control | Git and GitHub | Source control |
| Deployment | To be finalized | Production hosting |

### 2.1 Version Policy

- Use stable, mutually compatible dependency versions.
- Avoid unnecessary upgrades during active development.
- Do not introduce experimental or release-candidate packages without an explicit reason.
- Keep dependency versions consistent across development and deployment.
- Review breaking changes before upgrading major versions.

---

## 3. Architectural Approach

Trainoryx uses a **Modular Monolith** architecture.

The application is maintained as one deployable application, organized into independent business modules.

Each module owns its related components, validation, and business logic.

This approach provides:

- Simpler deployment.
- Less infrastructure overhead.
- Easier development and debugging.
- Clear separation of business responsibilities.
- Flexibility to expand without introducing unnecessary services.

Microservices are not part of the current architecture.

### 3.1 Application Principles

1. Server-first: Prefer Server Components for data-driven pages.
2. Client Components: Use only when browser interaction or client-side state is required.
3. Server-side operations: Database access and sensitive business logic stay on the server.
4. Feature ownership: Keep related functionality inside its business module.
5. Shared utilities: Avoid duplicating common functionality.
6. Explicit validation: Never trust incoming client data.
7. Simple implementation: Avoid abstractions that do not solve a real problem.

---

## 4. Project Structure

The current project uses the root-level Next.js `app/` directory.

```text
trainoryx/
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── favicon.ico
│
├── src/
│   ├── components/
│   │   ├── ui/
│   │   └── shared/
│   │
│   ├── features/
│   │   ├── clients/
│   │   ├── training/
│   │   ├── nutrition/
│   │   ├── schedule/
│   │   ├── progress/
│   │   └── coaching/
│   │
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── validation/
│   │   └── utils/
│   │
│   ├── hooks/
│   └── types/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   └── SECURITY.md
│
├── public/
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

This is the intended structure. Additional files and folders should only be introduced when required by actual functionality.

### 4.1 Folder Responsibilities

**app/**

- Next.js routes and layouts.
- Route-level loading and error states.
- Route handlers where appropriate.
- Authentication-related pages.

**src/components/**

- Reusable interface components.
- Shared navigation and layout components.
- Buttons, dialogs, forms, tables, and other common UI elements.

**src/features/**

- Business-specific functionality.
- Feature components.
- Feature-specific validation schemas.
- Feature-specific server operations.
- Feature-specific types where appropriate.

**src/lib/**

- Firebase initialization and authentication utilities.
- Prisma client initialization.
- Zod validation utilities.
- Shared server-side utilities.

**src/hooks/**

- Reusable React hooks.
- Client-side interaction logic.

**src/types/**

- Shared application TypeScript types.
- Types used across multiple modules.

**prisma/**

- Prisma database schema.
- Database migrations.
- Database-related configuration.

**docs/**

- Architecture documentation.
- Database specifications.
- Security standards.
- Testing and deployment documentation.

---

## 5. Authentication and User Management

Firebase Authentication is responsible for coach sign-in.

PostgreSQL stores the application's coach profile and related business data.

### 5.1 Authentication Flow

1. Coach signs in through Firebase Authentication.
2. Firebase issues an authentication token.
3. The application sends the token to the server.
4. The server verifies the token using Firebase Admin SDK.
5. The verified Firebase UID is matched against the application's User record.
6. The authenticated coach identity is used for authorization.
7. Protected operations are executed only after authorization succeeds.

### 5.2 User Model

The application has one authenticated user type: Coach.

The User record contains:

- Internal database ID.
- Firebase UID.
- Email.
- Display name.
- IANA timezone.
- Creation and update timestamps.

There is no client role or client authentication model in this release.

### 5.3 Coach Registration

Trainoryx uses open coach registration.

- Anyone may register using email and password.
- Firebase Authentication manages account creation and sign-in.
- Email verification is required before protected app access.
- Every registered account is a coach.
- No role field, role selection, invitations, or admin approval.
- A database User record is provisioned automatically for a verified Firebase identity.
- Each coach has an independent workspace.
- Client profiles are not application accounts.

Registration and authentication should remain straightforward and appropriate for the portfolio project's scope.

---

## 6. Database Architecture

Trainoryx uses Neon PostgreSQL with Prisma ORM.

The application uses a dedicated database for Trainoryx. Existing V1 database structures and data must never be reused.

**Database name:** `trainoryx_v2`

### 6.1 Database Principles

- Use UUID identifiers.
- Use PostgreSQL foreign keys and relational constraints.
- Use transactions for operations involving multiple related records.
- Use indexes for frequently queried relationships and filters.
- Use Decimal for physical measurements and precise nutritional values.
- Use UTC timestamps for stored date-time values.
- Preserve the coach's IANA timezone where local scheduling matters.
- Validate inputs before database writes.
- Preserve historical assignment snapshots.

### 6.2 Database Ownership

Every client belongs to a coach through `coachId`.

Every operation involving client records must enforce ownership on the server.

The application must never rely solely on a client-supplied ID to determine authorization.

### 6.3 Historical Records

Client records should be deactivated rather than casually deleted.

Training and nutrition assignments must retain snapshots of the assigned content.

Changes to reusable templates must not silently alter previously assigned plans.

Measurements may exist independently of formal check-ins.

### 6.4 Database Environments

Maintain separate environments:

- Development.
- Preview.
- Production.

Never point development tools or migrations at the production database accidentally.

Runtime application connections should use the appropriate pooled database connection.

Migration tooling should use the direct database connection.

---

## 7. Business Logic and Data Access

Business logic should be executed on the server.

The application should use the following general flow:

```text
User Interaction
       |
       v
Next.js Page or Route
       |
       v
Authentication Verification
       |
       v
Authorization and Ownership Check
       |
       v
Zod Validation
       |
       v
Business Logic
       |
       v
Prisma Database Operation
       |
       v
Response
```

### 7.1 Data Access Rules

- Use Prisma for database operations.
- Keep database access on the server.
- Scope queries by the authenticated coach.
- Validate input with Zod.
- Handle expected errors consistently.
- Avoid duplicating business logic across route handlers and server actions.
- Use transactions when multiple database changes must succeed together.

### 7.2 Server and Client Boundaries

Server Components should be the default.

Client Components should be introduced only for interactive functionality such as:

- Dialogs and dropdowns.
- Form interactions.
- Charts requiring client-side interaction.
- Calendar interactions.
- Theme controls.
- Other browser-dependent features.

Never expose database credentials, Firebase Admin credentials, or privileged server operations to the browser.

---

## 8. Security Architecture

Security is a foundational requirement, not a final development task.

### 8.1 Authentication

- Verify Firebase tokens on the server.
- Never trust an unverified UID from the browser.
- Protect authenticated routes and operations.
- Keep Firebase Admin credentials server-only.

### 8.2 Authorization

- Derive coach identity from verified authentication.
- Enforce coach ownership on every relevant query and mutation.
- Verify that related records belong to the same coach.
- Prevent cross-coach data access.
- Do not expose private coach notes through public or unauthenticated endpoints.

### 8.3 Input Validation

- Use Zod for external input.
- Validate IDs, numeric ranges, strings, dates, and relationships.
- Reject invalid or unexpected input.
- Do not rely solely on frontend validation.

### 8.4 Secrets

Never commit:

- `.env` files.
- Database passwords or connection strings.
- Firebase service account credentials.
- API keys.
- Private signing keys.
- Other authentication secrets.

Use environment variables and hosting-provider secret management.

Only explicitly public configuration values may use the `NEXT_PUBLIC_` prefix.

### 8.5 API Security

- Authenticate protected requests.
- Authorize access to individual records.
- Validate request payloads.
- Avoid exposing unnecessary database information.
- Return safe error messages.
- Apply rate limiting where appropriate for exposed authentication-sensitive endpoints.

---

## 9. UI and Design System

Trainoryx follows a Minimal and Airy design direction.

### 9.1 Brand Identity

- Primary background: White.
- Dark theme: Near-black and charcoal.
- Accent: Neon green.
- Primary typography: Clean modern sans-serif.
- Logo: Angular white-and-neon-green T emblem with geometric TRAINORYX wordmark.

### 9.2 Design Principles

- Clear visual hierarchy.
- Consistent spacing and typography.
- Accessible contrast.
- Responsive layouts.
- Subtle borders and shadows.
- Useful empty states.
- Minimal unnecessary decoration.
- No fake or nonfunctional controls.

### 9.3 Responsive Support

The application must support:

- Desktop.
- Tablet.
- Mobile.

Core workflows must remain usable on smaller screens.

### 9.4 Theme Support

The application should support light and dark themes.

Both themes must maintain readable text, accessible contrast, and consistent component behavior.

---

## 10. Scheduling and Timezone Handling

Scheduling uses UTC storage and coach-local presentation.

- Store event timestamps as PostgreSQL `timestamptz`.
- Preserve the coach's IANA timezone.
- Convert event times for display using the relevant timezone.
- Do not rely on the browser timezone as the source of truth.
- Validate that event end times occur after start times.
- Validate availability rules on the server.

The initial timezone default is `Asia/Manila`.

---

## 11. Infrastructure and Deployment

The infrastructure target is $0 for the initial release.

Provider selection must account for:

- Commercial-use permission.
- Free-tier limitations.
- Deployment compatibility with Next.js.
- Database quotas.
- Storage and bandwidth limitations.
- Backup and recovery options.
- Security and environment-variable support.

A free tier must not be assumed to permit commercial use.

### 11.1 Environment Separation

Use separate configuration for development, preview, and production.

Example environment variables:

```env
DATABASE_URL=
DIRECT_URL=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

These are placeholders only. Never commit actual secret values.

### 11.2 Deployment Rules

- Do not run production migrations during application startup.
- Run reviewed migrations through a controlled deployment process.
- Keep secrets outside source control.
- Verify database connectivity and authentication in the deployment environment.
- Test production builds before deployment.
- Maintain an independent database backup/export strategy.

The production hosting provider remains subject to a compatibility and commercial-use proof of concept.

---

## 12. Testing and Quality Assurance

Testing must be part of development, not postponed until launch.

### 12.1 Required Testing Areas

**Unit Tests**

- Validation schemas.
- Business logic.
- Utility functions.

**Integration Tests**

- Database operations.
- Authentication and authorization.
- Ownership enforcement.
- Related-record operations.

**End-to-End Tests**

- Coach sign-in.
- Client creation and editing.
- Training program management.
- Nutrition plan management.
- Scheduling.
- Measurement and progress management.

### 12.2 Quality Gates

Before a feature is considered complete:

- TypeScript checks pass.
- ESLint passes.
- Production build succeeds.
- Relevant automated tests pass.
- Authorization is reviewed.
- Responsive behavior is checked.
- No secrets are exposed.
- No existing functionality is unintentionally broken.

---

## 13. Development Workflow

Trainoryx follows a milestone-based workflow.

1. Review requirements.
2. Confirm scope and expected behavior.
3. Review relevant architecture and database implications.
4. Implement the smallest maintainable solution.
5. Run relevant tests and quality checks.
6. Review security and authorization.
7. Commit completed work.
8. Update documentation when architecture or behavior changes.

### 13.1 Git Practices

- Keep `main` stable.
- Use descriptive commit messages.
- Commit logical, reviewable changes.
- Never commit secrets.
- Avoid large unrelated changes in one commit.
- Use branches for substantial features when appropriate.

### 13.2 Implementation Principles

- Avoid overengineering.
- Prefer small, reviewable changes.
- Do not introduce dependencies without a clear need.
- Do not implement deferred features without approval.
- Keep documentation aligned with actual implementation.
- Record important architectural decisions.

---

## 14. Explicitly Out of Scope

The following are not part of the current Trainoryx release:

- Client login or authentication.
- Client portal or client dashboard.
- Client self-service check-ins.
- Client-side workout logging.
- Client-side nutrition logging.
- Payment processing and subscriptions.
- AI workout generation.
- AI nutrition generation.
- AI food recognition.
- Real-time messaging.
- Wearable integrations.
- Sleep tracking.
- Multi-coach organization management.
- Advanced analytics infrastructure.
- Push notification infrastructure.

These features may be considered in future releases after a separate scope review.

---

## 15. Architectural Decision Principles

Any significant architectural change must be evaluated against:

1. Does it solve a real product requirement?
2. Does it improve security or maintainability?
3. Does it introduce unnecessary cost?
4. Does it add operational complexity?
5. Can the existing architecture handle the requirement?
6. Does it affect existing data or business workflows?

Do not change core architecture simply because a newer library or framework is available.

---

## 16. Current Development Status

| Area | Status |
|---|---|
| Product scope | Approved |
| Coach-only architecture | Approved |
| Brand identity | Approved |
| Next.js foundation | Initialized |
| GitHub repository | Created |
| Project folder structure | Established |
| Architecture documentation | Initial draft |
| Prisma schema | Implemented and validated (18 models, 10 enums) |
| Database connection | Neon `trainoryx_v2` configured and verified |
| Initial migration | Applied and verified |
| Firebase integration | Client and Admin SDK foundation configured |
| Authentication | Not implemented |
| UI implementation | Pending |
| Deployment provider | Pending proof of concept |
| Automated testing | Pending setup |

---

## 17. Source of Truth

This document defines the high-level architecture of Trainoryx.

Supporting documents:

- `DATABASE.md` — Database models, relationships, constraints, and indexing.
- `SECURITY.md` — Detailed authentication, authorization, data protection, and secret-handling requirements.
- Future testing documentation — Test strategy and quality gates.

When implementation details conflict with this document, review the discrepancy before changing code or documentation.

**End of Architecture Reference**
