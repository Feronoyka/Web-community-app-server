import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  jwt: {
    accessToken: {
      secret: string;
      expiresIn: string | number;
    };

    refreshToken: {
      secret: string;
      expiresIn: string | number;
    };
  };
}

export const authConfig = registerAs(
  'auth',
  (): AuthConfig => ({
    jwt: {
      accessToken: {
        secret: process.env.ACCESS_TOKEN_SECRET as string,
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ?? '60m',
      },

      refreshToken: {
        secret: process.env.REFRESH_TOKEN_SECRET as string,
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d',
      },
    },
  }),
);
