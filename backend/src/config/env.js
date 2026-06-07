import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().url().or(z.string().regex(/^(postgresql|postgres):\/\//)),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET should be at least 8 characters long'),
  JWT_EXPIRATION_MS: z.coerce.number().default(86400000),
  DOCUMENT_STORAGE_PATH: z.string().default('./storage/documents'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const config = {
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  jwtSecret: parsed.data.JWT_SECRET,
  jwtExpirationMs: parsed.data.JWT_EXPIRATION_MS,
  documentStoragePath: parsed.data.DOCUMENT_STORAGE_PATH,
};
