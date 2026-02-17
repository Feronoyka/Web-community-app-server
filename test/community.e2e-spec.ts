/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
  let token: string;

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);
    testUser = generateUser();
    testCommunity = generateCommunity();

    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const res = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    token = res.body.accessToken;
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  it('Create the community successfully - POST /community', async () => {
    return await request(testSetup.app.getHttpServer())
      .post('/community')
      .set('Authorization', `Bearer ${token}`)
      .send(testCommunity)
      .expect(201)
      .expect((res) => {
        expect(res.body.name).toBeDefined();
        expect(res.body.description).toBeDefined();
      });
  });

  it('Get all communities - GET /community', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/community')
      .set('Authorization', `Bearer ${token}`)
      .send(testCommunity);

    return await request(testSetup.app.getHttpServer())
      .get('/community')
      .expect(200);
  });

  it('Get one community by id succesfully - GET /community/:id', async () => {
    const res = await request(testSetup.app.getHttpServer())
      .post('/community')
      .set('Authorization', `Bearer ${token}`)
      .send(testCommunity);

    const communityId = res.body.id;

    return await request(testSetup.app.getHttpServer())
      .get(`/community/${communityId}`)
      .expect(200);
  });

  it('Change own community successfully- PATCH /community/:id', async () => {
    const res = await request(testSetup.app.getHttpServer())
      .post('/community')
      .set('Authorization', `Bearer ${token}`)
      .send(testCommunity);

    const communityId = res.body.id;

    const updateCommunity = {
      description: 'This is updated community',
    };

    const updatedRes = await request(testSetup.app.getHttpServer())
      .patch(`/community/${communityId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateCommunity)
      .expect(200);

    expect(updatedRes.body.description).toBe(updateCommunity.description);
  });

  it("Should failure to changing other's community", async () => {
    const res = await request(testSetup.app.getHttpServer())
      .post('/community')
      .set('Authorization', `Bearer ${token}`)
      .send(testCommunity);

    const communityId = res.body.id;

    return await request(testSetup.app.getHttpServer())
      .patch(`/community/${communityId}`)
      .set('Authorization', `Bearer xxx`)
      .expect(401);
  });

  it('follow to community succesfully - POST /community/:id/follow', async () => {
    const res = await request(testSetup.app.getHttpServer())
      .post('/community')
      .set('Authorization', `Bearer ${token}`)
      .send(testCommunity);

    const communityId = res.body.id;

    const anotherUser = {
      domainName: 'anotherdomain',
      username: 'anotheruser',
      email: 'another@test.com',
      password: 'Password123',
    };

    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(anotherUser)
      .expect(201);

    const loginRes = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: anotherUser.email, password: anotherUser.password })
      .expect(201);

    const anotherToken = loginRes.body.accessToken;

    return await request(testSetup.app.getHttpServer())
      .post(`/community/${communityId}/follow`)
      .set('Authorization', `Bearer ${anotherToken}`)
      .expect(201);
  });

  it('Should fail when following again to community', async () => {
    const res = await request(testSetup.app.getHttpServer())
      .post('/community')
      .set('Authorization', `Bearer ${token}`)
      .send(testCommunity);

    const communityId = res.body.id;

    const anotherUser = {
      domainName: 'anotherdomain',
      username: 'anotheruser',
      email: 'another@test.com',
      password: 'Password123',
    };

    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(anotherUser)
      .expect(201);

    const loginRes = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: anotherUser.email, password: anotherUser.password })
      .expect(201);

    const anotherToken = loginRes.body.accessToken;

    await request(testSetup.app.getHttpServer())
      .post(`/community/${communityId}/follow`)
      .set('Authorization', `Bearer ${anotherToken}`)
      .expect(201);

    return await request(testSetup.app.getHttpServer())
      .post(`/community/${communityId}/follow`)
      .set('Authorization', `Bearer ${anotherToken}`)
      .expect(409);
  });

  it('unfollow to community successfully - DELETE /community/:id/unfollow', async () => {
    const res = await request(testSetup.app.getHttpServer())
      .post('/community')
      .set('Authorization', `Bearer ${token}`)
      .send(testCommunity);

    const communityId = res.body.id;

    const anotherUser = {
      domainName: 'anotherdomain',
      username: 'anotheruser',
      email: 'another@test.com',
      password: 'Password123',
    };

    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(anotherUser)
      .expect(201);

    const loginRes = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: anotherUser.email, password: anotherUser.password })
      .expect(201);

    const anotherToken = loginRes.body.accessToken;

    await request(testSetup.app.getHttpServer())
      .post(`/community/${communityId}/follow`)
      .set('Authorization', `Bearer ${anotherToken}`)
      .expect(201);

    return await request(testSetup.app.getHttpServer())
      .delete(`/community/${communityId}/unfollow`)
      .set('Authorization', `Bearer ${anotherToken}`)
      .expect(200);
  });

  it('Delete own community successfully - DELETE /community/:id', async () => {
    const res = await request(testSetup.app.getHttpServer())
      .post('/community')
      .set('Authorization', `Bearer ${token}`)
      .send(testCommunity);

    const communityId = res.body.id;

    return await request(testSetup.app.getHttpServer())
      .delete(`/community/${communityId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
