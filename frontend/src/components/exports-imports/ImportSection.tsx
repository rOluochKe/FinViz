import React, { useCallback, useEffect, useState } from 'react';

import {
  DocumentArrowUpIcon,
  DocumentTextIcon,
  TableCellsIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

import exportImportService from '../../services/export-import';
import { ExportFormatInfo, ImportPreview, ImportSectionProps, ImportTemplate } from '../../types';
import Alert from '../common/Alert';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';
import Select from '../common/Select';
import Spinner from '../common/Spinner';

// Default formats as fallback for imports
const getDefaultImportFormats = (): ExportFormatInfo[] => {
  return [
    {
      format: 'csv',
      name: 'CSV (Comma Separated Values)',
      mime_type: 'text/csv',
      extension: '.csv',
      features: ['Simple', 'Excel compatible'],
      max_size_mb: 100,
    },
    {
      format: 'json',
      name: 'JSON',
      mime_type: 'application/json',
      extension: '.json',
      features: ['Full data structure', 'Machine readable'],
      max_size_mb: 100,
    },
    {
      format: 'excel',
      name: 'Excel',
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: '.xlsx',
      features: ['Formatted', 'Multiple sheets'],
      max_size_mb: 50,
    },
  ];
};

const ImportSection: React.FC<ImportSectionProps> = ({ onImportComplete, onError }) => {
  const [formats, setFormats] = useState<ExportFormatInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [template, setTemplate] = useState<ImportTemplate | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('csv');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [importOptions, setImportOptions] = useState({
    skip_errors: false,
    create_missing_categories: true,
    default_category: '',
  });

  const loadSupportedFormats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await exportImportService.getSupportedFormats();

      // Ensure data is an array
      if (Array.isArray(data)) {
        setFormats(data);
      } else if (data && typeof data === 'object') {
        // Handle case where API returns an object with a formats property
        if (
          typeof data === 'object' &&
          data !== null &&
          'formats' in data &&
          Array.isArray((data as { formats: unknown }).formats)
        ) {
          setFormats((data as { formats: ExportFormatInfo[] }).formats);
        } else {
          // If it's a single object, wrap it in an array
          setFormats([data as ExportFormatInfo]);
        }
      } else {
        // Fallback to default formats if API returns invalid data
        setFormats(getDefaultImportFormats());
      }
    } catch (error: any) {
      // Set default formats on error
      setFormats(getDefaultImportFormats());
      onError?.(error.message || 'Failed to load supported formats');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Load supported formats on mount
  useEffect(() => {
    loadSupportedFormats();
  }, [loadSupportedFormats]);

  // Load template when format changes
  useEffect(() => {
    if (selectedFormat) {
      loadTemplate(selectedFormat);
    }
  }, [selectedFormat]);

  const loadTemplate = async (format: string) => {
    try {
      const data = await exportImportService.getImportTemplate(format);
      setTemplate(data);
    } catch (error: any) {
      console.error('Failed to load template:', error);
      // Set a default template structure on error
      setTemplate({
        format: format as any,
        headers: [],
        sample: [],
        description: 'Template unavailable',
        required_fields: [],
        optional_fields: [],
      });
    }
  };

  const handleValidate = useCallback(
    async (id: string) => {
      setValidating(true);
      try {
        const previewData = await exportImportService.validateFile(id);
        setPreview(previewData);

        // Initialize mapping with detected fields
        if (previewData.mapping) {
          setMapping(previewData.mapping);
        }

        setShowPreviewModal(true);
      } catch (error: any) {
        onError?.(error.message || 'Validation failed');
      } finally {
        setValidating(false);
      }
    },
    [onError]
  );

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const result = await exportImportService.uploadFile(file);
        setFileId(result.file_id);

        // Automatically validate after upload
        await handleValidate(result.file_id);

        toast.success(`File uploaded: ${result.filename}`);
      } catch (error: any) {
        onError?.(error.message || 'Upload failed');
        setFile(null);
      } finally {
        setUploading(false);
      }
    },
    [onError, handleValidate]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Validate file size (max 16MB)
      if (file.size > 16 * 1024 * 1024) {
        onError?.('File size exceeds 16MB limit');
        return;
      }

      setFile(file);
      await handleUpload(file);
    },
    [handleUpload, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  const handlePreview = async () => {
    if (!fileId) return;

    setValidating(true);
    try {
      const previewData = await exportImportService.previewImport(fileId, mapping);
      setPreview(previewData);
      setShowPreviewModal(true);
    } catch (error: any) {
      onError?.(error.message || 'Preview failed');
    } finally {
      setValidating(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!fileId) return;

    setImporting(true);
    try {
      const result = await exportImportService.executeImport(fileId, mapping, {
        skip_errors: importOptions.skip_errors,
        create_missing_categories: importOptions.create_missing_categories,
        default_category: importOptions.default_category
          ? parseInt(importOptions.default_category)
          : undefined,
      });

      setShowPreviewModal(false);
      onImportComplete?.(result);

      // Reset state
      setFile(null);
      setFileId(null);
      setPreview(null);
      setMapping({});
    } catch (error: any) {
      onError?.(error.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileId(null);
    setPreview(null);
    setMapping({});
  };

  const handleDownloadTemplate = () => {
    exportImportService.downloadTemplate(selectedFormat);
  };

  // Safely create format options
  const formatOptions = Array.isArray(formats)
    ? formats.map((f) => ({
        value: f.format,
        label: f.name,
      }))
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold mb-6">Import Data</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Format Selection */}
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                {formatOptions.length > 0 ? (
                  <Select
                    label="Import Format"
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    options={formatOptions}
                  />
                ) : (
                  <div className="text-sm text-gray-500">No import formats available</div>
                )}
              </div>
              <Button variant="outline" onClick={handleDownloadTemplate} disabled={!template}>
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Download Template
              </Button>
            </div>

            {/* Template Info - Add null checks for required_fields and optional_fields */}
            {template && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Required Fields:</h4>
                <p className="text-sm text-blue-600 mb-2">
                  {template.required_fields && Array.isArray(template.required_fields)
                    ? template.required_fields.join(', ')
                    : 'None specified'}
                </p>
                <h4 className="text-sm font-medium text-blue-800 mb-2">Optional Fields:</h4>
                <p className="text-sm text-blue-600">
                  {template.optional_fields && Array.isArray(template.optional_fields)
                    ? template.optional_fields.join(', ')
                    : 'None specified'}
                </p>
              </div>
            )}

            {/* Upload Area */}
            {!file ? (
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                  transition-colors duration-200
                  ${
                    isDragActive
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                  }
                `}
              >
                <input {...getInputProps()} />
                <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-lg font-medium text-gray-900">
                  {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  or click to browse (CSV, JSON, Excel up to 16MB)
                </p>
              </div>
            ) : (
              <div className="border rounded-lg p-6 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <DocumentTextIcon className="h-8 w-8 text-primary-600" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    disabled={uploading || validating || importing}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </Button>
                </div>

                <div className="mt-4 flex space-x-3">
                  <Button
                    variant="primary"
                    onClick={handlePreview}
                    isLoading={validating}
                    disabled={!fileId || importing}
                  >
                    <TableCellsIcon className="h-5 w-5 mr-2" />
                    Preview Data
                  </Button>
                </div>

                {validating && (
                  <div className="mt-4 flex items-center space-x-2 text-primary-600">
                    <Spinner size="sm" />
                    <span>Validating file...</span>
                  </div>
                )}
              </div>
            )}

            {/* Import Options */}
            {file && (
              <Card padding="sm">
                <h3 className="font-medium mb-4">Import Options</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={importOptions.skip_errors}
                      onChange={(e) =>
                        setImportOptions((prev) => ({
                          ...prev,
                          skip_errors: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">
                      Skip errors and continue importing
                    </span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={importOptions.create_missing_categories}
                      onChange={(e) =>
                        setImportOptions((prev) => ({
                          ...prev,
                          create_missing_categories: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">
                      Create missing categories automatically
                    </span>
                  </label>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Default Category ID (optional)
                    </label>
                    <input
                      type="number"
                      value={importOptions.default_category}
                      onChange={(e) =>
                        setImportOptions((prev) => ({
                          ...prev,
                          default_category: e.target.value,
                        }))
                      }
                      placeholder="Enter category ID for unmapped transactions"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </Card>

      {/* Tips Card */}
      <Card padding="sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 Import Tips</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Download and use the template for the correct format</li>
          <li>Ensure dates are in YYYY-MM-DD format</li>
          <li>Amounts should be positive numbers (type determines income/expense)</li>
          <li>Category names must match existing categories</li>
          <li>Preview your data before executing the import</li>
        </ul>
      </Card>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Preview Import Data"
        size="xl"
      >
        {preview && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                Found <span className="font-semibold">{preview.total_rows}</span> rows to import
              </p>
              {preview.warnings && preview.warnings.length > 0 && (
                <div className="mt-2">
                  {preview.warnings.map((warning, index) => (
                    <Alert key={index} type="warning" message={warning} />
                  ))}
                </div>
              )}
              {preview.errors && preview.errors.length > 0 && (
                <div className="mt-2">
                  {preview.errors.map((error, index) => (
                    <Alert
                      key={index}
                      type="error"
                      message={`Row ${error.row}: ${error.message}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Column Mapping */}
            <div>
              <h4 className="font-medium mb-2">Column Mapping</h4>
              <div className="space-y-2">
                {Object.entries(preview.mapping || {}).map(([field, column]) => (
                  <div key={field} className="flex items-center space-x-2">
                    <span className="w-32 text-sm font-medium text-gray-700">{field}:</span>
                    <select
                      value={column}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          [field]: e.target.value,
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">-- Select column --</option>
                      {preview.columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Data */}
            <div>
              <h4 className="font-medium mb-2">Sample Data (First 5 rows)</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {preview.columns.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.sample.map((row, index) => (
                      <tr key={index}>
                        {preview.columns.map((col) => (
                          <td key={col} className="px-4 py-2 text-sm text-gray-900">
                            {String(row[col] || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowPreviewModal(false)}
                disabled={importing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleExecuteImport}
                isLoading={importing}
                disabled={importing || (preview.errors && preview.errors.length > 0)}
              >
                Execute Import
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ImportSection;
