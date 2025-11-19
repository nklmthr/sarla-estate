import apiClient from './apiClient';
import { EmployeeType } from '../types';

export const employeeTypeApi = {
  getAll: async (): Promise<EmployeeType[]> => {
    return apiClient.get<EmployeeType[]>('/employee-types');
  },

  getActive: async (): Promise<EmployeeType[]> => {
    return apiClient.get<EmployeeType[]>('/employee-types/active');
  },

  getById: async (id: string): Promise<EmployeeType> => {
    return apiClient.get<EmployeeType>(`/employee-types/${id}`);
  },

  create: async (employeeType: Omit<EmployeeType, 'id'>): Promise<EmployeeType> => {
    return apiClient.post<EmployeeType>('/employee-types', employeeType);
  },

  update: async (id: string, employeeType: Omit<EmployeeType, 'id'>): Promise<EmployeeType> => {
    return apiClient.put<EmployeeType>(`/employee-types/${id}`, employeeType);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/employee-types/${id}`);
  },

  toggleActive: async (id: string): Promise<EmployeeType> => {
    return apiClient.patch<EmployeeType>(`/employee-types/${id}/toggle-active`);
  },
};

