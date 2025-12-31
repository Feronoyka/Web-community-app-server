import { Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  domainName: string;

  @Expose()
  pronouns: string | null;

  @Expose()
  description: string | null;
}
