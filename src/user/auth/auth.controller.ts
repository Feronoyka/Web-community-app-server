import { UserService } from './../user.service';
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
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { type AuthRequest } from './auth.request';
import type { Request as ExpressRequest, Response } from 'express';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ strategy: 'exposeAll' })
export class AuthController {
  private static readonly REFRESH_COOKIE_NAME = 'refreshToken';
  private static readonly EXPIRES = 7 * 24 * 60 * 60 * 1000;

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  public async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.register(createUserDto);
    return user;
  }

  @Post('login')
  public async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    response.cookie(AuthController.REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth',
      maxAge: AuthController.EXPIRES,
    });

    return new LoginResponseDto({ accessToken });
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

    return new LoginResponseDto({ accessToken: tokens.accessToken });
  }

  @Delete('account')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(204)
  public async delete(@Request() req: AuthRequest) {
    await this.authService.deleteUser(req.user.sub);
  }
}

/**
Client sends email + password
→ Server generates both tokens
→ Server puts refreshToken in httpOnly cookie on the response
→ Server returns { accessToken } in JSON body
→ Browser automatically stores the cookie

  When Access Token expiresIn
  Client gets 401 Unauthorized response
→ Client calls POST /auth/refresh
→ Browser automatically sends the httpOnly cookie along with the request
→ Server reads refreshToken from cookie (not from body)
→ Server validates it, issues new both tokens
→ New refreshToken goes back into cookie silently
→ New accessToken returned in JSON body
→ Client updates its stored accessToken and retries the original request

Client calls DELETE /auth/logout
→ Server clears the cookie
→ Client discards the accessToken from memory
→ Done
 */
