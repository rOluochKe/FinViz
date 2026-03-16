import React, { useState } from 'react';

import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import Button from '../common/Button';

interface LogViewerProps {
  logs: string[];
  total: number;
  showing: number;
  onRefresh: () => void;
  onLoadMore: (lines: number) => void;
  loading: boolean;
}

const LogViewer: React.FC<LogViewerProps> = ({ logs, total, onRefresh, onLoadMore, loading }) => {
  const [filter, setFilter] = useState('');
  const [level, setLevel] = useState<string>('all');
  const [lines, setLines] = useState(100);

  const filteredLogs = logs
    .filter((log) => {
      if (!filter) return true;
      return log.toLowerCase().includes(filter.toLowerCase());
    })
    .filter((log) => {
      if (level === 'all') return true;
      if (level === 'error') return log.includes('ERROR');
      if (level === 'warning') return log.includes('WARN');
      if (level === 'info') return log.includes('INFO');
      if (level === 'debug') return log.includes('DEBUG');
      return true;
    });

  const getLogColor = (log: string) => {
    if (log.includes('ERROR')) return 'text-red-600 bg-red-50';
    if (log.includes('WARN')) return 'text-yellow-600 bg-yellow-50';
    if (log.includes('INFO')) return 'text-blue-600 bg-blue-50';
    if (log.includes('DEBUG')) return 'text-purple-600 bg-purple-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Application Logs</h3>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="secondary" onClick={onRefresh} disabled={loading}>
            <ArrowPathIcon className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field pl-9 text-sm py-1"
            />
          </div>
        </div>

        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="input-field text-sm py-1 w-32"
        >
          <option value="all">All Levels</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>

        <select
          value={lines}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            setLines(val);
            onLoadMore(val);
          }}
          className="input-field text-sm py-1 w-32"
        >
          <option value="50">50 lines</option>
          <option value="100">100 lines</option>
          <option value="200">200 lines</option>
          <option value="500">500 lines</option>
          <option value="1000">1000 lines</option>
        </select>
      </div>

      {/* Log Count */}
      <div className="text-xs text-gray-500 mb-2">
        Showing {filteredLogs.length} of {total} total logs
        {filter && ` (filtered)`}
      </div>

      {/* Logs */}
      <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs h-96 overflow-y-auto">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log, index) => {
            const color = getLogColor(log);
            return (
              <div
                key={index}
                className={`mb-1 p-1 rounded ${color} hover:opacity-90 transition-opacity`}
              >
                <span className="whitespace-pre-wrap break-words">{log}</span>
              </div>
            );
          })
        ) : (
          <div className="text-gray-500 text-center py-8">No logs found</div>
        )}
      </div>
    </div>
  );
};

export default LogViewer;
