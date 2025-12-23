import { Expose } from 'class-transformer';
import { MemberPreviewDto } from './member-preview.dto';

export class CommunityResponseDto {
  @Expose()
  id?: string;

  @Expose()
  name: string;

  @Expose()
  isFollowed?: boolean;

  @Expose()
  description?: string;

  @Expose()
  followerCount: number;

  @Expose()
  members: MemberPreviewDto[] = [];

  constructor(partial: Partial<CommunityResponseDto>) {
    Object.assign(this, partial);
  }
}
