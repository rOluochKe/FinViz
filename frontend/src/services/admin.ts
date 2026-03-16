import api from './api';

interface SystemStats {
  users: number;
  transactions: number;
  categories: number;
  budgets: number;
}

interface CacheStats {
  backend: string;
  hits?: number;
  misses?: number;
  memory?: string;
  keys?: number;
}

interface DiskUsage {
  total_gb: number;
  used_gb: number;
  free_gb: number;
  percent: number;
}

interface StorageStats {
  disk: DiskUsage;
  uploads: {
    total_size_mb: number;
    total_users: number;
    users: Array<{
      user_id: number;
      usage: {
        receipts: { count: number; size: number; mb: number };
        exports: { count: number; size: number; mb: number };
        total: { count: number; size: number; mb: number };
      };
    }>;
  };
}

// interface LogEntry {
//   timestamp: string;
//   level: string;
//   message: string;
// }

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  components: {
    database?: { status: string; error?: string };
    cache?: { status: string; error?: string };
    disk?: { status: string; free_gb: number; total_gb: number };
    memory?: { status: string; percent: number; available_gb: number; total_gb: number };
  };
}

interface EnvInfo {
  environment: string;
  debug: boolean;
  database: string;
  cache: string;
}

interface MigrationResult {
  message: string;
  output: string;
  error?: string;
}

interface CleanupResult {
  message: string;
  count: number;
}

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
