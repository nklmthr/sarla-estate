import apiClient from './apiClient';
import { EmployeeSalary } from '../types';

export const salaryApi = {
  getCurrent: (employeeId: string) => 
    apiClient.get<EmployeeSalary>(`/employee-salaries/employee/${employeeId}/current`),
  
  getHistory: (employeeId: string) => 
    apiClient.get<EmployeeSalary[]>(`/employee-salaries/employee/${employeeId}/history`),
  
  getOnDate: (employeeId: string, date: string) => 
    apiClient.get<EmployeeSalary>(`/employee-salaries/employee/${employeeId}/on-date?date=${date}`),
  
  getAllActive: () => apiClient.get<EmployeeSalary[]>('/employee-salaries/active'),
  
  createInitial: (employeeId: string, salary: EmployeeSalary) => 
    apiClient.post<EmployeeSalary>(`/employee-salaries/employee/${employeeId}/initial`, salary),
  
  update: (employeeId: string, salary: EmployeeSalary) => 
    apiClient.post<EmployeeSalary>(`/employee-salaries/employee/${employeeId}/update`, salary),
  
  delete: (salaryId: string) => apiClient.delete(`/employee-salaries/${salaryId}`),
};

