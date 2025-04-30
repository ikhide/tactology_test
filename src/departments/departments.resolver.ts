import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DepartmentsService } from './departments.service';
import { Department } from './department.entity';
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateSubDepartmentInput,
  UpdateSubDepartmentInput,
} from './dto/department.dto';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UseGuards } from '@nestjs/common';

@Resolver(() => Department)
@UseGuards(GqlAuthGuard) // Apply JWT protection to all resolver methods
export class DepartmentsResolver {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Mutation(() => Department)
  async createDepartment(
    @Args('payload') createDepartmentInput: CreateDepartmentInput,
    @CurrentUser() user: { userId: string },
  ): Promise<Department> {
    return this.departmentsService.create(
      createDepartmentInput,
      parseInt(user.userId),
    );
  }

  @Query(() => [Department], { name: 'departments' })
  async getDepartments(): Promise<Department[]> {
    return this.departmentsService.findAll();
  }

  @Query(() => Department, { name: 'department' })
  async getDepartment(@Args('id') id: number): Promise<Department> {
    return this.departmentsService.findOne(id);
  }

  @Mutation(() => Department)
  async updateDepartment(
    @Args('payload') updateDepartmentInput: UpdateDepartmentInput,
  ): Promise<Department> {
    return await this.departmentsService.update(updateDepartmentInput);
  }

  @Mutation(() => Boolean)
  async deleteDepartment(@Args('id') id: number): Promise<boolean> {
    return this.departmentsService.remove(id);
  }

  // Bonus: CRUD operations for sub-departments
  @Mutation(() => Department)
  async createSubDepartment(
    @Args('payload') createSubDepartmentInput: CreateSubDepartmentInput,
    @CurrentUser() user: { userId: string },
  ): Promise<Department> {
    return this.departmentsService.createSubDepartment(
      createSubDepartmentInput,
      parseInt(user.userId),
    );
  }

  @Mutation(() => Department)
  async updateSubDepartment(
    @Args('payload') updateSubDepartmentInput: UpdateSubDepartmentInput,
  ): Promise<Department> {
    return this.departmentsService.updateSubDepartment(
      updateSubDepartmentInput,
    );
  }

  @Mutation(() => Boolean)
  async deleteSubDepartment(@Args('id') id: number): Promise<boolean> {
    return this.departmentsService.removeSubDepartment(id);
  }
}
