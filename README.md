# CodeLens

AI-powered GitHub Codebase Assistant.

CodeLens helps developers understand repositories faster by indexing source code, retrieving relevant context, and answering questions grounded in the codebase.

> ChatGPT for your GitHub Repository.

---

## Features

- GitHub Authentication
- Repository Selection
- Repository Indexing
- AI-Powered Codebase Chat
- Source References
- Vector Search with pgvector
- Repository-Aware Answers
- Background Indexing with Inngest

---

## Tech Stack

### Frontend

- Next.js
- TypeScript
- App Router
- Tailwind CSS
- shadcn/ui

### Backend

- Route Handlers
- Inngest

### Database

- PostgreSQL
- pgvector
- Drizzle ORM

### GitHub

- GitHub OAuth
- Octokit

### AI

- Embeddings
- Retrieval-Augmented Generation (RAG)
- LLM Integration

---

## Architecture

```text
apps/
└── web

packages/
├── ai
├── db
├── github
├── code-parser
├── types
├── ui
└── config
```

### Package Responsibilities

| Package     | Responsibility                            |
| ----------- | ----------------------------------------- |
| web         | UI, Authentication, Dashboard, API Routes |
| ai          | Embeddings, Retrieval, Prompt Building    |
| db          | Database, Drizzle, Queries                |
| github      | GitHub API Integration                    |
| code-parser | File Filtering & Chunking                 |
| types       | Shared Types                              |
| ui          | Shared Components                         |
| config      | Shared Configurations                     |

---

## Repository Indexing Flow

```text
Repository
    ↓
Fetch
    ↓
Filter Files
    ↓
Chunk Code
    ↓
Generate Embeddings
    ↓
Store in PostgreSQL
    ↓
Indexed
```

---

## RAG Workflow

```text
Question
    ↓
Generate Query Embedding
    ↓
Vector Search
    ↓
Retrieve Relevant Chunks
    ↓
Construct Context
    ↓
LLM Response
    ↓
Answer + Source References
```

---

## Project Structure

```text
codelens/
├── apps/
│   └── web/
│
├── packages/
│   ├── ai/
│   ├── db/
│   ├── github/
│   ├── code-parser/
│   ├── types/
│   ├── ui/
│   └── config/
│
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

---

## Environment Variables

Create a `.env` file in the project root.

```env
DATABASE_URL=

AUTH_SECRET=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

OPENAI_API_KEY=

INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
```

---

## Local Development

### Install Dependencies

```bash
pnpm install
```

### Start PostgreSQL

```bash
docker compose up -d
```

### Run Development Server

```bash
pnpm dev
```

Application:

```text
http://localhost:3000
```

---

## Docker Database

The project uses PostgreSQL with pgvector.

Start:

```bash
docker compose up -d
```

Stop:

```bash
docker compose down
```

Remove Data:

```bash
docker compose down -v
```

---

## Available Scripts

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Lint

```bash
pnpm lint
```

### Format

```bash
pnpm format
```

### Type Check

```bash
pnpm check-types
```

### Database

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio
```

---

## Development Roadmap

### Phase 1

- [x] Turborepo
- [x] Next.js
- [x] Tailwind CSS

### Phase 2

- [ ] GitHub Authentication
- [ ] Repository Selection

### Phase 3

- [ ] PostgreSQL
- [ ] Drizzle ORM
- [ ] pgvector

### Phase 4

- [ ] Repository Indexing
- [ ] Chunking
- [ ] Embeddings

### Phase 5

- [ ] RAG Chat

### Phase 6

- [ ] Repository Updates

### Phase 7

- [ ] Advanced Code Intelligence

---

## Security

- GitHub tokens remain server-side.
- Repository code is treated as private user data.
- Secrets are stored in environment variables.
- Authorization checks are enforced for repository access.
- Vector search results are isolated per user.

---

## Vision

CodeLens enables developers to:

```text
GitHub Login
    ↓
Select Repository
    ↓
Index Repository
    ↓
Ask Questions
    ↓
Get Grounded Answers
    ↓
View Source References
```

The goal is to make understanding large codebases as easy as having a conversation.
