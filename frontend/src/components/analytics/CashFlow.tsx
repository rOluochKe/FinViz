import React from 'react';

import { format } from 'date-fns';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { CashFlowData } from '../../types';

interface CashFlowProps {
  data: CashFlowData;
}

const CashFlow: React.FC<CashFlowProps> = ({ data }) => {
  // Ensure data has default values
  const safeData = {
    summary: {
      current_balance: data?.summary?.current_balance || 0,
      net_cashflow: data?.summary?.net_cashflow || 0,
      avg_monthly_inflow: data?.summary?.avg_monthly_inflow || 0,
      avg_monthly_outflow: data?.summary?.avg_monthly_outflow || 0,
      total_inflow: data?.summary?.total_inflow || 0,
      total_outflow: data?.summary?.total_outflow || 0,
    },
    daily_data: data?.daily_data || [],
    monthly_data: data?.monthly_data || [],
    patterns: data?.patterns || [],
  };

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

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Current Balance</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(safeData.summary.current_balance)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Net Cash Flow</p>
          <p
            className={`text-2xl font-bold ${safeData.summary.net_cashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {formatCurrency(safeData.summary.net_cashflow)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Avg Monthly Inflow</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(safeData.summary.avg_monthly_inflow)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Avg Monthly Outflow</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(safeData.summary.avg_monthly_outflow)}
          </p>
        </div>
      </div>

      {/* Balance History Chart */}
      {safeData.daily_data.length > 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Balance History</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={safeData.daily_data}
              margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={tooltipFormatter} labelFormatter={(label) => formatDate(label)} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#2563eb"
                fillOpacity={1}
                fill="url(#colorBalance)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No balance history data available</p>
        </div>
      )}

      {/* Daily Inflow/Outflow Chart */}
      {safeData.daily_data.length > 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Cash Flow</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={safeData.daily_data}
              margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={tooltipFormatter} labelFormatter={(label) => formatDate(label)} />
              <Bar dataKey="inflow" fill="#16a34a" name="Inflow" />
              <Bar dataKey="outflow" fill="#dc2626" name="Outflow" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {/* Monthly Summary */}
      {safeData.monthly_data.length > 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inflow
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outflow
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Savings Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {safeData.monthly_data.map((month) => (
                  <tr key={month.month} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {format(new Date(month.month + '-01'), 'MMMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 font-medium">
                      {formatCurrency(month.inflow)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600 font-medium">
                      {formatCurrency(month.outflow)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <span className={month.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(month.net)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {month.savings_rate?.toFixed(1) || '0.0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Patterns */}
      {safeData.patterns && safeData.patterns.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detected Patterns</h3>
          <div className="space-y-3">
            {safeData.patterns.map((pattern, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  pattern.type === 'positive'
                    ? 'bg-green-50 border border-green-200'
                    : pattern.type === 'good'
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <p className="font-medium text-gray-900">{pattern.description}</p>
                <p className="text-sm text-gray-600 mt-1">{pattern.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CashFlow;
