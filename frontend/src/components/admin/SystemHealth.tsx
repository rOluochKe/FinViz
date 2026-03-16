import React from 'react';

import {
  CheckCircleIcon,
  // Add this import
  CircleStackIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  ServerStackIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface SystemHealthProps {
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    components: {
      database?: { status: string; error?: string };
      cache?: { status: string; error?: string };
      disk?: { status: string; free_gb: number; total_gb: number };
      memory?: { status: string; percent: number; available_gb: number; total_gb: number };
    };
  };
}

const SystemHealth: React.FC<SystemHealthProps> = ({ health }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
      case 'degraded':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(health.status)}`}
        >
          {health.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Database */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <CircleStackIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Database</span>
            </div>
            {getStatusIcon(health.components.database?.status || 'unknown')}
          </div>
          {health.components.database?.status === 'healthy' ? (
            <p className="text-sm text-green-600">Connected</p>
          ) : (
            <p className="text-sm text-red-600">
              {health.components.database?.error || 'Disconnected'}
            </p>
          )}
        </div>

        {/* Cache */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <ServerStackIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Cache</span>
            </div>
            {getStatusIcon(health.components.cache?.status || 'unknown')}
          </div>
          {health.components.cache?.status === 'healthy' ? (
            <p className="text-sm text-green-600">Connected</p>
          ) : (
            <p className="text-sm text-red-600">
              {health.components.cache?.error || 'Disconnected'}
            </p>
          )}
        </div>

        {/* Disk - Fixed with ServerIcon */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <ServerIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Disk</span>
          </div>
          {health.components.disk && (
            <>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  Free: {health.components.disk.free_gb.toFixed(1)} GB
                </span>
                <span className="text-gray-600">
                  Total: {health.components.disk.total_gb.toFixed(1)} GB
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    health.components.disk.free_gb < 10 ? 'bg-red-600' : 'bg-green-500'
                  }`}
                  style={{
                    width: `${(health.components.disk.free_gb / health.components.disk.total_gb) * 100}%`,
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Memory */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <CpuChipIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Memory</span>
          </div>
          {health.components.memory && (
            <>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Used: {health.components.memory.percent}%</span>
                <span className="text-gray-600">
                  Free: {health.components.memory.available_gb.toFixed(1)} GB
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    health.components.memory.percent > 90 ? 'bg-red-600' : 'bg-green-500'
                  }`}
                  style={{ width: `${health.components.memory.percent}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
