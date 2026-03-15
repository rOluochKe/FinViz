import React from 'react';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import { BudgetStatusType } from '../../types';

interface BudgetStatusProps {
  status: {
    period: { year: number; month: number };
    summary: {
      total_budget: number;
      total_spent: number;
      remaining: number;
      percent: number;
      count: number;
    };
    categories: BudgetStatusType[];
    alerts: Array<{
      type: 'over' | 'warning';
      category: string;
      message: string;
    }>;
  };
}

const BudgetStatus: React.FC<BudgetStatusProps> = ({ status }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', // Fixed: removed the extra quote
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-600';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Total Budget</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(status.summary.total_budget)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{status.summary.count} categories</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(status.summary.total_spent)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {status.summary.percent.toFixed(1)}% of budget
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Remaining</p>
          <p
            className={`text-2xl font-bold ${status.summary.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {formatCurrency(status.summary.remaining)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Period</p>
          <p className="text-lg font-semibold text-gray-900">
            {status.period.month
              ? `${status.period.year}-${status.period.month.toString().padStart(2, '0')}`
              : status.period.year}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {status.alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
            Budget Alerts ({status.alerts.length})
          </h3>
          <div className="space-y-3">
            {status.alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  alert.type === 'over'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start">
                  {alert.type === 'over' ? (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{alert.category}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
        <div className="space-y-4">
          {status.categories.map((cat) => (
            <div key={cat.category_id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: cat.category_color }}
                  />
                  <span className="font-medium text-gray-700">{cat.category_name}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cat.status)}`}
                >
                  {cat.status}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  ${cat.spent.toFixed(2)} / ${cat.budget_amount.toFixed(2)}
                </span>
                <span className="font-medium text-gray-700">{cat.percentage.toFixed(1)}%</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(cat.percentage)}`}
                  style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                />
              </div>

              {cat.days_remaining != null && cat.days_remaining > 0 && (
                <p className="text-xs text-gray-500 text-right">
                  {cat.days_remaining} days remaining
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BudgetStatus;
