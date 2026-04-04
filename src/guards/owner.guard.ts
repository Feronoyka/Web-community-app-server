import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

interface RequestType {
  user: {
    sub: string;
  };
  params: {
    id: string;
  };
  body: {
    id: string;
  };
}

@Injectable()
export class OwnerGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<RequestType>();
    const jwtSub = req.user?.sub;
    if (!jwtSub) throw new UnauthorizedException();

    const targetId = req.params?.id ?? req.body?.id;
    if (!targetId) throw new ForbiddenException('Missing resource identifier');

    if (jwtSub !== targetId)
      throw new ForbiddenException('Only owner can perform this action');
    return true;
  }
}
