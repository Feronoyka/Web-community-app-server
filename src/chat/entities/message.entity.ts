import { Community } from '../../community/community.entity';
import { User } from '../../user/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @ManyToOne(() => User, (user) => user.sentMessages)
  sender: User;

  @Column({ nullable: true })
  senderId?: string;

  @ManyToOne(() => Community, (community) => community.messages, {
    nullable: true,
  })
  community: Community;

  @Column({ nullable: true })
  communityId: string;

  @ManyToOne(() => User, (user) => user.receivedMessages, { nullable: true })
  receiver: User;

  @Column({ nullable: true })
  receiverId?: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages)
  conversation: Conversation;

  @Column({ nullable: true })
  conversationId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
