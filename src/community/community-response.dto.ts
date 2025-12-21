import { Expose, Type } from 'class-transformer';
import { MemberDto } from './member.dto';

export class CommunityResponseDto {
  @Expose()
  id?: string;

  @Expose()
  name: string;

  @Expose()
  isFollowed: boolean;

  @Expose()
  description?: string;

  @Expose()
  followerCount: number;

  @Expose()
  @Type(() => MemberDto)
  members: MemberDto[];
}
