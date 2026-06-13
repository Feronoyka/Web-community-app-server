import { Message } from '../chat/entities/message.entity';
import { User } from '../user/user.entity';
import {
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Entity,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm';

@Entity()
export class Community {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  backgroundUrl?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ type: 'varchar', length: 30, unique: true, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  description?: string;

  @Column({ type: 'int', default: 1 })
  followerCount!: number;

  @ManyToMany(() => User, (user) => user.followedCommunities, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  members!: User[];

  @OneToMany(() => Message, (message) => message.community)
  messages!: Message[];

  isMember: boolean;

  @ManyToOne(() => User, (user) => user.ownedCommunities, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  owner!: User;

  @Column()
  ownerId!: string;
}
