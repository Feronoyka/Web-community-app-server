import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthConfig } from 'src/config/auth.config';

interface PayloadType {
  sub: string;
  email: string;
  nickname: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const authConfig = configService.get<AuthConfig>('auth');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfig?.jwt.accessToken.secret as string,
    });
  }

  validate(payload: PayloadType) {
    return {
      sub: payload.sub,
      email: payload.email,
      nickname: payload.nickname,
    };
  }
}
