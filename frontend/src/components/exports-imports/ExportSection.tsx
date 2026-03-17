import React, { useCallback, useEffect, useState } from 'react';

import { CalendarIcon } from '@heroicons/react/24/outline';

import { format as formatDate } from 'date-fns';
import toast from 'react-hot-toast';

import exportImportService from '../../services/export-import';
import { ExportFormat, ExportFormatInfo, ExportSectionProps } from '../../types';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';
import Select from '../common/Select';
import Spinner from '../common/Spinner';

const ExportSection: React.FC<ExportSectionProps> = ({ onExportComplete, onError }) => {
  const [formats, setFormats] = useState<ExportFormatInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState<
    'transactions' | 'categories' | 'budgets' | 'report'
  >('transactions');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dateRange, setDateRange] = useState<'all' | 'custom'>('all');
  const [startDate, setStartDate] = useState(
    formatDate(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(formatDate(new Date(), 'yyyy-MM-dd'));
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'category' | 'comparison'>(
    'summary'
  );
  const [includeCharts, setIncludeCharts] = useState(false);
  const [categoryId, setCategoryId] = useState<string>('');

  const loadFormats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await exportImportService.getExportFormats();

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
        setFormats(getDefaultFormats());
      }
    } catch (error: any) {
      // Set default formats on error
      setFormats(getDefaultFormats());
      onError?.(error.message || 'Failed to load export formats');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Load available formats on mount
  useEffect(() => {
    loadFormats();
  }, [loadFormats]);

  // Default formats as fallback
  const getDefaultFormats = (): ExportFormatInfo[] => {
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
      {
        format: 'pdf',
        name: 'PDF',
        mime_type: 'application/pdf',
        extension: '.pdf',
        features: ['Printable', 'Professional reports'],
        max_size_mb: 20,
      },
    ];
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      let result;

      const options = {
        format: exportFormat,
        ...(dateRange === 'custom' && { start_date: startDate, end_date: endDate }),
        ...(categoryId && { category_id: parseInt(categoryId) }),
      };

      switch (exportType) {
        case 'transactions':
          result = await exportImportService.exportTransactions(options);
          break;
        case 'categories':
          result = await exportImportService.exportCategories(options);
          break;
        case 'budgets':
          result = await exportImportService.exportBudgets(options);
          break;
        case 'report':
          result = await exportImportService.exportReport({
            format: exportFormat,
            start_date: startDate,
            end_date: endDate,
            report_type: reportType,
            include_charts: includeCharts,
          });
          break;
      }

      // Download the file
      if (result) {
        // Check if result has filename or if we need to get it from response
        const filename = result.filename || `export.${exportFormat}`;
        const downloadUrl = result.download_url || '';

        if (downloadUrl) {
          // If we have a download URL, fetch the blob
          const blob = await exportImportService.downloadFile(filename);
          exportImportService.triggerDownload(filename, blob);
        } else {
          // If no download URL, create a simple blob with the data
          const blob = new Blob([JSON.stringify(result)], { type: 'application/json' });
          exportImportService.triggerDownload(filename, blob);
        }

        toast.success(`Export completed: ${filename}`);
        onExportComplete?.({
          filename: filename,
          size: 0, // We don't have size info in this case
          size_formatted: 'Unknown',
          created_at: new Date().toISOString(),
          download_url: downloadUrl,
          type: exportType,
        });
      }
    } catch (error: any) {
      console.error('Export failed:', error);
      onError?.(error.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  // Safely create format options
  const formatOptions = Array.isArray(formats)
    ? formats.map((f) => ({
        value: f.format,
        label: f.name,
      }))
    : [];

  const exportTypeOptions = [
    { value: 'transactions', label: 'Transactions' },
    { value: 'categories', label: 'Categories' },
    { value: 'budgets', label: 'Budgets' },
    { value: 'report', label: 'Custom Report' },
  ];

  const reportTypeOptions = [
    { value: 'summary', label: 'Summary Report' },
    { value: 'detailed', label: 'Detailed Report' },
    { value: 'category', label: 'Category Analysis' },
    { value: 'comparison', label: 'Period Comparison' },
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'custom', label: 'Custom Range' },
  ];

  // Safely get current format info
  const currentFormat = Array.isArray(formats)
    ? formats.find((f) => f.format === exportFormat)
    : null;

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold mb-6">Export Data</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Export Type */}
            <Select
              label="Export Type"
              value={exportType}
              onChange={(e) => setExportType(e.target.value as typeof exportType)}
              options={exportTypeOptions}
            />

            {/* Format Selection - Only show if we have formats */}
            {formatOptions.length > 0 ? (
              <Select
                label="Format"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                options={formatOptions}
              />
            ) : (
              <div className="text-sm text-gray-500">No export formats available</div>
            )}

            {/* Format Description */}
            {currentFormat && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-1">{currentFormat.name}</h4>
                <p className="text-sm text-blue-600">MIME Type: {currentFormat.mime_type}</p>
                <p className="text-sm text-blue-600">
                  Features: {currentFormat.features?.join(', ') || 'None'}
                </p>
              </div>
            )}

            {/* Date Range (for transactions and report) */}
            {(exportType === 'transactions' || exportType === 'report') && (
              <>
                <Select
                  label="Date Range"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                  options={dateRangeOptions}
                />

                {dateRange === 'custom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Start Date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      leftIcon={<CalendarIcon className="h-5 w-5" />}
                    />
                    <Input
                      label="End Date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      leftIcon={<CalendarIcon className="h-5 w-5" />}
                    />
                  </div>
                )}
              </>
            )}

            {/* Category Filter (for transactions) */}
            {exportType === 'transactions' && (
              <Input
                label="Category ID (optional)"
                type="number"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                placeholder="Filter by category"
              />
            )}

            {/* Report Type (for report export) */}
            {exportType === 'report' && (
              <>
                <Select
                  label="Report Type"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as typeof reportType)}
                  options={reportTypeOptions}
                />

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Include charts in report</span>
                </label>
              </>
            )}

            {/* Export Button */}
            <div className="pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleExport}
                isLoading={exporting}
                fullWidth
              >
                Export {exportType.charAt(0).toUpperCase() + exportType.slice(1)}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Tips Card */}
      <Card padding="sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 Export Tips</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>CSV files are best for spreadsheet applications like Excel</li>
          <li>JSON format preserves all data structure and metadata</li>
          <li>Excel format includes formatting and multiple sheets</li>
          <li>PDF reports are optimized for printing and sharing</li>
          <li>Large exports are processed in the background</li>
        </ul>
      </Card>
    </div>
  );
};

export default ExportSection;
