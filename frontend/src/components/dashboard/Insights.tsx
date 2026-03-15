import React from 'react';

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

import { DashboardInsight } from '../../types';

interface InsightsProps {
  insights: DashboardInsight[];
}

const Insights: React.FC<InsightsProps> = ({ insights }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <LightBulbIcon className="h-5 w-5 text-purple-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-purple-50 border-purple-200';
    }
  };

  if (!insights || insights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500">
          <LightBulbIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p>No insights available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Insights</h3>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className={`p-4 rounded-lg border ${getBgColor(insight.type)}`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">{getIcon(insight.type)}</div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                <p className="mt-1 text-sm text-gray-600">{insight.msg}</p>
                {insight.action && (
                  <p className="mt-2 text-sm font-medium text-primary-600">{insight.action}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Insights;
