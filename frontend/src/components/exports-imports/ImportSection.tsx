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
      format: 'csv' as any,
      name: 'CSV (Comma Separated Values)',
      mime_type: 'text/csv',
      extension: '.csv',
      features: ['Simple', 'Excel compatible'],
      max_size_mb: 100,
    },
    {
      format: 'json' as any,
      name: 'JSON',
      mime_type: 'application/json',
      extension: '.json',
      features: ['Full data structure', 'Machine readable'],
      max_size_mb: 100,
    },
    {
      format: 'excel' as any,
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
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    filename: string;
    file_id: string;
  } | null>(null);
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

      let formatsArray: ExportFormatInfo[] = [];

      if (Array.isArray(data) && data.length > 0) {
        formatsArray = data;
      } else if (data && typeof data === 'object' && !Array.isArray(data)) {
        if ('formats' in data && Array.isArray((data as any).formats)) {
          formatsArray = (data as any).formats;
        }
      }

      if (formatsArray.length > 0 && formatsArray.every((f) => f.format && f.name)) {
        setFormats(formatsArray);
      } else {
        setFormats(getDefaultImportFormats());
      }
    } catch (error: any) {
      console.error('Failed to load supported formats:', error);
      setFormats(getDefaultImportFormats());
      onError?.(error.message || 'Failed to load supported formats');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    loadSupportedFormats();
  }, [loadSupportedFormats]);

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
      let defaultRequiredFields = ['date', 'amount', 'description'];
      let defaultOptionalFields = ['category', 'type', 'notes'];

      if (format === 'json') {
        defaultRequiredFields = ['date', 'amount', 'description'];
        defaultOptionalFields = ['category', 'type', 'notes', 'tags'];
      } else if (format === 'excel') {
        defaultRequiredFields = ['date', 'amount', 'description'];
        defaultOptionalFields = ['category', 'type', 'notes'];
      }

      setTemplate({
        format: format as any,
        headers: [],
        sample: [],
        description: 'Template unavailable',
        required_fields: defaultRequiredFields,
        optional_fields: defaultOptionalFields,
      });
    }
  };

  // Independent template download - separate from drag-drop
  const handleDownloadTemplate = async () => {
    try {
      // Use the API base URL from environment or default
      const baseUrl = process.env.REACT_APP_API_URL;
      const url = `${baseUrl}/api/imports/template?format=${selectedFormat}`;
      const token = localStorage.getItem('access_token');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let blob;
      let filename = `template.${selectedFormat}`;

      if (selectedFormat === 'csv') {
        blob = new Blob([data.template], { type: 'text/csv' });
      } else if (selectedFormat === 'json') {
        blob = new Blob([JSON.stringify(data.template, null, 2)], { type: 'application/json' });
      } else {
        blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/octet-stream' });
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`Template downloaded as ${filename}`);
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
    }
  };

  const handleUpload = useCallback(
    async (fileToUpload: File) => {
      setUploading(true);
      try {
        const result = await exportImportService.uploadFile(fileToUpload);

        if (!result || !result.filename) {
          console.error('Upload response missing filename:', result);
          throw new Error('Upload response missing filename');
        }

        setUploadedFileInfo({
          filename: result.filename,
          file_id: result.file_id || result.filename,
        });

        toast.success(`File uploaded: ${result.filename}`);
      } catch (error: any) {
        console.error('Upload error details:', error);
        onError?.(error.message || 'Upload failed');
        setFile(null);
        setUploadedFileInfo(null);
      } finally {
        setUploading(false);
      }
    },
    [onError]
  );

  const handlePreview = async () => {
    if (!uploadedFileInfo) {
      console.error('No uploaded file info available');
      onError?.('No file uploaded');
      return;
    }

    if (!uploadedFileInfo.filename) {
      console.error('Filename is missing from uploaded file info');
      onError?.('Invalid file data');
      return;
    }

    setValidating(true);
    try {
      const previewData = await exportImportService.previewImport(
        uploadedFileInfo.filename,
        mapping
      );

      if (!previewData.columns) previewData.columns = [];
      if (!previewData.sample) previewData.sample = [];
      if (!previewData.mapping) previewData.mapping = {};

      setPreview(previewData);
      setShowPreviewModal(true);
    } catch (error: any) {
      console.error('Preview error:', error);
      onError?.(error.message || 'Preview failed');
    } finally {
      setValidating(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!uploadedFileInfo) {
      console.error('No uploaded file info available');
      onError?.('No file uploaded');
      return;
    }

    if (!uploadedFileInfo.filename) {
      console.error('Filename is missing from uploaded file info');
      onError?.('Invalid file data');
      return;
    }

    setImporting(true);
    try {
      const result = await exportImportService.executeImport(uploadedFileInfo.filename, mapping, {
        skip_errors: importOptions.skip_errors,
        create_missing_categories: importOptions.create_missing_categories,
        default_category: importOptions.default_category
          ? parseInt(importOptions.default_category)
          : undefined,
      });

      setShowPreviewModal(false);
      onImportComplete?.(result);

      setFile(null);
      setUploadedFileInfo(null);
      setPreview(null);
      setMapping({});
    } catch (error: any) {
      console.error('Execute import error:', error);
      onError?.(error.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const acceptedFile = acceptedFiles[0];

      if (acceptedFile.size > 16 * 1024 * 1024) {
        onError?.('File size exceeds 16MB limit');
        return;
      }

      setFile(acceptedFile);
      await handleUpload(acceptedFile);
    },
    [handleUpload, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  const handleReset = () => {
    setFile(null);
    setUploadedFileInfo(null);
    setPreview(null);
    setMapping({});
  };

  const currentFormats =
    formats && formats.length > 0 && formats.every((f) => f.format && f.name)
      ? formats
      : getDefaultImportFormats();

  const formatOptions = currentFormats.map((f) => ({
    value: f.format,
    label: f.name,
  }));

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
            {/* Format Selection & Template Download - Separate section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div className="flex-1 w-full">
                <Select
                  label="Import Format"
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  options={formatOptions}
                />
              </div>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Download Template
              </Button>
            </div>

            {/* Template Info */}
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
                <div className="mt-2 text-xs text-blue-600">
                  <strong>Format:</strong> {selectedFormat.toUpperCase()}
                </div>
              </div>
            )}

            {/* Drag & Drop Upload Area - Completely separate */}
            <div className="mt-6">
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Upload File</h3>
              </div>

              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                  transition-colors duration-200
                  ${
                    !file &&
                    (isDragActive
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50')
                  }
                  ${file ? 'border-green-500 bg-green-50' : ''}
                `}
              >
                <input {...getInputProps()} />
                <DocumentArrowUpIcon
                  className={`mx-auto h-12 w-12 ${file ? 'text-green-500' : 'text-gray-400'}`}
                />
                {file ? (
                  <>
                    <p className="mt-4 text-lg font-medium text-green-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                    <p className="text-xs text-gray-400 mt-1">Type: {file.type || 'Unknown'}</p>
                    {uploading && (
                      <div className="mt-4 flex items-center justify-center space-x-2 text-primary-600">
                        <Spinner size="sm" />
                        <span>Uploading...</span>
                      </div>
                    )}
                    {uploadedFileInfo && !uploading && (
                      <p className="mt-2 text-xs text-green-600">✓ Upload complete</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="mt-4 text-lg font-medium text-gray-900">
                      {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      or click to browse (CSV, JSON, Excel up to 16MB)
                    </p>
                    <div className="mt-3 flex justify-center gap-2 text-xs text-gray-400">
                      <span>Supported: .csv, .json, .xls, .xlsx</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* After upload actions */}
            {uploadedFileInfo && !uploading && (
              <div className="flex space-x-3">
                <Button
                  variant="primary"
                  onClick={handlePreview}
                  isLoading={validating}
                  disabled={importing}
                  className="flex-1"
                >
                  <TableCellsIcon className="h-5 w-5 mr-2" />
                  Preview Data
                </Button>
                <Button variant="secondary" onClick={handleReset} disabled={importing}>
                  <XMarkIcon className="h-5 w-5" />
                  Clear
                </Button>
              </div>
            )}

            {validating && (
              <div className="flex items-center justify-center space-x-2 text-primary-600">
                <Spinner size="sm" />
                <span>Validating file...</span>
              </div>
            )}

            {/* Import Options */}
            {uploadedFileInfo && preview && (
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
                      type="text"
                      value={importOptions.default_category}
                      onChange={(e) =>
                        setImportOptions((prev) => ({
                          ...prev,
                          default_category: e.target.value,
                        }))
                      }
                      placeholder="Enter category UUID for unmapped transactions"
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
          <li>First, download the template to see the required format</li>
          <li>Prepare your data following the template structure</li>
          <li>Then drag and drop or click to upload your file</li>
          <li>For CSV files, ensure dates are in YYYY-MM-DD format</li>
          <li>For JSON files, the data should be an array of objects</li>
          <li>For Excel files, the first row should contain column headers</li>
          <li>Amounts should be positive numbers (type determines income/expense)</li>
          <li>Category names must match existing categories</li>
          <li>Always preview your data before executing the import</li>
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
                Found <span className="font-semibold">{preview.total_rows || 0}</span> rows to
                import
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
            {preview.mapping && Object.keys(preview.mapping).length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Column Mapping</h4>
                <div className="space-y-2">
                  {Object.entries(preview.mapping).map(([field, column]) => (
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
                        {(preview.columns || []).map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample Data */}
            {preview.sample &&
              preview.sample.length > 0 &&
              preview.columns &&
              preview.columns.length > 0 && (
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
              )}

            {(!preview.sample || preview.sample.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <p>No sample data available</p>
              </div>
            )}

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
