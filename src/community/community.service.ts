import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Community } from './community.entity';
import { User } from '../user/user.entity';
import { PaginationParams } from 'src/common/pagination.params';
import { FindCommunityQueryParams } from './find-community-query.params';
import { CreateCommunityDto } from './create-community.dto';
import { UpdateCommunityDto } from './update-community.dto';

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
    currentUserId: string,
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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const community = await queryRunner.manager.findOne(Community, {
        where: { id: communityId },
        relations: ['owner'],
      });

      if (!community) throw new NotFoundException('Community not found');
      if (community.ownerId === userId)
        throw new BadRequestException('Owner cannot follow own community');

      const isFollowing = await this.isFollowed(communityId, userId);
      if (isFollowing) return false;

      await queryRunner.manager
        .createQueryBuilder()
        .relation(Community, 'members')
        .of(communityId)
        .add(userId);

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  public async unfollow(communityId: string, userId: string): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const isFollowing = await this.isFollowed(communityId, userId);
      if (!isFollowing) return false;

      await queryRunner.manager
        .createQueryBuilder()
        .relation(Community, 'members')
        .of(communityId)
        .remove(userId);

      await queryRunner.commitTransaction();
      return false;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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
