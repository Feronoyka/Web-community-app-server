import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

type SocketData = {
  userId?: string;
};

type AuthedSocket = Socket<any, any, any, SocketData> & {
  handshake: Socket['handshake'] & {
    auth: {
      token?: string;
    };
  };
};

type JwtPayload = {
  sub: string;
};

@WebSocketGateway({
  cors: '*',
  methods: ['GET', 'POST'],
  credentials: true,
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    try {
      const token = client.handshake.auth.token?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      client.data.userId = payload.sub;

      await client.join(payload.sub);
      console.log(`Connected: ${client.data.userId}`);
    } catch (err) {
      console.log(err, 'Diconnected');
      client.disconnect();
    }
  }

  @SubscribeMessage('joinCommunity')
  async handleJoinCommunity(client: Socket, communityId: string) {
    await client.join(`community_${communityId}`);
  }

  @SubscribeMessage('messageToCommunity')
  async handleMessageToCommunity(
    client: Socket<any, any, any, SocketData>,
    data: { communityId: string; content: string },
  ) {
    const senderId = client.data.userId;
    if (!senderId) return;

    const message = await this.chatService.saveMessage(senderId, data.content, {
      communityId: data.communityId,
    });

    this.server.to(`community_${data.communityId}`).emit('newMessage', message);
  }

  @SubscribeMessage('messageToPrivate')
  async handleMessageToPrivate(
    client: Socket<any, any, any, SocketData>,
    data: { receiverId: string; content: string },
  ) {
    const senderId = client.data.userId;
    if (!senderId) return;

    const conversation = await this.chatService.getOrCreateConversation(
      senderId,
      data.receiverId,
    );

    const message = await this.chatService.saveMessage(senderId, data.content, {
      conversationId: conversation.id,
    });

    this.server
      .to(senderId)
      .to(data.receiverId)
      .emit('newPrivateMessage', message);
  }
}
