import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Otp } from './otp.entity';
import { OtpPurpose } from 'src/user/enum/otpPurpose.enum';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly OTP_EXPIRY_MINUTES = 5;

  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
  ) {}

  async createOtp(userId: string, purpose: OtpPurpose): Promise<string> {
    await this.otpRepository.delete({ userId, purpose });

    const otp = this.generateRandomOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() + OtpService.OTP_EXPIRY_MINUTES,
    );

    await this.otpRepository.save({
      userId,
      hashedOtp,
      purpose,
      expiresAt,
      attempts: 0,
    });

    return otp;
  }

  async verifyOtp(
    userId: string,
    otp: string,
    purpose: OtpPurpose,
  ): Promise<boolean> {
    const otpRecord = await this.otpRepository.findOne({
      where: { userId, purpose },
    });

    if (!otpRecord) {
      throw new BadRequestException('OTP not found or already used');
    }

    if (new Date() > otpRecord.expiresAt) {
      await this.otpRepository.delete({ id: otpRecord.id });
      throw new BadRequestException('OTP has expired');
    }

    if (otpRecord.attempts >= OtpService.MAX_ATTEMPTS) {
      await this.otpRepository.delete({ id: otpRecord.id });
      throw new BadRequestException('Too many attempts, request a new OTP');
    }

    const isValid = await bcrypt.compare(otp, otpRecord.hashedOtp);

    if (!isValid) {
      await this.otpRepository.update(otpRecord.id, {
        attempts: otpRecord.attempts + 1,
      });
      throw new BadRequestException('Invalid OTP');
    }

    await this.otpRepository.delete({ id: otpRecord.id });

    return true;
  }

  private generateRandomOtp() {
    return Math.floor(10000 + Math.random() * 900000).toString();
  }
}
