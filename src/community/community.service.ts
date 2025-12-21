/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from './community.entity';
import { MemberDto } from './member.dto';
import { CommunityResponseDto } from './community-response.dto';
import { User } from '../user/user.entity';
import { CreateCommunityDto } from './create-community.dto';
import { type FindCommunityQueryParams } from './find-community-query.params';
import { type PaginationResponse } from '../common/paginations-response.params';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  /**
   * Return a public view of a community, computing isFollowed for the viewer
   */
  public async findPublicById(
    communityId: string,
    viewerId?: string,
    previewLimit = 5,
  ): Promise<CommunityResponseDto | null> {
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
      relations: ['owner'],
    });

    if (!community) return null;

    const isFollowed = viewerId
      ? await this.isFollowed(communityId, viewerId)
      : false;

    const members = await this.getMembersPreview(communityId, previewLimit);

    const dto: CommunityResponseDto = {
      id: community.id,
      name: community.name,
      description: community.description,
      followerCount: community.followerCount,
      isFollowed,
      members,
    };

    return dto;
  }

  /**
   * Paginated list of public communities with optional search/sort
   */
  public async findAll(
    viewerId?: string,
    limit = 5,
    offset = 0,
    query?: FindCommunityQueryParams,
  ): Promise<PaginationResponse<CommunityResponseDto>> {
    const search = query?.search;
    const sortBy = query?.sortBy ?? 'followerCount';
    const sortOrder = query?.sortOrder ?? 'ASC';

    const qb = this.communityRepository
      .createQueryBuilder('community')
      .leftJoinAndSelect('community.owner', 'owner')
      .limit(limit)
      .offset(offset);

    if (search) {
      qb.where('LOWER(community.name) LIKE :q', {
        q: `%${search.toLowerCase()}%`,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    qb.orderBy(`community.${sortBy}`, sortOrder as 'ASC' | 'DESC');

    const [rows, total] = await qb.getManyAndCount();

    let followedSet = new Set<string>();
    if (viewerId) {
      const followed = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.followedCommunities', 'community')
        .where('user.id = :userid', { userid: viewerId })
        .select('community.id', 'id')
        .getRawMany();

      followedSet = new Set(followed.map((r: any) => r.id));
    }

    const data: CommunityResponseDto[] = await Promise.all(
      rows.map(async (community) => ({
        id: community.id,
        name: community.name,
        description: community.description,
        followerCount: community.followerCount,
        isFollowed: viewerId ? followedSet.has(community.id) : false,
        members: await this.getMembersPreview(community.id, 3),
      })),
    );

    return {
      data,
      meta: { total, offset, limit },
    };
  }

  public async create(
    dto: CreateCommunityDto,
    ownerId: string,
  ): Promise<CommunityResponseDto> {
    const owner = await this.userRepository.findOneBy({ id: ownerId });
    if (!owner) throw new NotFoundException('Owner not found');

    const community = this.communityRepository.create({
      name: dto.name,
      description: dto.description,
      owner,
    } as Partial<Community>);

    const saved = await this.communityRepository.save(community);
    // return public view with owner as viewer so isFollowed false and members preview empty
    return (await this.findPublicById(
      saved.id,
      ownerId,
    )) as CommunityResponseDto;
  }

  /**
   * Return a small preview list of members (minimal fields) to avoid loading full entities
   */
  public async getMembersPreview(
    communityId: string,
    limit = 5,
  ): Promise<MemberDto[]> {
    // Select minimal fields from users who follow the community
    const qb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin(
        'user.followedCommunities',
        'community',
        'community.id = :communityId',
        {
          communityId,
        },
      )
      .select(['user.id', 'user.username', 'user.domainName'])
      .limit(limit);

    const members = await qb.getRawMany();

    // getRawMany returns raw objects; map to MemberDto shape
    return members.map((member: any) => ({
      id: member.user_id,
      username: member.user_username,
      domainName: member.user_domainName,
    }));
  }

  /**
   * Checks if a user follows the community
   */
  public async isFollowed(
    communityId: string,
    userId: string,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['followedCommunities'],
    });

    if (!user) return false;

    return user.followedCommunities.some(
      (followedCommunity) => followedCommunity.id === communityId,
    );
  }

  /**
   * Idempotent follow. Returns true when follow was added, false when already following.
   */
  public async follow(communityId: string, userId: string): Promise<boolean> {
    const community = await this.communityRepository.findOneBy({
      id: communityId,
    });
    if (!community) throw new NotFoundException('Community not found');

    return await this.communityRepository.manager.transaction(
      async (manager) => {
        const user = await manager.findOne(User, {
          where: { id: userId },
          relations: ['followedCommunities'],
        });

        const exists =
          user?.followedCommunities.some(
            (followedCommunity) => followedCommunity.id === communityId,
          ) ?? false;

        if (exists) return false;

        await manager
          .createQueryBuilder()
          .relation(Community, 'members')
          .of(communityId)
          .add(userId);

        await manager
          .createQueryBuilder()
          .update(Community)
          .set({ followerCount: () => '"followerCount" + 1' })
          .where('id = :id', { id: communityId })
          .execute();

        return true;
      },
    );
  }

  /**
   * Idempotent unfollow. Returns true when unfollowed, false when not following.
   */
  public async unfollow(communityId: string, userId: string): Promise<boolean> {
    const community = await this.communityRepository.findOneBy({
      id: communityId,
    });
    if (!community) throw new NotFoundException('Community not found');

    return await this.communityRepository.manager.transaction(
      async (manager) => {
        const user = await manager.findOne(User, {
          where: { id: userId },
          relations: ['followedCommunities'],
        });

        const exists =
          user?.followedCommunities.some(
            (followedCommunity) => followedCommunity.id === communityId,
          ) ?? false;

        if (!exists) return false;

        await manager
          .createQueryBuilder()
          .relation(Community, 'members')
          .of(communityId)
          .remove(userId);

        await manager
          .createQueryBuilder()
          .update(Community)
          .set({ followerCount: () => 'GREATEST("followerCount" - 1, 0)' })
          .where('id = :id', { id: communityId })
          .execute();

        return true;
      },
    );
  }
}
