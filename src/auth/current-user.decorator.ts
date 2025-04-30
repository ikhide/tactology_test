import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

interface User {
  id: string;
}

interface RequestWithUser {
  user: User;
}

// Define an interface for the GraphQL context
interface GqlContext {
  req: RequestWithUser;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): User => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<GqlContext>().req.user;
  },
);
