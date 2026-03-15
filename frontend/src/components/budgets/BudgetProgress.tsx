import React from 'react';

import { ArrowTrendingUpIcon, CalendarIcon } from '@heroicons/react/24/outline';

import { format } from 'date-fns';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface BudgetProgressProps {
  progress: {
    budget: any;
    period: {
      start: string;
      end: string;
      days_passed: number;
      days_remaining: number;
      days_total: number;
    };
    daily_progress: Array<{
      date: string;
      day_spent: number;
      cumulative_spent: number;
      remaining: number;
      percentage: number;
    }>;
    projections: {
      average_daily_spend: number;
      projected_total: number;
      will_exceed_budget: boolean;
      projected_excess: number;
      recommended_daily: number;
    };
  };
}

// Custom formatter functions with proper typing for Recharts
const formatCurrency = (value: number | string | undefined): string => {
  if (value === undefined || value === null) return '$0';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '$0';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
};

const formatDate = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), 'MMM dd');
  } catch {
    return dateStr;
  }
};

// Tooltip formatter that matches Recharts expected signature
const tooltipValueFormatter = (value: any): string => {
  if (value === undefined || value === null) return '$0';
  if (typeof value === 'number') return formatCurrency(value);
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? value : formatCurrency(num);
  }
  return String(value);
};

// Label formatter that matches Recharts expected signature
const tooltipLabelFormatter = (label: any): string => {
  if (!label) return '';
  if (typeof label === 'string') return formatDate(label);
  if (label instanceof Date) return formatDate(label.toISOString());
  return String(label);
};

const BudgetProgress: React.FC<BudgetProgressProps> = ({ progress }) => {
  const getProgressColor = () => {
    if (progress.projections.will_exceed_budget) return 'text-red-600';
    if (progress.budget.spent_percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {progress.budget.category_name} Progress
          </h2>
          <p className="text-sm text-gray-500 flex items-center mt-1">
            <CalendarIcon className="h-4 w-4 mr-1" />
            {format(new Date(progress.period.start), 'MMM dd, yyyy')} -{' '}
            {format(new Date(progress.period.end), 'MMM dd, yyyy')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Budget</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(progress.budget.amount)}
          </p>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Spent</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(progress.budget.spent)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {progress.budget.spent_percentage.toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Remaining</p>
          <p className={`text-xl font-bold ${getProgressColor()}`}>
            {formatCurrency(progress.budget.remaining)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Days Passed</p>
          <p className="text-xl font-bold text-gray-900">{progress.period.days_passed}</p>
          <p className="text-xs text-gray-400">of {progress.period.days_total} days</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Avg Daily</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(progress.projections.average_daily_spend)}
          </p>
        </div>
      </div>

      {/* Cumulative Spending Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Cumulative Spending</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={progress.daily_progress}
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatDate} />
            <YAxis tickFormatter={tooltipValueFormatter} />
            <Tooltip
              formatter={tooltipValueFormatter}
              labelFormatter={tooltipLabelFormatter}
              contentStyle={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}
            />
            <Area
              type="monotone"
              dataKey="cumulative_spent"
              stroke="#2563eb"
              fillOpacity={1}
              fill="url(#colorCumulative)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Spending Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Daily Spending</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={progress.daily_progress}
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatDate} />
            <YAxis tickFormatter={tooltipValueFormatter} />
            <Tooltip
              formatter={tooltipValueFormatter}
              labelFormatter={tooltipLabelFormatter}
              contentStyle={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}
            />
            <Line
              type="monotone"
              dataKey="day_spent"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Projections */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <ArrowTrendingUpIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-700">Projections</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">Projected Total</p>
            <p
              className={`text-lg font-semibold ${progress.projections.will_exceed_budget ? 'text-red-600' : 'text-green-600'}`}
            >
              {formatCurrency(progress.projections.projected_total)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Projected Excess</p>
            <p className="text-lg font-semibold text-red-600">
              {formatCurrency(progress.projections.projected_excess)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Recommended Daily</p>
            <p className="text-lg font-semibold text-primary-600">
              {formatCurrency(progress.projections.recommended_daily)}
            </p>
          </div>
        </div>

        {progress.projections.will_exceed_budget && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              ⚠️ You're on track to exceed your budget by{' '}
              {formatCurrency(progress.projections.projected_excess)}. Try to limit daily spending
              to {formatCurrency(progress.projections.recommended_daily)}.
            </p>
          </div>
        )}

        {!progress.projections.will_exceed_budget && progress.period.days_remaining > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ You're on track to stay within budget. You have{' '}
              {formatCurrency(progress.budget.remaining)} left for the remaining{' '}
              {progress.period.days_remaining} days.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetProgress;
