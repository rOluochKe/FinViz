import React from 'react';

import { PencilIcon } from '@heroicons/react/24/outline';

import { format } from 'date-fns';

import { Transaction } from '../../types';
import Button from '../common/Button';

interface TransactionDetailsProps {
  transaction: Transaction;
  onEdit: () => void;
  onClose: () => void;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  transaction,
  onEdit,
  onClose,
}) => {
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

  const getTypeBadge = (type: string) => {
    const types = {
      income: { label: 'Income', class: 'bg-green-100 text-green-800' },
      expense: { label: 'Expense', class: 'bg-red-100 text-red-800' },
      transfer: { label: 'Transfer', class: 'bg-blue-100 text-blue-800' },
    };
    return types[type as keyof typeof types] || types.expense;
  };

  const typeBadge = getTypeBadge(transaction.type);

  return (
    <div className="space-y-6">
      {/* Header with amount */}
      <div className="text-center">
        <div
          className={`text-3xl font-bold ${
            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {formatCurrency(transaction.amount, transaction.type)}
        </div>
        <div className="mt-1">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadge.class}`}
          >
            {typeBadge.label}
          </span>
        </div>
      </div>

      {/* Details grid */}
      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm font-medium text-gray-500">Date</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {format(new Date(transaction.date), 'MMMM dd, yyyy')}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-gray-500">Category</dt>
          <dd className="mt-1">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: transaction.category_color
                  ? `${transaction.category_color}20`
                  : '#80808020',
                color: transaction.category_color || '#808080',
              }}
            >
              {transaction.category_name || 'Uncategorized'}
            </span>
          </dd>
        </div>

        <div className="col-span-2">
          <dt className="text-sm font-medium text-gray-500">Description</dt>
          <dd className="mt-1 text-sm text-gray-900">{transaction.description}</dd>
        </div>

        {transaction.notes && (
          <div className="col-span-2">
            <dt className="text-sm font-medium text-gray-500">Notes</dt>
            <dd className="mt-1 text-sm text-gray-900">{transaction.notes}</dd>
          </div>
        )}

        {transaction.tags && transaction.tags.length > 0 && (
          <div className="col-span-2">
            <dt className="text-sm font-medium text-gray-500">Tags</dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {transaction.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </dd>
          </div>
        )}

        {transaction.is_recurring && (
          <>
            <div>
              <dt className="text-sm font-medium text-gray-500">Frequency</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">
                {transaction.recurring_frequency}
              </dd>
            </div>
            {transaction.recurring_end_date && (
              <div>
                <dt className="text-sm font-medium text-gray-500">End Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(transaction.recurring_end_date), 'MMM dd, yyyy')}
                </dd>
              </div>
            )}
          </>
        )}

        <div>
          <dt className="text-sm font-medium text-gray-500">Created</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {format(new Date(transaction.updated_at), 'MMM dd, yyyy HH:mm')}
          </dd>
        </div>
      </dl>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit}>
          <PencilIcon className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>
    </div>
  );
};

export default TransactionDetails;
