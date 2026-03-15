import React from 'react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { CategorySpending, TimeSeriesData } from '../../types';

interface SpendingChartProps {
  type: 'pie' | 'bar' | 'line';
  data: CategorySpending[] | TimeSeriesData[];
  height?: number;
}

const COLORS = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#db2777',
  '#65a30d',
];

const SpendingChart: React.FC<SpendingChartProps> = ({ type, data, height = 300 }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderPieChart = () => {
    const pieData = data as CategorySpending[];

    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="amount"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => formatCurrency(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderBarChart = () => {
    const barData = data as CategorySpending[];

    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={barData} layout="vertical" margin={{ left: 100 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(value: any) => formatCurrency(value)} />
          <YAxis type="category" dataKey="category" width={80} />
          <Tooltip formatter={(value: any) => formatCurrency(value)} />
          <Legend />
          <Bar dataKey="amount" fill="#2563eb">
            {barData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderLineChart = () => {
    const lineData = data as TimeSeriesData[];

    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={(value: any) => formatCurrency(value)} />
          <Tooltip formatter={(value: any) => formatCurrency(value)} />
          <Legend />
          <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={2} />
          <Line type="monotone" dataKey="expense" stroke="#dc2626" strokeWidth={2} />
          <Line
            type="monotone"
            dataKey="net"
            stroke="#2563eb"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  switch (type) {
    case 'pie':
      return renderPieChart();
    case 'bar':
      return renderBarChart();
    case 'line':
      return renderLineChart();
    default:
      return null;
  }
};

export default SpendingChart;
