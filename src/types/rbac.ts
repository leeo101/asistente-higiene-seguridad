export type UserRole = 
  | 'superadmin'
  | 'auditor'
  | 'technician'
  | 'supervisor'
  | 'contractor'
  | 'viewer';

export interface RBACPermissions {
  canCreateInspection: boolean;
  canEditInspection: boolean;
  canDeleteInspection: boolean;
  canApproveCAPA: boolean;
  canCreateCAPA: boolean;
  canManageUsers: boolean;
  canManageCompany: boolean;
  canExportData: boolean;
  canImportData: boolean;
  canViewReports: boolean;
}

export interface UserProfileRBAC {
  uid: string;
  email: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
  branchId?: string;
  permissions: RBACPermissions;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, RBACPermissions> = {
  superadmin: {
    canCreateInspection: true,
    canEditInspection: true,
    canDeleteInspection: true,
    canApproveCAPA: true,
    canCreateCAPA: true,
    canManageUsers: true,
    canManageCompany: true,
    canExportData: true,
    canImportData: true,
    canViewReports: true,
  },
  auditor: {
    canCreateInspection: true,
    canEditInspection: true,
    canDeleteInspection: false,
    canApproveCAPA: true,
    canCreateCAPA: true,
    canManageUsers: false,
    canManageCompany: false,
    canExportData: true,
    canImportData: true,
    canViewReports: true,
  },
  technician: {
    canCreateInspection: true,
    canEditInspection: true,
    canDeleteInspection: false,
    canApproveCAPA: false,
    canCreateCAPA: true,
    canManageUsers: false,
    canManageCompany: false,
    canExportData: true,
    canImportData: false,
    canViewReports: true,
  },
  supervisor: {
    canCreateInspection: true,
    canEditInspection: false,
    canDeleteInspection: false,
    canApproveCAPA: true,
    canCreateCAPA: true,
    canManageUsers: false,
    canManageCompany: false,
    canExportData: true,
    canImportData: false,
    canViewReports: true,
  },
  contractor: {
    canCreateInspection: false,
    canEditInspection: false,
    canDeleteInspection: false,
    canApproveCAPA: false,
    canCreateCAPA: true,
    canManageUsers: false,
    canManageCompany: false,
    canExportData: false,
    canImportData: false,
    canViewReports: false,
  },
  viewer: {
    canCreateInspection: false,
    canEditInspection: false,
    canDeleteInspection: false,
    canApproveCAPA: false,
    canCreateCAPA: false,
    canManageUsers: false,
    canManageCompany: false,
    canExportData: true,
    canImportData: false,
    canViewReports: true,
  },
};

export function getPermissionsForRole(role?: UserRole): RBACPermissions {
  if (!role || !(role in DEFAULT_ROLE_PERMISSIONS)) {
    // Default fallback to technician/standard user permissions
    return DEFAULT_ROLE_PERMISSIONS.technician;
  }
  return DEFAULT_ROLE_PERMISSIONS[role];
}
