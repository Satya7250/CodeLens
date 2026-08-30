import { relations } from "drizzle-orm";
import {
  bigint,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  customType,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------
 * Custom pgvector column type
 * -----------------------------------------------------------------------
 * Using `customType` instead of relying on a specific drizzle-orm version's
 * built-in `vector` export keeps this schema portable across drizzle-orm
 * releases. Dimension is fixed to 1536 (OpenAI text-embedding-3-small /
 * ada-002 dimensionality) — adjust to match your embedding model.
 * ---------------------------------------------------------------------- */
export const VECTOR_DIMENSIONS = 1536;

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return `vector(${VECTOR_DIMENSIONS})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    return value.slice(1, -1).split(",").filter(Boolean).map(Number);
  },
});

/* -------------------------------------------------------------------------
 * Enums
 * ---------------------------------------------------------------------- */
export const indexStatusEnum = pgEnum("index_status", ["PENDING", "INDEXING", "INDEXED", "FAILED"]);

export const repositoryVisibilityEnum = pgEnum("repository_visibility", [
  "public",
  "private",
  "internal",
]);

export type IndexStatus = (typeof indexStatusEnum.enumValues)[number];
export type RepositoryVisibility = (typeof repositoryVisibilityEnum.enumValues)[number];

/* -------------------------------------------------------------------------
 * Table: users
 * ---------------------------------------------------------------------- */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  clerkId: text("clerk_id").notNull().unique(),

  email: text("email").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* -------------------------------------------------------------------------
 * Table: repositories
 * ---------------------------------------------------------------------- */
export const repositories = pgTable(
  "repositories",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    githubRepoId: bigint("github_repo_id", { mode: "bigint" }).notNull(),

    owner: text("owner").notNull(),

    name: text("name").notNull(),

    defaultBranch: text("default_branch").notNull(),

    visibility: repositoryVisibilityEnum("visibility").notNull(),

    lastIndexedCommit: text("last_indexed_commit"),

    indexStatus: indexStatusEnum("index_status").notNull().default("PENDING"),

    lastIndexedAt: timestamp("last_indexed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("repositories_user_id_idx").on(table.userId),
    indexStatusIdx: index("repositories_index_status_idx").on(table.indexStatus),
    userRepoUnique: unique("repositories_user_repo_unique").on(table.userId, table.githubRepoId),
  }),
);

/* -------------------------------------------------------------------------
 * Table: repositoryFiles
 * ---------------------------------------------------------------------- */
export const repositoryFiles = pgTable(
  "repository_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),

    path: text("path").notNull(),

    sha: text("sha").notNull(),

    size: integer("size").notNull(),

    language: text("language"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    repositoryPathUnique: unique("repository_files_repository_path_unique").on(
      table.repositoryId,
      table.path,
    ),
    // Required for composite FK from code_chunks
    repositoryIdFileIdUnique: unique("repository_files_repository_id_file_id_unique").on(
      table.repositoryId,
      table.id,
    ),
  }),
);

/* -------------------------------------------------------------------------
 * Table: codeChunks
 * ---------------------------------------------------------------------- */
export const codeChunks = pgTable(
  "code_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),

    fileId: uuid("file_id")
      .notNull()
      .references(() => repositoryFiles.id, { onDelete: "cascade" }),

    filePath: text("file_path").notNull(),

    content: text("content").notNull(),

    startLine: integer("start_line").notNull(),

    endLine: integer("end_line").notNull(),

    embedding: vector("embedding").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("code_chunks_repository_id_idx").on(table.repositoryId),
    index("code_chunks_file_id_idx").on(table.fileId),
    index("code_chunks_embedding_hnsw_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
    foreignKey({
      columns: [table.repositoryId, table.fileId],
      foreignColumns: [repositoryFiles.repositoryId, repositoryFiles.id],
      name: "code_chunks_repository_file_fk",
    }).onDelete("cascade"),
  ],
);

/* -------------------------------------------------------------------------
 * Relations
 * ---------------------------------------------------------------------- */

// users → repositories (one-to-many)
export const usersRelations = relations(users, ({ many }) => ({
  repositories: many(repositories),
}));

// repositories → user (many-to-one), repositoryFiles (one-to-many),
// codeChunks (one-to-many)
export const repositoriesRelations = relations(repositories, ({ one, many }) => ({
  user: one(users, {
    fields: [repositories.userId],
    references: [users.id],
  }),
  files: many(repositoryFiles),
  chunks: many(codeChunks),
}));

// repositoryFiles → repository (many-to-one), codeChunks (one-to-many)
export const repositoryFilesRelations = relations(repositoryFiles, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [repositoryFiles.repositoryId],
    references: [repositories.id],
  }),
  chunks: many(codeChunks),
}));

// codeChunks → repository (many-to-one), file (many-to-one)
export const codeChunksRelations = relations(codeChunks, ({ one }) => ({
  repository: one(repositories, {
    fields: [codeChunks.repositoryId],
    references: [repositories.id],
  }),
  file: one(repositoryFiles, {
    fields: [codeChunks.fileId],
    references: [repositoryFiles.id],
  }),
}));

/* -------------------------------------------------------------------------
 * Inferred types (handy for services / API layers in the monorepo)
 * ---------------------------------------------------------------------- */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;

export type RepositoryFile = typeof repositoryFiles.$inferSelect;
export type NewRepositoryFile = typeof repositoryFiles.$inferInsert;

export type CodeChunk = typeof codeChunks.$inferSelect;
export type NewCodeChunk = typeof codeChunks.$inferInsert;
