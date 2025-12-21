import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { PasswordService } from './password/password.service';

describe('UserService', () => {
  let service: UserService;
  let repo: Partial<Repository<any>>;
  let pw: Partial<PasswordService>;

  beforeEach(async () => {
    repo = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((u) => Promise.resolve({ id: '1', ...u })),
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    pw = {
      hash: jest.fn().mockResolvedValue('hashed'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: PasswordService, useValue: pw },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create calls hash and saves user', async () => {
    const dto: any = {
      email: 'a',
      password: 'p',
      username: 'u',
      domainName: 'd',
    };
    // @ts-expect-ignore rely on mocked repo
    (repo.save as jest.Mock).mockResolvedValue({
      id: '1',
      ...dto,
      password: 'hashed',
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const res = await service.create(dto);
    expect(pw.hash).toHaveBeenCalledWith('p');
    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
    expect(res).toHaveProperty('id', '1');
  });

  it('findAll returns list', async () => {
    // @ts-expectignore
    (repo.find as jest.Mock).mockResolvedValue([{ id: '1' }]);
    const res = await service.findAll();
    expect(res).toEqual([{ id: '1' }]);
  });

  it('findOneById returns mapped dto or null', async () => {
    const user = {
      id: '1',
      username: 'u',
      domainName: 'd',
      pronouns: 'x',
      description: 'desc',
    };
    // @ts-expect-ignore
    (repo.findOneBy as jest.Mock).mockResolvedValueOnce(user);
    expect(await service.findOneById('1')).toEqual({
      id: '1',
      username: 'u',
      domainName: 'd',
      pronouns: 'x',
      description: 'desc',
    });
    // not found
    // @ts-expect-ignore
    (repo.findOneBy as jest.Mock).mockResolvedValueOnce(null);
    expect(await service.findOneById('2')).toBeNull();
  });

  it('updateById updates fields and returns dto or null', async () => {
    const user = {
      id: '1',
      username: 'u',
      domainName: 'd',
      pronouns: 'x',
      description: 'desc',
    };
    // @ts-expect-ignore
    (repo.findOneBy as jest.Mock).mockResolvedValueOnce(user);
    // @ts-expect-ignore
    (repo.save as jest.Mock).mockResolvedValueOnce({
      ...user,
      username: 'new',
    });

    const updated = await service.updateById('1', { username: 'new' });
    expect(updated).toEqual({
      id: '1',
      username: 'new',
      domainName: 'd',
      pronouns: 'x',
      description: 'desc',
    });

    // not found
    // @ts-expect-ignore
    (repo.findOneBy as jest.Mock).mockResolvedValueOnce(null);
    expect(await service.updateById('2', {})).toBeNull();
  });

  it('findOneByEmail returns user or null', async () => {
    // @ts-expect-ignore
    (repo.findOneBy as jest.Mock).mockResolvedValueOnce({ id: '1' });
    expect(await service.findOneByEmail('a')).toEqual({ id: '1' });
    // @ts-expect-ignore
    (repo.findOneBy as jest.Mock).mockResolvedValueOnce(null);
    expect(await service.findOneByEmail('b')).toBeNull();
  });

  it('findOneByEmailWithPassword uses query builder', async () => {
    const qb: any = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: '1', password: 'h' }),
    };
    // @ts-expect-ignore
    (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
    const res = await service.findOneByEmailWithPassword('a');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(qb.addSelect).toHaveBeenCalled();
    expect(res).toEqual({ id: '1', password: 'h' });
  });

  it('findOneByDomainName returns value from repo', async () => {
    // @ts-expect-ignore
    (repo.findOneBy as jest.Mock).mockResolvedValueOnce({ id: '1' });
    expect(await service.findOneByDomainName('d')).toEqual({ id: '1' });
  });
});
