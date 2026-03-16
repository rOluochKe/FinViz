import React from 'react';

import { ArrowDownTrayIcon, DocumentTextIcon, EyeIcon } from '@heroicons/react/24/outline';

import Button from '../common/Button';

interface ReportCardProps {
  title: string;
  description: string;
  date: string;
  type: 'monthly' | 'yearly' | 'category';
  onView: () => void;
  onExport?: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({
  title,
  description,
  date,
  type,
  onView,
  onExport,
}) => {
  const getTypeColor = () => {
    switch (type) {
      case 'monthly':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'yearly':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'category':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 border border-gray-100">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <DocumentTextIcon className="h-8 w-8 text-primary-600" />
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor()}`}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{description}</p>
        <p className="text-xs text-gray-400 mb-4">{date}</p>

        <div className="flex space-x-2">
          <Button size="sm" variant="secondary" onClick={onView} className="flex-1">
            <EyeIcon className="h-4 w-4 mr-1" />
            View
          </Button>
          {onExport && (
            <Button size="sm" variant="secondary" onClick={onExport} className="flex-1">
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
