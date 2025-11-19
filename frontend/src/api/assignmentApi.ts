import apiClient from './apiClient';
import { WorkAssignment } from '../types';

export const assignmentApi = {
  getAllAssignments: async (): Promise<WorkAssignment[]> => {
    return apiClient.get<WorkAssignment[]>('/work-assignments');
  },
  
  getAssignmentById: async (id: string): Promise<WorkAssignment> => {
    return apiClient.get<WorkAssignment>(`/work-assignments/${id}`);
  },
  
  getAssignmentsByEmployee: async (employeeId: string): Promise<WorkAssignment[]> => {
    return apiClient.get<WorkAssignment[]>(`/work-assignments/by-employee/${employeeId}`);
  },

  getAssignmentsByDateRange: async (
    startDate: string,
    endDate: string,
    employeeIds?: string[]
  ): Promise<WorkAssignment[]> => {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    if (employeeIds && employeeIds.length > 0) {
      employeeIds.forEach(id => params.append('employeeIds', id));
    }
    return apiClient.get<WorkAssignment[]>(`/work-assignments/by-date-range?${params.toString()}`);
  },
  
  getUnassignedAssignments: async (startDate: string): Promise<WorkAssignment[]> => {
    return apiClient.get<WorkAssignment[]>(`/work-assignments/unassigned?startDate=${startDate}`);
  },
  
  createAssignment: async (assignment: WorkAssignment): Promise<WorkAssignment> => {
    return apiClient.post<WorkAssignment>('/work-assignments', assignment);
  },
  
  updateAssignment: async (id: string, assignment: WorkAssignment): Promise<WorkAssignment> => {
    return apiClient.put<WorkAssignment>(`/work-assignments/${id}`, assignment);
  },
  
  assignToEmployee: async (id: string, data: { employeeId: string }): Promise<WorkAssignment> => {
    return apiClient.post<WorkAssignment>(`/work-assignments/${id}/assign`, data);
  },
  
  unassignFromEmployee: async (id: string): Promise<WorkAssignment> => {
    return apiClient.post<WorkAssignment>(`/work-assignments/${id}/unassign`);
  },
  
  markAsCompleted: async (id: string, data: { completionNotes?: string; actualDurationHours?: number; completionPercentage?: number }): Promise<WorkAssignment> => {
    return apiClient.post<WorkAssignment>(`/work-assignments/${id}/complete`, data);
  },
  
  updateCompletionPercentage: async (id: string, data: { actualValue: number }): Promise<WorkAssignment> => {
    return apiClient.post<WorkAssignment>(`/work-assignments/${id}/update-completion`, data);
  },
  
  deleteAssignment: async (id: string): Promise<void> => {
    return apiClient.delete(`/work-assignments/${id}`);
  },
};
