import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsResolver } from './departments.resolver';
import { DepartmentsService } from './departments.service';
import { Department } from './department.entity';
import {
  CreateDepartmentInput,
  CreateSubDepartmentInput,
  UpdateDepartmentInput,
  UpdateSubDepartmentInput,
} from './dto/department.dto';

describe('DepartmentsResolver', () => {
  let resolver: DepartmentsResolver;

  const mockDepartmentService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createSubDepartment: jest.fn(),
    updateSubDepartment: jest.fn(),
    removeSubDepartment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsResolver,
        {
          provide: DepartmentsService,
          useValue: mockDepartmentService,
        },
      ],
    }).compile();

    resolver = module.get<DepartmentsResolver>(DepartmentsResolver);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createDepartment', () => {
    it('should create a department and pass user ID from CurrentUser decorator', async () => {
      const input: CreateDepartmentInput = { name: 'HR' };
      const user = { userId: '1' };
      const department = new Department();
      department.id = 1;
      department.name = 'HR';
      department.createdById = 1;

      mockDepartmentService.create.mockResolvedValue(department);

      const result = await resolver.createDepartment(input, user);

      expect(mockDepartmentService.create).toHaveBeenCalledWith(input, 1);
      expect(result).toEqual(department);
    });
  });

  describe('createSubDepartment', () => {
    it('should create a subdepartment and pass user ID from CurrentUser decorator', async () => {
      const input: CreateSubDepartmentInput = {
        name: 'Recruitment',
        parentId: 1,
      };
      const user = { userId: '1' };
      const subdepartment = new Department();
      subdepartment.id = 2;
      subdepartment.name = 'Recruitment';
      subdepartment.parentId = 1;
      subdepartment.createdById = 1;

      mockDepartmentService.createSubDepartment.mockResolvedValue(
        subdepartment,
      );

      const result = await resolver.createSubDepartment(input, user);

      expect(mockDepartmentService.createSubDepartment).toHaveBeenCalledWith(
        input,
        1,
      );
      expect(result).toEqual(subdepartment);
    });
  });

  describe('getDepartments', () => {
    it('should return an array of departments', async () => {
      const departments = [new Department(), new Department()];
      mockDepartmentService.findAll.mockResolvedValue(departments);

      const result = await resolver.getDepartments();

      expect(mockDepartmentService.findAll).toHaveBeenCalled();
      expect(result).toEqual(departments);
    });
  });

  describe('getDepartment', () => {
    it('should return a department by id', async () => {
      const department = new Department();
      department.id = 1;
      mockDepartmentService.findOne.mockResolvedValue(department);

      const result = await resolver.getDepartment(1);

      expect(mockDepartmentService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(department);
    });
  });

  describe('updateDepartment', () => {
    it('should update a department and return the updated entity', async () => {
      const updateInput: UpdateDepartmentInput = { id: 1, name: 'HR Updated' };
      const updatedDepartment = new Department();
      updatedDepartment.id = 1;
      updatedDepartment.name = 'HR Updated';

      mockDepartmentService.update.mockResolvedValue(updatedDepartment);

      const result = await resolver.updateDepartment(updateInput);

      expect(mockDepartmentService.update).toHaveBeenCalledWith(updateInput);
      expect(result).toEqual(updatedDepartment);
    });
  });

  describe('deleteDepartment', () => {
    it('should delete a department and return true on success', async () => {
      const departmentId = 1;
      mockDepartmentService.remove.mockResolvedValue(true);

      const result = await resolver.deleteDepartment(departmentId);

      expect(mockDepartmentService.remove).toHaveBeenCalledWith(departmentId);
      expect(result).toBe(true);
    });
  });

  describe('updateSubDepartment', () => {
    it('should update a subdepartment and return the updated entity', async () => {
      const updateInput: UpdateSubDepartmentInput = {
        id: 2,
        name: 'Recruitment Updated',
      };
      const updatedSubdepartment = new Department();
      updatedSubdepartment.id = 2;
      updatedSubdepartment.name = 'Recruitment Updated';
      updatedSubdepartment.parentId = 1;

      mockDepartmentService.updateSubDepartment.mockResolvedValue(
        updatedSubdepartment,
      );

      const result = await resolver.updateSubDepartment(updateInput);

      expect(mockDepartmentService.updateSubDepartment).toHaveBeenCalledWith(
        updateInput,
      );
      expect(result).toEqual(updatedSubdepartment);
    });
  });

  describe('deleteSubDepartment', () => {
    it('should delete a subdepartment and return true on success', async () => {
      const subdepartmentId = 2;
      mockDepartmentService.removeSubDepartment.mockResolvedValue(true);

      const result = await resolver.deleteSubDepartment(subdepartmentId);

      expect(mockDepartmentService.removeSubDepartment).toHaveBeenCalledWith(
        subdepartmentId,
      );
      expect(result).toBe(true);
    });
  });
});
