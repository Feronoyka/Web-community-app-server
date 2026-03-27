import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message) private messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
  ) {}

  async getOrCreateConversation(senderId: string, receiverId: string) {
    let conversation = await this.conversationRepository
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participants', 'user')
      .where('user.id = :senderUserId AND user.id = :receiverUserId', {
        senderUserId: senderId,
        receiverUserId: receiverId,
      })
      .getOne();

    if (!conversation) {
      conversation = this.conversationRepository.create({
        participants: [{ id: senderId }, { id: receiverId }],
      });
      await this.conversationRepository.save(conversation);
    }

    return conversation;
  }

  async saveMessage(
    senderId: string,
    content: string,
    target: { communityId?: string; conversationId?: string },
  ) {
    const message = this.messageRepository.create({
      content,
      senderId,
      communityId: target.communityId,
      conversationId: target.conversationId,
    });

    return await this.messageRepository.save(message);
  }
}
