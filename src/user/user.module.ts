import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PasswordService } from './password/password.service';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { OwnerGuard } from '../guards/owner.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthConfig } from 'src/config/auth.config';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
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
  ],
  controllers: [UserController, AuthController],
})
export class UserModule {}
