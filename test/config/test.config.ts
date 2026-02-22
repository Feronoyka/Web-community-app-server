export const testConfig = {
  database: {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'xd62ix1o1f41ck',
    database: 'feno',
    synchronize: true,
  },

  // Must match AuthConfig shape: accessToken and refreshToken used by AuthService (and JwtStrategy uses jwt.secret).
  auth: {
    jwt: {
      secret: 'secret-123',
      accessToken: {
        secret: 'secret-123',
        expiresIn: '60', // seconds; used as number by auth.service
      },
      refreshToken: {
        secret: 'refresh-secret-123',
        expiresIn: '604800', // 7d in seconds
      },
    },
  },
};
