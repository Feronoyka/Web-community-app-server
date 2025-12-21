/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { NotFoundException } from '@nestjs/common';

describe('CommunityController', () => {
  let controller: CommunityController;
  let svc: Partial<CommunityService>;

  beforeEach(async () => {
    svc = {
      findPublicById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      follow: jest.fn(),
      unfollow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunityController],
      providers: [{ provide: CommunityService, useValue: svc }],
    }).compile();

    controller = module.get<CommunityController>(CommunityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findOne returns community or throws', async () => {
    // found
    (svc.findPublicById as jest.Mock).mockResolvedValueOnce({
      id: '1',
      name: 'c',
      isFollowed: false,
      followerCount: 0,
      members: [],
    });
    const res = await controller.findOne('1', {} as any);
    expect(res).toHaveProperty('id', '1');

    // not found
    (svc.findPublicById as jest.Mock).mockResolvedValueOnce(null);
    await expect(controller.findOne('2', {} as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('findAll returns paginated response', async () => {
    (svc.findAll as jest.Mock).mockResolvedValueOnce({
      data: [{ id: '1', name: 'c' }],
      meta: { total: 1, offset: 0, limit: 5 },
    });
    const res = await controller.findAll(
      { limit: 5, offset: 0 } as any,
      {} as any,
      {} as any,
    );
    expect(res).toHaveProperty('data');
    expect(res.meta.total).toBe(1);
  });

  it('create calls service.create', async () => {
    const dto: any = { name: 'c', description: 'd' };
    (svc.create as jest.Mock).mockResolvedValueOnce({ id: '1', name: 'c' });
    const res = await controller.create(dto, { user: { sub: 'u1' } } as any);
    expect(svc.create).toHaveBeenCalledWith(dto, 'u1');
    expect(res).toHaveProperty('id', '1');
  });

  it('follow/unfollow returns status accordingly', async () => {
    (svc.follow as jest.Mock).mockResolvedValueOnce(true);
    expect(
      await controller.follow('1', { user: { sub: 'u1' } } as any),
    ).toEqual({ status: 'followed' });

    (svc.follow as jest.Mock).mockResolvedValueOnce(false);
    expect(
      await controller.follow('1', { user: { sub: 'u1' } } as any),
    ).toEqual({ status: 'already_following' });

    (svc.unfollow as jest.Mock).mockResolvedValueOnce(true);
    expect(
      await controller.unfollow('1', { user: { sub: 'u1' } } as any),
    ).toEqual({ status: 'unfollowed' });

    (svc.unfollow as jest.Mock).mockResolvedValueOnce(false);
    expect(
      await controller.unfollow('1', { user: { sub: 'u1' } } as any),
    ).toEqual({ status: 'not_following' });
  });
});
