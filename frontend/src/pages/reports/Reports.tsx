import React, { useEffect, useState } from 'react';

import {
  ArrowDownTrayIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import CategoryReport from '../../components/reports/CategoryReport';
import ComparisonReport from '../../components/reports/ComparisonReport';
import MonthlyReport from '../../components/reports/MonthlyReport';
import YearlyReport from '../../components/reports/YearlyReport';
import categoryService from '../../services/categories';
import reportsService from '../../services/reports';
import {
  CategoryReport as CategoryReportType,
  ComparisonReport as ComparisonReportType,
  MonthlyReport as MonthlyReportType,
  YearlyReport as YearlyReportType,
} from '../../types';
import showToast from '../../utils/toast';

type ReportType = 'monthly' | 'yearly' | 'category' | 'comparison';

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [, setAvailableReports] = useState<any>(null);

  // Report data states
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportType | null>(null);
  const [yearlyReport, setYearlyReport] = useState<YearlyReportType | null>(null);
  const [categoryReport, setCategoryReport] = useState<CategoryReportType | null>(null);
  const [comparisonReport, setComparisonReport] = useState<ComparisonReportType | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<ReportType>('monthly');

  // Form states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [period1, setPeriod1] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const [period2, setPeriod2] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth()).padStart(2, '0')}`
  );
  const [months, setMonths] = useState(12);

  // Categories for category report
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const reports = await reportsService.getAvailableReports();
        setAvailableReports(reports);

        // Load categories for category report
        const cats = await categoryService.getCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        showToast.error('Failed to load initial data');
      }
    };
    loadInitialData();
  }, []);

  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const handleViewMonthly = async () => {
    setLoading(true);
    try {
      const report = await reportsService.getMonthlyReport(selectedYear, selectedMonth);
      setMonthlyReport(report);
      setModalTitle(
        `Monthly Report - ${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`
      );
      setModalType('monthly');
      setIsModalOpen(true);
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to load monthly report');
    } finally {
      setLoading(false);
    }
  };

  const handleViewYearly = async () => {
    setLoading(true);
    try {
      const report = await reportsService.getYearlyReport(selectedYear);
      if (report && report.monthly && report.monthly.length > 0) {
        setYearlyReport(report);
        setModalTitle(`Yearly Report - ${selectedYear}`);
        setModalType('yearly');
        setIsModalOpen(true);
      } else {
        showToast.info(`No transaction data found for year ${selectedYear}`);
      }
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to load yearly report');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCategory = async () => {
    if (!selectedCategory) {
      showToast.error('Please select a category');
      return;
    }
    setLoading(true);
    try {
      const report = await reportsService.getCategoryReport(selectedCategory, months);
      if (report && report.category) {
        setCategoryReport(report);
        const category = categories.find((c) => c.id === selectedCategory);
        setModalTitle(`Category Report - ${category?.name || 'Unknown'}`);
        setModalType('category');
        setIsModalOpen(true);
      } else {
        showToast.info('No data found for this category');
      }
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to load category report');
    } finally {
      setLoading(false);
    }
  };

  const handleViewComparison = async () => {
    if (!period1 || !period2) {
      showToast.error('Please select both periods');
      return;
    }

    const periodRegex = /^\d{4}-\d{2}$/;
    if (!periodRegex.test(period1) || !periodRegex.test(period2)) {
      showToast.error('Please use format YYYY-MM (e.g., 2024-01)');
      return;
    }

    setLoading(true);
    try {
      const report = await reportsService.comparePeriods(period1, period2);
      setComparisonReport(report);
      setModalTitle(`Comparison: ${period1} vs ${period2}`);
      setModalType('comparison');
      setIsModalOpen(true);
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to load comparison');
    } finally {
      setLoading(false);
    }
  };

  const handleExportMonthly = async () => {
    setExportLoading(true);
    try {
      const blob = await reportsService.exportMonthlyReport(selectedYear, selectedMonth);
      reportsService.downloadPDF(blob, `monthly_report_${selectedYear}_${selectedMonth}.pdf`);
      showToast.success('Report downloaded');
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportYearly = async () => {
    setExportLoading(true);
    try {
      const blob = await reportsService.exportYearlyReport(selectedYear);
      reportsService.downloadPDF(blob, `yearly_report_${selectedYear}.pdf`);
      showToast.success('Report downloaded');
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const getPreviousMonth = () => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Generate and export financial reports</p>
        </div>
      </div>

      {/* Report Cards - 2x2 Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Monthly Report Card */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-500 rounded-xl shadow-md">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Monthly Report</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Detailed breakdown of income and expenses for a specific month
            </p>

            <div className="space-y-3 mb-4">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleViewMonthly}
                isLoading={loading}
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                View
              </Button>
              <Button
                variant="secondary"
                onClick={handleExportMonthly}
                isLoading={exportLoading}
                size="sm"
                className="flex-1"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Yearly Report Card */}
        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-green-500 rounded-xl shadow-md">
                <DocumentDuplicateIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Yearly Report</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Annual summary with monthly breakdown and trends
            </p>

            <div className="space-y-3 mb-4">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleViewYearly}
                isLoading={loading}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                View
              </Button>
              <Button
                variant="secondary"
                onClick={handleExportYearly}
                isLoading={exportLoading}
                size="sm"
                className="flex-1"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Category Report Card */}
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-purple-500 rounded-xl shadow-md">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Category Report</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Detailed analysis for a specific category</p>

            <div className="space-y-3 mb-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.type})
                  </option>
                ))}
              </select>
              <select
                value={months}
                onChange={(e) => setMonths(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="3">Last 3 months</option>
                <option value="6">Last 6 months</option>
                <option value="12">Last 12 months</option>
                <option value="24">Last 24 months</option>
              </select>
            </div>

            <Button
              onClick={handleViewCategory}
              isLoading={loading}
              size="sm"
              fullWidth
              className="bg-purple-600 hover:bg-purple-700"
            >
              View Report
            </Button>
          </div>
        </div>

        {/* Period Comparison Card */}
        <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-orange-500 rounded-xl shadow-md">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Period Comparison</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Compare two monthly periods side by side</p>

            <div className="space-y-3 mb-4">
              <input
                type="text"
                placeholder="Period 1 (YYYY-MM)"
                value={period1}
                onChange={(e) => setPeriod1(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
              <input
                type="text"
                placeholder="Period 2 (YYYY-MM)"
                value={period2}
                onChange={(e) => setPeriod2(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setPeriod1(getCurrentMonth());
                    setPeriod2(getPreviousMonth());
                  }}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  Use current month →
                </button>
              </div>
            </div>

            <Button
              onClick={handleViewComparison}
              isLoading={loading}
              size="sm"
              fullWidth
              className="bg-orange-600 hover:bg-orange-700"
            >
              Compare
            </Button>
          </div>
        </div>
      </div>

      {/* Report Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setMonthlyReport(null);
          setYearlyReport(null);
          setCategoryReport(null);
          setComparisonReport(null);
        }}
        title={modalTitle}
        size="xl"
      >
        {modalType === 'monthly' && monthlyReport && <MonthlyReport report={monthlyReport} />}
        {modalType === 'yearly' && yearlyReport && <YearlyReport report={yearlyReport} />}
        {modalType === 'category' && categoryReport && <CategoryReport report={categoryReport} />}
        {modalType === 'comparison' && comparisonReport && (
          <ComparisonReport report={comparisonReport} />
        )}
        {modalType === 'yearly' && !yearlyReport && (
          <div className="text-center py-8">
            <p className="text-gray-500">No data available for year {selectedYear}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reports;
