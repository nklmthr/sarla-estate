import apiClient from './apiClient';

// Permission is actually just a string enum value from the backend
// e.g., "VIEW_DASHBOARD", "CREATE_USER", etc.
export type Permission = string;

export interface Role {
  id?: string;
  name: string;
  description?: string;
  permissions: Permission[]; // Permission enum values as strings
  isSystemRole?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const roleApi = {
  getAllRoles: async (): Promise<Role[]> => {
    return apiClient.get<Role[]>('/roles');
  },

  getActiveRoles: async (): Promise<Role[]> => {
    return apiClient.get<Role[]>('/roles/active');
  },

  getRoleById: async (id: string): Promise<Role> => {
    return apiClient.get<Role>(`/roles/${id}`);
  },

  getRoleByName: async (name: string): Promise<Role> => {
    return apiClient.get<Role>(`/roles/name/${name}`);
  },

  createRole: async (role: Role): Promise<Role> => {
    return apiClient.post<Role>('/roles', role);
  },

  updateRole: async (id: string, role: Role): Promise<Role> => {
    return apiClient.put<Role>(`/roles/${id}`, role);
  },

  deleteRole: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/roles/${id}`);
  },

  getAllPermissions: async (): Promise<Permission[]> => {
    return apiClient.get<Permission[]>('/roles/permissions');
  },
};

