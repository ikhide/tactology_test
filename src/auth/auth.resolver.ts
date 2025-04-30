import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto } from './auth.dto';
import { CreateUserResponse, LoginResponse } from './dto/auth-response.dto';
import { HttpStatus } from '@nestjs/common';
import { ApiResponse } from '../common/response/api-response';

@Resolver('Authentication')
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => LoginResponse)
  async login(
    @Args('loginInput') loginInput: LoginDto,
  ): Promise<LoginResponse> {
    try {
      const result = await this.authService.login(
        loginInput.username,
        loginInput.password,
      );
      return ApiResponse.success(
        {
          access_token: result.access_token,
          username: result.user.username,
          userId: result.user.id,
        },
        'Login successful',
        HttpStatus.OK,
      );
    } catch (error) {
      return ApiResponse.fromError(error);
    }
  }

  @Mutation(() => CreateUserResponse)
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserDto,
  ): Promise<CreateUserResponse> {
    try {
      await this.authService.createUser(
        createUserInput.username,
        createUserInput.password,
      );
      return ApiResponse.created(true, 'User created successfully');
    } catch (error) {
      return ApiResponse.fromError(error);
    }
  }
}
