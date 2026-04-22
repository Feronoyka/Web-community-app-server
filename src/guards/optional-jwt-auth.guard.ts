import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

type JwtUser = {
  sub: string;
  email: string;
  nickname: string;
};

// Let unauthorizated users view other's community but cannot follow
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = JwtUser>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): TUser {
    void err;
    void info;
    void context;

    if (err || !user) return null as TUser;
    return user as TUser;
  }
}
