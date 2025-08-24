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

    // Also check if this org is a child - include parent org
    if (org.parentId) {
      const parent = await this.organizationRepository.findOne({
        where: { id: org.parentId }
      });
      if (parent) {
        orgIds.push(parent.id);
        // Note: We do NOT add sibling organizations here
        // Child orgs should NOT see sibling org tasks
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

  /**
   * Check if targetOrgId is a child of parentOrgId
   */
  async isChildOrganization(parentOrgId: number, targetOrgId: number): Promise<boolean> {
    const parentOrg = await this.getOrganizationWithChildren(parentOrgId);
    if (!parentOrg || !parentOrg.children) {
      return false;
    }
    return parentOrg.children.some(child => child.id === targetOrgId);
  }
}