import React from 'react';

import { ChartBarIcon } from '@heroicons/react/24/outline';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { SpendingPatterns as SpendingPatternsType } from '../../types';

interface SpendingPatternsProps {
  data: SpendingPatternsType;
}

const COLORS = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#db2777',
  '#65a30d',
];

const SpendingPatterns: React.FC<SpendingPatternsProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const tooltipFormatter = (value: any) => {
    if (typeof value === 'number') {
      return formatCurrency(value);
    }
    return value;
  };

  const getConcentrationColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Safe data access with fallbacks
  const safeData = {
    summary: {
      total_spending: data?.summary?.total_spending || 0,
      transaction_count: data?.summary?.transaction_count || 0,
      avg_transaction: data?.summary?.avg_transaction || 0,
      median_transaction: data?.summary?.median_transaction || 0,
      avg_monthly_spending: data?.summary?.avg_monthly_spending || 0,
    },
    by_day: data?.by_day || [],
    by_category: data?.by_category || [],
    concentration: {
      hhi_score: data?.concentration?.hhi_score || 0,
      level: data?.concentration?.level || 'low',
      top_categories: data?.concentration?.top_categories || {},
    },
    seasonal: data?.seasonal || [],
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Spending</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(safeData.summary.total_spending)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Avg Transaction</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(safeData.summary.avg_transaction)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Monthly Avg</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(safeData.summary.avg_monthly_spending)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Transaction Count</p>
          <p className="text-xl font-bold text-gray-900">{safeData.summary.transaction_count}</p>
        </div>
      </div>

      {/* Concentration Score */}
      {safeData.concentration.hhi_score > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Spending Concentration</h3>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getConcentrationColor(safeData.concentration.level)}`}
            >
              {safeData.concentration.level.toUpperCase()} (
              {safeData.concentration.hhi_score.toFixed(1)})
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {safeData.concentration.level === 'low' &&
              'Your spending is well diversified across categories.'}
            {safeData.concentration.level === 'medium' &&
              'Your spending is somewhat concentrated in a few categories.'}
            {safeData.concentration.level === 'high' &&
              'Your spending is highly concentrated. Consider diversifying.'}
          </p>
        </div>
      )}

      {/* Day of Week Patterns */}
      {safeData.by_day.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Day of Week</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={safeData.by_day}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day_name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Bar dataKey="sum" fill="#2563eb" name="Total Spending" />
              <Bar dataKey="mean" fill="#16a34a" name="Average" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Breakdown */}
      {safeData.by_category.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={safeData.by_category.slice(0, 5)}
                  dataKey="sum"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ payload, percent }) =>
                    percent !== undefined
                      ? `${payload.category} (${(percent * 100).toFixed(0)}%)`
                      : payload.category
                  }
                >
                  {safeData.by_category.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={tooltipFormatter} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Details</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {safeData.by_category.map((cat, index) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700">{cat.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(cat.sum)}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">({cat.count} tx)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Seasonal Patterns */}
      {safeData.seasonal && safeData.seasonal.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Patterns</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {safeData.seasonal.map((season) => (
              <div key={season.month} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">{season.month_name}</p>
                <p className="text-lg font-bold text-primary-600">
                  {formatCurrency(season.avg_spending)}
                </p>
                <p className="text-xs text-gray-500">{season.transaction_count} tx</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!safeData.by_category.length && !safeData.by_day.length && !safeData.seasonal.length && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ChartBarIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Spending Data Available</h3>
          <p className="text-sm text-gray-500">
            Add some transactions to see your spending patterns.
          </p>
        </div>
      )}
    </div>
  );
};

export default SpendingPatterns;
