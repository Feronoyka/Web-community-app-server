import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestUser } from './model/test-user.model';
import { AuthClient, bearerAuth } from './utils/auth-client';
import { generateUser } from './utils/generate-user';
import { TestSetup } from './utils/test-setup';

describe('UserController (e2e)', () => {
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

  describe('GET /users', () => {
    it('returns all registered users', async () => {
      await auth.register(user).expect(201);

      const response = await request(setup.getHttpServer())
        .get('/users')
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta.total).toBeGreaterThan(0);
    });
  });

  describe('GET /users?search=', () => {
    it('finds users by username or nickname', async () => {
      await auth.register(user).expect(201);

      const response = await request(setup.getHttpServer())
        .get(`/users?search=${user.username}`)
        .expect(200);

      expect(response.body.data.some((item: TestUser) => item.id)).toBe(true);
      expect(
        response.body.data.some(
          (item: TestUser) =>
            item.username === user.username || item.nickname === user.nickname,
        ),
      ).toBe(true);
    });
  });

  describe('GET /users/:id', () => {
    it('returns a public profile for an existing user', async () => {
      const registerResponse = await auth.register(user).expect(201);
      const userId = registerResponse.body.id as string;

      const response = await request(setup.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200);

      expect(response.body.id).toBe(userId);
      expect(response.body.username).toBe(user.username);
      expect(response.body).not.toHaveProperty('password');
    });

    it('returns 404 for an unknown user id', async () => {
      await auth.register(user).expect(201);

      await request(setup.getHttpServer())
        .get('/users/43f18951-2c9b-4e31-b51d-557dc8611ff4')
        .expect(404);
    });
  });

  describe('PATCH /users/:id', () => {
    it('updates the authenticated user profile', async () => {
      const { accessToken, registerResponse } = await auth.registerAndLogin(user);
      const userId = registerResponse.body.id as string;
      const patch = { description: 'Updated public bio' };

      const response = await request(setup.getHttpServer())
        .patch(`/users/${userId}`)
        .set(bearerAuth(accessToken))
        .send(patch)
        .expect(200);

      expect(response.body.id).toBe(userId);
      expect(response.body.description).toBe(patch.description);
    });
  });
});
