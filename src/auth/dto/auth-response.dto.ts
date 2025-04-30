import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
class LoginData {
  @Field()
  access_token: string;

  @Field()
  username: string;

  @Field(() => Int)
  userId: number;
}

@ObjectType()
export class LoginResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => Int)
  code: number;

  @Field(() => LoginData, { nullable: true })
  data?: LoginData;
}

@ObjectType()
export class CreateUserResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => Int)
  code: number;

  @Field({ nullable: true })
  data?: boolean;
}
