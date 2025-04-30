import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Department } from '../department.entity'; // Import the Department entity

@ObjectType()
export class DepartmentResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => Int)
  code: number;

  @Field(() => Department, { nullable: true })
  data?: Department;
}

@ObjectType()
export class DepartmentsResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => Int)
  code: number;

  @Field(() => [Department], { nullable: true })
  data?: Department[];
}

@ObjectType()
export class DeleteResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => Int)
  code: number;

  @Field({ nullable: true })
  data?: boolean;
}
