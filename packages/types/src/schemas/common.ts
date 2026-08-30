import { z } from "zod";

export const PaginationSchema = z
  .object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  })
  .strict();

export const SortOrderSchema = z.enum(["asc", "desc"]);

export const IdSchema = z.uuid();

export type Pagination = z.infer<typeof PaginationSchema>;
export type SortOrder = z.infer<typeof SortOrderSchema>;
export type Id = z.infer<typeof IdSchema>;
