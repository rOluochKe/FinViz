import React from 'react';

import {
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import { Budget } from '../../types';

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
  onViewProgress: (budget: Budget) => void;
}

const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onEdit, onDelete, onViewProgress }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = () => {
    if (budget.is_over_budget) return 'bg-red-100 text-red-800 border-red-200';
    if (budget.spent_percentage >= 80) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStatusText = () => {
    if (budget.is_over_budget) return 'Over Budget';
    if (budget.spent_percentage >= 80) return 'Near Limit';
    return 'On Track';
  };

  const getProgressColor = () => {
    if (budget.is_over_budget) return 'bg-red-600';
    if (budget.spent_percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: budget.category_color ? `${budget.category_color}20` : '#f3f4f6',
              }}
            >
              <ChartBarIcon
                className="h-5 w-5"
                style={{ color: budget.category_color || '#6b7280' }}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{budget.category_name}</h3>
              <p className="text-xs text-gray-500 capitalize">{budget.period}</p>
            </div>
          </div>

          {/* Status badge */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Budget amount */}
        <div className="mb-4">
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(budget.amount)}</p>
          <p className="text-xs text-gray-500">Budget limit</p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Spent: {formatCurrency(budget.spent)}</span>
            <span className="font-medium text-gray-900">{budget.spent_percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${getProgressColor()}`}
              style={{ width: `${Math.min(budget.spent_percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Remaining: {formatCurrency(budget.remaining)}</span>
            {budget.should_alert && (
              <span className="flex items-center text-yellow-600" title="Budget alert triggered">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                Alert
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => onViewProgress(budget)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="View Progress"
          >
            <ArrowTrendingUpIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onEdit(budget)}
            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
            title="Edit Budget"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(budget)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete Budget"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetCard;
