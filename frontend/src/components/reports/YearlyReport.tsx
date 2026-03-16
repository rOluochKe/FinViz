import React from 'react';

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

import { YearlyReport as YearlyReportType } from '../../types';

interface YearlyReportProps {
  report: YearlyReportType;
  onExport?: () => void;
}

const YearlyReport: React.FC<YearlyReportProps> = ({ report }) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900">Yearly Report</h2>
        <p className="text-sm text-gray-500 mt-1">{report.year}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(report.summary.income)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(report.summary.expense)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Net Savings</p>
          <p
            className={`text-2xl font-bold ${report.summary.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {formatCurrency(report.summary.savings)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Savings Rate</p>
          <p className="text-2xl font-bold text-primary-600">{report.summary.rate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={report.monthly} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={2} name="Income" />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#dc2626"
              strokeWidth={2}
              name="Expense"
            />
            <Line
              type="monotone"
              dataKey="savings"
              stroke="#2563eb"
              strokeWidth={2}
              name="Savings"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Income
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expense
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Savings
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {report.monthly.map((month) => {
                const savingsRate = month.income > 0 ? (month.savings / month.income) * 100 : 0;
                return (
                  <tr key={month.month} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {month.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 font-medium">
                      {formatCurrency(month.income)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600 font-medium">
                      {formatCurrency(month.expense)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <span className={month.savings >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(month.savings)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {savingsRate.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Categories */}
      {report.top_categories && report.top_categories.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Spending Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.top_categories.map((cat) => (
              <div
                key={cat.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(cat.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best & Worst Months */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {report.best_month && (
          <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
            <h4 className="text-sm font-medium text-green-800 mb-2">Best Month</h4>
            <p className="text-2xl font-bold text-green-900">{report.best_month.name}</p>
            <p className="text-lg text-green-700 mt-2">
              Savings: {formatCurrency(report.best_month.savings)}
            </p>
          </div>
        )}
        {report.worst_month && (
          <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
            <h4 className="text-sm font-medium text-red-800 mb-2">Worst Month</h4>
            <p className="text-2xl font-bold text-red-900">{report.worst_month.name}</p>
            <p className="text-lg text-red-700 mt-2">
              Savings: {formatCurrency(report.worst_month.savings)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YearlyReport;
