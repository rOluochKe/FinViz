import React from 'react';

import { ArrowPathIcon, CubeIcon, ServerIcon } from '@heroicons/react/24/outline';

interface CacheStatsProps {
  stats: {
    backend: string;
    hits?: number;
    misses?: number;
    memory?: string;
    keys?: number;
  };
  onClearCache: () => Promise<void>;
  clearing: boolean;
}

const CacheStats: React.FC<CacheStatsProps> = ({ stats, onClearCache, clearing }) => {
  const formatNumber = (num?: number) => {
    if (num === undefined) return 'N/A';
    return num.toLocaleString();
  };

  const hitRate =
    stats.hits && stats.misses
      ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1)
      : 'N/A';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Cache Statistics</h3>
        <button
          onClick={onClearCache}
          disabled={clearing}
          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {clearing ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : 'Clear Cache'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <ServerIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm text-gray-500">Backend</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{stats.backend}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <CubeIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm text-gray-500">Total Keys</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{formatNumber(stats.keys)}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Cache Hits</span>
          <span className="font-medium text-green-600">{formatNumber(stats.hits)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Cache Misses</span>
          <span className="font-medium text-red-600">{formatNumber(stats.misses)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Hit Rate</span>
          <span className="font-medium text-blue-600">{hitRate}%</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-gray-600">Memory Usage</span>
          <span className="font-medium text-gray-900">{stats.memory || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default CacheStats;
