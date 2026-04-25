import { User } from '../../user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OtpPurpose } from '../../enum/otpPurpose.enum';

@Entity()
export class Otp {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  hashedOtp!: string;

  @Column({ type: 'enum', enum: OtpPurpose })
  purpose!: OtpPurpose;

  @Column({ default: 0 })
  attempts!: number;

  @Column()
  expiresAt!: Date;

  @ManyToOne(() => User, (user) => user.otps, { onDelete: 'CASCADE' })
  user!: User;

  @Column()
  userId!: string;

  @CreateDateColumn()
  createdAt!: string;
}
