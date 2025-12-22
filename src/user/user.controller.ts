import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OwnerGuard } from './owner.guard';
import { UserService } from './user.service';
import { User } from './user.entity';
import { UserResponseDto } from './user-response.dto';
import { UpdateUserDto } from './update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  public async findAll(): Promise<User[]> {
    const user = await this.userService.findAll();
    return user;
  }

  // view other users' public profiles
  @Get(':id')
  public async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return await this.findOneOrFail(id);
  }

  // edit own public profile
  @Put(':id')
  @UseGuards(AuthGuard('jwt'), OwnerGuard)
  public async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.userService.updateById(id, updateUserDto);
    if (!updatedUser) throw new NotFoundException('User not found');

    return updatedUser;
  }

  // Helper method
  async findOneOrFail(id: string) {
    const user = await this.userService.findOneById(id);
    if (!user) throw new NotFoundException('User not found');

    return user;
  }
}
