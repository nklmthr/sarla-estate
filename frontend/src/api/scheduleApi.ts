import apiClient from './apiClient';
import { OperationSchedule } from '../types';

export const scheduleApi = {
  getAllSchedules: () => apiClient.get<OperationSchedule[]>('/operation-schedules'),
  
  getScheduleById: (id: string) => apiClient.get<OperationSchedule>(`/operation-schedules/${id}`),
  
  createSchedule: (schedule: OperationSchedule) => 
    apiClient.post<OperationSchedule>('/operation-schedules', schedule),
  
  updateSchedule: (id: string, schedule: OperationSchedule) => 
    apiClient.put<OperationSchedule>(`/operation-schedules/${id}`, schedule),
  
  deleteSchedule: (id: string) => apiClient.delete(`/operation-schedules/${id}`),
  
  generateAssignments: (id: string) => 
    apiClient.post<OperationSchedule>(`/operation-schedules/${id}/generate-assignments`),
};
