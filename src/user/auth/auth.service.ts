import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './../create-user.dto';
import { UserService } from '../user.service';
import { PasswordService } from '../password/password.service';
import { User } from '../user.entity';
import { AuthConfig } from 'src/config/auth.config';
import type { StringValue } from 'ms';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly configService: ConfigService,
  ) {}

  public async register(createUserDto: CreateUserDto) {
    const existingUser = await this.userService.findOneByEmailWithPassword(
      createUserDto.email,
    );

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.userService.create(createUserDto);
    return user;
  }

  public async login(email: string, plainPassword: string) {
    const user = await this.userService.findOneByEmailWithPassword(email);

    if (
      !user ||
      !(await this.passwordService.verify(plainPassword, user.password))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { accessToken, refreshToken };
  }

  public async refreshToken(refreshToken: string) {
    const authConfig = this.configService.get<AuthConfig>('auth');
    if (!authConfig?.jwt.refreshToken.secret) {
      throw new UnauthorizedException('Refresh token secret is not configured');
    }

    const payload = this.jwtService.verify<{
      sub: string;
      domainName: string;
      email: string;
    }>(refreshToken, { secret: authConfig.jwt.refreshToken.secret });

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findOneByIdEntity(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    return { accessToken, refreshToken: newRefreshToken };
  }

  public async deleteUser(userId: string) {
    return await this.userService.deleteUser(userId);
  }

  private generateAccessToken(user: User) {
    const authConfig = this.configService.get<AuthConfig>('auth');
    const payload = {
      sub: user.id,
      domainName: user.domainName,
      email: user.email,
    };
    if (!authConfig) {
      throw new UnauthorizedException('Auth configuration is not set');
    }

    const { secret, expiresIn } = authConfig.jwt.accessToken;

    return this.jwtService.sign(payload, {
      secret,
      expiresIn: this.toJwtExpiresIn(expiresIn),
    });
  }

  private generateRefreshToken(user: User) {
    const authConfig = this.configService.get<AuthConfig>('auth');
    const payload = {
      sub: user.id,
      domainName: user.domainName,
      email: user.email,
    };
    if (!authConfig) {
      throw new UnauthorizedException('Auth configuration is not set');
    }

    const { secret, expiresIn } = authConfig.jwt.refreshToken;

    return this.jwtService.sign(payload, {
      secret,
      expiresIn: this.toJwtExpiresIn(expiresIn),
    });
  }

  private toJwtExpiresIn(expiresIn: string | number): number | StringValue {
    if (typeof expiresIn === 'number') {
      return expiresIn;
    }

    if (/^\d+$/.test(expiresIn)) {
      return parseInt(expiresIn, 10);
    }

    return expiresIn as StringValue;
  }
}
