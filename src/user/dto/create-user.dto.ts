import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Domain name should not be empty' })
  @IsString()
  @MinLength(3, { message: 'Domain name should be at least 3 characters long' })
  @MaxLength(30, { message: 'Domain name should not exceed 30 characters' })
  @Matches(/^[A-Za-z0-9]+$/, {
    message: 'Domain name can only contain letters and numbers',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  nickname!: string;

  @IsOptional()
  @IsString()
  @MinLength(3, {
    message: 'Username should be at least 3 characters long',
  })
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, _ and -',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  username?: string;

  @IsNotEmpty({ message: 'Email is empty' })
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&_])[A-Za-z\d@$!%*#?&_]+$/, {
    message:
      'Password must contain at least one Uppercase letter and one number and one special character',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  password!: string;
}
