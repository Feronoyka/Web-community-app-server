import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UserService } from '../../user.service';
import { PasswordService } from '../password/password.service';
import { User } from '../../user.entity';
import { AuthConfig } from '../../../config/auth.config';
import type { StringValue } from 'ms';
import { LoginResponseDto } from '../../dto/login-response.dto';
import { OtpService } from '../otp/otp.service';
import { OtpPurpose } from '../../enum/otpPurpose.enum';
import { MailService } from '../mail/mail.service';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  public async login(
    email: string,
    plainPassword: string,
    deviceToken?: string,
  ): Promise<LoginResponseDto> {
    const user = await this.userService.findOneByEmailWithPassword(email);

    if (
      !user ||
      !(await this.passwordService.verify(plainPassword, user.password))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);

    const isTrusted = deviceToken && user.trustedDevices?.includes(deviceToken);

    if (isTrusted) {
      // for trusted device user
      return { requires2FA: false, accessToken, refreshToken };
    }

    // for untrusted device
    const otp = await this.otpService.createOtp(user.id, OtpPurpose.TWO_FA);
    await this.mailService.sendOtp(user.email, otp, '2fa');

    const tempToken = this.generateTempToken(user.id, '2fa');

    return { requires2FA: true, tempToken };
  }

  public async verify2FA(userId: string, otp: string, trustDevice: boolean) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) return null;

    await this.otpService.verifyOtp(user.id, otp, OtpPurpose.TWO_FA);

    const { accessToken, refreshToken } = this.generateTokens(user);

    let deviceToken: string | null = null;

    if (trustDevice) {
      deviceToken = this.generateDeviceToken();
      await this.userRepository.update(user.id, {
        trustedDevices: [...(user?.trustedDevices ?? []), deviceToken],
      });
    }

    return { accessToken, refreshToken, deviceToken };
  }

  public async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return { message: 'The code was sent to this email' };
    }

    const otp = await this.otpService.createOtp(
      user.id,
      OtpPurpose.PASSWORD_RESET,
    );
    await this.mailService.sendOtp(user.email, otp, 'password_reset');

    return { message: 'The code was sent to this email' };
  }

  public async verifyResetOtp(email: string, otp: string) {
    const user = await this.userRepository.findOneBy({ email });

    if (!user) throw new UnauthorizedException();

    await this.otpService.verifyOtp(user.id, otp, OtpPurpose.PASSWORD_RESET);

    return { resetToken: this.generateTempToken(user.id, 'password_reset') };
  }

  public async resetPassword(
    userId: string,
    password: string,
    confirmPassword: string,
  ) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) return null;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.userRepository.update(user.id, { password: hashedPassword });

    const { accessToken, refreshToken } = this.generateTokens(user);

    return { accessToken, refreshToken };
  }

  public async refreshToken(refreshToken: string) {
    const authConfig = this.configService.get<AuthConfig>('auth');
    if (!authConfig?.jwt.refreshToken.secret) {
      throw new UnauthorizedException('Refresh token secret is not configured');
    }

    const payload = this.jwtService.verify<{
      sub: string;
      nickname: string;
      email: string;
    }>(refreshToken, { secret: authConfig.jwt.refreshToken.secret });

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findOneByIdEntity(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      this.generateTokens(user);

    return { accessToken, refreshToken: newRefreshToken };
  }

  public async deleteUser(userId: string) {
    return await this.userService.deleteUser(userId);
  }

  private generateTokens(user: User) {
    const authConfig = this.configService.get<AuthConfig>('auth');
    const payload = {
      sub: user.id,
      nickname: user.nickname,
      email: user.email,
    };

    if (!authConfig) {
      throw new UnauthorizedException('Auth configuration is not set');
    }

    const { accessToken, refreshToken } = authConfig.jwt;

    const jwtAccessToken = this.jwtService.sign(payload, {
      secret: accessToken.secret,
      expiresIn: this.toJwtExpiresIn(accessToken.expiresIn),
    });

    const jwtRefreshToken = this.jwtService.sign(payload, {
      secret: refreshToken.secret,
      expiresIn: this.toJwtExpiresIn(refreshToken.expiresIn),
    });

    return { accessToken: jwtAccessToken, refreshToken: jwtRefreshToken };
  }

  private generateTempToken(userId: string, purpose: string) {
    return this.jwtService.sign({ sub: userId, purpose }, { expiresIn: '5m' });
  }

  private generateDeviceToken() {
    return crypto.randomUUID();
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
