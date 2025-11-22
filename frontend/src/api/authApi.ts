import apiClient from './apiClient';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  id: string;
  username: string;
  fullName?: string;
  email?: string;
  timezone?: string;
  profilePicture?: string;
  role: string;
  permissions: string[];
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/auth/login', credentials);
  },
};

