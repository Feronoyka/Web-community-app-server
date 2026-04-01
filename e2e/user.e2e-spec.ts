/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import request from 'supertest';
import { generateUser } from './utils/generate-user';
import { TestUser } from './model/test-user.model';
import { TestSetup } from './utils/test-setup';
import { AppModule } from '../src/app.module';

describe('UserController (e2e)', () => {
  let testSetup: TestSetup;
  let testUser: TestUser;

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);
    testUser = generateUser();
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  it('Get all users successfully- GET /users', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    return await request(testSetup.app.getHttpServer())
      .get('/user')
      .expect(200);
  });

  it('Get the specific user with search successfully - GET /user?search=username OR domainName', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    return await request(testSetup.app.getHttpServer())
      .get('/user?search=alish')
      .expect(200);
  });

  it('Get the specific user by id successfully - GET /user/:id', async () => {
    const res = await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const userId = res.body.id;

    return await request(testSetup.app.getHttpServer())
      .get(`/user/${userId}`)
      .expect(200);
  });

  it('Get the specific user by id failure - GET /user/:id', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    return await request(testSetup.app.getHttpServer())
      .get('/user/43f18951-2c9b-4e31-b51d-557dc8611ff4')
      .expect(404);
  });

  it('Updating successfully own public profile - PATCH /user/:id', async () => {
    const res = await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const userId = res.body.id;

    return await request(testSetup.app.getHttpServer()).patch(
      `/user/${userId}`,
    );
  });
});
