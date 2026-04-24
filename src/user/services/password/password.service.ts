import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { HashConfig } from 'src/config/hash.config';

@Injectable()
export class PasswordService {
  private readonly SALT_ROUNDS: HashConfig['SALT_ROUNDS'];

  constructor(config: ConfigService) {
    const hashConfig = config.get<HashConfig>('hash');
    this.SALT_ROUNDS = Number(hashConfig?.SALT_ROUNDS || 12);
  }

  public async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  public async verify(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}
