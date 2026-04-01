import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  // @IsNotEmpty()
  // @IsOptional()
  // @Transform(({ value }) =>
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  //   typeof value === 'string' ? value.trim() : value,
  // )
  // domainName?: string;

  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsNotEmpty({ message: 'Password should not be empty' })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  password!: string;
}
