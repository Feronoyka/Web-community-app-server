import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { User } from '../../user/user.entity';

export class CommunityResponseDto {
  @IsString()
  id!: string;

  @IsString()
  @IsOptional()
  backgroundUrl?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  followerCount!: number;

  @IsArray()
  @IsOptional()
  members?: User[];

  isMember: boolean;
}
