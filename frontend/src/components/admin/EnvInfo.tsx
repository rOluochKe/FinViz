import React from 'react';

import {
  BeakerIcon,
  BugAntIcon,
  CircleStackIcon,
  ClipboardDocumentIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';

import toast from 'react-hot-toast';

interface EnvInfoProps {
  env: {
    environment: string;
    debug: boolean;
    database: string;
    cache: string;
  };
}

const EnvInfo: React.FC<EnvInfoProps> = ({ env }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getEnvColor = (env: string) => {
    switch (env) {
      case 'production':
        return 'bg-red-100 text-red-800';
      case 'staging':
        return 'bg-yellow-100 text-yellow-800';
      case 'development':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment Information</h3>

      <div className="space-y-4">
        {/* Environment */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <BeakerIcon className="h-5 w-5 text-gray-500 mr-3" />
            <span className="text-sm text-gray-700">Environment</span>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getEnvColor(env.environment)}`}
            >
              {env.environment}
            </span>
            <button
              onClick={() => copyToClipboard(env.environment)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <ClipboardDocumentIcon className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Debug Mode */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <BugAntIcon className="h-5 w-5 text-gray-500 mr-3" />
            <span className="text-sm text-gray-700">Debug Mode</span>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              env.debug ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {env.debug ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {/* Database */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <CircleStackIcon className="h-5 w-5 text-gray-500 mr-3" />
            <span className="text-sm text-gray-700">Database</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono text-gray-900 truncate max-w-[200px]">
              {env.database}
            </span>
            <button
              onClick={() => copyToClipboard(env.database)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <ClipboardDocumentIcon className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Cache */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <ServerIcon className="h-5 w-5 text-gray-500 mr-3" />
            <span className="text-sm text-gray-700">Cache</span>
          </div>
          <span className="text-sm font-mono text-gray-900">{env.cache}</span>
        </div>
      </div>
    </div>
  );
};

export default EnvInfo;
