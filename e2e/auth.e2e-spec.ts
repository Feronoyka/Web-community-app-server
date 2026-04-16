/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestUser } from './model/test-user.model';
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
        expect(res.body.nickname).toBe(testUser.nickname);
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

    const loginResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const token = loginResponse.body.accessToken;

    return await request(testSetup.app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.nickname).toBe(testUser.nickname);
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

  it('Login out succesfully - POST /auth/logout/:id', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const loginResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const token = loginResponse.body.accessToken;

    return await request(testSetup.app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('Delete own user account - DELETE /auth/account', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const loginResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const token = loginResponse.body.accessToken;

    return await request(testSetup.app.getHttpServer())
      .delete('/auth/account')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });
});
