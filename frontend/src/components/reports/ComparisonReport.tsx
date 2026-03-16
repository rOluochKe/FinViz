import React from 'react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ComparisonReport as ComparisonReportType } from '../../types';

interface ComparisonReportProps {
  report: ComparisonReportType;
}

const ComparisonReport: React.FC<ComparisonReportProps> = ({ report }) => {
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

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (value: number) => {
    if (value > 0) return '↑';
    if (value < 0) return '↓';
    return '→';
  };

  const chartData = [
    {
      name: 'Income',
      period1: report.period1.summary.income,
      period2: report.period2.summary.income,
    },
    {
      name: 'Expense',
      period1: report.period1.summary.expense,
      period2: report.period2.summary.expense,
    },
    {
      name: 'Savings',
      period1: report.period1.summary.savings,
      period2: report.period2.summary.savings,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900">Period Comparison</h2>
        <div className="flex items-center space-x-4 mt-2">
          <p className="text-sm text-gray-600">{report.period1.period}</p>
          <span className="text-gray-400">vs</span>
          <p className="text-sm text-gray-600">{report.period2.period}</p>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparison Chart</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
            <Bar dataKey="period1" fill="#2563eb" name={report.period1.period} />
            <Bar dataKey="period2" fill="#16a34a" name={report.period2.period} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Differences Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Differences</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Income</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(report.differences.income)}
            </p>
            <p className={`mt-1 text-sm font-medium ${getChangeColor(report.differences.income)}`}>
              {getChangeIcon(report.differences.income)}{' '}
              {Math.abs(report.differences.income).toFixed(0)}% change
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Expense</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(report.differences.expense)}
            </p>
            <p
              className={`mt-1 text-sm font-medium ${getChangeColor(-report.differences.expense)}`}
            >
              {getChangeIcon(-report.differences.expense)}{' '}
              {Math.abs(report.differences.expense).toFixed(0)}% change
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Savings</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(report.differences.savings)}
            </p>
            <p className={`mt-1 text-sm font-medium ${getChangeColor(report.differences.savings)}`}>
              {getChangeIcon(report.differences.savings)}{' '}
              {Math.abs(report.differences.savings).toFixed(0)}% change
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Period 1 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{report.period1.period}</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Income</span>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(report.period1.summary.income)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Expense</span>
              <span className="text-sm font-medium text-red-600">
                {formatCurrency(report.period1.summary.expense)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm text-gray-500">Savings</span>
              <span
                className={`text-sm font-medium ${report.period1.summary.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatCurrency(report.period1.summary.savings)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Rate</span>
              <span className="text-sm font-medium text-primary-600">
                {report.period1.summary.rate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Transactions</span>
              <span className="text-sm font-medium text-gray-900">
                {report.period1.summary.count}
              </span>
            </div>
          </div>
        </div>

        {/* Period 2 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{report.period2.period}</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Income</span>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(report.period2.summary.income)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Expense</span>
              <span className="text-sm font-medium text-red-600">
                {formatCurrency(report.period2.summary.expense)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm text-gray-500">Savings</span>
              <span
                className={`text-sm font-medium ${report.period2.summary.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatCurrency(report.period2.summary.savings)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Rate</span>
              <span className="text-sm font-medium text-primary-600">
                {report.period2.summary.rate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Transactions</span>
              <span className="text-sm font-medium text-gray-900">
                {report.period2.summary.count}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonReport;
