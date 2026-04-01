import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Community } from './community.entity';
import { User } from '../user/user.entity';
import { PaginationParams } from 'src/common/pagination.params';
import { FindCommunityQueryParams } from './params/find-community-query.params';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  public async findAll(
    filter: FindCommunityQueryParams,
    pagination: PaginationParams,
  ): Promise<[Community[], number]> {
    const query = this.communityRepository.createQueryBuilder('community');

    if (filter.search) {
      query.where('community.name ILIKE :search', {
        search: `%${filter.search}%`,
      });
    }

    query.orderBy(`community.${filter.sortBy}`, filter.sortOrder);

    return await query
      .offset(pagination.offset)
      .limit(pagination.limit)
      .getManyAndCount();
  }

  public async findOne(
    communityId: string,
    currentUserId: string | null,
  ): Promise<Community> {
    const query = this.communityRepository
      .createQueryBuilder('community')
      .loadRelationCountAndMap('community.followerCount', 'community.members')
      .leftJoinAndSelect('community.owner', 'owner')
      .where('community.id = :id', { id: communityId });

    const community = await query.getOne();

    if (!community) throw new NotFoundException('Community not found');

    // check if current user already follows this community
    const isFollowing = currentUserId
      ? await this.isFollowed(communityId, currentUserId)
      : false;

    // return minimal members
    const membersPreview = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.followedCommunities', 'community')
      .where('community.id = :communityId', { communityId })
      .take(10)
      .getMany();

    return {
      ...community,
      isFollowing,
      members: membersPreview,
    };
  }

  public async follow(communityId: string, userId: string): Promise<boolean> {
    return await this.dataSource.transaction(async (manager) => {
      const community = await manager.findOne(Community, {
        where: { id: communityId },
      });

      if (!community) throw new NotFoundException('Community not found');

      if (community.ownerId === userId) {
        throw new BadRequestException('Owner cannot follow own community');
      }

      const isFollowing = await manager
        .createQueryBuilder(User, 'user')
        .innerJoin('user.followedCommunities', 'community')
        .where('user.id = :userId AND community.id = :communityId', {
          userId,
          communityId,
        })
        .getExists();

      if (isFollowing) {
        throw new ConflictException(
          'You are already a member of this community',
        );
      }

      await manager
        .createQueryBuilder()
        .relation(Community, 'members')
        .of(communityId)
        .add(userId);

      return true;
    });
  }

  public async unfollow(communityId: string, userId: string): Promise<boolean> {
    return await this.dataSource.transaction(async (manager) => {
      const isFollowing = await this.isFollowed(communityId, userId);
      if (!isFollowing) return false;

      await manager
        .createQueryBuilder()
        .relation(Community, 'members')
        .of(communityId)
        .remove(userId);

      return true;
    });
  }

  public async createCommunity(
    createCommunityDto: CreateCommunityDto,
    ownerId: string,
  ): Promise<Community> {
    const community = this.communityRepository.create({
      ...createCommunityDto,
      ownerId,
    });
    return await this.communityRepository.save(community);
  }

  public async removeCommunity(
    communityId: string,
    ownerId: string,
  ): Promise<void> {
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
      relations: ['owner'],
    });

    if (!community) throw new NotFoundException('Community not found');
    if (community.ownerId !== ownerId)
      throw new ForbiddenException('Only owner can delete community');

    await this.communityRepository.remove(community);
  }

  public async updateCommunity(
    community: Community,
    updateCommunityDto: UpdateCommunityDto,
  ): Promise<Community> {
    Object.assign(community, updateCommunityDto);
    return await this.communityRepository.save(community);
  }

  private async isFollowed(
    communityId: string,
    userId: string,
  ): Promise<boolean> {
    if (!userId) return false;

    return await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.followedCommunities', 'community')
      .where('user.id = :userId AND community.id = :communityId', {
        userId,
        communityId,
      })
      .getExists();
  }
}
