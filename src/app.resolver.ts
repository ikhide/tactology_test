import { Query, Resolver } from '@nestjs/graphql';
import { AppService } from './app.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from './auth/gql-auth.guard';
import { CurrentUser } from './auth/current-user.decorator';

@Resolver()
export class AppResolver {
  constructor(private readonly appService: AppService) {}

  @Query(() => String)
  hello(): string {
    return this.appService.getHello();
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => String)
  protected(@CurrentUser() user: any): string {
    return `This is a protected resource. Hello, ${user}!`;
  }
}
