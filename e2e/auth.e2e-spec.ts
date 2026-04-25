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

  const register = (user: TestUser) =>
    request(testSetup.app.getHttpServer()).post('/auth/register').send(user);

  const login = (user: TestUser) =>
    request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: user.password });

  const registerAndLogin = async (user: TestUser) => {
    await register(user).expect(201);

    // Login now requires 2FA for first-time/untrusted devices.
    // We keep cookies using a supertest agent so `/auth/verify-2fa` can read `tempToken`.
    const agent = request.agent(testSetup.app.getHttpServer());

    const loginRes = await agent
      .post('/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(201);

    expect(loginRes.body.requires2FA).toBe(true);

    const otp = testSetup.sentOtps.get(user.email);
    expect(otp).toBeDefined();

    const verifyRes = await agent
      .post('/auth/verify-2fa')
      .send({ otp, trustDevice: false, purpose: '2fa' })
      .expect(201);

    expect(verifyRes.body.accessToken).toBeDefined();
    return verifyRes.body.accessToken as string;
  };

  beforeAll(async () => {
    testSetup = await TestSetup.create(AppModule);
  });

  beforeEach(() => {
    testUser = generateUser();
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  it('Register - POST /auth/register', async () => {
    return await register(testUser)
      .expect(201)
      .expect((res) => {
        expect(res.body.email).toBe(testUser.email);
        expect(res.body.nickname).toBe(testUser.nickname);
        expect(res.body).not.toHaveProperty('password');
      });
  });

  it('Login - POST /auth/login', async () => {
    await register(testUser).expect(201);

    const response = await login(testUser).expect(201);
    expect(response.body.requires2FA).toBe(true);
  });

  it('Register duplicate email - POST /auth/register', async () => {
    await register(testUser).expect(201);

    return await register(testUser).expect(409);
  });

  it('Get own profile - GET /auth/profile', async () => {
    const token = await registerAndLogin(testUser);

    return await request(testSetup.app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        // Keep assertions stable: only check fields we control.
        expect(res.body.nickname).toBe(testUser.nickname);
        expect(res.body.username).toBe(testUser.username);
        expect(res.body).not.toHaveProperty('password');
      });
  });

  it('Get own profile without valid token - GET /auth/profile', async () => {
    await register(testUser).expect(201);
    await login(testUser).expect(201);

    return await request(testSetup.app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', 'Bearer xxx')
      .expect(401);
  });

  it('Logout - POST /auth/logout', async () => {
    const token = await registerAndLogin(testUser);

    return await request(testSetup.app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('Delete own user account - DELETE /auth/account', async () => {
    const token = await registerAndLogin(testUser);

    return await request(testSetup.app.getHttpServer())
      .delete('/auth/account')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });
});
