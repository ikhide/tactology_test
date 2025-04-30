import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, IsNull } from 'typeorm';
import { Department } from './department.entity';
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateSubDepartmentInput,
  UpdateSubDepartmentInput,
} from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>,
  ) {}

  async create(
    createDepartmentInput: CreateDepartmentInput,
    userId: number,
  ): Promise<Department> {
    // Check if a top-level department with this name already exists
    const existingDepartment = await this.departmentsRepository.findOne({
      where: { name: createDepartmentInput.name, parentId: null },
    });

    if (existingDepartment) {
      throw new ConflictException(
        `Department with name '${createDepartmentInput.name}' already exists`,
      );
    }

    // Create the main department
    const department = this.departmentsRepository.create({
      name: createDepartmentInput.name,
      createdById: userId,
    });

    // Save the department to get an ID
    const savedDepartment = await this.departmentsRepository.save(department);

    // Handle sub-departments if provided
    if (
      createDepartmentInput.subDepartments &&
      createDepartmentInput.subDepartments.length > 0
    ) {
      // Check for duplicate subdepartment names
      const subdepartmentNames = createDepartmentInput.subDepartments.map(
        (sd) => sd.name,
      );
      const uniqueNames = new Set(subdepartmentNames);

      if (uniqueNames.size !== subdepartmentNames.length) {
        throw new ConflictException(
          'Subdepartment names must be unique within a department',
        );
      }

      const subDeps = createDepartmentInput.subDepartments.map((subDep) =>
        this.departmentsRepository.create({
          name: subDep.name,
          parent: savedDepartment,
          createdById: userId,
        }),
      );

      await this.departmentsRepository.save(subDeps);
    }

    return this.findOne(savedDepartment.id);
  }

  async findAll(): Promise<Department[]> {
    const departments = await this.departmentsRepository
      .createQueryBuilder('department')
      .leftJoinAndSelect('department.subDepartments', 'subDepartments')
      .where('department.parentId IS NULL')
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('child.id')
          .from(Department, 'child')
          .innerJoin('child.parent', 'parent')
          .getQuery();
        return 'department.id NOT IN ' + subQuery;
      })
      .getMany();

    return departments;
  }

  async findOne(id: number): Promise<Department> {
    const department = await this.departmentsRepository.findOne({
      where: { id, parentId: IsNull() },
      relations: ['subDepartments', 'createdBy'],
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  async findOneSubdepartment(id: number): Promise<Department> {
    const department = await this.departmentsRepository.findOne({
      where: {
        id: id,
        parentId: Not(IsNull()),
      },
      relations: ['parent'],
    });

    if (!department) {
      throw new NotFoundException(`Subdepartment with ID ${id} not found`);
    }

    return department;
  }

  async update(
    updateDepartmentInput: UpdateDepartmentInput,
  ): Promise<Department> {
    const department = await this.findOne(updateDepartmentInput.id);

    // Check if it's a subdepartment - only top-level departments can be updated with this method
    if (department.parentId !== null) {
      throw new NotFoundException(
        `Entity with ID ${updateDepartmentInput.id} is a sub-department and cannot be updated with this method. Use updateSubDepartment instead.`,
      );
    }

    // Only validate uniqueness if the name is being changed
    if (department.name !== updateDepartmentInput.name) {
      // Check if another top-level department with this name already exists
      const existingDepartment = await this.departmentsRepository.findOne({
        where: {
          name: updateDepartmentInput.name,
          parentId: null,
          id: Not(updateDepartmentInput.id),
        },
      });

      if (existingDepartment) {
        throw new ConflictException(
          `Department with name '${updateDepartmentInput.name}' already exists`,
        );
      }
    }

    department.name = updateDepartmentInput.name;

    return this.departmentsRepository.save(department);
  }

  async remove(id: number): Promise<boolean> {
    // Find the department first to check if it exists
    const department = await this.findOne(id);

    // Delete department (cascade should handle sub-departments)
    await this.departmentsRepository.remove(department);

    return true;
  }

  // Bonus: CRUD operations for sub-departments
  async createSubDepartment(
    createSubDepartmentInput: CreateSubDepartmentInput,
    userId: number,
  ): Promise<Department> {
    // Check if parent department exists
    const parentDepartment = await this.findOne(
      createSubDepartmentInput.parentId,
    );

    // Check if a subdepartment with the same name already exists under this parent
    const existingSubDepartment = await this.departmentsRepository.findOne({
      where: {
        name: createSubDepartmentInput.name,
        parentId: createSubDepartmentInput.parentId,
      },
    });

    if (existingSubDepartment) {
      throw new ConflictException(
        `Subdepartment with name '${createSubDepartmentInput.name}' already exists under this parent department`,
      );
    }

    // Create sub-department
    const subDepartment = this.departmentsRepository.create({
      name: createSubDepartmentInput.name,
      parent: parentDepartment,
      createdById: userId,
    });

    return this.departmentsRepository.save(subDepartment);
  }

  async updateSubDepartment(
    updateSubDepartmentInput: UpdateSubDepartmentInput,
  ): Promise<Department> {
    const subDepartment = await this.findOneSubdepartment(
      updateSubDepartmentInput.id,
    );

    // Only validate uniqueness if the name is being changed
    if (subDepartment.name !== updateSubDepartmentInput.name) {
      // Check if another subdepartment with this name already exists under the same parent
      const existingSubDepartment = await this.departmentsRepository.findOne({
        where: {
          name: updateSubDepartmentInput.name,
          parentId: subDepartment.parentId,
          id: Not(updateSubDepartmentInput.id),
        },
      });

      if (existingSubDepartment) {
        throw new ConflictException(
          `Subdepartment with name '${updateSubDepartmentInput.name}' already exists under this parent department`,
        );
      }
    }

    subDepartment.name = updateSubDepartmentInput.name;

    return this.departmentsRepository.save(subDepartment);
  }

  async removeSubDepartment(id: number): Promise<boolean> {
    const subDepartment = await this.findOneSubdepartment(id);

    // Delete the subdepartment
    await this.departmentsRepository.remove(subDepartment);

    return true;
  }
}
