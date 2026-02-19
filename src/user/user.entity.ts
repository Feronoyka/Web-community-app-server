import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pronouns } from './enum/pronouns.enum';
import { Exclude } from 'class-transformer';
import { Community } from '../community/community.entity';
import { Message } from '../chat/entities/message.entity';
import { Conversation } from '../chat/entities/conversation.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, nullable: false, unique: true })
  domainName!: string;

  @Column({ type: 'varchar', length: 100, select: false })
  @Exclude()
  password!: string;

  @Column({ nullable: false, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  username!: string;

  @Column({ type: 'enum', enum: Pronouns, nullable: true })
  pronouns!: Pronouns | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  description!: string | null;

  @OneToMany(() => Community, (community) => community.owner)
  ownedCommunities!: Community[];

  @ManyToMany(() => Community, (community) => community.members)
  followedCommunities!: Community[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages!: Message[];

  @OneToMany(() => Message, (message) => message.receiver)
  receivedMessages!: Message[];

  @ManyToMany(() => Conversation, (conversation) => conversation.participants)
  conversation!: Conversation[];

  @CreateDateColumn()
  @Exclude()
  createdAt!: Date;

  @UpdateDateColumn()
  @Exclude()
  updatedAt!: Date;
}
