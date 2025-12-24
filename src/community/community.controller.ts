import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './create-community.dto';
import { AuthGuard } from '@nestjs/passport';
import type { AuthRequest } from 'src/user/auth/auth.request';
import { FindCommunityQueryParams } from './find-community-query.params';
import { PaginationParams } from 'src/common/pagination.params';
import { PaginationResponse } from 'src/common/pagination-response.params';
import { Community } from './community.entity';
import { UpdateCommunityDto } from './update-community.dto';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // creating community
  @Post()
  @UseGuards(AuthGuard('jwt'))
  public async create(
    @Body() createCommunityDto: CreateCommunityDto,
    @Req() req: AuthRequest,
  ) {
    return this.communityService.createCommunity(
      createCommunityDto,
      req.user.sub,
    );
  }

  // get all communities with limit 5
  @Get()
  public async findAll(
    @Query() filter: FindCommunityQueryParams,
    @Query() pagination: PaginationParams,
  ): Promise<PaginationResponse<Community>> {
    const [communities, total] = await this.communityService.findAll(
      filter,
      pagination,
    );
    return {
      data: communities,
      meta: {
        total,
        ...pagination,
      },
    };
  }

  // get one community by id
  @Get(':id')
  public async findOne(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<Community> {
    const community = await this.communityService.findOne(id, req.user.sub);

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    return community;
  }

  // update community
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  public async update(
    @Param('id') id: string,
    @Body() updateCommunityDto: UpdateCommunityDto,
    @Req() req: AuthRequest,
  ): Promise<Community> {
    const community = await this.communityService.findOne(id, req.user.sub);
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    this.checkCommunityOwnerShip(community, req.user.sub);
    return await this.communityService.updateCommunity(
      community,
      updateCommunityDto,
    );
  }

  // delete community
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  public async remove(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<void> {
    return await this.communityService.removeCommunity(id, req.user.sub);
  }

  // follow to community
  @Post(':id/follow')
  @UseGuards(AuthGuard('jwt'))
  public async follow(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<boolean> {
    return await this.communityService.follow(id, req.user.sub);
  }

  // unfollow from community
  @Delete(':id/unfollow')
  @UseGuards(AuthGuard('jwt'))
  public async unfollow(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<boolean> {
    return await this.communityService.unfollow(id, req.user.sub);
  }

  // check if the user is the owner of the community
  private checkCommunityOwnerShip(community: Community, userId: string): void {
    if (community.ownerId !== userId) {
      throw new ForbiddenException();
    }
  }
}
