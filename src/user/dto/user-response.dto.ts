import { Expose } from 'class-transformer';
import { Conversation } from 'src/chat/entities/conversation.entity';
import { Community } from 'src/community/community.entity';

export class UserResponseDto {
  @Expose()
  id!: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  nickname!: string;

  @Expose()
  username!: string;

  @Expose()
  pronouns!: string | null;

  @Expose()
  description!: string | null;

  @Expose()
  email?: string | null;

  @Expose()
  ownedCommunities?: Community[] | null;

  @Expose()
  joinedCommunities?: Community[] | null;

  @Expose()
  conversations?: Conversation[] | null;
}
