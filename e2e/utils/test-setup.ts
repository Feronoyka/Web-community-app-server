import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { testConfig } from '../config/test.config';
import { MailService } from '../../src/user/services/mail/mail.service';
import cookieParser from 'cookie-parser';

export class TestSetup {
  app: INestApplication;
  dataSource: DataSource;
  sentOtps = new Map<string, string>();

  static async create(module: any) {
    const instance = new TestSetup();
    await instance.init(module);
    return instance;
  }

  private async init(module: any) {
    const sentOtps = this.sentOtps;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [module],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string, defaultValue?: any) => {
          const k = (key ?? '').toLowerCase();
          if (k.includes('database')) return testConfig.database;
          if (k.includes('auth')) return testConfig.auth;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return defaultValue;
        },
      })
      .overrideProvider(MailService)
      .useValue({
        sendOtp: (email: string, otp: string) => {
          sentOtps.set(email, otp);
          return Promise.resolve();
        },
      })
      .compile();

    this.app = moduleFixture.createNestApplication();
    this.app.use(cookieParser());
    this.app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    this.dataSource = moduleFixture.get(DataSource);
    await this.app.init();
  }

  async cleanup() {
    const entities = this.dataSource.entityMetadatas;
    const tableNames = entities
      .map((entity) => `"${entity.tableName}"`)
      .join(', ');
    await this.dataSource.query(
      `TRUNCATE ${tableNames} RESTART IDENTITY CASCADE;`,
    );
  }

  async teardown() {
    await this.dataSource.destroy(); // Close database connection
    await this.app.close(); // Shut down NestJS app
  }
}
