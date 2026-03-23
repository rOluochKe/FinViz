import React, { useMemo, useState } from 'react';

import { ExclamationTriangleIcon, EyeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import { format } from 'date-fns';

import { Anomaly } from '../../types';

interface AnomaliesProps {
  data: {
    total: number;
    anomalies: number;
    threshold: number;
    items: Anomaly[];
  };
  onViewTransaction?: (id: string) => void; // Change from number to string
}

const Anomalies: React.FC<AnomaliesProps> = ({ data, onViewTransaction }) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Ensure data has default values
  const safeData = {
    total: data?.total || 0,
    anomalies: data?.anomalies || 0,
    threshold: data?.threshold || 2.0,
    items: data?.items || [],
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAnomalyColor = (zScore: number) => {
    if (zScore > 3) return 'bg-red-100 text-red-800 border-red-200';
    if (zScore > 2) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  // Memoize filtered items to prevent unnecessary recalculations
  const filteredItems = useMemo(() => {
    if (!safeData.items.length) return [];

    return safeData.items.filter((item) => {
      if (selectedType !== 'all' && item.type !== selectedType) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.description?.toLowerCase().includes(searchLower) ||
          item.desc?.toLowerCase().includes(searchLower) ||
          item.category?.toLowerCase().includes(searchLower) ||
          item.reason?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [safeData.items, selectedType, searchTerm]);

  // Get the transaction ID from the item (could be id or transaction_id)
  const getTransactionId = (item: Anomaly): string | undefined => {
    return item.id || item.transaction_id;
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Anomaly Detection</h2>
            <p className="text-sm text-gray-500 mt-1">
              Unusual transactions detected using statistical analysis
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-red-600">{safeData.anomalies}</p>
            <p className="text-sm text-gray-500">anomalies found</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Threshold:</span> {safeData.threshold} standard deviations
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search anomalies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input-field w-40"
          >
            <option value="all">All Types</option>
            <option value="global">Global</option>
            <option value="category">Category</option>
            <option value="frequency">Frequency</option>
          </select>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detected Anomalies</h3>
        </div>

        {filteredItems.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredItems.map((item, index) => {
              const transactionId = getTransactionId(item);
              return (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <ExclamationTriangleIcon
                          className={`h-5 w-5 mr-2 ${
                            item.type === 'global' ? 'text-red-500' : 'text-yellow-500'
                          }`}
                        />
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getAnomalyColor(item.z_score)}`}
                        >
                          {item.type || 'anomaly'} · Z-score: {item.z_score.toFixed(2)}
                        </span>
                      </div>

                      <p className="text-lg font-medium text-gray-900 mb-1">
                        {item.description || item.desc || 'Unknown transaction'}
                      </p>

                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <span>
                          {item.date ? format(new Date(item.date), 'MMM dd, yyyy') : 'Unknown date'}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{item.category || 'Uncategorized'}</span>
                      </div>

                      {item.reason && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                          {item.reason}
                        </p>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(item.amount)}
                      </p>
                      {transactionId && onViewTransaction && (
                        <button
                          onClick={() => onViewTransaction(transactionId)}
                          className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-lg font-medium text-gray-900">No anomalies found</p>
            <p className="text-sm text-gray-500">
              {searchTerm || selectedType !== 'all'
                ? 'Try adjusting your filters'
                : safeData.items.length === 0
                  ? 'No anomaly data available'
                  : 'All transactions appear normal'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Anomalies;
