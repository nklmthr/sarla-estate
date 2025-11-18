import apiClient from './apiClient';
import { WorkActivityCompletionCriteria } from '../types';

export const completionCriteriaApi = {
  getAllByActivity: (workActivityId: string) => 
    apiClient.get(`/work-activities/${workActivityId}/completion-criteria`),
  
  getActive: (workActivityId: string) => 
    apiClient.get(`/work-activities/${workActivityId}/completion-criteria/active`),
  
  create: (workActivityId: string, criteria: WorkActivityCompletionCriteria) => 
    apiClient.post(`/work-activities/${workActivityId}/completion-criteria`, criteria),
  
  update: (workActivityId: string, criteriaId: string, criteria: WorkActivityCompletionCriteria) => 
    apiClient.put(`/work-activities/${workActivityId}/completion-criteria/${criteriaId}`, criteria),
  
  delete: (workActivityId: string, criteriaId: string) => 
    apiClient.delete(`/work-activities/${workActivityId}/completion-criteria/${criteriaId}`),
};

