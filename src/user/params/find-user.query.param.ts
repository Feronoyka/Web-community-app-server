import { IsOptional, IsString, MinLength } from 'class-validator';

export class FindUserQueryParams {
  @IsOptional()
  @MinLength(0)
  @IsString()
  search?: string;
}
