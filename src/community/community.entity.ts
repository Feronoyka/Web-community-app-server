import { User } from '../user/user.entity';
import {
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Entity,
  RelationId,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity()
export class Community {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  description?: string;

  @Column({ type: 'int', default: 0 })
  followerCount: number;

  @ManyToMany(() => User, (user) => user.followedCommunities)
  @JoinTable({ name: 'community_members' })
  members: User[];

  @ManyToOne(() => User, (user) => user.ownedCommunities, { nullable: false })
  owner: User;

  @RelationId((community: Community) => community.owner)
  ownerId: string;
}
