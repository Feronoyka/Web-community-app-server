import { IsOptional, IsString, MinLength, IsIn } from 'class-validator';

export class FindCommunityQueryParams {
  @IsOptional()
  @MinLength(3)
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['followerCount'])
  sortBy?: string = 'followerCount';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
