import { IsBoolean, IsEnum, IsString, Length } from 'class-validator';
import { OtpPurpose } from '../enum/otpPurpose.enum';

export class VerifyOtpDto {
  @IsString()
  @Length(6, 6)
  otp: string;

  @IsEnum(OtpPurpose)
  purpose?: OtpPurpose;

  @IsBoolean()
  trustDevice?: boolean;
}
