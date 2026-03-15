import React from 'react';

import { ChartBarIcon, DocumentTextIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

import { Category } from '../../types';

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onViewTransactions: (category: Category) => void;
  onViewStats: (category: Category) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onEdit,
  onDelete,
  onViewTransactions,
  onViewStats,
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income':
        return '💰';
      case 'expense':
        return '💸';
      case 'transfer':
        return '🔄';
      default:
        return '📁';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expense':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'transfer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
      <div className="p-5">
        {/* Header with icon and color indicator */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: category.color ? `${category.color}20` : '#f3f4f6' }}
            >
              {category.icon ? (
                <span style={{ color: category.color }}>{getTypeIcon(category.type)}</span>
              ) : (
                <span style={{ color: category.color }}>{getTypeIcon(category.type)}</span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
              <div className="flex items-center mt-1 space-x-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(category.type)}`}
                >
                  {category.type.charAt(0).toUpperCase() + category.type.slice(1)}
                </span>
                {category.is_system && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    System
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-1">
            {!category.is_system && (
              <button
                onClick={() => onEdit(category)}
                className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                title="Edit"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
            {!category.is_system && (
              <button
                onClick={() => onDelete(category)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {category.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{category.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-100">
          <div
            className="text-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
            onClick={() => onViewTransactions(category)}
          >
            <DocumentTextIcon className="h-5 w-5 mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500">Transactions</p>
            <p className="text-sm font-semibold text-gray-700">{category.transaction_count || 0}</p>
          </div>
          <div
            className="text-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
            onClick={() => onViewStats(category)}
          >
            <ChartBarIcon className="h-5 w-5 mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-sm font-semibold text-gray-700">
              ${category.total_amount?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;
