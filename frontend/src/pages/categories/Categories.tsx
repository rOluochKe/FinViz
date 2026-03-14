import React from 'react';

import { PlusIcon } from '@heroicons/react/24/outline';

import Button from '../../components/common/Button';

const Categories: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">Organize your transactions</p>
        </div>
        <Button>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Categories content will go here */}
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Categories content coming soon...</p>
      </div>
    </div>
  );
};

export default Categories;
