import React from 'react';

import { ArrowRightIcon } from '@heroicons/react/24/outline';

import { Link } from 'react-router-dom';

import { format } from 'date-fns';

import { Transaction } from '../../types';

interface RecentTransactionsProps {
  transactions: Transaction[];
  limit?: number;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions, limit = 5 }) => {
  const formatCurrency = (amount: number, type: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    if (type === 'income') {
      return `+${formatter.format(amount)}`;
    } else if (type === 'expense') {
      return `-${formatter.format(amount)}`;
    }
    return formatter.format(amount);
  };

  const displayedTransactions = transactions.slice(0, limit);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        <Link
          to="/transactions"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center"
        >
          View All
          <ArrowRightIcon className="h-4 w-4 ml-1" />
        </Link>
      </div>

      <div className="divide-y divide-gray-200">
        {displayedTransactions.length > 0 ? (
          displayedTransactions.map((transaction) => (
            <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: transaction.category_color || '#808080' }}
                    />
                    <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                  </div>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <span>{format(new Date(transaction.date), 'MMM dd, yyyy')}</span>
                    <span className="mx-2">•</span>
                    <span>{transaction.category_name || 'Uncategorized'}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <span
                    className={`text-sm font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(transaction.amount, transaction.type)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            <p>No recent transactions</p>
            <Link
              to="/transactions"
              className="mt-2 inline-block text-sm text-primary-600 hover:text-primary-700"
            >
              Add your first transaction
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
