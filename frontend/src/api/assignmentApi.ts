import apiClient from './apiClient';
import { WorkAssignment } from '../types';

export const assignmentApi = {
  getAllAssignments: () => apiClient.get<WorkAssignment[]>('/work-assignments'),
  
  getAssignmentById: (id: string) => apiClient.get<WorkAssignment>(`/work-assignments/${id}`),
  
  getAssignmentsByEmployee: (employeeId: string) => 
    apiClient.get<WorkAssignment[]>(`/work-assignments/by-employee/${employeeId}`),
  
  getUnassignedAssignments: (startDate: string) => 
    apiClient.get<WorkAssignment[]>(`/work-assignments/unassigned?startDate=${startDate}`),
  
  updateAssignment: (id: string, assignment: WorkAssignment) => 
    apiClient.put<WorkAssignment>(`/work-assignments/${id}`, assignment),
  
  assignToEmployee: (id: string, data: { employeeId: string }) => 
    apiClient.post<WorkAssignment>(`/work-assignments/${id}/assign`, data),
  
  unassignFromEmployee: (id: string) => 
    apiClient.post<WorkAssignment>(`/work-assignments/${id}/unassign`),
  
  markAsCompleted: (id: string, data: { completionNotes?: string; actualDurationHours?: number; completionPercentage?: number }) => 
    apiClient.post<WorkAssignment>(`/work-assignments/${id}/complete`, data),
  
  updateCompletionPercentage: (id: string, data: { completionPercentage: number }) => 
    apiClient.post<WorkAssignment>(`/work-assignments/${id}/update-completion`, data),
  
  deleteAssignment: (id: string) => apiClient.delete(`/work-assignments/${id}`),
};
