import { parseEnvironment } from './environment.schema';

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function configuration() {
  const env = parseEnvironment(process.env);

  return {
    app: {
      env: env.NODE_ENV,
      name: env.APP_NAME,
      port: env.APP_PORT,
      host: env.APP_HOST,
      apiPrefix: env.API_PREFIX,
      apiVersion: env.API_VERSION,
    },
    database: {
      url: env.DATABASE_URL,
    },
    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    },
    security: {
      corsOrigins: parseList(env.CORS_ORIGINS),
      throttleTtl: env.THROTTLE_TTL,
      throttleLimit: env.THROTTLE_LIMIT,
    },
    swagger: {
      enabled: env.SWAGGER_ENABLED,
      path: env.SWAGGER_PATH,
    },
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
    },
  };
}
