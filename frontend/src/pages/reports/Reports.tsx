import React from 'react';

import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

import Button from '../../components/common/Button';

const Reports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Generate financial reports</p>
        </div>
        <Button variant="secondary">
          <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
          Export
        </Button>
      </div>

      {/* Reports content will go here */}
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Reports content coming soon...</p>
      </div>
    </div>
  );
};

export default Reports;
