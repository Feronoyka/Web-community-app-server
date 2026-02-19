/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// ...existing code...
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import * as jest from 'jest';

describe('UserController', () => {
  let controller: UserController;
  const mockUserService = {
    findAll: jest.fn().mockResolvedValue([]),
    // add other mocked methods as needed
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // or if you prefer manual instantiation:
  // beforeEach(() => {
  //   controller = new UserController(mockUserService as any);
  // });
});
// ...existing code...
