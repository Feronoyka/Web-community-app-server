import { registerAs } from '@nestjs/config';

export interface HashConfig {
  SALT_ROUNDS: number;
}

export const hashConfig = registerAs(
  'hash',
  (): HashConfig => ({
    SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS || '12'),
  }),
);
