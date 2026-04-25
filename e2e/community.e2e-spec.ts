/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestUser } from './model/test-user.model';
import { TestSetup } from './utils/test-setup';
import { generateUser } from './utils/generate-user';
import { generateCommunity } from './utils/generate-community';
import { TestCommunity } from './model/test-community.model';

describe('CommunityController (e2e) test', () => {
  let testSetup: TestSetup;
  let testUser: TestUser;
  let testCommunity: TestCommunity;
  let accessToken: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  const register = (user: TestUser) =>
    request(testSetup.app.getHttpServer()).post('/auth/register').send(user);

  const registerAndLogin = async (user: TestUser) => {
    await register(user).expect(201);

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

  const createUserAndToken = async () => {
    const user = generateUser();
    const token = await registerAndLogin(user);
    return { user, token };
  };

  const createCommunity = async (token: string, body: TestCommunity) => {
    const res = await request(testSetup.app.getHttpServer())
      .post('/communities')
      .set(auth(token))
      .send(body)
      .expect(201);

    return res.body as { id: string; name: string; description: string };
  };

  beforeAll(async () => {
    testSetup = await TestSetup.create(AppModule);
  });

  beforeEach(async () => {
    testUser = generateUser();
    testCommunity = generateCommunity();
    accessToken = await registerAndLogin(testUser);
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  it('Create the community successfully - POST /communities', async () => {
    const created = await createCommunity(accessToken, testCommunity);
    expect(created.id).toBeDefined();
    expect(created.name).toBe(testCommunity.name);
    expect(created.description).toBe(testCommunity.description);
  });

  it('Get all communities - GET /communities', async () => {
    await createCommunity(accessToken, testCommunity);

    const res = await request(testSetup.app.getHttpServer())
      .get('/communities')
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('Get one community by id - GET /communities/:id', async () => {
    const created = await createCommunity(accessToken, testCommunity);

    const res = await request(testSetup.app.getHttpServer())
      .get(`/communities/${created.id}`)
      .expect(200);

    expect(res.body.id).toBe(created.id);
    expect(res.body.name).toBe(created.name);
  });

  it('Update own community - PATCH /communities/:id', async () => {
    const created = await createCommunity(accessToken, testCommunity);

    const patch = { description: 'This is updated community' };

    const updatedRes = await request(testSetup.app.getHttpServer())
      .patch(`/communities/${created.id}`)
      .set(auth(accessToken))
      .send(patch)
      .expect(200);

    expect(updatedRes.body.id).toBe(created.id);
    expect(updatedRes.body.description).toBe(patch.description);
  });

  it('Should fail to update without valid token - PATCH /communities/:id', async () => {
    const created = await createCommunity(accessToken, testCommunity);

    return await request(testSetup.app.getHttpServer())
      .patch(`/communities/${created.id}`)
      .set('Authorization', 'Bearer xxx')
      .expect(401);
  });

  it('Follow a community - POST /communities/:id/follow', async () => {
    const created = await createCommunity(accessToken, testCommunity);
    const { token: anotherToken } = await createUserAndToken();

    return await request(testSetup.app.getHttpServer())
      .post(`/communities/${created.id}/follow`)
      .set(auth(anotherToken))
      .expect(201);
  });

  it('Should fail when following same community twice', async () => {
    const created = await createCommunity(accessToken, testCommunity);
    const { token: anotherToken } = await createUserAndToken();

    await request(testSetup.app.getHttpServer())
      .post(`/communities/${created.id}/follow`)
      .set(auth(anotherToken))
      .expect(201);

    return await request(testSetup.app.getHttpServer())
      .post(`/communities/${created.id}/follow`)
      .set(auth(anotherToken))
      .expect(409);
  });

  it('Unfollow a community - DELETE /communities/:id/unfollow', async () => {
    const created = await createCommunity(accessToken, testCommunity);
    const { token: anotherToken } = await createUserAndToken();

    await request(testSetup.app.getHttpServer())
      .post(`/communities/${created.id}/follow`)
      .set(auth(anotherToken))
      .expect(201);

    return await request(testSetup.app.getHttpServer())
      .delete(`/communities/${created.id}/unfollow`)
      .set(auth(anotherToken))
      .expect(200);
  });

  it('Delete own community - DELETE /communities/:id', async () => {
    const created = await createCommunity(accessToken, testCommunity);

    return await request(testSetup.app.getHttpServer())
      .delete(`/communities/${created.id}`)
      .set(auth(accessToken))
      .expect(200);
  });
});
