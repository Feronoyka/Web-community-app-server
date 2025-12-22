import { IsOptional, IsString, MinLength, IsIn, IsEnum } from 'class-validator';

export class FindCommunityQueryParams {
  @IsOptional()
  @MinLength(3)
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['followerCount'])
  sortBy?: string = 'followerCount';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
