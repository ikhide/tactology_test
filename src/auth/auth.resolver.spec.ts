import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto } from './auth.dto';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    createUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('login', () => {
    it('should return login response with access token and user info when credentials are valid', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
      };
      const mockLoginResponse = {
        access_token: 'test-access-token',
        user: {
          id: 1,
          username: 'testuser',
        },
      };
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      // Act
      const result = await resolver.login(loginDto);

      // Assert
      expect(authService.login).toHaveBeenCalledWith('testuser', 'password123');
      expect(result).toEqual({
        access_token: 'test-access-token',
        username: 'testuser',
        userId: 1,
      });
    });

    it('should propagate exceptions from the auth service', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      // Act & Assert
      await expect(resolver.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.login).toHaveBeenCalledWith(
        'testuser',
        'wrongpassword',
      );
    });
  });

  describe('createUser', () => {
    it('should return true when user is created successfully', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        username: 'newuser',
        password: 'password123',
      };
      mockAuthService.createUser.mockResolvedValue({
        id: 2,
        username: 'newuser',
        password: 'hashedpassword',
      });

      // Act
      const result = await resolver.createUser(createUserDto);

      // Assert
      expect(authService.createUser).toHaveBeenCalledWith(
        'newuser',
        'password123',
      );
      expect(result).toBe(true);
    });
  });
});
