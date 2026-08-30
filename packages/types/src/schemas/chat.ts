import { z } from "zod";

export const ChatMessageRoleSchema = z.enum(["user", "assistant"]);

export const ChatMessageSchema = z
  .object({
    role: ChatMessageRoleSchema,
    content: z.string(),
  })
  .strict();

export const RepositoryChatRequestSchema = z
  .object({
    repositoryId: z.uuid(),
    message: z.string().trim().min(1).max(5000),
  })
  .strict();

export const RepositorySourceSchema = z
  .object({
    filePath: z.string().trim().min(1),
    startLine: z.number().int().min(1),
    endLine: z.number().int().min(1),
  })
  .strict();

export const RepositoryChatResponseSchema = z
  .object({
    answer: z.string().trim(),
    sources: z.array(RepositorySourceSchema),
  })
  .strict();

export type ChatMessageRole = z.infer<typeof ChatMessageRoleSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type RepositoryChatRequest = z.infer<typeof RepositoryChatRequestSchema>;
export type RepositorySource = z.infer<typeof RepositorySourceSchema>;
export type RepositoryChatResponse = z.infer<typeof RepositoryChatResponseSchema>;
