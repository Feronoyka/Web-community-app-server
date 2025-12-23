import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from './community.entity';
import { User } from '../user/user.entity';
import { PaginationParams } from 'src/common/pagination.params';
import { FindCommunityQueryParams } from './find-community-query.params';
import { CommunityResponseDto } from './community-response.dto';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  public async findOne(id: string): Promise<CommunityResponseDto | null> {
    const community = await this.communityRepository.findOne({
      where: { id },
      relations: ['owner'], // to load owner relation
    });
    if (!community) return null;

    const membersPreview = await this.userRepository // return minimal members
      .createQueryBuilder('user')
      .innerJoin(
        'user.followedCommunities',
        'community',
        'community.id = :communityId',
        { id },
      )
      .take(10)
      .getMany();

    community.members = membersPreview;

    return community;
  }

  /**
   * Return a small preview list of members (minimal fields) to avoid loading full entities
   */
}

/**
 * Checks if a user follows the community
 */
// public async isFollowed(
//   communityId: string,
//   userId: string,
// ): Promise<boolean> {
//   const user = await this.userRepository.findOne({
//     where: { id: userId },
//     relations: ['followedCommunities'],
//   });

//   if (!user) return false;

//   return user.followedCommunities.some(
//     (followedCommunity) => followedCommunity.id === communityId,
//   );
// }

/**
 * Idempotent follow. Returns true when follow was added, false when already following.
 */
// public async follow(communityId: string, userId: string): Promise<boolean> {
//   const community = await this.communityRepository.findOneBy({
//     id: communityId,
//   });
//   if (!community) throw new NotFoundException('Community not found');

//   return await this.communityRepository.manager.transaction(
//     async (manager) => {
//       const user = await manager.findOne(User, {
//         where: { id: userId },
//         relations: ['followedCommunities'],
//       });

//       const exists =
//         user?.followedCommunities.some(
//           (followedCommunity) => followedCommunity.id === communityId,
//         ) ?? false;

//       if (exists) return false;

//       await manager
//         .createQueryBuilder()
//         .relation(Community, 'members')
//         .of(communityId)
//         .add(userId);

//       await manager
//         .createQueryBuilder()
//         .update(Community)
//         .set({ followerCount: () => '"followerCount" + 1' })
//         .where('id = :id', { id: communityId })
//         .execute();

//       return true;
//     },
//   );
// }

// /**
//  * Idempotent unfollow. Returns true when unfollowed, false when not following.
//  */
// public async unfollow(communityId: string, userId: string): Promise<boolean> {
//   const community = await this.communityRepository.findOneBy({
//     id: communityId,
//   });
//   if (!community) throw new NotFoundException('Community not found');

//   return await this.communityRepository.manager.transaction(
//     async (manager) => {
//       const user = await manager.findOne(User, {
//         where: { id: userId },
//         relations: ['followedCommunities'],
//       });

//       const exists =
//         user?.followedCommunities.some(
//           (followedCommunity) => followedCommunity.id === communityId,
//         ) ?? false;

//       if (!exists) return false;

//       await manager
//         .createQueryBuilder()
//         .relation(Community, 'members')
//         .of(communityId)
//         .remove(userId);

//       await manager
//         .createQueryBuilder()
//         .update(Community)
//         .set({ followerCount: () => 'GREATEST("followerCount" - 1, 0)' })
//         .where('id = :id', { id: communityId })
//         .execute();

//       return true;
//     },
//   );
// }
