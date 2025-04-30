import { Field, ID, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

@InputType()
export class SubDepartmentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Sub-department name must be at least 2 characters long',
  })
  name: string;
}

@InputType()
export class CreateDepartmentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Department name must be at least 2 characters long',
  })
  name: string;

  @Field(() => [SubDepartmentInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubDepartmentInput)
  subDepartments?: SubDepartmentInput[];
}

@InputType()
export class UpdateDepartmentInput {
  @Field(() => ID)
  id: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Department name must be at least 2 characters long',
  })
  name: string;
}

@InputType()
export class CreateSubDepartmentInput {
  @Field(() => ID)
  @IsNotEmpty()
  parentId: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Sub-department name must be at least 2 characters long',
  })
  name: string;
}

@InputType()
export class UpdateSubDepartmentInput {
  @Field(() => ID)
  id: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Sub-department name must be at least 2 characters long',
  })
  name: string;
}
