import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT!),
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async sendOtp(email: string, otp: string, purpose: string): Promise<void> {
    const subject =
      purpose === '2fa'
        ? 'Your login verification code'
        : 'Password reset code';

    const message =
      purpose === '2fa'
        ? `Your verification code is: <b>${otp}</b>.`
        : `Your password reset code is: <b>${otp}</b>.`;

    await this.transporter.sendMail({
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
  }
}
