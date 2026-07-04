import { User } from '../../user/user.entity';
import {
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Message } from './message.entity';

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToMany(() => User, (user) => user.conversations)
  @JoinTable()
  participants!: User[];

  @OneToMany(() => Message, (message) => message.conversation)
  messages!: Message[];

  @UpdateDateColumn()
  updatedAt!: Date;
}
