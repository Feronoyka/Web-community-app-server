/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: '*',
  methods: ['GET', 'POST'],
  credentials: true,
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token: string = client.handshake.auth.token?.split(' ')[1];
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;

      await client.join(client.data.userId as string);
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
    client: Socket,
    data: { communityId: string; content: string },
  ) {
    const senderId = client.data.userId as string;

    const message = await this.chatService.saveMessage(senderId, data.content, {
      communityId: data.communityId,
    });

    this.server.to(`community_${data.communityId}`).emit('newMessage', message);
  }

  @SubscribeMessage('messageToPrivate')
  async handleMessageToPrivate(
    client: Socket,
    data: { receiverId: string; content: string },
  ) {
    const senderId = client.data.userId as string;

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
