/* eslint-disable @typescript-eslint/no-unsafe-argument */
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { TestSetup } from './utils/test-setup';

describe('AppController (e2e)', () => {
  let testSetup: TestSetup;

  beforeAll(async () => {
    testSetup = await TestSetup.create(AppModule);
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  it('/ (GET)', () => {
    return request(testSetup.app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
