import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestCommunity } from './model/test-community.model';
import { TestUser } from './model/test-user.model';
import { AuthClient, bearerAuth } from './utils/auth-client';
import { generateCommunity } from './utils/generate-community';
import { generateUser } from './utils/generate-user';
import { TestSetup } from './utils/test-setup';

describe('CommunityController (e2e)', () => {
  let setup: TestSetup;
  let auth: AuthClient;
  let owner: TestUser;
  let community: TestCommunity;
  let ownerToken: string;

  const createCommunity = async (
    token: string,
    payload: TestCommunity = community,
  ) => {
    const response = await request(setup.getHttpServer())
      .post('/communities/create')
      .set(bearerAuth(token))
      .send(payload)
      .expect(201);

    return response.body as {
      id: string;
      name: string;
      description: string;
    };
  };

  const createAuthenticatedUser = async () => {
    const user = generateUser();
    const { accessToken } = await auth.registerAndLogin(user);
    return { user, accessToken };
  };

  beforeAll(async () => {
    setup = await TestSetup.create(AppModule);
    auth = new AuthClient(setup);
  });

  beforeEach(async () => {
    owner = generateUser();
    community = generateCommunity();
    ownerToken = (await auth.registerAndLogin(owner)).accessToken;
  });

  afterEach(async () => {
    await setup.resetDatabase();
  });

  afterAll(async () => {
    await setup.close();
  });

  describe('POST /communities/create', () => {
    it('creates a community for the authenticated owner', async () => {
      const created = await createCommunity(ownerToken);

      expect(created.id).toBeDefined();
      expect(created.name).toBe(community.name);
      expect(created.description).toBe(community.description);
    });
  });

  describe('GET /communities', () => {
    it('returns a paginated list of communities', async () => {
      await createCommunity(ownerToken);

      const response = await request(setup.getHttpServer())
        .get('/communities')
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta.total).toBeGreaterThan(0);
    });
  });

  describe('GET /communities/:id', () => {
    it('returns one community by id', async () => {
      const created = await createCommunity(ownerToken);

      const response = await request(setup.getHttpServer())
        .get(`/communities/${created.id}`)
        .expect(200);

      expect(response.body.id).toBe(created.id);
      expect(response.body.name).toBe(created.name);
    });
  });

  describe('PATCH /communities/:id', () => {
    it('updates a community owned by the caller', async () => {
      const created = await createCommunity(ownerToken);
      const patch = { description: 'Updated community description' };

      const response = await request(setup.getHttpServer())
        .patch(`/communities/${created.id}`)
        .set(bearerAuth(ownerToken))
        .send(patch)
        .expect(200);

      expect(response.body.id).toBe(created.id);
      expect(response.body.description).toBe(patch.description);
    });

    it('returns 401 without a valid token', async () => {
      const created = await createCommunity(ownerToken);

      await request(setup.getHttpServer())
        .patch(`/communities/${created.id}`)
        .set(bearerAuth('invalid-token'))
        .send({ description: 'Should fail' })
        .expect(401);
    });
  });

  describe('POST /communities/:id/join', () => {
    it('lets another user join a community', async () => {
      const created = await createCommunity(ownerToken);
      const { accessToken: memberToken } = await createAuthenticatedUser();

      await request(setup.getHttpServer())
        .post(`/communities/${created.id}/join`)
        .set(bearerAuth(memberToken))
        .expect(201);
    });

    it('returns 409 when joining the same community twice', async () => {
      const created = await createCommunity(ownerToken);
      const { accessToken: memberToken } = await createAuthenticatedUser();

      await request(setup.getHttpServer())
        .post(`/communities/${created.id}/join`)
        .set(bearerAuth(memberToken))
        .expect(201);

      await request(setup.getHttpServer())
        .post(`/communities/${created.id}/join`)
        .set(bearerAuth(memberToken))
        .expect(409);
    });
  });

  describe('DELETE /communities/:id/leave', () => {
    it('lets a member leave a community', async () => {
      const created = await createCommunity(ownerToken);
      const { accessToken: memberToken } = await createAuthenticatedUser();

      await request(setup.getHttpServer())
        .post(`/communities/${created.id}/join`)
        .set(bearerAuth(memberToken))
        .expect(201);

      await request(setup.getHttpServer())
        .delete(`/communities/${created.id}/leave`)
        .set(bearerAuth(memberToken))
        .expect(200);
    });
  });

  describe('DELETE /communities/:id', () => {
    it('deletes a community owned by the caller', async () => {
      const created = await createCommunity(ownerToken);

      await request(setup.getHttpServer())
        .delete(`/communities/${created.id}`)
        .set(bearerAuth(ownerToken))
        .expect(200);
    });
  });
});
