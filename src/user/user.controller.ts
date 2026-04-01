import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OwnerGuard } from '../guards/owner.guard';
import { UserService } from './user.service';
import { User } from './user.entity';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUserQueryParams } from './params/find-user.query.param';
import { PaginationResponse } from 'src/common/pagination-response.params';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  public async findAll(
    @Query() filter: FindUserQueryParams,
  ): Promise<PaginationResponse<User>> {
    const [users, total] = await this.userService.findAll(filter);
    return {
      data: users,
      meta: {
        total,
      },
    };
  }

  // view other users' public profiles
  @Get(':id')
  public async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return await this.findOneOrFail(id);
  }

  // edit own public profile
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), OwnerGuard)
  public async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.userService.updateById(id, updateUserDto);
    if (!updatedUser) throw new NotFoundException('User not found');

    return updatedUser;
  }

  // Helper function
  async findOneOrFail(id: string) {
    const user = await this.userService.findOneById(id);
    if (!user) throw new NotFoundException('User not found');

    return user;
  }
}
