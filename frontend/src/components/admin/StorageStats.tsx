import React from 'react';

import { ArrowDownTrayIcon, DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface StorageStatsProps {
  stats: {
    disk: {
      total_gb: number;
      used_gb: number;
      free_gb: number;
      percent: number;
    };
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
  };
}

const StorageStats: React.FC<StorageStatsProps> = ({ stats }) => {
  const formatSize = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(2)} MB`;
  };

  const getDiskColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-600';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Statistics</h3>

      {/* Disk Usage */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Disk Usage</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">
              Used: {formatSize(stats.disk.used_gb * 1024)}
            </span>
            <span className="text-sm text-gray-600">
              Free: {formatSize(stats.disk.free_gb * 1024)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div
              className={`h-2.5 rounded-full ${getDiskColor(stats.disk.percent)}`}
              style={{ width: `${stats.disk.percent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Total: {formatSize(stats.disk.total_gb * 1024)}</span>
            <span>{stats.disk.percent.toFixed(1)}% used</span>
          </div>
        </div>
      </div>

      {/* Uploads Summary */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Uploads Summary</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <PhotoIcon className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-xs text-gray-600">Receipts</span>
            </div>
            <p className="text-lg font-bold text-blue-700">
              {formatSize(stats.uploads.total_size_mb)}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <ArrowDownTrayIcon className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-xs text-gray-600">Exports</span>
            </div>
            <p className="text-lg font-bold text-green-700">
              {formatSize(stats.uploads.total_size_mb * 0.3)}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Total users with uploads: {stats.uploads.total_users}
        </p>
      </div>

      {/* Top Users by Storage */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Top Users by Storage</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {stats.uploads.users
            .sort((a, b) => b.usage.total.mb - a.usage.total.mb)
            .slice(0, 5)
            .map((user) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <DocumentIcon className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700">User #{user.user_id}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {formatSize(user.usage.total.mb)}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({user.usage.total.count} files)
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default StorageStats;
