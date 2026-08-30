CREATE TYPE "public"."index_status" AS ENUM('PENDING', 'INDEXING', 'INDEXED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."repository_visibility" AS ENUM('public', 'private', 'internal');--> statement-breakpoint
CREATE TABLE "code_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"file_path" text NOT NULL,
	"content" text NOT NULL,
	"start_line" integer NOT NULL,
	"end_line" integer NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"github_repo_id" bigint NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"default_branch" text NOT NULL,
	"visibility" "repository_visibility" NOT NULL,
	"last_indexed_commit" text,
	"index_status" "index_status" DEFAULT 'PENDING' NOT NULL,
	"last_indexed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "repositories_user_repo_unique" UNIQUE("user_id","github_repo_id")
);
--> statement-breakpoint
CREATE TABLE "repository_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"path" text NOT NULL,
	"sha" text NOT NULL,
	"size" integer NOT NULL,
	"language" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "repository_files_repository_path_unique" UNIQUE("repository_id","path"),
	CONSTRAINT "repository_files_repository_id_file_id_unique" UNIQUE("repository_id","id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "code_chunks" ADD CONSTRAINT "code_chunks_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_chunks" ADD CONSTRAINT "code_chunks_file_id_repository_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."repository_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_chunks" ADD CONSTRAINT "code_chunks_repository_file_fk" FOREIGN KEY ("repository_id","file_id") REFERENCES "public"."repository_files"("repository_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_files" ADD CONSTRAINT "repository_files_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "code_chunks_repository_id_idx" ON "code_chunks" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "code_chunks_file_id_idx" ON "code_chunks" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "code_chunks_embedding_hnsw_idx" ON "code_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "repositories_user_id_idx" ON "repositories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "repositories_index_status_idx" ON "repositories" USING btree ("index_status");