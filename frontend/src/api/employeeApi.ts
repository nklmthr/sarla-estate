import apiClient from './apiClient';
import { Employee } from '../types';

export const employeeApi = {
  getAllEmployees: async (): Promise<Employee[]> => {
    return apiClient.get<Employee[]>('/employees');
  },
  
  getEmployeeById: async (id: string): Promise<Employee> => {
    return apiClient.get<Employee>(`/employees/${id}`);
  },
  
  getEmployeePhoto: (id: string) => 
    apiClient.get(`/employees/${id}/photo`, { responseType: 'blob' }),
  
  createEmployee: async (employee: Employee): Promise<Employee> => {
    return apiClient.post<Employee>('/employees', employee);
  },
  
  updateEmployee: async (id: string, employee: Employee): Promise<Employee> => {
    return apiClient.put<Employee>(`/employees/${id}`, employee);
  },
  
  deleteEmployee: (id: string) => apiClient.delete(`/employees/${id}`),
  
  searchEmployees: async (term: string): Promise<Employee[]> => {
    return apiClient.get<Employee[]>(`/employees/search?term=${term}`);
  },
};

