import React from 'react';

import { ArrowTrendingUpIcon, CurrencyDollarIcon, HashtagIcon } from '@heroicons/react/24/outline';

import { CategoryStats as CategoryStatsType } from '../../types';

interface CategoryStatsProps {
  stats: CategoryStatsType[];
}

const CategoryStatistics: React.FC<CategoryStatsProps> = ({ stats }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (!stats || stats.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500">
          <p>No statistics available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Statistics</h3>
      <div className="space-y-4">
        {stats.slice(0, 5).map((stat) => (
          <div
            key={stat.category_id}
            className="border-b border-gray-100 last:border-0 pb-4 last:pb-0"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: stat.color }}
                />
                <span className="font-medium text-gray-900">{stat.category_name}</span>
                {stat.is_system && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    System
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(stat.total_amount_12m)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <HashtagIcon className="h-3 w-3 mx-auto text-gray-400 mb-1" />
                <span className="text-gray-500">Transactions</span>
                <p className="font-medium text-gray-700">{stat.transaction_count_12m}</p>
              </div>
              <div className="text-center">
                <CurrencyDollarIcon className="h-3 w-3 mx-auto text-gray-400 mb-1" />
                <span className="text-gray-500">Monthly Avg</span>
                <p className="font-medium text-gray-700">{formatCurrency(stat.monthly_average)}</p>
              </div>
              <div className="text-center">
                <ArrowTrendingUpIcon className="h-3 w-3 mx-auto text-gray-400 mb-1" />
                <span className="text-gray-500">% of Total</span>
                <p className="font-medium text-gray-700">
                  {(
                    (stat.total_amount_12m /
                      stats.reduce((sum, s) => sum + s.total_amount_12m, 0)) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryStatistics;
