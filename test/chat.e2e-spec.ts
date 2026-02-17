/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import request from 'supertest';
// import { INestApplication } from '@nestjs/common';
// import { Test } from '@nestjs/testing';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { TestSetup } from './utils/test-setup';
import { generateUser } from './utils/generate-user';
import { TestUser } from './model/test-user.model';
import { TestCommunity } from './model/test-community.model';
import { generateCommunity } from './utils/generate-community';

describe('ChatGateway (e2e)', () => {
  let testSetup: TestSetup;
  let testUser: TestUser;
  let testCommunity: TestCommunity;
  let clientSocket: Socket;
  let secondClientSocket: Socket;
  let firstUsertoken: string;
  let secondUsertoken: string;
  let userId: string;
  let communityId: string;
  let server: any;
  let port: number;

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);
    testUser = generateUser();
    testCommunity = generateCommunity();

    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    const firstUserRes = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(201);

    firstUsertoken = firstUserRes.body.accessToken;
    console.log(`First user token: ${firstUsertoken}`);

    const secondUser = {
      domainName: 'albertfgfd',
      username: 'Albert',
      email: 'test@example.com',
      password: 'Test1234',
    };

    const secondUserRes = await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(secondUser)
      .expect(201);

    const secondUserLoginRes = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: secondUser.email,
        password: secondUser.password,
      })
      .expect(201);

    secondUsertoken = secondUserLoginRes.body.accessToken;
    userId = secondUserRes.body.id;

    const community = await request(testSetup.app.getHttpServer())
      .post('/community')
      .set('Authorization', `Bearer ${firstUsertoken}`)
      .send(testCommunity)
      .expect(201);

    communityId = community.body.id;

    server = await testSetup.app.listen(0);

    port = server.address().port;
    console.log(`Test server listening on port ${port}`);
  });

  afterEach(async () => {
    if (clientSocket?.connected) clientSocket.disconnect();
    if (secondClientSocket?.connected) secondClientSocket.disconnect();
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await testSetup.teardown();
    await server.close();
  });

  it('should send and receive messages in community chat', async () => {
    clientSocket = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${firstUsertoken}` },
    });

    await new Promise<void>((resolve) => clientSocket.on('connect', resolve));

    clientSocket.emit('joinCommunity', communityId);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const messageReceived = new Promise((resolve) => {
      clientSocket.on('newMessage', (message) => resolve(message));
    });

    clientSocket.emit('messageToCommunity', {
      communityId,
      content: 'Hello Community',
    });

    const message: any = await messageReceived;
    expect(message.content).toBe('Hello Community');
    expect(message.communityId).toBe(communityId);
  });

  it('should send and receive private messages', async () => {
    clientSocket = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${firstUsertoken}` },
    });

    secondClientSocket = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${secondUsertoken}` },
    });

    await Promise.all([
      new Promise<void>((resolve) =>
        clientSocket.on('connect', () => resolve()),
      ),
      new Promise<void>((resolve) =>
        secondClientSocket.on('connect', () => resolve()),
      ),
    ]);

    const privateMessageReceived = new Promise((resolve) => {
      secondClientSocket.on('newPrivateMessage', (message) => resolve(message));
    });

    clientSocket.emit('messageToPrivate', {
      receiverId: userId,
      content: 'Hello Private Message',
    });

    const message: any = await privateMessageReceived;
    expect(message.content).toBe('Hello Private Message');
  });
});
