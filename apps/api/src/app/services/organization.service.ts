import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  /**
   * Get an organization with all its children (2-level hierarchy)
   */
  async getOrganizationWithChildren(organizationId: number): Promise<Organization | null> {
    return this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['children'],
    });
  }

  /**
   * Get all organization IDs in the hierarchy (parent + children)
   * This is used for filtering tasks that belong to parent or child orgs
   */
  async getOrganizationHierarchyIds(organizationId: number): Promise<number[]> {
    const org = await this.getOrganizationWithChildren(organizationId);
    
    if (!org) {
      return [organizationId];
    }

    // Include the current org and all its children
    const orgIds = [org.id];
    
    if (org.children && org.children.length > 0) {
      orgIds.push(...org.children.map(child => child.id));
    }

    // Also check if this org is a child - get parent's other children
    if (org.parentId) {
      const parent = await this.getOrganizationWithChildren(org.parentId);
      if (parent) {
        orgIds.push(parent.id);
        if (parent.children) {
          parent.children.forEach(sibling => {
            if (!orgIds.includes(sibling.id)) {
              orgIds.push(sibling.id);
            }
          });
        }
      }
    }

    return [...new Set(orgIds)]; // Remove duplicates
  }

  /**
   * Check if user's organization has authority over target organization
   * (either same org, parent org, or child org)
   */
  async canAccessOrganization(userOrgId: number, targetOrgId: number): Promise<boolean> {
    if (userOrgId === targetOrgId) {
      return true;
    }

    const hierarchyIds = await this.getOrganizationHierarchyIds(userOrgId);
    return hierarchyIds.includes(targetOrgId);
  }

  /**
   * Determine if an organization is a parent organization
   */
  async isParentOrganization(organizationId: number): Promise<boolean> {
    const org = await this.getOrganizationWithChildren(organizationId);
    return !!(org && org.children && org.children.length > 0);
  }
}