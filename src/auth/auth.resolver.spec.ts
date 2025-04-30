import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto } from './auth.dto';
import { UnauthorizedException, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '../common/response/api-response'; // Import ApiResponse

// Mock AuthService
const mockAuthService = {
  login: jest.fn(),
  createUser: jest.fn(),
};

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('login', () => {
    it('should return login response within ApiResponse.success when credentials are valid', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
      };
      const loginResult = {
        access_token: 'test-access-token',
        user: { id: 1, username: 'testuser' },
      };
      const expectedData = {
        access_token: 'test-access-token',
        username: 'testuser',
        userId: 1,
      };
      mockAuthService.login.mockResolvedValue(loginResult);

      // Act
      const result = await resolver.login(loginDto);

      // Assert
      expect(authService.login).toHaveBeenCalledWith('testuser', 'password123');
      // Expect ApiResponse structure
      expect(result).toEqual(
        ApiResponse.success(expectedData, 'Login successful', HttpStatus.OK),
      );
    });

    it('should return ApiResponse.fromError when credentials are invalid', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };
      const error = new UnauthorizedException('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      // Act
      const result = await resolver.login(loginDto);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(
        'testuser',
        'wrongpassword',
      );
      // Expect the method to return the error response object
      expect(result).toEqual(ApiResponse.fromError(error));
      expect(result.success).toBe(false);
      expect(result.code).toBe(HttpStatus.UNAUTHORIZED);
      expect(result.message).toBe('Invalid credentials');
    });
  });

  describe('createUser', () => {
    it('should return ApiResponse.created(true) when user is created successfully', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        username: 'newuser',
        password: 'password123',
      };
      // Assume createUser service method doesn't return anything on success
      mockAuthService.createUser.mockResolvedValue(undefined);

      // Act
      const result = await resolver.createUser(createUserDto);

      // Assert
      expect(authService.createUser).toHaveBeenCalledWith(
        'newuser',
        'password123',
      );
      // Expect ApiResponse structure
      expect(result).toEqual(
        ApiResponse.created(true, 'User created successfully'),
      );
    });

    it('should return ApiResponse.fromError when user creation fails', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        username: 'existinguser',
        password: 'password123',
      };
      const error = new Error('User already exists'); // Example error
      mockAuthService.createUser.mockRejectedValue(error);

      // Act
      const result = await resolver.createUser(createUserDto);

      // Assert
      expect(authService.createUser).toHaveBeenCalledWith(
        'existinguser',
        'password123',
      );
      // Expect the method to return the error response object
      expect(result).toEqual(ApiResponse.fromError(error));
      expect(result.success).toBe(false);
      // Assuming generic error maps to 500 if status isn't set
      expect(result.code).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('User already exists');
    });
  });
});
