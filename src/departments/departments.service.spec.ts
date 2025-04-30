import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsService } from './departments.service';
import { Department } from './department.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Not, IsNull } from 'typeorm';

describe('DepartmentsService', () => {
  let service: DepartmentsService;

  const mockDepartmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        {
          provide: getRepositoryToken(Department),
          useValue: mockDepartmentRepository,
        },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a department with createdById field', async () => {
      const userId = 1;
      const createDepartmentDto = { name: 'HR' };
      const department = new Department();
      department.id = 1;
      department.name = 'HR';
      department.createdById = userId;

      mockDepartmentRepository.findOne.mockResolvedValueOnce(null);
      mockDepartmentRepository.create.mockReturnValueOnce(department);
      mockDepartmentRepository.save.mockResolvedValueOnce(department);

      // Mock findOne that will be called after save
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(department);

      const result = await service.create(createDepartmentDto, userId);

      expect(mockDepartmentRepository.create).toHaveBeenCalledWith({
        name: 'HR',
        createdById: userId,
      });
      expect(result.createdById).toEqual(userId);
    });

    it('should create a department with subdepartments', async () => {
      const userId = 1;
      const createDepartmentDto = {
        name: 'HR',
        subDepartments: [{ name: 'Recruitment' }, { name: 'Training' }],
      };

      const department = new Department();
      department.id = 1;
      department.name = 'HR';
      department.createdById = userId;

      const subDep1 = new Department();
      subDep1.name = 'Recruitment';
      subDep1.parent = department;
      subDep1.createdById = userId;

      const subDep2 = new Department();
      subDep2.name = 'Training';
      subDep2.parent = department;
      subDep2.createdById = userId;

      const departmentWithSubs = {
        ...department,
        subDepartments: [subDep1, subDep2],
      };

      mockDepartmentRepository.findOne.mockResolvedValueOnce(null);
      mockDepartmentRepository.create
        .mockReturnValueOnce(department)
        .mockReturnValueOnce(subDep1)
        .mockReturnValueOnce(subDep2);
      mockDepartmentRepository.save
        .mockResolvedValueOnce(department)
        .mockResolvedValueOnce([subDep1, subDep2]);

      // Mock findOne that will be called after save
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(departmentWithSubs);

      const result = await service.create(createDepartmentDto, userId);

      expect(mockDepartmentRepository.create).toHaveBeenNthCalledWith(1, {
        name: 'HR',
        createdById: userId,
      });
      expect(result.subDepartments).toHaveLength(2);
    });

    it('should throw ConflictException if department name already exists', async () => {
      const userId = 1;
      const createDepartmentDto = { name: 'HR' };
      const existingDepartment = new Department();
      existingDepartment.name = 'HR';

      mockDepartmentRepository.findOne.mockResolvedValueOnce(
        existingDepartment,
      );

      await expect(service.create(createDepartmentDto, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a department when found', async () => {
      const mockDepartment = {
        id: 1,
        name: 'HR',
        parentId: null,
        subDepartments: [],
      };

      mockDepartmentRepository.findOne.mockResolvedValueOnce(mockDepartment);

      const result = await service.findOne(1);

      expect(result).toEqual(mockDepartment);
      expect(mockDepartmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, parentId: IsNull() },
        relations: ['subDepartments', 'createdBy'],
      });
    });

    it('should throw NotFoundException when department is not found', async () => {
      mockDepartmentRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockDepartmentRepository.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOneSubdepartment', () => {
    it('should return a subdepartment when found', async () => {
      const mockSubdepartment = {
        id: 2,
        name: 'Recruitment',
        parentId: 1,
        parent: { id: 1, name: 'HR' },
      };

      mockDepartmentRepository.findOne.mockResolvedValueOnce(mockSubdepartment);

      const result = await service.findOneSubdepartment(2);

      expect(result).toEqual(mockSubdepartment);
      expect(mockDepartmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 2, parentId: Not(IsNull()) },
        relations: ['parent'],
      });
    });

    it('should throw NotFoundException when subdepartment is not found', async () => {
      mockDepartmentRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.findOneSubdepartment(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a department name', async () => {
      const updateDto = { id: 1, name: 'HR Updated' };

      const existingDepartment = new Department();
      existingDepartment.id = 1;
      existingDepartment.name = 'HR';
      existingDepartment.parentId = null;

      const updatedDepartment = { ...existingDepartment, name: 'HR Updated' };

      // Mock findOne from the service
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(existingDepartment);

      // Check that no other department exists with this name
      mockDepartmentRepository.findOne.mockResolvedValueOnce(null);

      mockDepartmentRepository.save.mockResolvedValueOnce(updatedDepartment);

      const result = await service.update(updateDto);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(mockDepartmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: 'HR Updated',
        }),
      );
      expect(result.name).toBe('HR Updated');
    });

    it('should throw NotFoundException when trying to update a subdepartment', async () => {
      const updateDto = { id: 2, name: 'Recruitment Updated' };

      const subDepartment = new Department();
      subDepartment.id = 2;
      subDepartment.name = 'Recruitment';
      subDepartment.parentId = 1;

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(subDepartment);

      await expect(service.update(updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockDepartmentRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when updating to a name that already exists', async () => {
      const updateDto = { id: 1, name: 'Finance' };

      const existingDepartment = new Department();
      existingDepartment.id = 1;
      existingDepartment.name = 'HR';
      existingDepartment.parentId = null;

      const conflictDepartment = new Department();
      conflictDepartment.id = 2;
      conflictDepartment.name = 'Finance';

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(existingDepartment);
      mockDepartmentRepository.findOne.mockResolvedValueOnce(
        conflictDepartment,
      );

      await expect(service.update(updateDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockDepartmentRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a department and return true', async () => {
      const departmentToRemove = new Department();
      departmentToRemove.id = 1;
      departmentToRemove.name = 'HR';

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(departmentToRemove);
      mockDepartmentRepository.remove.mockResolvedValueOnce(departmentToRemove);

      const result = await service.remove(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(mockDepartmentRepository.remove).toHaveBeenCalledWith(
        departmentToRemove,
      );
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when department does not exist', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValueOnce(new NotFoundException());

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockDepartmentRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('createSubDepartment', () => {
    it('should create a subdepartment with createdById field', async () => {
      const userId = 1;
      const parentDepartment = new Department();
      parentDepartment.id = 1;
      parentDepartment.name = 'HR';

      const createSubDepartmentDto = {
        name: 'Recruitment',
        parentId: 1,
      };

      const subdepartment = new Department();
      subdepartment.id = 2;
      subdepartment.name = 'Recruitment';
      subdepartment.parent = parentDepartment;
      subdepartment.parentId = 1;
      subdepartment.createdById = userId;

      // Mock findOne in the custom method to return parentDepartment
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(parentDepartment);

      mockDepartmentRepository.findOne.mockResolvedValueOnce(null); // No existing subdepartment
      mockDepartmentRepository.create.mockReturnValueOnce(subdepartment);
      mockDepartmentRepository.save.mockResolvedValueOnce(subdepartment);

      const result = await service.createSubDepartment(
        createSubDepartmentDto,
        userId,
      );

      expect(mockDepartmentRepository.create).toHaveBeenCalledWith({
        name: 'Recruitment',
        parent: parentDepartment,
        createdById: userId,
      });
      expect(result.createdById).toEqual(userId);
    });

    it('should throw ConflictException if subdepartment with same name exists under parent', async () => {
      const userId = 1;
      const parentDepartment = new Department();
      parentDepartment.id = 1;
      parentDepartment.name = 'HR';

      const createSubDepartmentDto = {
        name: 'Recruitment',
        parentId: 1,
      };

      const existingSubdepartment = new Department();
      existingSubdepartment.id = 2;
      existingSubdepartment.name = 'Recruitment';
      existingSubdepartment.parentId = 1;

      // Mock findOne in the custom method to return parentDepartment
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(parentDepartment);

      mockDepartmentRepository.findOne.mockResolvedValueOnce(
        existingSubdepartment,
      ); // Existing subdepartment

      await expect(
        service.createSubDepartment(createSubDepartmentDto, userId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateSubDepartment', () => {
    it('should update a subdepartment name', async () => {
      const updateDto = { id: 2, name: 'Recruitment Updated' };

      const parentDepartment = new Department();
      parentDepartment.id = 1;
      parentDepartment.name = 'HR';

      const existingSubdepartment = new Department();
      existingSubdepartment.id = 2;
      existingSubdepartment.name = 'Recruitment';
      existingSubdepartment.parentId = 1;
      existingSubdepartment.parent = parentDepartment;

      const updatedSubdepartment = {
        ...existingSubdepartment,
        name: 'Recruitment Updated',
      };

      jest
        .spyOn(service, 'findOneSubdepartment')
        .mockResolvedValueOnce(existingSubdepartment);
      mockDepartmentRepository.findOne.mockResolvedValueOnce(null); // No other subdep with same name
      mockDepartmentRepository.save.mockResolvedValueOnce(updatedSubdepartment);

      const result = await service.updateSubDepartment(updateDto);

      expect(service.findOneSubdepartment).toHaveBeenCalledWith(2);
      expect(mockDepartmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 2,
          name: 'Recruitment Updated',
        }),
      );
      expect(result.name).toBe('Recruitment Updated');
    });

    it('should throw ConflictException when updating to a name that already exists under the same parent', async () => {
      const updateDto = { id: 2, name: 'Training' };

      const existingSubdepartment = new Department();
      existingSubdepartment.id = 2;
      existingSubdepartment.name = 'Recruitment';
      existingSubdepartment.parentId = 1;

      const conflictSubdepartment = new Department();
      conflictSubdepartment.id = 3;
      conflictSubdepartment.name = 'Training';
      conflictSubdepartment.parentId = 1;

      jest
        .spyOn(service, 'findOneSubdepartment')
        .mockResolvedValueOnce(existingSubdepartment);
      mockDepartmentRepository.findOne.mockResolvedValueOnce(
        conflictSubdepartment,
      );

      await expect(service.updateSubDepartment(updateDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockDepartmentRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('removeSubDepartment', () => {
    it('should remove a subdepartment and return true', async () => {
      const subdepartmentToRemove = new Department();
      subdepartmentToRemove.id = 2;
      subdepartmentToRemove.name = 'Recruitment';
      subdepartmentToRemove.parentId = 1;

      jest
        .spyOn(service, 'findOneSubdepartment')
        .mockResolvedValueOnce(subdepartmentToRemove);
      mockDepartmentRepository.remove.mockResolvedValueOnce(
        subdepartmentToRemove,
      );

      const result = await service.removeSubDepartment(2);

      expect(service.findOneSubdepartment).toHaveBeenCalledWith(2);
      expect(mockDepartmentRepository.remove).toHaveBeenCalledWith(
        subdepartmentToRemove,
      );
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when subdepartment does not exist', async () => {
      jest
        .spyOn(service, 'findOneSubdepartment')
        .mockRejectedValueOnce(new NotFoundException());

      await expect(service.removeSubDepartment(999)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockDepartmentRepository.remove).not.toHaveBeenCalled();
    });
  });
});
