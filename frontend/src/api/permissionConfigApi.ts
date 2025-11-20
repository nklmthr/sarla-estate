import apiClient from './apiClient';

export interface PermissionConfig {
  id?: string;
  resourceType: string;
  operationType: string;
  requiredPermission: string; // Permission enum value
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const permissionConfigApi = {
  getAllPermissionConfigs: async (): Promise<PermissionConfig[]> => {
    return apiClient.get<PermissionConfig[]>('/permission-configs');
  },

  getActivePermissionConfigs: async (): Promise<PermissionConfig[]> => {
    return apiClient.get<PermissionConfig[]>('/permission-configs/active');
  },

  getPermissionConfigById: async (id: string): Promise<PermissionConfig> => {
    return apiClient.get<PermissionConfig>(`/permission-configs/${id}`);
  },

  getPermissionConfigsByResource: async (resourceType: string): Promise<PermissionConfig[]> => {
    return apiClient.get<PermissionConfig[]>(`/permission-configs/resource/${resourceType}`);
  },

  createPermissionConfig: async (config: PermissionConfig): Promise<PermissionConfig> => {
    return apiClient.post<PermissionConfig>('/permission-configs', config);
  },

  updatePermissionConfig: async (id: string, config: PermissionConfig): Promise<PermissionConfig> => {
    return apiClient.put<PermissionConfig>(`/permission-configs/${id}`, config);
  },

  deletePermissionConfig: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/permission-configs/${id}`);
  },
};

