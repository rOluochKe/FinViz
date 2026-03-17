import React, { useEffect, useRef, useState } from 'react';

import {
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import toast from 'react-hot-toast';

import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';
import ExportSection from '../../components/exports-imports/ExportSection';
import ImportSection from '../../components/exports-imports/ImportSection';
import exportImportService from '../../services/export-import';
import { ExportFile, ExportFilesResponse } from '../../types';

type TabType = 'export' | 'import' | 'files';

const ExportsImports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('export');
  const activeTabRef = useRef<TabType>('export');
  const [exportedFiles, setExportedFiles] = useState<ExportFilesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  // Update ref whenever activeTab changes
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Load exported files on mount and when tab changes to 'files'
  useEffect(() => {
    if (activeTab === 'files') {
      loadExportedFiles();
    }
  }, [activeTab]);

  const loadExportedFiles = async () => {
    setLoading(true);
    try {
      const data = await exportImportService.listExportedFiles();
      setExportedFiles(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load exported files');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (file: ExportFile) => {
    setDownloading(file.filename);
    try {
      const blob = await exportImportService.downloadFile(file.filename);
      exportImportService.triggerDownload(file.filename, blob);
      toast.success(`Downloaded ${file.filename}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to download file');
    } finally {
      setDownloading(null);
    }
  };

  const handleClearTempFiles = async () => {
    if (!window.confirm('Are you sure you want to clear all temporary import files?')) {
      return;
    }

    setClearing(true);
    try {
      const result = await exportImportService.clearTempFiles();
      toast.success(result.message);
      loadExportedFiles(); // Reload files list
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear temp files');
    } finally {
      setClearing(false);
    }
  };

  const tabs = [
    { id: 'export', name: 'Export Data', icon: DocumentArrowDownIcon },
    { id: 'import', name: 'Import Data', icon: DocumentArrowUpIcon },
    { id: 'files', name: 'Exported Files', icon: DocumentTextIcon },
  ];

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exports & Imports</h1>
          <p className="text-gray-600 mt-1">
            Export your financial data or import transactions from external sources
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'export' && (
          <ExportSection
            onExportComplete={(file) => {
              toast.success(`Export completed: ${file.filename}`);
              // Use ref to check current tab
              if (activeTabRef.current === 'files') {
                loadExportedFiles();
              }
            }}
            onError={(error) => toast.error(error)}
          />
        )}

        {activeTab === 'import' && (
          <ImportSection
            onImportComplete={(result) => {
              toast.success(
                `Import completed: ${result.succeeded} of ${result.total_rows} records imported successfully`
              );
            }}
            onError={(error) => toast.error(error)}
          />
        )}

        {activeTab === 'files' && (
          <div className="space-y-6">
            {/* Storage Usage */}
            {exportedFiles?.storage && (
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Storage Usage</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearTempFiles}
                    isLoading={clearing}
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Clear Temp Files
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Used:</span>
                    <span className="font-medium">{exportedFiles.storage.used_formatted}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Limit:</span>
                    <span className="font-medium">{exportedFiles.storage.limit_formatted}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        exportedFiles.storage.percent_used > 90
                          ? 'bg-red-600'
                          : exportedFiles.storage.percent_used > 70
                            ? 'bg-yellow-400'
                            : 'bg-primary-600'
                      }`}
                      style={{ width: `${Math.min(exportedFiles.storage.percent_used, 100)}%` }}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Files List */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Exported Files</h3>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : exportedFiles?.files && exportedFiles.files.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Filename
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {exportedFiles.files.map((file) => (
                        <tr key={file.filename} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {file.filename}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {file.size_formatted}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(file.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {file.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadFile(file)}
                              isLoading={downloading === file.filename}
                            >
                              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Alert
                  type="info"
                  message="No exported files found. Use the Export tab to create your first export."
                />
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportsImports;
