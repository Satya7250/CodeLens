import { z } from "zod";

export const UserSchema = z
  .object({
    id: z.uuid(),
    clerkId: z.string().trim().min(1),
    email: z.email(),
  })
  .strict();

export type User = z.infer<typeof UserSchema>;
