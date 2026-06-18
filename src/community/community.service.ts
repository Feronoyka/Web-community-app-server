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
import { PaginationParams } from '../common/pagination.params';
import { FindCommunityQueryParams } from './params/find-community-query.params';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
  ) {}

  public async findAll(
    filter: FindCommunityQueryParams,
    pagination: PaginationParams,
  ): Promise<[Community[], number]> {
    const query = this.communityRepository
      .createQueryBuilder('community')
      .leftJoinAndSelect('community.members', 'member')
      .loadRelationCountAndMap('community.membersCount', 'community.members');

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
      .loadRelationCountAndMap('community.membersCount', 'community.members')
      .leftJoinAndSelect('community.owner', 'owner')
      .where('community.id = :id', { id: communityId });

    const community = await query.getOne();

    if (!community) throw new NotFoundException('Community not found');

    // return minimal members
    const membersPreview = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.joinedCommunities', 'community')
      .where('community.id = :communityId', { communityId })
      .take(10)
      .getMany();

    const isMember = currentUserId
      ? await this.isMember(communityId, currentUserId)
      : false;

    return {
      ...community,
      isMember,
      members: membersPreview,
    };
  }

  public async join(communityId: string, userId: string) {
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
    });

    if (!community) throw new NotFoundException('Community not found');

    if (community.ownerId === userId) {
      throw new BadRequestException('Owner cannot follow own community');
    }

    const isMember = await this.isMember(communityId, userId);

    if (isMember) {
      throw new ConflictException('You are already a member of this community');
    }

    await this.dataSource
      .createQueryBuilder()
      .relation(Community, 'members')
      .of(communityId)
      .add(userId);

    return {
      ...community,
    };
  }

  public async leave(communityId: string, userId: string) {
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
    });

    const isMember = await this.isMember(communityId, userId);

    if (!isMember) return false;

    if (!community) throw new NotFoundException('Community not found');

    await this.dataSource
      .createQueryBuilder()
      .relation(Community, 'members')
      .of(communityId)
      .remove(userId);

    return {
      ...community,
    };
  }

  public async createCommunity(
    createCommunityDto: CreateCommunityDto,
    ownerId: string,
  ): Promise<Community> {
    const community = this.communityRepository.create({
      ...createCommunityDto,
      ownerId,
    });

    const user = await this.userService.findOneById(ownerId);

    if (!user || !user.ownedCommunities) {
      throw new NotFoundException('User not found');
    }

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    if (user.ownedCommunities.length >= 5) {
      throw new BadRequestException('You can only create up to 5 communities');
    }

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

  private async isMember(
    communityId: string,
    userId: string,
  ): Promise<boolean> {
    if (!userId) return false;

    return this.communityRepository
      .createQueryBuilder('community')
      .innerJoin('community.members', 'member', 'member.id = :userId', {
        userId,
      })
      .where('community.id = :communityId', {
        communityId,
      })
      .getExists();
  }
}
