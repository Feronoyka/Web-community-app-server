import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './create-user.dto';
import { PasswordService } from './password/password.service';
import { UserResponseDto } from './user-response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
  ) {}

  public async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await this.passwordService.hash(
      createUserDto.password,
    );

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return await this.userRepository.save(user);
  }

  public async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  public async findOneById(id: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      domainName: user.domainName,
      pronouns: user?.pronouns,
      description: user?.description,
    };
  }

  public async updateById(
    id: string,
    updateUserDto: Partial<Pick<User, 'username' | 'pronouns' | 'description'>>,
  ): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return null;

    user.username = updateUserDto.username ?? user.username;
    user.pronouns = updateUserDto.pronouns ?? user.pronouns;
    user.description = updateUserDto.description ?? user.description;

    const saved = await this.userRepository.save(user);
    return {
      id: saved.id,
      username: saved.username,
      domainName: saved.domainName,
      pronouns: saved.pronouns,
      description: saved.description,
    };
  }

  public async findOneByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) return null;
    return user;
  }

  public async findOneByEmailWithPassword(email: string): Promise<User | null> {
    return await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  public async findOneByDomainName(domainName: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ domainName });
  }
}
