import { Category, CategoryCreate, CategoryStats } from '../types';
import api from './api';

class CategoryService {
  private static instance: CategoryService;

  private constructor() {}

  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  /**
   * Get all categories with optional filters
   */
  async getCategories(type?: string, includeSystem: boolean = true): Promise<Category[]> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('include_system', includeSystem.toString());

    const response = await api.get<{ categories: Category[] }>(`/categories?${params.toString()}`);
    return response.categories || [];
  }

  /**
   * Get a single category by ID
   */
  async getCategory(id: number): Promise<Category> {
    const response = await api.get<{ category: Category }>(`/categories/${id}`);
    return response.category;
  }

  /**
   * Create a new category
   */
  async createCategory(data: CategoryCreate): Promise<Category> {
    const response = await api.post<{ category: Category }>('/categories', data);
    return response.category;
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: number, data: Partial<CategoryCreate>): Promise<Category> {
    const response = await api.put<{ category: Category }>(`/categories/${id}`, data);
    return response.category;
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  }

  /**
   * Get category hierarchy (tree structure)
   */
  async getCategoryHierarchy(): Promise<any[]> {
    const response = await api.get<{ categories: any[] }>('/categories/hierarchy');
    return response.categories || [];
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(): Promise<CategoryStats[]> {
    const response = await api.get<{ stats: CategoryStats[] }>('/categories/stats');
    return response.stats || [];
  }

  /**
   * Get transactions for a specific category
   */
  async getCategoryTransactions(categoryId: number): Promise<any> {
    const response = await api.get(`/categories/${categoryId}/transactions`);
    return response;
  }

  /**
   * Create default categories for the current user
   */
  async createDefaultCategories(): Promise<{ message: string; categories: string[] }> {
    const response = await api.post<{ message: string; categories: string[] }>(
      '/categories/defaults'
    );
    return response;
  }
}

export default CategoryService.getInstance();
