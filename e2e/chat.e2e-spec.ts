import request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { TestCommunity } from './model/test-community.model';
import { TestUser } from './model/test-user.model';
import { AuthClient, bearerAuth } from './utils/auth-client';
import { generateCommunity } from './utils/generate-community';
import { generateUser } from './utils/generate-user';
import { TestSetup } from './utils/test-setup';
import { AddressInfo } from 'net';
import * as http from 'http';

describe('ChatGateway (e2e)', () => {
  let setup: TestSetup;
  let auth: AuthClient;

  let firstUser: TestUser;
  let secondUser: TestUser;
  let community: TestCommunity;

  let firstUserToken: string;
  let secondUserToken: string;
  let secondUserId: string;
  let communityId: string;

  let httpServer: http.Server;
  let port: number;

  let clientSocket: Socket;
  let secondClientSocket: Socket;

  const connectSocket = (token: string): Promise<Socket> =>
    new Promise((resolve, reject) => {
      const socket = io(`http://localhost:${port}`, {
        auth: { token: `Bearer ${token}` },
      });

      socket.on('connect', () => resolve(socket));
      socket.on('connect_error', reject);
    });

  beforeAll(async () => {
    setup = await TestSetup.create(AppModule);
    auth = new AuthClient(setup);

    firstUser = generateUser();
    secondUser = generateUser();
    community = generateCommunity();

    firstUserToken = (await auth.registerAndLogin(firstUser)).accessToken;

    const secondRegisterResponse = await auth.register(secondUser).expect(201);
    secondUserId = secondRegisterResponse.body.id as string;
    secondUserToken = await auth.loginWith2FA(secondUser);

    const communityResponse = await request(setup.getHttpServer())
      .post('/communities/create')
      .set(bearerAuth(firstUserToken))
      .send(community)
      .expect(201);

    communityId = communityResponse.body.id as string;

    await setup.app.listen(0);
    httpServer = setup.app.getHttpServer();
    port = (httpServer.address() as AddressInfo).port;
  });

  afterEach(() => {
    clientSocket?.disconnect();
    secondClientSocket?.disconnect();
  });

  afterAll(async () => {
    if (httpServer) {
      await httpServer.close();
    }

    await setup.app.close();
  });

  describe('community chat', () => {
    it('broadcasts a message to joined community members', async () => {
      clientSocket = await connectSocket(firstUserToken);
      clientSocket.emit('joinCommunity', communityId);

      const messagePromise = new Promise<{
        content: string;
        communityId: string;
      }>((resolve) => {
        clientSocket.on('newMessage', resolve);
      });

      clientSocket.emit('messageToCommunity', {
        communityId,
        content: 'Hello Community',
      });

      const message = await messagePromise;

      expect(message.content).toBe('Hello Community');
      expect(message.communityId).toBe(communityId);
    });
  });

  describe('private chat', () => {
    it('delivers a private message to the receiver', async () => {
      clientSocket = await connectSocket(firstUserToken);
      secondClientSocket = await connectSocket(secondUserToken);

      const messagePromise = new Promise<{ content: string }>(
        (resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error('Timed out waiting for newPrivateMessage')),
            8000,
          );

          secondClientSocket.on('newPrivateMessage', (message) => {
            clearTimeout(timeout);
            resolve(message);
          });
        },
      );

      clientSocket.emit('messageToPrivate', {
        receiverId: secondUserId,
        content: 'Hello Private Message',
      });

      const message = await messagePromise;

      expect(message.content).toBe('Hello Private Message');
    }, 15000);
  });
});
