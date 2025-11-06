import apiClient from './apiClient';
import { WorkActivity } from '../types';

export const workActivityApi = {
  getAllWorkActivities: () => apiClient.get<WorkActivity[]>('/work-activities'),
  
  getWorkActivityById: (id: string) => apiClient.get<WorkActivity>(`/work-activities/${id}`),
  
  createWorkActivity: (activity: WorkActivity) => apiClient.post<WorkActivity>('/work-activities', activity),
  
  updateWorkActivity: (id: string, activity: WorkActivity) => 
    apiClient.put<WorkActivity>(`/work-activities/${id}`, activity),
  
  deleteWorkActivity: (id: string) => apiClient.delete(`/work-activities/${id}`),
  
  searchWorkActivities: (term: string) => apiClient.get<WorkActivity[]>(`/work-activities/search?term=${term}`),
  
  getWorkActivitiesByStatus: (status: string) => 
    apiClient.get<WorkActivity[]>(`/work-activities/by-status/${status}`),
  
  getWorkActivitiesByFrequency: (frequency: string) => 
    apiClient.get<WorkActivity[]>(`/work-activities/by-frequency/${frequency}`),
  
  getSchedulableActivities: () => apiClient.get<WorkActivity[]>('/work-activities/schedulable'),
};

