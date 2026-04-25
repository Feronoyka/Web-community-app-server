import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PasswordService } from './services/password/password.service';
import { AuthService } from './services/auth/auth.service';
import { AuthController } from './services/auth/auth.controller';
import { OwnerGuard } from '../guards/owner.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthConfig } from '../config/auth.config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OtpService } from './services/otp/otp.service';
import { MailService } from './services/mail/mail.service';
import { Otp } from './services/otp/otp.entity';
import { ResetTokenGuard } from '../guards/reset-token.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Otp]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const authConfig = configService.get<AuthConfig>('auth');
        return {
          secret: authConfig?.jwt.accessToken.secret,
          signOptions: {
            expiresIn: parseInt(
              authConfig?.jwt.accessToken.expiresIn as string,
            ),
          },
        };
      },
    }),
  ],
  providers: [
    UserService,
    PasswordService,
    AuthService,
    OwnerGuard,
    JwtStrategy,
    OtpService,
    MailService,
    ResetTokenGuard,
  ],
  controllers: [UserController, AuthController],
})
export class UserModule {}
