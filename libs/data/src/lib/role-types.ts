// Define RoleType enum directly here to avoid circular dependency
export enum RoleType {
  SYSTEM_ADMIN = 'SystemAdmin',
  OWNER = 'Owner',
  ADMIN = 'Admin',
  VIEWER = 'Viewer'
}

// Helper functions for role permissions
export function hasRolePermission(userRole: string, requiredRole: string): boolean {
  if (!userRole) {
    return false;
  }
  
  // SystemAdmin has all permissions
  if (userRole === 'SystemAdmin') {
    return true;
  }
  
  // Owner has all permissions except SystemAdmin
  if (userRole === 'Owner' && requiredRole !== 'SystemAdmin') {
    return true;
  }
  
  // Admin has admin and viewer permissions
  if (requiredRole === 'Admin' && userRole === 'Admin') {
    return true;
  }
  
  // Check specific role
  return userRole === requiredRole;
}

export function canViewAllOrgTasks(userRole: string): boolean {
  // SystemAdmin, Owner and Admin can view all tasks in their organization hierarchy
  return userRole === 'SystemAdmin' || userRole === 'Owner' || userRole === 'Admin';
}

export function canEditSpecificTask(userRole: string, _taskCreatedBy: number, _currentUserId: number): boolean {
  // SystemAdmin can edit any task
  if (userRole === 'SystemAdmin') {
    return true;
  }
  
  // Owner can edit any task
  if (userRole === 'Owner') {
    return true;
  }
  
  // Admin can edit all tasks in their organization
  if (userRole === 'Admin') {
    return true;
  }
  
  // Viewer cannot edit any tasks
  return false;
}

export function hasPermission(role: string, permission: string): boolean {
  const rolePermissions: Record<string, string[]> = {
    'SystemAdmin': ['create', 'read', 'update', 'delete', 'manage', 'system'],
    'Owner': ['create', 'read', 'update', 'delete', 'manage'],
    'Admin': ['create', 'read', 'update'],
    'Viewer': ['read']
  };
  
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
}

export function canEditTask(userRole: string): boolean {
  if (userRole === 'SystemAdmin') {
    return true;
  }
  if (userRole === 'Owner') {
    return true;
  }
  if (userRole === 'Admin') {
    return true; // Admin can edit all tasks in their organization
  }
  return false;
}