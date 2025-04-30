import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { Field, ObjectType } from '@nestjs/graphql';
import { CreateUserDto, LoginDto } from './auth.dto';

// Define the return type for the login mutation
@ObjectType()
class LoginResponse {
  @Field()
  access_token: string;

  @Field()
  username: string;

  @Field()
  userId: number;
}

@Resolver('Authentication')
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => LoginResponse)
  async login(
    @Args('loginInput') loginInput: LoginDto,
  ): Promise<LoginResponse> {
    const result = await this.authService.login(
      loginInput.username,
      loginInput.password,
    );
    return {
      access_token: result.access_token,
      username: result.user.username,
      userId: result.user.id,
    };
  }

  // For testing purposes - creates a test user
  @Mutation(() => Boolean)
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserDto,
  ): Promise<boolean> {
    try {
      await this.authService.createUser(
        createUserInput.username,
        createUserInput.password,
      );
      return true;
    } catch (error) {
      console.error('Error creating test user:', error);
      return false;
    }
  }
}
