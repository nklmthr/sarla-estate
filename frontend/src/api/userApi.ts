import apiClient from './apiClient';

export interface User {
  id?: string;
  username: string;
  fullName?: string;
  email?: string;
  roleId?: string; // Role ID for assignment
  role?: string; // Role name for display
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  password?: string; // Only for create/update
}

export const userApi = {
  getAllUsers: async (): Promise<User[]> => {
    return apiClient.get<User[]>('/users');
  },

  getUserById: async (id: string): Promise<User> => {
    return apiClient.get<User>(`/users/${id}`);
  },

  getUserByUsername: async (username: string): Promise<User> => {
    return apiClient.get<User>(`/users/username/${username}`);
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

