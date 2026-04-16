import { registerAs } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

export const typeOrmConfig = registerAs(
  'database',
  (): TypeOrmModule => ({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: process.env.DB_SYNC === '1',
    // ssl: {
    //   rejectUnauthorized: false,
    // },
  }),
);
