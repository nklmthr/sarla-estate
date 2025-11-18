import apiClient from './apiClient';
import { WorkActivityCompletionCriteria } from '../types';

export const completionCriteriaApi = {
  getAllByActivity: async (workActivityId: string): Promise<WorkActivityCompletionCriteria[]> => {
    return apiClient.get<WorkActivityCompletionCriteria[]>(`/work-activities/${workActivityId}/completion-criteria`);
  },
  
  getActive: async (workActivityId: string): Promise<WorkActivityCompletionCriteria | null> => {
    try {
      return await apiClient.get<WorkActivityCompletionCriteria>(`/work-activities/${workActivityId}/completion-criteria/active`);
    } catch (error: any) {
      // Return null if no active criteria found (204 No Content)
      if (error?.response?.status === 204) {
        return null;
      }
      throw error;
    }
  },
  
  create: async (workActivityId: string, criteria: WorkActivityCompletionCriteria): Promise<WorkActivityCompletionCriteria> => {
    return apiClient.post<WorkActivityCompletionCriteria>(`/work-activities/${workActivityId}/completion-criteria`, criteria);
  },
  
  update: async (workActivityId: string, criteriaId: string, criteria: WorkActivityCompletionCriteria): Promise<WorkActivityCompletionCriteria> => {
    return apiClient.put<WorkActivityCompletionCriteria>(`/work-activities/${workActivityId}/completion-criteria/${criteriaId}`, criteria);
  },
  
  delete: async (workActivityId: string, criteriaId: string): Promise<void> => {
    return apiClient.delete(`/work-activities/${workActivityId}/completion-criteria/${criteriaId}`);
  },
};

