import { Args, Mutation, Query, Resolver, Int } from '@nestjs/graphql';
import { DepartmentsService } from './departments.service';
import { Department } from './department.entity';
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateSubDepartmentInput,
  UpdateSubDepartmentInput,
} from './dto/department.dto';
import {
  DepartmentResponse,
  DepartmentsResponse,
  DeleteResponse,
} from './dto/department-response.dto';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { ApiResponse } from '../common/response/api-response';

@Resolver(() => Department)
@UseGuards(GqlAuthGuard)
export class DepartmentsResolver {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Mutation(() => DepartmentResponse)
  async createDepartment(
    @Args('payload') createDepartmentInput: CreateDepartmentInput,
    @CurrentUser() user: { userId: string },
  ): Promise<DepartmentResponse> {
    try {
      const department = await this.departmentsService.create(
        createDepartmentInput,
        parseInt(user.userId),
      );
      return ApiResponse.created(department, 'Department created successfully');
    } catch (error: unknown) {
      return ApiResponse.fromError(error);
    }
  }

  @Query(() => DepartmentsResponse, { name: 'departments' })
  async getDepartments(): Promise<DepartmentsResponse> {
    try {
      const departments = await this.departmentsService.findAll();
      return ApiResponse.success(
        departments,
        'Departments retrieved successfully',
      );
    } catch (error: unknown) {
      return ApiResponse.fromError(error);
    }
  }

  @Query(() => DepartmentResponse, { name: 'department' })
  async getDepartment(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<DepartmentResponse> {
    try {
      const department = await this.departmentsService.findOne(id);
      if (!department) {
        return ApiResponse.notFound('Department not found');
      }
      return ApiResponse.success(
        department,
        'Department retrieved successfully',
      );
    } catch (error: unknown) {
      return ApiResponse.fromError(error);
    }
  }

  @Mutation(() => DepartmentResponse)
  async updateDepartment(
    @Args('payload') updateDepartmentInput: UpdateDepartmentInput,
  ): Promise<DepartmentResponse> {
    try {
      const department = await this.departmentsService.update(
        updateDepartmentInput,
      );
      return ApiResponse.success(department, 'Department updated successfully');
    } catch (error: unknown) {
      if (
        error instanceof HttpException &&
        (error.getStatus() as HttpStatus) === HttpStatus.NOT_FOUND
      ) {
        return ApiResponse.notFound(error.message || 'Department not found');
      }
      return ApiResponse.fromError(error);
    }
  }

  @Mutation(() => DeleteResponse)
  async deleteDepartment(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<DeleteResponse> {
    try {
      const deleted = await this.departmentsService.remove(id);
      if (!deleted) {
        return ApiResponse.notFound(
          'Department not found or could not be deleted',
        );
      }
      return ApiResponse.successNoData('Department deleted successfully');
    } catch (error: unknown) {
      return ApiResponse.fromError(error);
    }
  }

  @Mutation(() => DepartmentResponse)
  async createSubDepartment(
    @Args('payload') createSubDepartmentInput: CreateSubDepartmentInput,
    @CurrentUser() user: { userId: string },
  ): Promise<DepartmentResponse> {
    try {
      const subDepartment = await this.departmentsService.createSubDepartment(
        createSubDepartmentInput,
        parseInt(user.userId),
      );
      return ApiResponse.created(
        subDepartment,
        'Sub-department created successfully',
      );
    } catch (error: unknown) {
      return ApiResponse.fromError(error);
    }
  }

  @Mutation(() => DepartmentResponse)
  async updateSubDepartment(
    @Args('payload') updateSubDepartmentInput: UpdateSubDepartmentInput,
  ): Promise<DepartmentResponse> {
    try {
      const subDepartment = await this.departmentsService.updateSubDepartment(
        updateSubDepartmentInput,
      );
      return ApiResponse.success(
        subDepartment,
        'Sub-department updated successfully',
      );
    } catch (error: unknown) {
      if (
        error instanceof HttpException &&
        (error.getStatus() as HttpStatus) === HttpStatus.NOT_FOUND
      ) {
        return ApiResponse.notFound(
          error.message || 'Sub-department not found',
        );
      }
      return ApiResponse.fromError(error);
    }
  }

  @Mutation(() => DeleteResponse)
  async deleteSubDepartment(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<DeleteResponse> {
    try {
      const deleted = await this.departmentsService.removeSubDepartment(id);
      if (!deleted) {
        return ApiResponse.notFound(
          'Sub-department not found or could not be deleted',
        );
      }
      return ApiResponse.successNoData('Sub-department deleted successfully');
    } catch (error: unknown) {
      return ApiResponse.fromError(error);
    }
  }
}
