import { Expose } from 'class-transformer';

export class MemberDto {
  @Expose()
  id: string;

  @Expose()
  username: string;
}
