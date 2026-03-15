import React from 'react';

import { ArrowRightIcon } from '@heroicons/react/24/outline';

import { Link } from 'react-router-dom';

interface BudgetStatusProps {
  budgets: any[];
}

const BudgetStatus: React.FC<BudgetStatusProps> = ({ budgets }) => {
  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-600';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = (percentage: number) => {
    if (percentage >= 100) return 'Over Budget';
    if (percentage >= 80) return 'Near Limit';
    return 'On Track';
  };

  if (!budgets || budgets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500">
          <p>No budgets set</p>
          <Link
            to="/budgets"
            className="mt-2 inline-block text-sm text-primary-600 hover:text-primary-700"
          >
            Create your first budget
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Budget Status</h3>
        <Link
          to="/budgets"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center"
        >
          Manage
          <ArrowRightIcon className="h-4 w-4 ml-1" />
        </Link>
      </div>

      <div className="space-y-4">
        {budgets.slice(0, 3).map((budget: any, index: number) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">{budget.category_name}</span>
              <span className="text-gray-600">
                ${budget.spent?.toFixed(2)} / ${budget.budget_amount?.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getStatusColor(budget.percentage)}`}
                style={{ width: `${Math.min(budget.percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className={budget.percentage >= 100 ? 'text-red-600' : 'text-gray-500'}>
                {getStatusText(budget.percentage)}
              </span>
              <span className="text-gray-500">{budget.percentage?.toFixed(1)}%</span>
            </div>
          </div>
        ))}

        {budgets.length > 3 && (
          <p className="text-xs text-gray-500 text-center mt-2">
            +{budgets.length - 3} more budgets
          </p>
        )}
      </div>
    </div>
  );
};

export default BudgetStatus;
