import React from 'react';

import { CalendarDaysIcon } from '@heroicons/react/24/outline';

interface PeriodSelectorProps {
  period: string;
  onPeriodChange: (period: string) => void;
}

const periods = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'all', label: 'All time' },
];

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ period, onPeriodChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
      <select
        value={period}
        onChange={(e) => onPeriodChange(e.target.value)}
        className="input-field text-sm py-2 w-40"
      >
        {periods.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PeriodSelector;
