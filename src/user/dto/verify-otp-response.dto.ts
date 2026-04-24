import { PartialType } from '@nestjs/mapped-types';
import { LoginResponseDto } from './login-response.dto';

export class VerifyOtpResponseDto extends PartialType(LoginResponseDto) {}
