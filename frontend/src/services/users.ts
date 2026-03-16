import { User } from '../types';
import api from './api';

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  pages: number;
  per_page: number;
}

interface UserUpdateData {
  first_name?: string;
  last_name?: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'inactive' | 'suspended';
  preferences?: any;
}

class UsersService {
  private static instance: UsersService;

  private constructor() {}

  public static getInstance(): UsersService {
    if (!UsersService.instance) {
      UsersService.instance = new UsersService();
    }
    return UsersService.instance;
  }

  /**
   * Get paginated list of all users (admin only)
   */
  async getUsers(page: number = 1, perPage: number = 20, search?: string): Promise<UsersResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    if (search) params.append('search', search);

    const response = await api.get<UsersResponse>(`/users?${params.toString()}`);
    return response;
  }

  /**
   * Get a single user by ID (admin only)
   */
  async getUser(id: number): Promise<User> {
    const response = await api.get<{ user: User }>(`/users/${id}`);
    return response.user;
  }

  /**
   * Update a user (admin only)
   */
  async updateUser(id: number, data: UserUpdateData): Promise<User> {
    const response = await api.put<{ user: User }>(`/users/${id}`, data);
    return response.user;
  }

  /**
   * Delete a user (admin only)
   */
  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  }

  /**
   * Activate a user account (admin only)
   */
  async activateUser(id: number): Promise<User> {
    const response = await api.post<{ user: User }>(`/users/${id}/activate`);
    return response.user;
  }

  /**
   * Deactivate a user account (admin only)
   */
  async deactivateUser(id: number): Promise<User> {
    const response = await api.post<{ user: User }>(`/users/${id}/deactivate`);
    return response.user;
  }
}

export default UsersService.getInstance();
