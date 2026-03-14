import React from 'react';

const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <select className="input-field text-sm py-1 w-40">
          <option>Last 30 days</option>
          <option>Last 90 days</option>
          <option>Last 12 months</option>
          <option>Year to date</option>
        </select>
      </div>

      {/* Analytics content will go here */}
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Analytics content coming soon...</p>
      </div>
    </div>
  );
};

export default Analytics;
