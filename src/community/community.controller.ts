import { Controller } from '@nestjs/common';
import { CommunityService } from './community.service';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // @UseGuards(AuthGuard('jwt'))
  // @Post()
  // public async create(
  //   @Body() dto: CreateCommunityDto,
  //   @Request() req: AuthRequest,
  // ) {
  //   return this.communityService.create(dto, req.user.sub);
  // }

  // @UseGuards(AuthGuard('jwt'))
  // @Post(':id/follow')
  // public async follow(@Param('id') id: string, @Request() req: AuthRequest) {
  //   const added = await this.communityService.follow(id, req.user.sub);
  //   return { status: added ? 'followed' : 'already_following' };
  // }

  // @UseGuards(AuthGuard('jwt'))
  // @Delete(':id/follow')
  // public async unfollow(@Param('id') id: string, @Request() req: AuthRequest) {
  //   const removed = await this.communityService.unfollow(id, req.user.sub);
  //   return { status: removed ? 'unfollowed' : 'not_following' };
  // }
}
