import React, { useEffect, useState } from 'react';

import { XMarkIcon } from '@heroicons/react/24/outline';

import { format } from 'date-fns';

import categoryService from '../../services/categories';
import { Category, Transaction } from '../../types';
import Button from '../common/Button';

interface CategoryTransactionsModalProps {
  category: Category;
  onClose: () => void;
}

const CategoryTransactionsModal: React.FC<CategoryTransactionsModalProps> = ({
  category,
  onClose,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await categoryService.getCategoryTransactions(category.id);
        setTransactions(response.transactions || []);
        setTotal(response.total || 0);
      } catch (error) {
        console.error('Failed to load category transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [category.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateTotalAmount = () => {
    return transactions.reduce((sum, tx) => sum + tx.amount, 0);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Category Transactions</h2>
            <div className="flex items-center mt-1">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm text-gray-600">{category.name}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Stats Summary */}
        {!loading && (
          <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(calculateTotalAmount())}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Transaction Count</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(tx.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">📭 No transactions found</p>
              <p className="text-sm">This category doesn't have any transactions yet.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} fullWidth>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CategoryTransactionsModal;
