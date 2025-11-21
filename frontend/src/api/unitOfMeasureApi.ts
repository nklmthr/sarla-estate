import apiClient from './apiClient';

export interface UnitOfMeasure {
  id?: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const unitOfMeasureApi = {
  getAllUnits: () => apiClient.get<UnitOfMeasure[]>('/units-of-measure'),
  
  getActiveUnits: () => apiClient.get<UnitOfMeasure[]>('/units-of-measure/active'),
  
  getUnitById: (id: string) => apiClient.get<UnitOfMeasure>(`/units-of-measure/${id}`),
  
  createUnit: (unit: UnitOfMeasure) => apiClient.post<UnitOfMeasure>('/units-of-measure', unit),
  
  updateUnit: (id: string, unit: UnitOfMeasure) => 
    apiClient.put<UnitOfMeasure>(`/units-of-measure/${id}`, unit),
  
  deleteUnit: (id: string) => apiClient.delete(`/units-of-measure/${id}`),
};

