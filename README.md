# Next.js Team Template

## 🗒️ Features

### Supports team development

Enforce consistent development standards across the entire team with Git hooks and automated checks.

This template uses:

- **husky** for Git hooks
- **commit lint** for conventional commit messages
- **lint-staged** for checking staged files
- **ESLint** for code-quality checks
- **Prettier** for consistent formatting
- **TypeScript** for static type checking

These checks help prevent inconsistent formatting, invalid commits, and type or lint errors from reaching the remote repository.

### Feature based architecture

The codebase follows a **feature-based structure**.

Everything that belongs specifically to a feature—such as:

- components
- schemas
- constants
- actions
- feature-specific providers
- other feature-specific logic

should live inside that feature's directory.

For example:

```text
src/features/
└── auth/
    ├── action.ts
    ├── components/
    ├── provider.tsx
    └── schema.ts
```

This makes the codebase easier to navigate and allows teams to divide development work by feature or domain.

### Centralized API & Service Layer

Third-party integrations and external connections are isolated from feature code and stored inside `src/services`.

Examples include:

- REST APIs
- supabase
- external SDKs
- data-fetching hooks
- other third-party integrations

This provides a **single source of truth** for external services, reducing duplicated connection logic and making integrations easier to maintain, test, and replace.

## 🛠️ Setup

### Prerequisites

Make sure you have the following installed:

- node.js
- npm
- git

### 1. Create Next.js

Run:

```bash
npx create-next-app@latest
```

(Optional) Follow this configuration:

```
TypeScript, ESLint, No React Compiler, Tailwind CSS, src/ directory, App Router, AGENTS.md
```

Install dev dependencies:

```bash
npm install -D prettier husky @commitlint/cli @commitlint/config-conventional lint-staged
```

### 2. Configure husky

Copy commit-msg, pre-commit and pre-push from this repo's .husky into your .husky, or copy from below.

Folder structure:

```
.husky
├── commit-msg
├── pre-commit
└── pre-push
```

commit-msg

```bash
npx --no -- commitlint --edit $1
```

pre-commit

```bash
#!/bin/sh
npx lint-staged
```

pre-push

```bash
#!/bin/sh

echo "Running lint..."
npm run lint

echo "Running type check..."
npm run type-check

echo "Checking Prettier format..."
npx prettier --check .

echo "Pre-push checks passed ✅"
```

### 3. Configure package.json

Inside package.json, add this to the json:

```json
"lint-staged": {
  "**/*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "**/*.{js,jsx,json,css,md}": [
    "prettier --write"
  ]
},
```

Make sure your scripts field has prepare, type-check and format as shown below:

```json
"scripts": {
  "prepare": "husky",
  "type-check": "tsc --noEmit",
  "format": "prettier --write \"**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts,json,css,md}\""
}
```

### 4. Add configuration files

Add .prettierrc at the root of the project and copy:

```json
{
  "semi": false,
  "singleQuote": true,
  "jsxSingleQuote": false,
  "trailingComma": "all",
  "tabWidth": 2,
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

Add .prettierignore at the root of the project and copy:

```bash
# Dependency folders
node_modules/

# Build outputs
.next
build/
dist/
coverage/
out/

# Lockfiles and system files
package-lock.json
yarn.lock
pnpm-lock.yaml
.DS_Store
supabase/.temp
```

Add commitlint.config.js at the root of the project and copy:

```js
module.exports = { extends: ['@commitlint/config-conventional'] }
```

Create .vscode folder at the root of the project, add settings.json into .vscode and copy:

```json
{
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.detectIndentation": false,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

## 📁 Folder structure

```
.
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── commitlint.config.js
├── docs
│   └── DEVELOPERS.md
├── eslint.config.mjs
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public/
├── src
│   ├── app
│   │   ├── api
│   │   │   └── v1/
│   │   ├── chat/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── provider.tsx
│   │   └── users/
│   ├── components
│   │   ├── modal/
│   │   ├── navbar.tsx
│   │   └── overlay/
│   ├── features
│   │   ├── auth
│   │   │   ├── action.ts
│   │   │   ├── components/
│   │   │   ├── provider.tsx
│   │   │   └── schema.ts
│   │   ├── chat
│   │   │   ├── components/
│   │   │   ├── const.ts
│   │   │   └── schema.ts
│   │   └── user
│   │       ├── components/
│   │       └── schema.ts
│   ├── lib
│   │   ├── api-client.ts
│   │   └── supabase/
│   ├── proxy.ts
│   ├── services
│   │   ├── api/
│   │   ├── hooks/
│   │   └── supabase/
│   ├── types/
│   └── utils/
├── supabase/
└── tsconfig.json
```

### Folder description

#### `src/app`

Contains Next.js App Router routes and application-level files.

Use this directory for:

- pages
- layouts
- route handlers
- loading and error states
- application-level providers
- API routes

Example:

```text
src/app/
├── chat/
├── users/
└── api/
    └── v1/
```

Keep business logic out of `app` whenever possible. Route files should primarily compose the appropriate feature components and services.

---

#### `src/components`

Contains **shared UI components** that are not specific to a single feature.

Examples:

```text
src/components/
├── modal/
├── overlay/
└── navbar.tsx
```

A component belongs here when it is reusable across multiple features.

If a component is only relevant to authentication, for example, it should live under:

```text
src/features/auth/components/
```

rather than `src/components/`.

---

#### `src/features`

Contains the application's **business/domain features**.

Each feature should be self-contained and own the code that belongs specifically to it.

Example:

```text
src/features/auth/
├── action.ts
├── components/
├── provider.tsx
└── schema.ts
```

A feature may contain:

- components
- server actions
- schemas
- constants
- providers
- feature-specific utilities
- feature-specific types

If the code only makes sense within one feature, keep it inside that feature.
This keeps feature boundaries clear and makes parallel development easier.

---

#### `src/lib`

Contains low-level application infrastructure and libraries.

Unlike `services`, which focuses on external integrations, `lib` should contain foundational code used by the application itself.

Examples:

```text
src/lib/
├── api-client.ts
└── supabase/
```

Typical responsibilities include:

- API client configuration
- supabase client initialization
- shared infrastructure
- library configuration
- framework-level helpers

---

#### `src/services`

Contains integrations with **external systems and third-party services**.

This is the project's centralized integration layer.

Example:

```text
src/services/
├── api/
├── hooks/
└── supabase/
```

Typical responsibilities include:

- API requests
- external SDK integrations
- supabase operations
- data-fetching hooks
- external service configuration

The goal is to prevent third-party implementation details from leaking throughout the feature layer.

For example, instead of having multiple features independently configure an API client:

```text
features/auth → API configuration
features/chat → API configuration
features/user → API configuration
```

centralize the integration:

```text
features/auth ──┐
features/chat ──┼──> services/api
features/user ──┘
```

This gives the project a single source of truth for external connections.

---

#### `src/types`

Contains **shared TypeScript types** used across multiple features or application layers.

Use this directory for types that do not clearly belong to one feature.

For example:

```text
src/types/
├── api.ts
├── pagination.ts
└── common.ts
```

Feature-specific types should generally remain inside the relevant feature instead of being placed here.

---

#### `src/utils`

Contains **generic, reusable utility functions**.

Utilities should be independent of a particular feature or external service.

Examples include:

- string helpers
- date helpers
- formatting functions
- array/object helpers
- generic validation helpers

If a utility is specific to a feature, prefer keeping it inside that feature.

## License

This project is licensed under the **MIT License**.
