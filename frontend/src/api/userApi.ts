import apiClient from './apiClient';

export interface UserProfile {
  id: string;
  username: string;
  fullName: string | null;
  email: string | null;
  timezone: string | null;
  profilePicture: string | null;
  role: string;
  permissions: string[];
}

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  timezone?: string;
}

export interface ChangePasswordRequest {
  oldPassword?: string;
  newPassword?: string;
}

export interface User {
  id?: string;
  username: string;
  fullName?: string;
  email?: string;
  roleId?: string;
  role?: string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  password?: string;
}

export const userApi = {
  // Profile Methods
  getProfile: async (): Promise<UserProfile> => {
    return apiClient.get<UserProfile>('/users/profile');
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    return apiClient.put<UserProfile>('/users/profile', data);
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.put('/users/profile/password', data);
  },

  uploadProfilePicture: async (file: File): Promise<UserProfile> => {
    const formData = new FormData();
    formData.append('file', file);

    // Don't set Content-Type header manually for multipart/form-data
    // Axios will set it automatically with the correct boundary
    const response = await apiClient.post<UserProfile>('/users/profile/picture', formData);
    return response;
  },

  getProfilePicture: async (userId: string): Promise<Blob> => {
    return apiClient.get(`/users/profile/picture/${userId}`, {
      responseType: 'blob',
      silentError: true  // Don't show error dialog for missing photos (404 is expected)
    } as any);
  },

  deleteProfilePicture: async (): Promise<UserProfile> => {
    return apiClient.delete<UserProfile>('/users/profile/picture');
  },

  // User Management Methods
  getAllUsers: async (): Promise<User[]> => {
    return apiClient.get<User[]>('/users');
  },

  getUserById: async (id: string): Promise<User> => {
    return apiClient.get<User>(`/users/${id}`);
  },

  createUser: async (user: User): Promise<User> => {
    return apiClient.post<User>('/users', user);
  },

  updateUser: async (id: string, user: User): Promise<User> => {
    return apiClient.put<User>(`/users/${id}`, user);
  },

  deleteUser: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/users/${id}`);
  },
};
