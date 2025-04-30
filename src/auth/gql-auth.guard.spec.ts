import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlAuthGuard } from './gql-auth.guard';

describe('GqlAuthGuard', () => {
  let guard: GqlAuthGuard;
  let mockContext: ExecutionContext;

  const mockRequest = { headers: { authorization: 'Bearer test-token' } };

  beforeEach(() => {
    guard = new GqlAuthGuard();

    // Create a mock GqlExecutionContext
    const mockGqlContext = {
      getContext: jest.fn().mockReturnValue({ req: mockRequest }),
    };

    // Mock the static create method
    GqlExecutionContext.create = jest.fn().mockReturnValue(mockGqlContext);

    // Create a mock ExecutionContext
    mockContext = {
      switchToHttp: jest.fn(),
      getType: jest.fn().mockReturnValue('graphql'),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('getRequest', () => {
    it('should extract the request object from GraphQL context', () => {
      const request = guard.getRequest(mockContext);

      expect(GqlExecutionContext.create).toHaveBeenCalledWith(mockContext);
      expect(request).toEqual(mockRequest);
    });
  });
});
