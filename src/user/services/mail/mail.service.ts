import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT!),
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async onModuleInit() {
    try {
      await this.transporter.verify();
      this.logger.log('Mail transporter verified successfully');
    } catch (err) {
      this.logger.warn(
        `Mail transporter verification failed: ${String(
          (err as Error)?.message ?? err,
        )}`,
      );
    }
  }

  async sendOtp(email: string, otp: string, purpose: string): Promise<void> {
    const subject =
      purpose === '2fa'
        ? 'Your login verification code'
        : 'Password reset code';

    const message =
      purpose === '2fa'
        ? `Your verification code is: <b>${otp}</b>.`
        : `Your password reset code is: <b>${otp}</b>.`;

    const info = await this.transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_USER}>`,
      to: email,
      subject,
      html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: auto;">
          <h2>${subject}</h2>
          <p>${message}</p>
          <p style="color: #808080; font-size: 12px;">
            If you did not request this, ignore this email.
          </p>
        </div>
      `,
    });

    this.logger.log(
      `Sent OTP email to ${email} (messageId=${info.messageId}, accepted=${info.accepted?.length ?? 0}, rejected=${info.rejected?.length ?? 0})`,
    );
  }
}
