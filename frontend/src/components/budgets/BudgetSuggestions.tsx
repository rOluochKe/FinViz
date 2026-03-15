import React from 'react';

import { CheckCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';

import { BudgetSuggestion } from '../../types';
import Button from '../common/Button';

interface BudgetSuggestionsProps {
  suggestions: BudgetSuggestion[];
  onApplySuggestion: (suggestion: BudgetSuggestion) => void;
}

const BudgetSuggestions: React.FC<BudgetSuggestionsProps> = ({
  suggestions,
  onApplySuggestion,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <LightBulbIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Suggestions Available</h3>
        <p className="text-sm text-gray-500">
          Add more transactions to get AI-powered budget suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <LightBulbIcon className="h-5 w-5 text-yellow-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">AI Budget Suggestions</h3>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Based on your spending patterns over the last 90 days
      </p>

      <div className="space-y-4">
        {suggestions.slice(0, 5).map((suggestion) => (
          <div
            key={suggestion.category_id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: suggestion.category_color }}
                />
                <span className="font-medium text-gray-900">{suggestion.category_name}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}
              >
                {suggestion.confidence} confidence
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">Current Monthly Average</p>
                <p className="text-sm font-semibold text-gray-700">
                  {formatCurrency(suggestion.current_avg_monthly)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Suggested Budget</p>
                <p className="text-sm font-semibold text-primary-600">
                  {formatCurrency(suggestion.suggested_budget)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Based on {suggestion.transaction_count_90d} transactions
              </span>
              <Button size="sm" onClick={() => onApplySuggestion(suggestion)}>
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Apply
              </Button>
            </div>

            {suggestion.notes && (
              <p className="mt-2 text-xs text-gray-500 italic">{suggestion.notes}</p>
            )}
          </div>
        ))}
      </div>

      {suggestions.length > 5 && (
        <p className="text-xs text-gray-500 text-center mt-4">
          +{suggestions.length - 5} more suggestions
        </p>
      )}
    </div>
  );
};

export default BudgetSuggestions;
