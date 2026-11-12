# CodeLens

CodeLens helps developers understand GitHub repositories with AI-powered code search and chat. Connect a GitHub account, index a repository, and ask questions answered using retrieved source code and file/line citations.

## Features

- Sign in and manage your workspace with Clerk.
- Connect GitHub through Clerk's GitHub OAuth integration.
- Index supported repository files into syntax-aware chunks.
- Generate embeddings with OpenRouter and store them in PostgreSQL with pgvector.
- Search using semantic and keyword retrieval.
- Ask repository-specific questions and receive answers with validated source citations.
- Use the responsive dashboard in light or dark mode.

## How it works

1. Sign in with Clerk and connect GitHub.
2. Select a repository that the connected GitHub account can access.
3. Start indexing. CodeLens fetches supported files, chunks them, generates embeddings, and stores the index in PostgreSQL.
4. Ask a question. CodeLens retrieves relevant chunks, sends them with the chat instructions to the configured OpenRouter model, then validates citations before returning the answer.

Repository indexing currently runs through the web app's API request; it is not an Inngest background job.

## Tech stack

- **Web:** Next.js App Router, React, TypeScript, Tailwind CSS
- **Authentication:** Clerk
- **Database:** PostgreSQL 17 with pgvector, Drizzle ORM
- **GitHub:** GitHub API using the user's Clerk-managed GitHub OAuth connection
- **AI:** OpenRouter chat completions and embeddings
- **Workspace:** pnpm workspaces and Turborepo

## Prerequisites

- Node.js **24 or newer**
- pnpm **11.23.0** (the version declared in `package.json`)
- Docker Desktop or another Docker Compose-compatible runtime
- A Clerk application
- An OpenRouter API key with access to an embedding model and the configured chat model
- A GitHub OAuth app configured as a social connection in Clerk

## Quick start

### 1. Get the code and install dependencies

```bash
git clone https://github.com/Satya7250/CodeLens.git
cd CodeLens
corepack enable
pnpm install
```

### 2. Configure environment variables

The database tooling and the Next.js app run from different workspace directories. Create both environment files from the checked-in template:

```bash
cp .env.example .env
cp .env.example apps/web/.env.local
```

Set `DATABASE_URL` in the root `.env` for Drizzle and in `apps/web/.env.local` for the web app. Set the Clerk and OpenRouter values only in `apps/web/.env.local`; the root database tooling does not need those credentials.

| Variable                            | Required | Description                                                                                                                |
| ----------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                      | Yes      | PostgreSQL connection string. For the included local database, use `postgres://postgres:postgres@localhost:5432/codelens`. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes      | Publishable key from your Clerk application.                                                                               |
| `CLERK_SECRET_KEY`                  | Yes      | Secret key from the same Clerk application. Keep it server-side.                                                           |
| `OPENROUTER_API_KEY`                | Yes      | Server-side OpenRouter API key. Used for query/repository embeddings and chat completions.                                 |
| `OPENROUTER_CHAT_MODEL`             | Yes      | OpenRouter chat model identifier available to your account. The checked-in template sets this to `openai/gpt-4o-mini`.     |

Do not commit `.env` or `apps/web/.env.local`, expose secret keys in browser code, or share credentials in issue reports. The `.env.example` values are placeholders, not working credentials.

### 3. Configure Clerk and GitHub

1. Create a Clerk application and copy its publishable and secret keys into `apps/web/.env.local`.
2. In Clerk's dashboard, enable **GitHub as a social connection** and configure it with your GitHub OAuth app credentials.
3. Add the callback/redirect URL shown by Clerk to the GitHub OAuth app. Use Clerk's development credentials or configure your own GitHub OAuth app according to Clerk's setup instructions.
4. Enable the GitHub scopes required to list repositories and read repository contents. The application obtains the signed-in user's GitHub OAuth token from Clerk; do not add a personal GitHub token to `.env`.

Use the development keys and redirect URLs provided by your own Clerk application. Production deployments need the production Clerk instance and its registered production callback URLs.

### 4. Start PostgreSQL

The included Compose service runs PostgreSQL 17 with pgvector:

```bash
pnpm db:start
```

Wait for the database health check to pass, then apply the checked-in migrations:

```bash
pnpm db:migrate
```

The local database defaults in `docker-compose.yml` are intended for development only. If you change the database username, password, database name, or port, update `DATABASE_URL` in both environment files to match.

### 5. Start CodeLens

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Create or sign in to a Clerk user, connect GitHub, select a repository, and start indexing it before asking codebase questions.

## Environment template

