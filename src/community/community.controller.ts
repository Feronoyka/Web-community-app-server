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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { AuthGuard } from '@nestjs/passport';
import type { AuthRequest } from '../user/services/auth/auth.request';
import { FindCommunityQueryParams } from './params/find-community-query.params';
import { PaginationParams } from '../common/pagination.params';
import { PaginationResponse } from '../common/pagination-response.params';
import { Community } from './community.entity';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';
import { SkipThrottle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@SkipThrottle()
@Controller('communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // creating community
  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('avatarUrl', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniquename = `${Date.now()}${extname(file.originalname)}`;
          cb(null, uniquename);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  public async create(
    @Body() createCommunityDto: CreateCommunityDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthRequest,
  ) {
    const avatarUrl = file
      ? `http://localhost:3000/uploads/${file.filename}`
      : undefined;

    const community = await this.communityService.createCommunity(
      { ...createCommunityDto, avatarUrl },
      req.user.sub,
    );

    return community;
  }

  // get all communities with limit 10
  @Get()
  public async findAll(
    @Query() filter: FindCommunityQueryParams,
    @Query() pagination: PaginationParams,
  ): Promise<PaginationResponse<Community>> {
    const [communities, total] = await this.communityService.findAll(
      filter,
      pagination,
    );

    if (!communities) {
      throw new NotFoundException('There is no communities');
    }

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
  @UseGuards(OptionalJwtAuthGuard)
  public async findOne(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<Community> {
    const userId = req.user?.sub || null;

    const community = await this.communityService.findOne(id, userId);

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    return community;
  }

  // update community
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('avatarUrl', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniquename = `${Date.now()}${extname(file.originalname)}`;
          cb(null, uniquename);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  public async update(
    @Param('id') id: string,
    @Body() updateCommunityDto: UpdateCommunityDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthRequest,
  ): Promise<Community> {
    const community = await this.communityService.findOne(id, req.user.sub);
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    this.checkCommunityOwnerShip(community, req.user.sub);

    const avatarUrl = file
      ? `http://localhost:3000/uploads/${file.filename}`
      : undefined;

    return await this.communityService.updateCommunity(community, {
      ...updateCommunityDto,
      ...(avatarUrl && { avatarUrl }),
    });
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
  public async follow(@Param('id') id: string, @Req() req: AuthRequest) {
    return await this.communityService.follow(id, req.user.sub);
  }

  // unfollow from community
  @Delete(':id/unfollow')
  @UseGuards(AuthGuard('jwt'))
  public async unfollow(@Param('id') id: string, @Req() req: AuthRequest) {
    return await this.communityService.unfollow(id, req.user.sub);
  }

  // check if the user is the owner of the community
  private checkCommunityOwnerShip(community: Community, userId: string): void {
    if (community.ownerId !== userId) {
      throw new ForbiddenException();
    }
  }
}
