import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    password: 'hashedpassword',
  };

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a user when user exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('testuser');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return undefined when user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(undefined);

      const result = await service.findOne('nonexistent');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'nonexistent' },
      });
      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should hash the password and create a new user', async () => {
      const username = 'newuser';
      const password = 'password123';
      const hashedPassword = 'hashedpassword123';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.create.mockReturnValue({
        username,
        password: hashedPassword,
      });

      mockRepository.save.mockResolvedValue({
        id: 2,
        username,
        password: hashedPassword,
      });

      const result = await service.create(username, password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        username,
        password: hashedPassword,
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: 2,
        username,
        password: hashedPassword,
      });
    });
  });
});
