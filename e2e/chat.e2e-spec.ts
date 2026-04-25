/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { TestSetup } from './utils/test-setup';
import { generateUser } from './utils/generate-user';
import { TestUser } from './model/test-user.model';
import { TestCommunity } from './model/test-community.model';
import { generateCommunity } from './utils/generate-community';

describe('ChatGateway (e2e)', () => {
  let testSetup: TestSetup;
  let firstTestUser: TestUser;
  let secondTestUser: TestUser;
  let testCommunity: TestCommunity;
  let clientSocket: Socket;
  let secondClientSocket: Socket;
  let firstUsertoken: string;
  let secondUsertoken: string;
  let userId: string;
  let communityId: string;
  let server: any;
  let port: number;

  const register = (user: TestUser) =>
    request(testSetup.app.getHttpServer()).post('/auth/register').send(user);

  const loginAndVerify2FA = async (user: TestUser) => {
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

    return verifyRes.body.accessToken as string;
  };

  const registerAndVerify2FA = async (user: TestUser) => {
    await register(user).expect(201);
    return await loginAndVerify2FA(user);
  };

  beforeAll(async () => {
    testSetup = await TestSetup.create(AppModule);
    firstTestUser = generateUser();
    secondTestUser = generateUser();
    testCommunity = generateCommunity();

    firstUsertoken = await registerAndVerify2FA(firstTestUser);
    console.log(`First user token: ${firstUsertoken}`);

    const secondUserRes = await register(secondTestUser).expect(201);
    secondUsertoken = await loginAndVerify2FA(secondTestUser);
    userId = secondUserRes.body.id;

    const community = await request(testSetup.app.getHttpServer())
      .post('/communities')
      .set('Authorization', `Bearer ${firstUsertoken}`)
      .send(testCommunity)
      .expect(201);

    communityId = community.body.id;

    server = await testSetup.app.listen(0);

    port = server.address().port;
    console.log(`Test server listening on port ${port}`);
  });

  afterEach(() => {
    if (clientSocket?.connected) clientSocket.disconnect();
    if (secondClientSocket?.connected) secondClientSocket.disconnect();
  });

  afterAll(async () => {
    if (server) await server.close();
    await testSetup.teardown();
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

    const privateMessageReceived = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Timed out waiting for newPrivateMessage')),
        8000,
      );
      secondClientSocket.on('newPrivateMessage', (message) => {
        clearTimeout(timeout);
        resolve(message);
      });
    });

    clientSocket.emit('messageToPrivate', {
      receiverId: userId,
      content: 'Hello Private Message',
    });

    const message: any = await privateMessageReceived;
    expect(message.content).toBe('Hello Private Message');
  }, 15000);
});
