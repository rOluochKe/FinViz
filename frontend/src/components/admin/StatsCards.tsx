import React from 'react';

import {
  CalculatorIcon,
  CreditCardIcon,
  TagIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface StatsCardsProps {
  stats: {
    users: number;
    transactions: number;
    categories: number;
    budgets: number;
  };
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total Users',
      value: stats.users,
      icon: UserGroupIcon,
      color: 'bg-blue-100 text-blue-600',
      description: 'Registered users',
    },
    {
      title: 'Transactions',
      value: stats.transactions,
      icon: CreditCardIcon,
      color: 'bg-green-100 text-green-600',
      description: 'Total transactions',
    },
    {
      title: 'Categories',
      value: stats.categories,
      icon: TagIcon,
      color: 'bg-purple-100 text-purple-600',
      description: 'Active categories',
    },
    {
      title: 'Budgets',
      value: stats.budgets,
      icon: CalculatorIcon,
      color: 'bg-orange-100 text-orange-600',
      description: 'Active budgets',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${card.color}`}>
              <card.icon className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-700">{card.title}</h3>
          <p className="text-xs text-gray-500 mt-1">{card.description}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
