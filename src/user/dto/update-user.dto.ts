import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Pronouns } from '../enum/pronouns.enum';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  username?: string;

  @IsOptional()
  @IsEnum(Pronouns)
  pronouns?: Pronouns;

  @IsOptional()
  @IsString()
  @MaxLength(650)
  description?: string | null;
}
