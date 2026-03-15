import React from 'react';

import { CalendarIcon } from '@heroicons/react/24/outline';

import { differenceInDays, format } from 'date-fns';

interface UpcomingTransactionsProps {
  upcoming: any[];
}

const UpcomingTransactions: React.FC<UpcomingTransactionsProps> = ({ upcoming }) => {
  const getDaysColor = (days: number) => {
    if (days <= 3) return 'text-red-600 bg-red-50';
    if (days <= 7) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (!upcoming || upcoming.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500">
          <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p>No upcoming transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming</h3>
      <div className="space-y-3">
        {upcoming.slice(0, 5).map((item, index) => {
          const daysUntil = differenceInDays(new Date(item.date), new Date());
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.desc}</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(item.date), 'MMM dd, yyyy')}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span
                  className={`text-sm font-semibold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                >
                  {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getDaysColor(daysUntil)}`}
                >
                  {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingTransactions;
