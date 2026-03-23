import React, { useState } from 'react';

import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

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
    }).format(value || 0);
  };

  const formatDate = (period: string) => {
    if (!period) return '';
    const parts = period.split('-');
    if (parts.length < 2) return period;
    const [year, month] = parts;
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

  // Safe data access with fallbacks
  const safeData = {
    method: data?.method || 'linear_regression',
    historical_period: {
      start: data?.historical_period?.start || '',
      end: data?.historical_period?.end || '',
      months: data?.historical_period?.months || 0,
    },
    forecast_periods: data?.forecast_periods || [],
    confidence: {
      score: data?.confidence?.score || 0,
      income_interval: data?.confidence?.income_interval || 0,
      expense_interval: data?.confidence?.expense_interval || 0,
      interpretation: data?.confidence?.interpretation || 'Low',
    },
    statistics: {
      historical_avg_income: data?.statistics?.historical_avg_income || 0,
      historical_avg_expense: data?.statistics?.historical_avg_expense || 0,
      historical_trend_income: data?.statistics?.historical_trend_income || 0,
      historical_trend_expense: data?.statistics?.historical_trend_expense || 0,
    },
  };

  // Combine historical and forecast data for chart
  const chartData = [
    ...safeData.forecast_periods.map((p) => ({
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
              Based on your historical data using {safeData.method} analysis
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(safeData.confidence.score)}`}
          >
            Confidence: {(safeData.confidence.score * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Confidence Interval Toggle */}
      {safeData.forecast_periods.length > 0 && (
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
      )}

      {/* Forecast Chart */}
      {safeData.forecast_periods.length > 0 ? (
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
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ArrowTrendingUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Forecast Data Available</h3>
          <p className="text-sm text-gray-500">
            Need at least 6 months of transaction data to generate a forecast.
          </p>
        </div>
      )}

      {/* Forecast Table */}
      {safeData.forecast_periods.length > 0 && (
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
                {safeData.forecast_periods.map((period, idx) => (
                  <tr key={period.period || idx} className="hover:bg-gray-50">
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
                      <span
                        className={period.forecast_net >= 0 ? 'text-green-600' : 'text-red-600'}
                      >
                        {formatCurrency(period.forecast_net)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      ±{formatCurrency(safeData.confidence.income_interval)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistics */}
      {safeData.forecast_periods.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Historical Avg Income</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(safeData.statistics.historical_avg_income)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Historical Avg Expense</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(safeData.statistics.historical_avg_expense)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Income Trend</p>
            <p
              className={`text-xl font-bold ${safeData.statistics.historical_trend_income >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {safeData.statistics.historical_trend_income > 0 ? '+' : ''}
              {formatCurrency(safeData.statistics.historical_trend_income)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Expense Trend</p>
            <p
              className={`text-xl font-bold ${safeData.statistics.historical_trend_expense <= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {safeData.statistics.historical_trend_expense > 0 ? '+' : ''}
              {formatCurrency(safeData.statistics.historical_trend_expense)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forecast;
