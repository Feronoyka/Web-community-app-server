/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestUser } from './test-user.model';
import { TestSetup } from './utils/test-setup';
import { generateUser } from './utils/generate-user';

describe('AuthController (e2e)', () => {
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

  it('Register - POST /auth/register', async () => {
    return await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201)
      .expect((res) => {
        expect(res.body.email).toBe(testUser.email);
        expect(res.body.domainName).toBe(testUser.domainName);
        expect(res.body).not.toHaveProperty('password');
      });
  });

  it('Login - POST /auth/login', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const response = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toBeDefined();
  });

  it('Register - POST duplicated email /auth/login', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    return await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(409);
  });

  it('Get own profile - GET /auth/profile', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const response = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const token = response.body.accessToken;

    return await request(testSetup.app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.domainName).toBe(testUser.domainName);
        expect(res.body.username).toBe(testUser.username);
        expect(res.body.pronouns).toBeNull();
        expect(res.body.description).toBeNull();
      });
  });

  it('Get own profile faiure - GET /auth/profile', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    await request(testSetup.app.getHttpServer()).post('/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    return await request(testSetup.app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', 'Bearer xxx')
      .expect(401);
  });
});
