import apiClient from './apiClient';
import { Employee } from '../types';

export interface PaginatedEmployees {
  content: Employee[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export const employeeApi = {
  getAllEmployees: async (): Promise<Employee[]> => {
    return apiClient.get<Employee[]>('/employees');
  },

  getEmployeesPaginated: async (page: number, size: number): Promise<PaginatedEmployees> => {
    return apiClient.get<PaginatedEmployees>(`/employees/paginated?page=${page}&size=${size}`);
  },

  searchEmployeesPaginated: async (term: string, page: number, size: number): Promise<PaginatedEmployees> => {
    return apiClient.get<PaginatedEmployees>(`/employees/search/paginated?term=${encodeURIComponent(term)}&page=${page}&size=${size}`);
  },
  
  getEmployeeById: async (id: string): Promise<Employee> => {
    return apiClient.get<Employee>(`/employees/${id}`);
  },
  
  getEmployeePhoto: (id: string) => 
    apiClient.get(`/employees/${id}/photo`, { 
      responseType: 'blob',
      silentError: true  // Don't show error dialog for missing photos (404 is expected)
    } as any),
  
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

