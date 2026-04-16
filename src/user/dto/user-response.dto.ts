import { Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id!: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  nickname!: string;

  @Expose()
  username!: string;

  @Expose()
  pronouns!: string | null;

  @Expose()
  description!: string | null;
}
