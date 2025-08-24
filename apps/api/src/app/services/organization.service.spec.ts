import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationService } from './organization.service';
import { Organization } from '../entities/organization.entity';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let organizationRepository: Repository<Organization>;

  const mockParentOrg: Organization = {
    id: 1,
    name: 'Parent Corp',
    parentId: undefined,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChildOrg1: Organization = {
    id: 2,
    name: 'Child Corp 1',
    parentId: 1,
    parent: mockParentOrg,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChildOrg2: Organization = {
    id: 3,
    name: 'Child Corp 2',
    parentId: 1,
    parent: mockParentOrg,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrganizationRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrganizationRepository,
        },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
    organizationRepository = module.get<Repository<Organization>>(
      getRepositoryToken(Organization)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrganizationWithChildren', () => {
    it('should return organization with children', async () => {
      const orgWithChildren = {
        ...mockParentOrg,
        children: [mockChildOrg1, mockChildOrg2],
      };

      mockOrganizationRepository.findOne.mockResolvedValue(orgWithChildren);

      const result = await service.getOrganizationWithChildren(1);

      expect(organizationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['children'],
      });
      expect(result).toEqual(orgWithChildren);
      expect(result?.children).toHaveLength(2);
    });

    it('should return null when organization not found', async () => {
      mockOrganizationRepository.findOne.mockResolvedValue(null);

      const result = await service.getOrganizationWithChildren(999);

      expect(result).toBeNull();
    });

    it('should return organization without children', async () => {
      mockOrganizationRepository.findOne.mockResolvedValue(mockChildOrg1);

      const result = await service.getOrganizationWithChildren(2);

      expect(result).toEqual(mockChildOrg1);
    });
  });

  describe('getOrganizationHierarchyIds', () => {
    it('should return parent org with all children IDs', async () => {
      const orgWithChildren = {
        ...mockParentOrg,
        children: [mockChildOrg1, mockChildOrg2],
      };

      mockOrganizationRepository.findOne.mockResolvedValue(orgWithChildren);

      const result = await service.getOrganizationHierarchyIds(1);

      expect(result).toEqual([1, 2, 3]);
    });

    it('should return child org with parent but NOT siblings', async () => {
      const parentWithChildren = {
        ...mockParentOrg,
        children: [mockChildOrg1, mockChildOrg2],
      };

      // First call returns the child org
      mockOrganizationRepository.findOne
        .mockResolvedValueOnce(mockChildOrg1)
        .mockResolvedValueOnce(mockParentOrg); // Parent without children relation

      const result = await service.getOrganizationHierarchyIds(2);

      expect(result).toContain(1); // Parent
      expect(result).toContain(2); // Self
      expect(result).not.toContain(3); // Sibling should NOT be included
    });

    it('should return only self ID when org not found', async () => {
      mockOrganizationRepository.findOne.mockResolvedValue(null);

      const result = await service.getOrganizationHierarchyIds(999);

      expect(result).toEqual([999]);
    });

    it('should handle org with no children and no parent', async () => {
      const standaloneOrg = {
        id: 4,
        name: 'Standalone Corp',
        parentId: undefined,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOrganizationRepository.findOne.mockResolvedValue(standaloneOrg);

      const result = await service.getOrganizationHierarchyIds(4);

      expect(result).toEqual([4]);
    });

    it('should remove duplicate IDs', async () => {
      const orgWithChildren = {
        ...mockParentOrg,
        children: [mockChildOrg1, mockChildOrg1], // Duplicate child (edge case)
      };

      mockOrganizationRepository.findOne.mockResolvedValue(orgWithChildren);

      const result = await service.getOrganizationHierarchyIds(1);

      expect(result).toEqual([1, 2]); // Should remove duplicate
    });

    it('should not include sibling organizations in hierarchy', async () => {
      // Test that sibling organizations are NOT included
      const sibling1 = { ...mockChildOrg1, id: 2, parentId: 1 };
      const sibling2 = { ...mockChildOrg2, id: 3, parentId: 1 };

      // When org 2 queries hierarchy, it should NOT get org 3
      mockOrganizationRepository.findOne
        .mockResolvedValueOnce(sibling1) // First call returns sibling1
        .mockResolvedValueOnce(mockParentOrg); // Second call returns parent (no siblings)

      const result = await service.getOrganizationHierarchyIds(2);

      expect(result).toContain(2); // Self
      expect(result).toContain(1); // Parent
      expect(result).not.toContain(3); // Should NOT contain sibling
      expect(result).toHaveLength(2); // Only self and parent
    });
  });

  describe('canAccessOrganization', () => {
    it('should return true when same organization', async () => {
      const result = await service.canAccessOrganization(1, 1);

      expect(result).toBe(true);
      expect(organizationRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return true when parent can access child', async () => {
      const orgWithChildren = {
        ...mockParentOrg,
        children: [mockChildOrg1, mockChildOrg2],
      };

      mockOrganizationRepository.findOne.mockResolvedValue(orgWithChildren);

      const result = await service.canAccessOrganization(1, 2);

      expect(result).toBe(true);
    });

    it('should return true when child can access parent', async () => {
      mockOrganizationRepository.findOne
        .mockResolvedValueOnce(mockChildOrg1)
        .mockResolvedValueOnce(mockParentOrg);

      const result = await service.canAccessOrganization(2, 1);

      expect(result).toBe(true);
    });

    it('should return false when child tries to access sibling', async () => {
      // Child org 2 trying to access sibling org 3
      mockOrganizationRepository.findOne
        .mockResolvedValueOnce(mockChildOrg1) // org 2
        .mockResolvedValueOnce(mockParentOrg); // parent without siblings

      const result = await service.canAccessOrganization(2, 3);

      expect(result).toBe(false);
    });

    it('should return false when no relationship exists', async () => {
      // When checking org 1, return org 1 with no children
      const org1 = {
        id: 1,
        name: 'Org 1',
        parentId: undefined,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOrganizationRepository.findOne.mockResolvedValue(org1);

      const result = await service.canAccessOrganization(1, 5);

      expect(result).toBe(false);
    });
  });

  describe('isParentOrganization', () => {
    it('should return true when org has children', async () => {
      const orgWithChildren = {
        ...mockParentOrg,
        children: [mockChildOrg1, mockChildOrg2],
      };

      mockOrganizationRepository.findOne.mockResolvedValue(orgWithChildren);

      const result = await service.isParentOrganization(1);

      expect(result).toBe(true);
    });

    it('should return false when org has no children', async () => {
      mockOrganizationRepository.findOne.mockResolvedValue(mockChildOrg1);

      const result = await service.isParentOrganization(2);

      expect(result).toBe(false);
    });

    it('should return false when org not found', async () => {
      mockOrganizationRepository.findOne.mockResolvedValue(null);

      const result = await service.isParentOrganization(999);

      expect(result).toBe(false);
    });

    it('should return false when children array is empty', async () => {
      const orgWithEmptyChildren = {
        ...mockParentOrg,
        children: [],
      };

      mockOrganizationRepository.findOne.mockResolvedValue(orgWithEmptyChildren);

      const result = await service.isParentOrganization(1);

      expect(result).toBe(false);
    });
  });

  describe('isChildOrganization', () => {
    it('should return true when target is a child of parent', async () => {
      const parentWithChildren = {
        ...mockParentOrg,
        children: [mockChildOrg1, mockChildOrg2],
      };

      mockOrganizationRepository.findOne.mockResolvedValue(parentWithChildren);

      const result = await service.isChildOrganization(1, 2);

      expect(result).toBe(true);
      expect(mockOrganizationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['children'],
      });
    });

    it('should return false when target is not a child of parent', async () => {
      const parentWithChildren = {
        ...mockParentOrg,
        children: [mockChildOrg1],
      };

      mockOrganizationRepository.findOne.mockResolvedValue(parentWithChildren);

      const result = await service.isChildOrganization(1, 3);

      expect(result).toBe(false);
    });

    it('should return false when parent has no children', async () => {
      const parentWithNoChildren = {
        ...mockParentOrg,
        children: [],
      };

      mockOrganizationRepository.findOne.mockResolvedValue(parentWithNoChildren);

      const result = await service.isChildOrganization(1, 2);

      expect(result).toBe(false);
    });

    it('should return false when parent org not found', async () => {
      mockOrganizationRepository.findOne.mockResolvedValue(null);

      const result = await service.isChildOrganization(999, 2);

      expect(result).toBe(false);
    });

    it('should return false when parent children is undefined', async () => {
      const parentWithoutChildrenProperty = {
        ...mockParentOrg,
        children: undefined,
      };

      mockOrganizationRepository.findOne.mockResolvedValue(parentWithoutChildrenProperty);

      const result = await service.isChildOrganization(1, 2);

      expect(result).toBe(false);
    });
  });
});