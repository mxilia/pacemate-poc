# Developer Guide

This guide is a reusable baseline for team projects. Adapt names, tools, and
folder details to match the repository you are working in, but keep the
principles consistent: small branches, readable commits, reviewed pull requests,
clear ownership, and predictable structure.

## Branch Strategy

Use four branch families:

- `main`: production-ready code only. This branch should always be deployable.
- `develop`: integration branch for completed work before release.
- `feature/<short-name>`: normal development branches created from `develop`.
- `hotfix/<short-name>`: urgent production fixes created from `main`.

Recommended flow:

- Create feature branches from `develop`.
- Open pull requests from feature branches into `develop`.
- Merge `develop` into `main` when preparing a release.
- Create hotfix branches from `main` only for urgent production issues.
- After a hotfix reaches `main`, merge or cherry-pick the fix back into
  `develop`.

Examples:

```text
feature/user-profile-page
feature/chat-message-list
fix/login-redirect
hotfix/payment-timeout
```

Keep branches small and focused. One branch should usually represent one
feature, bug fix, cleanup, or documentation change.

## Commit Convention

Use Conventional Commits. If the project has Commitlint, follow the configured
rules in `commitlint.config.*`. A common setup is
`@commitlint/config-conventional`.

Format:

```text
<type>(optional-scope): <short summary>
```

Common types:

- `feat`: user-facing feature
- `fix`: bug fix
- `docs`: documentation-only change
- `style`: formatting-only change
- `refactor`: code change that is not a feature or bug fix
- `perf`: performance improvement
- `test`: test changes
- `build`: build system or dependency changes
- `ci`: CI configuration changes
- `chore`: maintenance task
- `revert`: revert a previous commit

Examples:

```text
feat(auth): add login form
fix(users): handle missing avatar
docs: update developer guide
refactor(services): centralize api client
test(chat): cover message creation
```

Guidelines:

- Use lower-case summaries.
- Use imperative mood, such as `add`, `fix`, `update`, or `remove`.
- Do not end the summary with a period.
- Add a scope when it clarifies the affected area, such as `auth`, `users`,
  `chat`, `api`, `db`, `services`, or `docs`.
- Use the body for context when the change is not obvious from the summary.

## Git Workflow

1. Update the integration branch.

   ```bash
   git switch develop
   git pull origin develop
   ```

2. Create a feature branch.

   ```bash
   git switch -c feature/<short-name>
   ```

3. Write code on the feature branch.

4. Run the checks required by the project.

   Common examples:

   ```bash
   npm run lint
   npm run type-check
   npm test
   npx prettier --check .
   ```

   Use the repository's actual scripts from `package.json`, `Makefile`, CI
   config, or project documentation.

5. Commit using the commit convention.

6. Push the branch.

   ```bash
   git push -u origin feature/<short-name>
   ```

7. Open a pull request into `develop`.

8. Fill in the pull request template. A useful template usually includes:

   - Summary
   - Motivation or related issue
   - Screenshots or recordings for UI changes
   - Testing performed
   - Database, migration, or environment-variable changes
   - Risks, follow-ups, or known limitations

9. Request review, address feedback, and merge after approval and passing checks.

## Folder Structure

Prefer a structure that separates routing, feature ownership, shared UI,
service/data access, low-level utilities, and types.

Common structure:

```text
.
|-- docs/
|-- public/
|-- src/
|   |-- app/
|   |-- components/
|   |-- features/
|   |-- lib/
|   |-- services/
|   |-- types/
|   `-- utils/
`-- <platform-or-infra-folder>/
```

### `docs`

Project documentation.

Use this for onboarding guides, architecture notes, decision records, local
setup, deployment steps, and scripts intended for developers.

### `public`

Static assets served directly by the web framework.

Use this for images, icons, fonts, downloadable files, and other browser-visible
assets that do not need bundling.

### `src/app`

Application routing.

In Next.js App Router projects, this contains routes, layouts, loading states,
error boundaries, and Route Handlers:

```text
src/app/page.tsx
src/app/layout.tsx
src/app/<segment>/page.tsx
src/app/<segment>/loading.tsx
src/app/api/**/route.ts
```

Keep route files focused on composition, request handling, authentication,
validation, and calling feature or service code.

### `src/components`

Shared UI components that are not owned by a single feature.

