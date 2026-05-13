import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { OtpPurpose } from '../enum/otpPurpose.enum';

export class VerifyOtpDto {
  @IsString()
  @Length(6, 6)
  otp: string;

  @IsOptional()
  @IsEnum(OtpPurpose)
  purpose?: OtpPurpose;

  @IsOptional()
  @IsBoolean()
  trustDevice?: boolean;
}
