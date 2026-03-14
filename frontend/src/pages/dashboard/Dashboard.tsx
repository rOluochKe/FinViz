import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</div>
      </div>

      {/* Dashboard content will go here */}
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Dashboard content coming soon...</p>
      </div>
    </div>
  );
};

export default Dashboard;
