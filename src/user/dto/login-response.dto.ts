import { Expose } from 'class-transformer';

export class LoginResponseDto {
  constructor(private readonly partial?: Partial<LoginResponseDto>) {
    Object.assign(this, partial);
  }

  @Expose()
  accessToken?: string;

  @Expose()
  refreshToken?: string;

  @Expose()
  requires2FA?: boolean;

  @Expose()
  tempToken?: string;
}
