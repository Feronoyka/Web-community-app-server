import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { PasswordService } from './services/password/password.service';
import { UserResponseDto } from './dto/user-response.dto';
import { FindCommunityQueryParams } from '../community/params/find-community-query.params';
import { Pronouns } from './enum/pronouns.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly passwordService: PasswordService,
  ) {}

  public async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await this.passwordService.hash(
      createUserDto.password,
    );
    const username = createUserDto.username ?? createUserDto.nickname;

    const user = this.userRepository.create({
      ...createUserDto,
      username,
      password: hashedPassword,
    });

    return await this.userRepository.save(user);
  }

  public async findAll(
    filter: FindCommunityQueryParams,
  ): Promise<[User[], number]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .take(5)
      .skip(0);

    if (filter.search) {
      query.where(
        'user.username ILIKE :search OR user.nickname ILIKE :search',
        { search: `%${filter.search}%` },
      );
    }

    return await query.getManyAndCount();
  }

  // Returns the user for API
  public async findOneById(id: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['ownedCommunities'],
    });
    if (!user) return null;
    return {
      id: user.id,
      avatarUrl: user?.avatarUrl,
      username: user.username,
      nickname: user.nickname,
      pronouns: user?.pronouns,
      description: user?.description,
      email: user.email,
      ownedCommunities: user?.ownedCommunities ?? [],
      followedCommunities: user.followedCommunities ?? [],
    };
  }

  // Returns the User entity for auth (e.g. token generation.
  public async findOneByIdEntity(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  // For editing profile
  public async updateById(
    id: string,
    updateUserDto: Partial<
      Pick<User, 'avatarUrl' | 'username' | 'pronouns' | 'description'>
    >,
  ): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return null;

    user.avatarUrl = updateUserDto.avatarUrl ?? user.avatarUrl;
    user.username = updateUserDto.username ?? user.username;
    user.description = updateUserDto.description ?? user.description;

    user.pronouns =
      updateUserDto.pronouns === Pronouns.None
        ? null
        : (updateUserDto.pronouns ?? user.pronouns);

    const saved = await this.userRepository.save(user);
    return {
      id: saved.id,
      avatarUrl: saved.avatarUrl,
      username: saved.username,
      nickname: saved.nickname,
      pronouns: saved.pronouns,
      description: saved.description,
    };
  }

  // public async findOneByEmail(email: string): Promise<User | null> {
  //   const user = await this.userRepository.findOneBy({ email });
  //   if (!user) return null;
  //   return user;
  // }

  public async findOneByEmailWithPassword(email: string): Promise<User | null> {
    return await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  // For searching the user by nickname
  public async findOneBynickname(nickname: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ nickname });
  }

  // For deleting account
  public async deleteUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) return;

    await this.userRepository.remove(user);
  }
}
