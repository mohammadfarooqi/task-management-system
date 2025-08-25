import { RoleType } from '../role-types';

export interface JwtPayload {
  sub: number; // User ID
  email: string;
  firstName: string;
  lastName: string;
  organizationId: number;
  role: RoleType;
  iat?: number; // Issued at
  exp?: number; // Expiration
}