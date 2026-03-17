import {
  CacheStats,
  CleanupResult,
  EnvInfo,
  MigrationResult,
  StorageStats,
  SystemHealth,
  SystemStats,
} from '../types';
import api from './api';

class AdminService {
  private static instance: AdminService;

  private constructor() {}

  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    const response = await api.get<SystemStats>('/admin/stats');
    return response;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    const response = await api.get<CacheStats>('/admin/cache');
    return response;
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>('/admin/cache');
    return response;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    const response = await api.get<StorageStats>('/admin/storage');
    return response;
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(): Promise<CleanupResult> {
    const response = await api.post<CleanupResult>('/admin/cleanup');
    return response;
  }

  /**
   * Get application logs
   */
  async getLogs(lines: number = 100): Promise<{ logs: string[]; total: number; showing: number }> {
    const response = await api.get<any>(`/admin/logs?lines=${lines}`);
    return response;
  }

  /**
   * Get environment information
   */
  async getEnvInfo(): Promise<EnvInfo> {
    const response = await api.get<EnvInfo>('/admin/env');
    return response;
  }

  /**
   * Get detailed system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await api.get<SystemHealth>('/admin/health/system');
    return response;
  }

  /**
   * Run database migrations
   */
  async runMigrations(): Promise<MigrationResult> {
    const response = await api.post<MigrationResult>('/admin/migrate');
    return response;
  }
}

export default AdminService.getInstance();
