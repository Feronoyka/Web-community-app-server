import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from './community.entity';
import { User } from '../user/user.entity';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  public async findAll(): Promise<Community[]> {
    return await this.communityRepository.find();
  }

  /**
   * Return a small preview list of members (minimal fields) to avoid loading full entities
   */
  // public async getMembersPreview(
  //   communityId: string,
  //   limit = 5,
  // ): Promise<MemberDto[]> {
  //   // Select minimal fields from users who follow the community
  //   const qb = this.userRepository
  //     .createQueryBuilder('user')
  //     .innerJoin(
  //       'user.followedCommunities',
  //       'community',
  //       'community.id = :communityId',
  //       {
  //         communityId,
  //       },
  //     )
  //     .select(['user.id', 'user.username', 'user.domainName'])
  //     .limit(limit);

  //   const members = await qb.getRawMany();

  //   // getRawMany returns raw objects; map to MemberDto shape
  //   return members.map((member: any) => ({
  //     id: member.user_id,
  //     username: member.user_username,
  //     domainName: member.user_domainName,
  //   }));
  // }

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
}
