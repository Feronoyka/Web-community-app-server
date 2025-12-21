/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './create-community.dto';
import { type AuthRequest } from '../user/auth/auth.request';
import { FindCommunityQueryParams } from './find-community-query.params';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  public async findAll(
    @Query() params: import('../common/pagination.params').PaginationParams,
    @Query()
    query: FindCommunityQueryParams,
    @Request() req: any,
  ) {
    const viewerId = req?.user?.sub;
    const limit = params?.limit ?? 5;
    const offset = params?.offset ?? 0;
    return this.communityService.findAll(viewerId, limit, offset, query);
  }

  @Get(':id')
  public async findOne(@Param('id') id: string, @Request() req: any) {
    const viewerId = req?.user?.sub;
    const community = await this.communityService.findPublicById(id, viewerId);
    if (!community) throw new NotFoundException('Community not found');
    return community;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  public async create(
    @Body() dto: CreateCommunityDto,
    @Request() req: AuthRequest,
  ) {
    return this.communityService.create(dto, req.user.sub);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/follow')
  public async follow(@Param('id') id: string, @Request() req: AuthRequest) {
    const added = await this.communityService.follow(id, req.user.sub);
    return { status: added ? 'followed' : 'already_following' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/follow')
  public async unfollow(@Param('id') id: string, @Request() req: AuthRequest) {
    const removed = await this.communityService.unfollow(id, req.user.sub);
    return { status: removed ? 'unfollowed' : 'not_following' };
  }
}