Use this for reusable building blocks such as buttons, modals, navigation,
layout primitives, dialogs, toasts, and providers. If a component belongs only
to one domain, put it in that feature folder instead.

### `src/features`

Domain-owned code.

Each feature folder should contain code for one product area or business domain:

```text
src/features/auth/
src/features/users/
src/features/billing/
src/features/chat/
```

A feature can contain:

```text
components/
schema.ts
action.ts
const.ts
types.ts
utils.ts
```

Keep feature-specific UI, validation, actions, and domain helpers close
together.

### `src/services`

Centralized service and data access layer.

Common subfolders:

- `api`: typed clients for HTTP APIs
- `hooks`: data-fetching hooks or query option factories
- `database`: database adapters or repositories
- `realtime`: realtime, websocket, or subscription helpers
- `external`: third-party service clients

Avoid scattering raw `fetch`, SDK calls, database queries, or third-party API
calls throughout components. Put them behind service functions so behavior,
typing, auth, caching, and error handling stay consistent.

### `src/lib`

Low-level application integrations and framework helpers.

Use this for shared clients, environment parsing, authentication helpers,
configuration, logging, analytics, storage, and framework-specific setup.

Examples:

```text
src/lib/api-client.ts
src/lib/auth.ts
src/lib/env.ts
src/lib/database.ts
```

### `src/types`

Shared TypeScript types.

Use this for generated types, API response shapes, domain model aliases, shared
interfaces, enums, and cross-feature type definitions.

Prefer generated or shared types over duplicating local shapes in many files.

### `src/utils`

Small generic helper functions.

Utilities should be framework-light and broadly reusable. If a helper only
belongs to one feature, keep it inside that feature.

### Platform Or Infrastructure Folders

Some projects include platform-specific folders such as:

```text
supabase/
prisma/
drizzle/
terraform/
docker/
k8s/
scripts/
```

Use these for migrations, seed data, infrastructure configuration, deployment
assets, and operational scripts.

## Naming Conventions

### PaceMate Ownership

The current app applies the folder guidelines above as follows:

```text
src/app/api/coach/route.ts                 HTTP request validation, limits, response handling
src/features/running-coach/components/    Running-coach UI and dashboard panels
src/features/running-coach/schema.ts      Coach and nutrition boundary schemas
src/features/running-coach/storage-schema.ts  Saved-runner boundary schemas
src/features/running-coach/onboarding-schema.ts  Onboarding validation
src/features/running-coach/coach-context.ts  Live statistics and compact AI context
src/features/running-coach/nutrition.ts    Daily nutrition calculations
src/features/running-coach/const.ts        Domain defaults
src/services/api/coach.ts                 Browser client for POST /api/coach
src/services/coach-ai/coach-service.ts     AI service adapter
groq/groq-service.ts                     Server-only Groq provider integration
src/services/coach-ai/mock/                Mock implementations and seed fixtures
src/services/database/runner-repository.ts Saved runner and mock-session access
src/lib/browser-storage.ts                Browser storage availability helper
src/lib/env.ts                            Server-only environment parsing
src/types/coach-ai.ts                     Shared coach contracts
src/types/runner.ts                       Shared persistence contracts
```

Production services and UI must not import contracts or calculations from mock
implementations. Only the AI adapter and new-user fixture seeding depend on mocks.
Groq provider implementation and its tests live in the top-level `groq/` folder,
outside `src/`, imported using the `@groq/*` alias. Next.js HTTP routing and the
browser API client remain under `src/`.
Keep provider-specific calls inside the Groq service; the browser API client must
not depend on a provider. Keep HTTP request/response handling in the route and
localStorage access in the repository/browser integration. Preserve existing
storage keys when reorganizing files so saved users retain their history.
Tests live beside the module they exercise; service integration tests may also
verify domain schemas and calculations used by that service.

Use kebab case for file and folder names:

```text
login-form.tsx
profile-form-modal.tsx
room-member.ts
api-helper.ts
```

Use framework-required file names exactly as required. For Next.js App Router:

```text
page.tsx
layout.tsx
loading.tsx
route.ts
not-found.tsx
error.tsx
```

Code naming:

- Components: `PascalCase`, for example `LoginForm`.
- Hooks: `useCamelCase`, for example `useCurrentUser`.
- Schemas: `camelCase` ending in `Schema`, for example `loginSchema`.
- API clients: `camelCase` ending in `Api`, for example `userApi`.
- Service objects: `camelCase` ending in the service type, for example
  `userService`, `userRepository`, or `userSupabase`.
