import React from 'react';

import { BanknotesIcon, ChartBarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { ArrowTrendingUpIcon as ArrowTrendingUpSolid } from '@heroicons/react/24/solid';

import { DashboardKPI } from '../../types';

interface KPICardsProps {
  kpis: DashboardKPI;
  period: string;
}

const KPICards: React.FC<KPICardsProps> = ({ kpis, period }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowTrendingUpSolid className="h-4 w-4 text-green-600" />;
    if (trend < 0)
      return <ArrowTrendingUpSolid className="h-4 w-4 text-red-600 transform rotate-180" />;
    return null;
  };

  const cards = [
    {
      title: 'Total Income',
      value: formatCurrency(kpis.income.current),
      trend: kpis.income.trend,
      previousValue: formatCurrency(kpis.income.previous),
      icon: BanknotesIcon,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      period: period,
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(kpis.expense.current),
      trend: kpis.expense.trend,
      previousValue: formatCurrency(kpis.expense.previous),
      icon: CurrencyDollarIcon,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      period: period,
    },
    {
      title: 'Net Savings',
      value: formatCurrency(kpis.savings.current),
      trend: kpis.savings.current - kpis.savings.previous,
      previousValue: formatCurrency(kpis.savings.previous),
      icon: BanknotesIcon,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      period: period,
    },
    {
      title: 'Savings Rate',
      value: `${kpis.rate.toFixed(1)}%`,
      trend:
        kpis.rate -
        (kpis.income.previous && kpis.expense.previous
          ? ((kpis.income.previous - kpis.expense.previous) / kpis.income.previous) * 100
          : 0),
      previousValue:
        kpis.income.previous && kpis.expense.previous
          ? `${(((kpis.income.previous - kpis.expense.previous) / kpis.income.previous) * 100).toFixed(1)}%`
          : '0%',
      icon: ChartBarIcon,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      period: period,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-lg p-3 ${card.iconBg}`}>
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
                  <dd>
                    <div className="text-lg font-semibold text-gray-900">{card.value}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="flex items-center gap-1">
                {getTrendIcon(card.trend)}
                <span className={getTrendColor(card.trend)}>
                  {card.trend > 0 ? '+' : ''}
                  {card.trend.toFixed(1)}%
                </span>
                <span className="text-gray-500 ml-1">vs previous {period}</span>
              </span>
              <p className="text-xs text-gray-500 mt-1">Previous: {card.previousValue}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
