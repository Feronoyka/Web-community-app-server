import { UserService } from '../../user.service';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
  Request,
  Res,
  SerializeOptions,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../../dto/create-user.dto';
import { LoginDto } from '../../dto/login.dto';
import { LoginResponseDto } from '../../dto/login-response.dto';
import { type AuthRequest } from './auth.request';
import type { Request as ExpressRequest, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { VerifyOtpDto } from '../../dto/verify-otp.dto';
import { VerifyOtpResponseDto } from '../../dto/verify-otp-response.dto';
import { ForgotPasswordDto } from '../../dto/forgot-password.dto';
import { ResetTokenGuard } from '../../../guards/reset-token.guard';
import { ResetConfirmDto } from '../../dto/reset-confirm.dto';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ strategy: 'exposeAll' })
export class AuthController {
  private static readonly COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/auth',
  };
  private static readonly REFRESH_COOKIE_NAME = 'refreshToken';
  private static readonly EXPIRES = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  public async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.register(createUserDto);
    return user;
  }

  @Post('login')
  public async login(
    @Body() loginDto: LoginDto,
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseDto> {
    const deviceToken = request.cookies?.['deviceToken'] as string;

    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
      deviceToken,
    );

    if (!result.requires2FA) {
      response.cookie(AuthController.REFRESH_COOKIE_NAME, result.refreshToken, {
        ...AuthController.COOKIE_OPTIONS,
        maxAge: AuthController.EXPIRES,
      });

      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    }

    response.cookie('tempToken', result.tempToken, {
      ...AuthController.COOKIE_OPTIONS,
      maxAge: 10 * 60 * 1000, // 1 minute
    });
    return new LoginResponseDto({
      requires2FA: true,
    });
  }

  @Post('verify-2fa')
  public async verify2FA(
    @Body() body: VerifyOtpDto,
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<VerifyOtpResponseDto> {
    const tempToken = request.cookies?.['tempToken'] as string;
    if (!tempToken) throw new UnauthorizedException('Session expired');

    const payload: { purpose: string; sub: string } =
      await this.jwtService.verify(tempToken);

    if (payload.purpose !== '2fa') throw new UnauthorizedException();

    const result = await this.authService.verify2FA(
      payload.sub,
      body.otp,
      body.trustDevice!,
    );

    response.clearCookie('tempToken');

    response.cookie(AuthController.REFRESH_COOKIE_NAME, result?.refreshToken, {
      ...AuthController.COOKIE_OPTIONS,
      maxAge: AuthController.EXPIRES,
    });

    if (result?.deviceToken) {
      response.cookie('deviceToken', result.deviceToken, {
        ...AuthController.COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return {
      accessToken: result?.accessToken,
      refreshToken: result?.refreshToken,
    };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('verify-reset-otp')
  async verifyResetOtp(
    @Body() body: { email: string; otp: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const { resetToken } = await this.authService.verifyResetOtp(
      body.email,
      body.otp,
    );

    response.cookie('resetToken', resetToken, {
      ...AuthController.COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutes,
    });

    return { message: 'OTP verified' };
  }

  @Post('reset-confirm')
  @UseGuards(ResetTokenGuard)
  async resetConfirm(
    @Body() resetConfirmDto: ResetConfirmDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { sub: userId } = request['resetUser'] as { sub: string };

    const result = await this.authService.resetPassword(
      userId,
      resetConfirmDto.password,
      resetConfirmDto.confirmPassword,
    );

    response.clearCookie('resetToken');

    response.cookie('refreshToken', result?.refreshToken, {
      ...AuthController.COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: result?.accessToken,
      refreshToken: result?.refreshToken,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  public logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(AuthController.REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth',
    });

    return { message: 'Logget out successfully' };
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  public async getProfile(@Request() request: AuthRequest) {
    const user = await this.userService.findOneById(request.user.sub);

    if (user) {
      return user;
    }

    throw new NotFoundException('User not found');
  }

  @Post('refresh')
  public async refresh(
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookies = request.cookies as Record<string, string | undefined>;
    const refreshToken = cookies?.[AuthController.REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const tokens = await this.authService.refreshToken(refreshToken);
    response.cookie(AuthController.REFRESH_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth',
    });

    return new LoginResponseDto({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  }

  @Delete('account')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(204)
  public async delete(@Request() req: AuthRequest) {
    await this.authService.deleteUser(req.user.sub);
  }
}
