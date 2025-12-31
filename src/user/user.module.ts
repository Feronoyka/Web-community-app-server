import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PasswordService } from './password/password.service';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
// import { APP_GUARD } from '@nestjs/core';
import { OwnerGuard } from './owner.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthConfig } from 'src/config/auth.config';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const authConfig = config.get<AuthConfig>('auth');
        return {
          secret: authConfig?.jwt.secret,
          signOptions: {
            expiresIn: parseInt(authConfig?.jwt.expiresIn as string),
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
