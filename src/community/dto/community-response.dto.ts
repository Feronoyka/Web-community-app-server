import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { User } from '../../user/user.entity';
import { Message } from 'src/chat/entities/message.entity';

export class CommunityResponseDto {
  @IsString()
  id!: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  membersCount?: number;

  @IsArray()
  @IsOptional()
  message: Message[];

  @IsArray()
  @IsOptional()
  members?: User[];

  isMember?: boolean;
}
