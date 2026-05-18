import { z } from 'zod';

const booleanFromString = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}, z.boolean());

export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_NAME: z.string().min(1).default('GigaHub OS'),
  APP_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_HOST: z.string().min(1).default('0.0.0.0'),
  API_PREFIX: z.string().min(1).default('api'),
  API_VERSION: z.string().min(1).default('1'),
  CORS_ORIGINS: z.string().min(1).default('http://localhost:3000'),
  SWAGGER_ENABLED: booleanFromString.default(true),
  SWAGGER_PATH: z.string().min(1).default('docs'),
  THROTTLE_TTL: z.coerce.number().int().positive().default(60000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string().min(1).default('localhost'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  JWT_ACCESS_SECRET: z.string().min(24),
  JWT_REFRESH_SECRET: z.string().min(24),
});

export type EnvironmentVariables = z.infer<typeof environmentSchema>;

export function parseEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  return environmentSchema.parse(config);
}

export function validateEnvironment(config: Record<string, unknown>): Record<string, unknown> {
  return parseEnvironment(config);
}
