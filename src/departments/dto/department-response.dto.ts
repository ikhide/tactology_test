import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Department } from '../department.entity';
import { PaginationMeta } from '../../common/dto/pagination.dto';

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
  @Field(() => [Department])
  items: Department[];

  @Field(() => PaginationMeta)
  meta: PaginationMeta;
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
