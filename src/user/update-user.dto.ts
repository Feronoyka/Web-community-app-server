import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Pronouns } from './enum/pronouns.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  username?: string;

  @IsOptional()
  pronouns?: Pronouns;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string | null;
}
