import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let usersService: UsersService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let jwtService: JwtService;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    password: 'hashedpassword',
  };

  const mockUsersService = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-jwt-token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return the user when credentials are valid', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('testuser', 'password');

      expect(mockUsersService.findOne).toHaveBeenCalledWith('testuser');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedpassword');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(
        service.validateUser('nonexistent', 'password'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUsersService.findOne).toHaveBeenCalledWith('nonexistent');
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser('testuser', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUsersService.findOne).toHaveBeenCalledWith('testuser');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        'hashedpassword',
      );
    });
  });

  describe('login', () => {
    it('should generate JWT token when credentials are valid', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('testuser', 'password');

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        username: 'testuser',
        sub: 1,
      });

      expect(result).toEqual({
        access_token: 'test-jwt-token',
        user: {
          id: 1,
          username: 'testuser',
        },
      });
    });

    it('should throw UnauthorizedException when login credentials are invalid', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('testuser', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('createUser', () => {
    it('should successfully create a new user', async () => {
      mockUsersService.findOne.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({
        id: 1,
        username: 'newuser',
        password: 'hashedpassword',
      });

      const result = await service.createUser('newuser', 'password');

      expect(mockUsersService.findOne).toHaveBeenCalledWith('newuser');
      expect(mockUsersService.create).toHaveBeenCalledWith(
        'newuser',
        'password',
      );
      expect(result).toEqual({
        id: 1,
        username: 'newuser',
        password: 'hashedpassword',
      });
    });

    it('should throw UnauthorizedException when user already exists', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      await expect(service.createUser('testuser', 'password')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockUsersService.findOne).toHaveBeenCalledWith('testuser');
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });
});
