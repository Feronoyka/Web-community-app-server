import { JwtService } from '@nestjs/jwt';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ResetTokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const resetToken = request.cookies?.['resetToken'] as string;

    if (!resetToken) {
      throw new UnauthorizedException('Reset token mmissing');
    }

    try {
      const payload: { purpose: string } = this.jwtService.verify(resetToken);

      if (payload.purpose !== 'password_reset') {
        throw new UnauthorizedException('Invalid token purpose');
      }

      request['resetUser'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }
}
