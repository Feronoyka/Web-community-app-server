import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCommunityDto {
  @IsNotEmpty({ message: 'The name is required' })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name: string;

  @IsString()
  @MaxLength(650)
  description?: string;
}
