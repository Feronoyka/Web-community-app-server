import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommunityDto {
  @IsNotEmpty({ message: 'The name is required' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  name: string;

  @IsString()
  @MaxLength(300)
  description?: string;
}
