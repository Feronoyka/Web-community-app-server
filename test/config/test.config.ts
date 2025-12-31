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

  auth: {
    jwt: {
      secret: 'secret-123',
      expiresIn: '1m',
    },
  },
};
