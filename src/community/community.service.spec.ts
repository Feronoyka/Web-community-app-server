/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { CommunityService } from './community.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Community } from './community.entity';
import { User } from '../user/user.entity';

describe('CommunityService', () => {
  let service: CommunityService;
  let communityRepo: any;
  let userRepo: any;

  beforeEach(async () => {
    communityRepo = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn().mockImplementation((community) => community),
      save: jest.fn(),
      manager: { transaction: jest.fn() },
      createQueryBuilder: jest.fn(),
    };

    userRepo = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityService,
        { provide: getRepositoryToken(Community), useValue: communityRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<CommunityService>(CommunityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll returns paginated data', async () => {
    const comm = {
      id: '1',
      name: 'c',
      description: 'd',
      followerCount: 0,
    } as any;
    // @ts-expect-ignore
    (communityRepo.createQueryBuilder as jest.Mock).mockReturnValueOnce({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValueOnce([[comm], 1]),
    });

    // user followed set
    // @ts-expect-ignore
    (userRepo.createQueryBuilder as jest.Mock).mockReturnValueOnce({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValueOnce([{ id: '1' }]),
    });

    // members preview
    // @ts-expect-ignore
    (userRepo.createQueryBuilder as jest.Mock).mockReturnValueOnce({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValueOnce([
          { user_id: 'u1', user_username: 'u', user_domainName: 'd' },
        ]),
    });

    const res = await service.findAll('u1', 5, 0);
    expect(res.meta.total).toBe(1);
    expect(res.data[0]).toHaveProperty('isFollowed', true);
    expect(res.data[0].members[0]).toHaveProperty('id', 'u1');
  });
});
