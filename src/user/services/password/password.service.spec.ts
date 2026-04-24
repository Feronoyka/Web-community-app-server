import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';
import { ConfigService } from '@nestjs/config';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue({ SALT_ROUNDS: 10 }) },
        },
      ],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
