/* eslint-disable @typescript-eslint/no-unsafe-return */
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
  @IsNotEmpty({
    message: 'Domain name should not be empty',
  })
  @IsString()
  @MinLength(6, {
    message: 'Domain name should be at least 6 characters long',
  })
  @MaxLength(16, {
    message: 'Domain name should not exceed 16 characters',
  })
  @Matches(/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])$/, {
    message:
      'Domain must use letters/numbers, hyphens allowed but not at start/end',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  domainName!: string; // domain name

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'Symbols are not valid',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  username?: string; // username

  @IsNotEmpty({
    message: 'Email is empty',
  })
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string; // email

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/, {
    message:
      'Password must be at least 6 characters long and contain at least one letter and one number.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  password!: string; // password
}
