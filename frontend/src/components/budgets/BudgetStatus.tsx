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
  // Add null check at the beginning
  if (!status || !status.summary || !status.categories) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
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
    if (percentage === undefined || percentage === null) return 'bg-gray-500';
    if (percentage >= 100) return 'bg-red-600';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Safely format percentage
  const formatPercentage = (value: number) => {
    if (value === undefined || value === null) return '0';
    return value.toFixed(1);
  };

  // Safe values
  const totalBudget = status.summary.total_budget || 0;
  const totalSpent = status.summary.total_spent || 0;
  const remaining = status.summary.remaining || 0;
  const percent = status.summary.percent || 0;
  const count = status.summary.count || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Total Budget</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
          <p className="text-xs text-gray-400 mt-1">{count} categories</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
          <p className="text-xs text-gray-400 mt-1">{formatPercentage(percent)}% of budget</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Remaining</p>
          <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Period</p>
          <p className="text-lg font-semibold text-gray-900">
            {status.period?.month
              ? `${status.period.year}-${status.period.month.toString().padStart(2, '0')}`
              : status.period?.year || 'N/A'}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {status.alerts && status.alerts.length > 0 && (
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
          {status.categories.map((cat) => {
            // Safely get values
            const budgetAmount = cat.budget_amount || 0;
            const spent = cat.spent || 0;
            const percentage = cat.percentage || 0;
            const daysRemaining = cat.days_remaining;

            return (
              <div key={cat.category_id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: cat.category_color || '#808080' }}
                    />
                    <span className="font-medium text-gray-700">{cat.category_name}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cat.status || 'good')}`}
                  >
                    {cat.status || 'good'}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {formatCurrency(spent)} / {formatCurrency(budgetAmount)}
                  </span>
                  <span className="font-medium text-gray-700">{formatPercentage(percentage)}%</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressColor(percentage)}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                {daysRemaining != null && daysRemaining > 0 && (
                  <p className="text-xs text-gray-500 text-right">{daysRemaining} days remaining</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BudgetStatus;
