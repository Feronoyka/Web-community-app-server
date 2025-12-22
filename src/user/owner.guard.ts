import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class OwnerGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const req = ctx.switchToHttp().getRequest<any>();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const jwtSub = req.user?.sub as string;
    if (!jwtSub) throw new UnauthorizedException();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const targetId = req.params?.id ?? req.body?.id;
    if (!targetId) throw new ForbiddenException('Missing resource identifier');

    if (jwtSub !== targetId)
      throw new ForbiddenException('Only owner can perform this action');
    return true;
  }
}
