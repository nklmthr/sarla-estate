import apiClient from './apiClient';
import { EmployeeStatus } from '../types';

export const employeeStatusApi = {
  getAll: async (): Promise<EmployeeStatus[]> => {
    return apiClient.get<EmployeeStatus[]>('/employee-statuses');
  },

  getActive: async (): Promise<EmployeeStatus[]> => {
    return apiClient.get<EmployeeStatus[]>('/employee-statuses/active');
  },

  getById: async (id: string): Promise<EmployeeStatus> => {
    return apiClient.get<EmployeeStatus>(`/employee-statuses/${id}`);
  },

  create: async (employeeStatus: Omit<EmployeeStatus, 'id'>): Promise<EmployeeStatus> => {
    return apiClient.post<EmployeeStatus>('/employee-statuses', employeeStatus);
  },

  update: async (id: string, employeeStatus: Omit<EmployeeStatus, 'id'>): Promise<EmployeeStatus> => {
    return apiClient.put<EmployeeStatus>(`/employee-statuses/${id}`, employeeStatus);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/employee-statuses/${id}`);
  },

  toggleActive: async (id: string): Promise<EmployeeStatus> => {
    return apiClient.patch<EmployeeStatus>(`/employee-statuses/${id}/toggle-active`);
  },
};

