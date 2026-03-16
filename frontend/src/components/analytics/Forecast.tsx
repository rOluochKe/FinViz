import React, { useState } from 'react';

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ForecastData } from '../../types';

interface ForecastProps {
  data: ForecastData;
}

const Forecast: React.FC<ForecastProps> = ({ data }) => {
  const [showConfidence, setShowConfidence] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const tooltipFormatter = (value: any) => {
    if (typeof value === 'number') {
      return formatCurrency(value);
    }
    return value;
  };

  const getConfidenceColor = (score: number) => {
    if (score > 0.8) return 'text-green-600 bg-green-100';
    if (score > 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Combine historical and forecast data for chart
  const chartData = [
    ...(data.historical_period?.months
      ? Array.from({ length: data.historical_period.months }, (_, i) => ({
          period: `${data.historical_period.start}-${i}`,
          income: data.statistics?.historical_avg_income || 0,
          expense: data.statistics?.historical_avg_expense || 0,
          isForecast: false,
        }))
      : []),
    ...data.forecast_periods.map((p) => ({
      period: p.period,
      income: p.forecast_income,
      expense: p.forecast_expense,
      net: p.forecast_net,
      isForecast: true,
      confidence_lower: p.confidence_lower,
      confidence_upper: p.confidence_upper,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Financial Forecast</h2>
            <p className="text-sm text-gray-500 mt-1">
              Based on your historical data using {data.method} analysis
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(data.confidence.score)}`}
          >
            Confidence: {(data.confidence.score * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Confidence Interval Toggle */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showConfidence}
            onChange={(e) => setShowConfidence(e.target.checked)}
            className="h-4 w-4 text-primary-600 rounded"
          />
          <span className="text-sm text-gray-700">Show confidence intervals</span>
        </label>
      </div>

      {/* Forecast Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Forecast Projection</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" tickFormatter={formatDate} />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip
              formatter={tooltipFormatter}
              labelFormatter={(label) => (typeof label === 'string' ? formatDate(label) : label)}
            />
            <Legend />

            {/* Confidence interval area */}
            {showConfidence && (
              <>
                <Area
                  type="monotone"
                  dataKey="confidence_upper"
                  stroke="none"
                  fill="#2563eb"
                  fillOpacity={0.1}
                  name="Upper Bound"
                />
                <Area
                  type="monotone"
                  dataKey="confidence_lower"
                  stroke="none"
                  fill="#2563eb"
                  fillOpacity={0.1}
                  name="Lower Bound"
                />
              </>
            )}

            <Line
              type="monotone"
              dataKey="income"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Income"
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Expense"
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#2563eb"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              name="Net"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Forecast Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Income
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expense
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.forecast_periods.map((period) => (
                <tr key={period.period} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatDate(period.period)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 font-medium">
                    {formatCurrency(period.forecast_income)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600 font-medium">
                    {formatCurrency(period.forecast_expense)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <span className={period.forecast_net >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(period.forecast_net)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                    ±{formatCurrency(data.confidence.income_interval)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Historical Avg Income</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(data.statistics.historical_avg_income)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Historical Avg Expense</p>
          <p className="text-xl font-bold text-red-600">
            {formatCurrency(data.statistics.historical_avg_expense)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Income Trend</p>
          <p
            className={`text-xl font-bold ${data.statistics.historical_trend_income >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {data.statistics.historical_trend_income > 0 ? '+' : ''}
            {formatCurrency(data.statistics.historical_trend_income)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Expense Trend</p>
          <p
            className={`text-xl font-bold ${data.statistics.historical_trend_expense <= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {data.statistics.historical_trend_expense > 0 ? '+' : ''}
            {formatCurrency(data.statistics.historical_trend_expense)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Forecast;
