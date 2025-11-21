import apiClient from './apiClient';

export interface AuditLog {
  id: string;
  username: string;
  userFullName: string;
  ipAddress: string;
  timestamp: string;
  operation: 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT';
  entityType: string;
  entityId?: string;
  entityName?: string;
  requestMethod: string;
  requestUrl: string;
  oldValue?: string;
  newValue?: string;
  status: 'SUCCESS' | 'FAILURE' | 'UNAUTHORIZED' | 'FORBIDDEN';
  errorMessage?: string;
  userAgent?: string;
  
  // Geolocation fields
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  organization?: string;
}

export interface AuditLogFilters {
  username?: string;
  entityType?: string;
  operation?: 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT';
  ipAddress?: string;
  startDate?: string;
  endDate?: string;
  status?: 'SUCCESS' | 'FAILURE' | 'UNAUTHORIZED' | 'FORBIDDEN';
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface AuditLogResponse {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface UserActivityCount {
  username: string;
  activityCount: number;
  timeRange: string;
  startTime: string;
  endTime: string;
}

export const auditLogApi = {
  /**
   * Get audit logs with filtering and pagination
   */
  getAuditLogs: async (filters: AuditLogFilters = {}): Promise<AuditLogResponse> => {
    const params = new URLSearchParams();
    
    if (filters.username) params.append('username', filters.username);
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.operation) params.append('operation', filters.operation);
    if (filters.ipAddress) params.append('ipAddress', filters.ipAddress);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);

    const response = await apiClient.get<AuditLogResponse>(
      `/audit-logs?${params.toString()}`
    );
    return response;
  },

  /**
   * Get audit history for a specific entity
   */
  getEntityHistory: async (entityId: string): Promise<AuditLog[]> => {
    const response = await apiClient.get<AuditLog[]>(
      `/audit-logs/entity/${entityId}`
    );
    return response;
  },

  /**
   * Get recent activity (last 10 entries)
   */
  getRecentActivity: async (): Promise<AuditLog[]> => {
    const response = await apiClient.get<AuditLog[]>(
      `/audit-logs/recent`
    );
    return response;
  },

  /**
   * Get failed operations
   */
  getFailedOperations: async (page: number = 0, size: number = 50): Promise<AuditLogResponse> => {
    const response = await apiClient.get<AuditLogResponse>(
      `/audit-logs/failed?page=${page}&size=${size}`
    );
    return response;
  },

  /**
   * Get user activity count for the last 24 hours
   */
  getUserActivityCount: async (username: string): Promise<UserActivityCount> => {
    const response = await apiClient.get<UserActivityCount>(
      `/audit-logs/user-activity/${username}`
    );
    return response;
  },

  /**
   * Get audit log statistics
   */
  getStatistics: async (startDate?: string, endDate?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get(
      `/audit-logs/statistics?${params.toString()}`
    );
    return response;
  }
};

