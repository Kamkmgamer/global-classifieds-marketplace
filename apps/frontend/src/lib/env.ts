import { z } from "zod";

const EnvSchema = z.object({
  NEXT_PUBLIC_BACKEND_URL: z
    .string()
    .url()
    .optional()
    .or(z.literal("").optional()),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .optional()
    .or(z.literal("").optional()),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse({
  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
