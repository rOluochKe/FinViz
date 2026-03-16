import React from 'react';

import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

interface SummaryCardsProps {
  data: {
    total_income: number;
    total_expense: number;
    net_savings: number;
    savings_rate: number;
    transaction_count: number;
  };
  period: string;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ data, period }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const cards = [
    {
      title: 'Total Income',
      value: formatCurrency(data.total_income),
      icon: ArrowTrendingUpIcon,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(data.total_expense),
      icon: ArrowTrendingDownIcon,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      title: 'Net Savings',
      value: formatCurrency(data.net_savings),
      icon: BanknotesIcon,
      iconBg: data.net_savings >= 0 ? 'bg-blue-100' : 'bg-red-100',
      iconColor: data.net_savings >= 0 ? 'text-blue-600' : 'text-red-600',
    },
    {
      title: 'Savings Rate',
      value: `${data.savings_rate.toFixed(1)}%`,
      icon: CurrencyDollarIcon,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${card.iconBg} mr-4`}>
              <card.icon className={`h-6 w-6 ${card.iconColor}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">{period}</p>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
