import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, CanActivate } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import cookieParser from 'cookie-parser';
import { testConfig } from '../config/test.config';
import { MailService } from '../../src/user/services/mail/mail.service';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Boots a real Nest application against the test database.
 *
 * Lifecycle per spec file:
 *   beforeAll  -> TestSetup.create(AppModule)
 *   afterEach  -> testSetup.resetDatabase()
 *   afterAll   -> testSetup.close()
 */

export class TestSetup {
  app!: INestApplication;
  dataSource!: DataSource;

  /** OTP codes captured from the mocked MailService, keyed by email. */
  readonly sentOtps = new Map<string, string>();

  static async create(appModule: unknown): Promise<TestSetup> {
    const setup = new TestSetup();
    await setup.init(appModule);
    return setup;
  }

  getHttpServer() {
    return this.app.getHttpServer();
  }

  /** Wipes every table between tests so cases stay isolated. */
  async resetDatabase(): Promise<void> {
    this.sentOtps.clear();

    const tableNames = this.dataSource.entityMetadatas
      .map((entity) => `"${entity.tableName}"`)
      .join(', ');

    if (!tableNames) return;

    await this.dataSource.query(
      `TRUNCATE ${tableNames} RESTART IDENTITY CASCADE;`,
    );
  }

  /** Closes DB connections and shuts down the Nest app. */
  async close(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
    }

    if (this.app) {
      await this.app.close();
    }
  }

  private async init(appModule: unknown): Promise<void> {
    const sentOtps = this.sentOtps;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [appModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: <T = unknown>(key: string, defaultValue?: T): T => {
          switch (key) {
            case 'database':
              return testConfig.database as T;
            case 'auth':
              return testConfig.auth as T;
            case 'hash':
              return testConfig.hash as T;
            default:
              return defaultValue as T;
          }
        },
      })
      .overrideProvider(MailService)
      .useValue({
        sendOtp: (email: string, otp: string) => {
          sentOtps.set(email, otp);
          return Promise.resolve();
        },
      })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
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
}
