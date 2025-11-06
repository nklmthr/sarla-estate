import apiClient from './apiClient';
import { Employee } from '../types';

export const employeeApi = {
  getAllEmployees: () => apiClient.get<Employee[]>('/employees'),
  
  getEmployeeById: (id: string) => apiClient.get<Employee>(`/employees/${id}`),
  
  createEmployee: (employee: Employee) => apiClient.post<Employee>('/employees', employee),
  
  updateEmployee: (id: string, employee: Employee) => apiClient.put<Employee>(`/employees/${id}`, employee),
  
  deleteEmployee: (id: string) => apiClient.delete(`/employees/${id}`),
  
  searchEmployees: (term: string) => apiClient.get<Employee[]>(`/employees/search?term=${term}`),
};

