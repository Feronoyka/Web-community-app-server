import { Test, TestingModule } from '@nestjs/testing';
import { CommunityService } from './community.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Community } from './community.entity';
import { User } from '../user/user.entity';

interface CommunityRepoType {
  findOne: () => void;
  findOneBy: () => void;
  create: () => void;
  save: () => void;
  manager: {
    transaction: () => void;
  };
  createQueryBuilder: () => void;
}

interface UserRepoType {
  findOne: () => void;
  findOneBy: () => void;
  createQueryBuilder: () => void;
}

describe('CommunityService', () => {
  let service: CommunityService;
  let communityRepo: CommunityRepoType;
  let userRepo: UserRepoType;

  beforeEach(async () => {
    communityRepo = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn().mockImplementation((community: Community) => community),
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

  it('findAll returns paginated data', () => {
    const comm = {
      id: '1',
      name: 'c',
      description: 'd',
      followerCount: 0,
    } as Community;
    (communityRepo.createQueryBuilder as jest.Mock).mockReturnValueOnce({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValueOnce([[comm], 1]),
    });

    // user followed set
    (userRepo.createQueryBuilder as jest.Mock).mockReturnValueOnce({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValueOnce([{ id: '1' }]),
    });

    // members preview
    (userRepo.createQueryBuilder as jest.Mock).mockReturnValueOnce({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValueOnce([
          { user_id: 'u1', user_username: 'u', user_nickname: 'd' },
        ]),
    });
  });
});
