import { AuthConfig } from '../../src/config/auth.config';
import { HashConfig } from '../../src/config/hash.config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Values used when e2e tests override Nest's ConfigService.
 * Keep shapes aligned with src/config/* so services behave like production.
 */
export const testConfig = {
  database: {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'xd62ix1o1f41ck',
    database: process.env.DB_NAME ?? 'feno',
    synchronize: true,
  } satisfies TypeOrmModuleOptions,

  auth: {
    jwt: {
      accessToken: {
        secret: 'e2e-access-token-secret',
        expiresIn: '60',
      },
      refreshToken: {
        secret: 'e2e-refresh-token-secret',
        expiresIn: '604800',
      },
    },
  } satisfies AuthConfig,

  hash: {
    SALT_ROUNDS: 4,
  } satisfies HashConfig,
};