- Types and interfaces: `PascalCase`, for example `ApiResponse`.
- Constants: `UPPER_SNAKE_CASE` for true constants, or clear `camelCase` for
  local values.
- Environment variables: `UPPER_SNAKE_CASE`.
- Route segments and URLs: kebab case where possible.

Import rules:

- Prefer the configured source alias, commonly `@/`, for imports from `src`.
- Use relative imports for files that are genuinely local siblings.
- Avoid deep cross-feature imports when a shared service or type would be
  clearer.

## Next.js Practices

For Next.js App Router projects, prefer the defaults and patterns below.

### Prefer Server Components For Pages

`page.tsx` and `layout.tsx` are Server Components by default. Keep them
server-side for data loading, auth checks, redirects, metadata, and composition.

Example:

```tsx
import { redirect } from 'next/navigation'

export default async function Page() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return <main>{/* server-rendered route UI */}</main>
}
```

Use `'use client'` only for components that need client behavior:

- State
- Event handlers
- Effects
- Browser APIs
- Client-only hooks
- React Query or other browser-side data hooks
- Client stores

Keep the client boundary as small as practical.

### Centralize API Access

Do not spread raw HTTP calls across UI components.

Recommended pattern:

- Route Handlers live in `src/app/api/**/route.ts`.
- HTTP client wrappers live in `src/lib` or `src/services/api`.
- Domain API methods live in `src/services/api`.
- Data-fetching hooks live in `src/services/hooks` or inside the owning feature.
- Database or third-party SDK calls live in `src/services`.

This keeps request formatting, auth, caching, retries, errors, and response
types consistent.

### Keep Route Handlers Thin

Use Route Handlers to:

- Read route params, query params, headers, cookies, and request bodies
- Authenticate or authorize the request
- Validate input
- Call service-layer functions
- Return a consistent response shape

Avoid putting large business workflows, raw database queries, or duplicated
response formatting directly in route files.

### Validate Inputs At Boundaries

Validate data when it enters the system:

- Form submissions
- Server Actions
- Route Handler request bodies
- Query params
- Webhook payloads
- Third-party callbacks

Use a schema library such as Zod when available. Keep schemas near the owning
feature unless they are shared across domains.

### Use Server Actions Carefully

Server Actions are useful for mutations tightly coupled to forms or server-side
workflows.

Guidelines:

- Put `'use server'` at the top of action files or inside individual actions.
- Validate all input.
- Keep secrets and privileged SDK calls server-side.
- Return predictable success/error shapes.
- Revalidate or redirect intentionally after mutations.

### Preserve Type Safety

Keep TypeScript strict. Before opening a pull request, run the project's type
check command.

Prefer:

- Shared response types
- Generated database or API types
- Explicit input/output types for service functions
- Narrow types over `any`

### Use Loading And Error Boundaries Intentionally

Add route-level `loading.tsx` when a page may wait on data or stream content.
Add `error.tsx` when a route segment needs a local error boundary.

Keep fallback UI simple, stable, and consistent with the page layout.

### Keep Client Bundles Small

Do not mark an entire page or layout as a Client Component just because one
child is interactive. Extract the interactive part into a focused child
component with `'use client'`.

### Handle Environment Variables Safely

Use a centralized environment module when possible.

Guidelines:

- Validate required environment variables at startup.
- Keep secrets server-side.
- Only use public prefixes such as `NEXT_PUBLIC_` for values intentionally
  exposed to the browser.
- Document new variables in the project setup guide or pull request.

### Keep Styling Consistent

Follow the project's existing styling system, whether that is Tailwind CSS, CSS
modules, styled components, a component library, or plain CSS.

Avoid introducing a second styling approach without team agreement.

## Pull Request Checklist

Before requesting review:

- Branch starts from the correct base branch.
- Pull request targets `develop` for normal work.
- Commits follow Conventional Commits.
- Lint passes.
- Type check passes.
- Tests pass, when the project has tests.
- Formatting passes.
- UI changes include screenshots or recordings.
- API changes include request/response notes.
- Database changes include migrations and seed updates when needed.
- Environment-variable changes are documented.
- New code follows folder ownership and naming conventions.
