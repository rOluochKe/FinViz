import React, { useState } from 'react';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { TrendDataPoint } from '../../types';

interface TrendsProps {
  data: {
    trends: TrendDataPoint[];
  };
}

const Trends: React.FC<TrendsProps> = ({ data }) => {
  const [selectedMetrics, setSelectedMetrics] = useState({
    income: true,
    expense: true,
    net: true,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const tooltipFormatter = (value: any) => {
    if (typeof value === 'number') {
      return formatCurrency(value);
    }
    return value;
  };

  const formatPeriod = (period: string) => {
    if (period.includes('-W')) {
      const [year, week] = period.split('-W');
      return `W${week} ${year}`;
    }
    return period;
  };

  const toggleMetric = (metric: keyof typeof selectedMetrics) => {
    setSelectedMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900">Spending Trends</h2>
        <p className="text-sm text-gray-500 mt-1">Track your income and expenses over time</p>
      </div>

      {/* Metric Toggles */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedMetrics.income}
              onChange={() => toggleMetric('income')}
              className="h-4 w-4 text-green-600 rounded"
            />
            <span className="text-sm text-gray-700">Income</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedMetrics.expense}
              onChange={() => toggleMetric('expense')}
              className="h-4 w-4 text-red-600 rounded"
            />
            <span className="text-sm text-gray-700">Expense</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedMetrics.net}
              onChange={() => toggleMetric('net')}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Net</span>
          </label>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data.trends} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" tickFormatter={formatPeriod} />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip formatter={tooltipFormatter} labelFormatter={(label) => formatPeriod(label)} />
            <Legend />

            {selectedMetrics.income && (
              <Line
                type="monotone"
                dataKey="income"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Income"
              />
            )}

            {selectedMetrics.expense && (
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#dc2626"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Expense"
              />
            )}

            {selectedMetrics.net && (
              <Line
                type="monotone"
                dataKey="net"
                stroke="#2563eb"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Net"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Moving Averages */}
      {data.trends.some((t) => t.income_ma3 != null) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Moving Averages (3-period)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.trends} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tickFormatter={formatPeriod} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                formatter={tooltipFormatter}
                labelFormatter={(label) => formatPeriod(label)}
              />
              <Legend />

              <Line
                type="monotone"
                dataKey="income_ma3"
                stroke="#16a34a"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Income MA(3)"
              />
              <Line
                type="monotone"
                dataKey="expense_ma3"
                stroke="#dc2626"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Expense MA(3)"
              />
              <Line
                type="monotone"
                dataKey="net_ma3"
                stroke="#2563eb"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Net MA(3)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default Trends;
