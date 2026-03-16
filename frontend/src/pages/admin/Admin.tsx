import React, { useCallback, useEffect, useState } from 'react';

import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

import toast from 'react-hot-toast';

import CacheStats from '../../components/admin/CacheStats';
import EnvInfo from '../../components/admin/EnvInfo';
import LogViewer from '../../components/admin/LogViewer';
import StatsCards from '../../components/admin/StatsCards';
import StorageStats from '../../components/admin/StorageStats';
import SystemHealth from '../../components/admin/SystemHealth';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import adminService from '../../services/admin';

const Admin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [systemStats, setSystemStats] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [envInfo, setEnvInfo] = useState<any>(null);
  const [logs, setLogs] = useState<any>(null);

  // Modal states
  const [isMigrateModalOpen, setIsMigrateModalOpen] = useState(false);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [, setCleanupResult] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadAllData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [stats, cache, storage, health, env, logsData] = await Promise.allSettled([
        adminService.getSystemStats(),
        adminService.getCacheStats(),
        adminService.getStorageStats(),
        adminService.getSystemHealth(),
        adminService.getEnvInfo(),
        adminService.getLogs(100),
      ]);

      if (stats.status === 'fulfilled') setSystemStats(stats.value);
      if (cache.status === 'fulfilled') setCacheStats(cache.value);
      if (storage.status === 'fulfilled') setStorageStats(storage.value);
      if (health.status === 'fulfilled') setSystemHealth(health.value);
      if (env.status === 'fulfilled') setEnvInfo(env.value);
      if (logsData.status === 'fulfilled') setLogs(logsData.value);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleRefresh = () => {
    loadAllData(true);
  };

  const handleClearCache = async () => {
    try {
      const result = await adminService.clearCache();
      toast.success(result.message);
      // Refresh cache stats
      const stats = await adminService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      toast.error('Failed to clear cache');
    }
  };

  const handleCleanup = async () => {
    setActionLoading(true);
    try {
      const result = await adminService.cleanupTempFiles();
      setCleanupResult(result);
      setIsCleanupModalOpen(false);
      toast.success(result.message);
      // Refresh storage stats
      const stats = await adminService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      toast.error('Failed to clean up temp files');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunMigrations = async () => {
    setActionLoading(true);
    try {
      const result = await adminService.runMigrations();
      setMigrationResult(result);
      toast.success(result.message);
    } catch (error) {
      toast.error('Failed to run migrations');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLoadMoreLogs = async (lines: number) => {
    try {
      const newLogs = await adminService.getLogs(lines);
      setLogs(newLogs);
    } catch (error) {
      toast.error('Failed to load more logs');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">System administration and monitoring</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            isLoading={refreshing}
            disabled={refreshing}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Admin Warning */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start">
        <ShieldCheckIcon className="h-5 w-5 text-purple-600 mr-3 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-purple-800">Administrator Access</h3>
          <p className="text-xs text-purple-700 mt-1">
            You are logged in as an administrator. You have full access to system settings, cache
            management, and database operations. Be careful with destructive actions as they may
            affect all users.
          </p>
        </div>
      </div>

      {/* System Stats */}
      {systemStats && <StatsCards stats={systemStats} />}

      {/* System Health */}
      {systemHealth && <SystemHealth health={systemHealth} />}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cache Stats */}
        {cacheStats && (
          <CacheStats stats={cacheStats} onClearCache={handleClearCache} clearing={actionLoading} />
        )}

        {/* Storage Stats */}
        {storageStats && <StorageStats stats={storageStats} />}
      </div>

      {/* Environment Info */}
      {envInfo && <EnvInfo env={envInfo} />}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setIsCleanupModalOpen(true)}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cleanup Temp Files</h3>
          <p className="text-sm text-gray-500 mb-4">
            Remove temporary uploaded files older than 24 hours
          </p>
          <span className="text-sm text-primary-600 font-medium">Run Cleanup →</span>
        </button>

        <button
          onClick={() => setIsMigrateModalOpen(true)}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Migrations</h3>
          <p className="text-sm text-gray-500 mb-4">
            Run pending database migrations (use with caution)
          </p>
          <span className="text-sm text-primary-600 font-medium">Run Migrations →</span>
        </button>
      </div>

      {/* Log Viewer */}
      {logs && (
        <LogViewer
          logs={logs.logs}
          total={logs.total}
          showing={logs.showing}
          onRefresh={() => handleLoadMoreLogs(100)}
          onLoadMore={handleLoadMoreLogs}
          loading={refreshing}
        />
      )}

      {/* Cleanup Confirmation Modal */}
      <Modal
        isOpen={isCleanupModalOpen}
        onClose={() => setIsCleanupModalOpen(false)}
        title="Cleanup Temporary Files"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start p-4 bg-yellow-50 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
              <p className="text-sm text-yellow-700">
                This will permanently delete all temporary files older than 24 hours. This action
                cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsCleanupModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleCleanup}
              isLoading={actionLoading}
            >
              Cleanup Files
            </Button>
          </div>
        </div>
      </Modal>

      {/* Migration Confirmation Modal */}
      <Modal
        isOpen={isMigrateModalOpen}
        onClose={() => setIsMigrateModalOpen(false)}
        title="Run Database Migrations"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-start p-4 bg-red-50 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Dangerous Action</h3>
              <p className="text-sm text-red-700">
                Running migrations can modify your database schema. Make sure you have a backup
                before proceeding. This action may cause temporary downtime.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsMigrateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={async () => {
                await handleRunMigrations();
                setIsMigrateModalOpen(false);
              }}
              isLoading={actionLoading}
            >
              Run Migrations
            </Button>
          </div>

          {migrationResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Migration Result</h4>
              <pre className="text-xs bg-gray-900 text-gray-300 p-3 rounded-lg overflow-x-auto">
                {migrationResult.output || migrationResult.message}
                {migrationResult.error && (
                  <span className="text-red-400 block mt-2">{migrationResult.error}</span>
                )}
              </pre>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Admin;
