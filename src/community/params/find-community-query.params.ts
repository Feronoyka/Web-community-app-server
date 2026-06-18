import { IsOptional, IsString, MinLength, IsIn, IsEnum } from 'class-validator';

export class FindCommunityQueryParams {
  @IsOptional()
  @MinLength(0)
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['name', 'createdAt'])
  sortBy?: string = 'name';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
