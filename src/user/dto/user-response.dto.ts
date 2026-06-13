import { Expose } from 'class-transformer';
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
  followedCommunities?: Community[] | null;
}
