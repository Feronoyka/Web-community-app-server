import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestUser } from './model/test-user.model';
import { AuthClient, bearerAuth } from './utils/auth-client';
import { generateUser } from './utils/generate-user';
import { TestSetup } from './utils/test-setup';

describe('AuthController (e2e)', () => {
  let setup: TestSetup;
  let auth: AuthClient;
  let user: TestUser;

  beforeAll(async () => {
    setup = await TestSetup.create(AppModule);
    auth = new AuthClient(setup);
  });

  beforeEach(() => {
    user = generateUser();
  });

  afterEach(async () => {
    await setup.resetDatabase();
  });

  afterAll(async () => {
    await setup.close();
  });

  describe('POST /auth/register', () => {
    it('creates a user and returns auth tokens', async () => {
      const response = await auth.register(user).expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body).not.toHaveProperty('password');
    });

    it('rejects duplicate email with 409', async () => {
      await auth.register(user).expect(201);

      await auth.register(user).expect(409);
    });
  });

  describe('POST /auth/login', () => {
    it('requires 2FA for a new device', async () => {
      await auth.register(user).expect(201);

      const response = await auth.login(user).expect(201);

      expect(response.body.requires2FA).toBe(true);
      expect(setup.sentOtps.get(user.email)).toBeDefined();
    });
  });

  describe('GET /auth/profile', () => {
    it('returns the authenticated user profile', async () => {
      const { accessToken } = await auth.registerAndLogin(user);

      const response = await request(setup.getHttpServer())
        .get('/auth/profile')
        .set(bearerAuth(accessToken))
        .expect(200);

      expect(response.body.nickname).toBe(user.nickname);
      expect(response.body.username).toBe(user.username);
      expect(response.body.email).toBe(user.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('returns 401 when the token is invalid', async () => {
      await auth.register(user).expect(201);

      await request(setup.getHttpServer())
        .get('/auth/profile')
        .set(bearerAuth('invalid-token'))
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('clears the refresh cookie and returns success', async () => {
      const { accessToken } = await auth.registerAndLogin(user);

      const response = await request(setup.getHttpServer())
        .post('/auth/logout')
        .set(bearerAuth(accessToken))
        .expect(200);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('DELETE /auth/account', () => {
    it('deletes the authenticated account', async () => {
      const { accessToken } = await auth.registerAndLogin(user);

      await request(setup.getHttpServer())
        .delete('/auth/account')
        .set(bearerAuth(accessToken))
        .expect(204);
    });
  });
});
