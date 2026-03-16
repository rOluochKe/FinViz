import React from 'react';

import {
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  UserIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface UserStatsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    admins: number;
    verified: number;
  };
}

const UserStats: React.FC<UserStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Users',
      value: stats.total,
      icon: UserGroupIcon,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Active',
      value: stats.active,
      icon: CheckCircleIcon,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Inactive',
      value: stats.inactive,
      icon: ClockIcon,
      color: 'bg-gray-100 text-gray-600',
    },
    {
      title: 'Suspended',
      value: stats.suspended,
      icon: XCircleIcon,
      color: 'bg-red-100 text-red-600',
    },
    {
      title: 'Admins',
      value: stats.admins,
      icon: UserIcon,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Verified',
      value: stats.verified,
      icon: CheckCircleIcon,
      color: 'bg-teal-100 text-teal-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((card) => (
        <div key={card.title} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{card.title}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
            <div className={`p-2 rounded-lg ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserStats;
