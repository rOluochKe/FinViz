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

    const response = await api.get<Category[]>(`/categories?${params.toString()}`);
    // Handle both response formats
    if (Array.isArray(response)) {
      return response;
    }
    return response || [];
  }

  /**
   * Get a single category by ID
   */
  async getCategory(id: string): Promise<Category> {
    const response = await api.get<Category>(`/categories/${id}`);
    return response;
  }

  /**
   * Create a new category
   */
  async createCategory(data: CategoryCreate): Promise<Category> {
    const response = await api.post<Category>('/categories', data);
    return response;
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: string, data: Partial<CategoryCreate>): Promise<Category> {
    const response = await api.put<Category>(`/categories/${id}`, data);
    return response;
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
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
  async getCategoryTransactions(categoryId: string): Promise<{
    category: Category;
    transactions: any[];
    total: number;
  }> {
    // Define the expected response type
    interface CategoryTransactionsResponse {
      category: Category;
      transactions: any[];
      total: number;
    }

    const response = await api.get<CategoryTransactionsResponse>(
      `/categories/${categoryId}/transactions`
    );
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