The checked-in `.env.example` is a template. The application currently uses `DATABASE_URL`, the two Clerk variables, `OPENROUTER_API_KEY`, and `OPENROUTER_CHAT_MODEL`. The template also contains legacy `AUTH_SECRET`, GitHub OAuth, and Inngest placeholders; they are not required by the current app. GitHub OAuth is configured through Clerk, and repository indexing is handled by the web app rather than Inngest.

## Useful commands

Run these commands from the repository root:

| Command                  | Purpose                                                                   |
| ------------------------ | ------------------------------------------------------------------------- |
| `pnpm dev`               | Start workspace development services, including the web app on port 3000. |
| `pnpm build`             | Build workspace packages and the web app.                                 |
| `pnpm lint`              | Run workspace ESLint checks.                                              |
| `pnpm check-types`       | Run workspace TypeScript checks.                                          |
| `pnpm --filter web test` | Run the web app's Node-based unit tests.                                  |
| `pnpm format`            | Format TypeScript, TSX, and Markdown files.                               |
| `pnpm format:check`      | Check repository formatting.                                              |
| `pnpm db:start`          | Start the local PostgreSQL/pgvector container.                            |
| `pnpm db:stop`           | Stop the database container and retain its data volume.                   |
| `pnpm db:logs`           | Follow database logs.                                                     |
| `pnpm db:restart`        | Restart the database container.                                           |
| `pnpm db:generate`       | Generate a Drizzle migration from schema changes.                         |
| `pnpm db:migrate`        | Apply checked-in Drizzle migrations.                                      |
| `pnpm db:push`           | Push the current schema directly to the database (development use).       |
| `pnpm db:studio`         | Open Drizzle Studio.                                                      |

To run only the web app's scripts:

```bash
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web test
pnpm --filter web build
```

The web package's test script uses Node's built-in test runner with Node 24's TypeScript support.

## Project layout

```text
apps/
  web/                 Next.js app, API routes, UI, auth, indexing, and AI retrieval
packages/
  code-parser/         File filtering and syntax-aware chunking
  db/                  Drizzle schema, migrations, and database queries
  eslint-config/       Shared ESLint configuration
  github/              GitHub API client and repository operations
  types/               Shared schemas and TypeScript types
  typescript-config/   Shared TypeScript configurations
docker-compose.yml     Local PostgreSQL with pgvector
turbo.json             Turborepo task configuration
pnpm-workspace.yaml    pnpm workspace configuration
```

## Database workflow

Database schema definitions live in `packages/db/src/schema.ts`; committed migrations live in `packages/db/drizzle/`.

After changing a schema:

```bash
pnpm db:generate
```

Review the generated migration, then apply it locally:

```bash
pnpm db:migrate
```

`pnpm db:push` is available for local development, but migrations are the reproducible workflow for changes intended to be shared or deployed.

## Troubleshooting

### The app cannot connect to PostgreSQL

- Check `pnpm db:logs` and confirm the container is healthy.
- Confirm `DATABASE_URL` in both `.env` and `apps/web/.env.local` points to the host-accessible database.
- Apply migrations with `pnpm db:migrate`.

### Sign-in or GitHub repository access is unavailable

- Check that the Clerk keys belong to the same Clerk application and instance.
- Confirm GitHub is enabled as a social connection in Clerk, with a valid GitHub OAuth app and callback URL.
- Make sure the signed-in account has authorized the GitHub connection and can access the selected repository.

### Indexing or chat reports an AI provider error

- Confirm `OPENROUTER_API_KEY` is set in `apps/web/.env.local` and is valid.
- Confirm `OPENROUTER_CHAT_MODEL` is available to the OpenRouter account.
- Check the server logs for the sanitized provider status and error details.
- Check the OpenRouter account's credits, model access, and rate limits.

### TypeScript or build output is stale

After installing dependencies or switching branches, run:

```bash
pnpm install
pnpm check-types
pnpm build
```

## Security notes

- Keep Clerk secret keys, OpenRouter API keys, and database credentials on the server.
- Never commit `.env` or `apps/web/.env.local`.
- GitHub OAuth access is obtained through Clerk; do not store personal access tokens in the repository or environment.
- Repository content is user data. Access to repository operations is authenticated and scoped to the current user.
- Use non-development database credentials and production Clerk/OpenRouter configuration when deploying.

## Contributing

1. Create a focused branch for your change.
2. Keep schema changes and migrations together.
3. Run the relevant tests, lint, type checks, and build before opening a pull request.
4. Do not include secrets, local environment files, or private repository contents in commits.

## License

No license file is currently included. Unless a license is added to this repository, its contents are not explicitly licensed for reuse.
