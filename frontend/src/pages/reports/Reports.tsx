import React, { useEffect, useState } from 'react';

import {
  ArrowDownTrayIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

import toast from 'react-hot-toast';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import CategoryReport from '../../components/reports/CategoryReport';
import ComparisonReport from '../../components/reports/ComparisonReport';
import MonthlyReport from '../../components/reports/MonthlyReport';
import ReportCard from '../../components/reports/ReportCard';
import YearlyReport from '../../components/reports/YearlyReport';
import reportsService from '../../services/reports';
import {
  CategoryReport as CategoryReportType,
  ComparisonReport as ComparisonReportType,
  MonthlyReport as MonthlyReportType,
  YearlyReport as YearlyReportType,
} from '../../types';

type ReportType = 'monthly' | 'yearly' | 'category' | 'comparison';

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [availableReports, setAvailableReports] = useState<any>(null);

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
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [period1, setPeriod1] = useState('');
  const [period2, setPeriod2] = useState('');
  const [months, setMonths] = useState(12);

  // Categories for category report
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const reports = await reportsService.getAvailableReports();
        setAvailableReports(reports);

        // Load categories for category report
        const categoriesRes = await import('../../services/categories').then((m) => m.default);
        const cats = await categoriesRes.getCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Failed to load initial data:', error);
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
    } catch (error) {
      toast.error('Failed to load monthly report');
    } finally {
      setLoading(false);
    }
  };

  const handleViewYearly = async () => {
    setLoading(true);
    try {
      const report = await reportsService.getYearlyReport(selectedYear);
      setYearlyReport(report);
      setModalTitle(`Yearly Report - ${selectedYear}`);
      setModalType('yearly');
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Failed to load yearly report');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCategory = async () => {
    if (!selectedCategory) {
      toast.error('Please select a category');
      return;
    }
    setLoading(true);
    try {
      const report = await reportsService.getCategoryReport(selectedCategory, months);
      setCategoryReport(report);
      const category = categories.find((c) => c.id === selectedCategory);
      setModalTitle(`Category Report - ${category?.name || 'Unknown'}`);
      setModalType('category');
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Failed to load category report');
    } finally {
      setLoading(false);
    }
  };

  const handleViewComparison = async () => {
    if (!period1 || !period2) {
      toast.error('Please select both periods');
      return;
    }
    setLoading(true);
    try {
      const report = await reportsService.comparePeriods(period1, period2);
      setComparisonReport(report);
      setModalTitle(`Comparison: ${period1} vs ${period2}`);
      setModalType('comparison');
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Failed to load comparison');
    } finally {
      setLoading(false);
    }
  };

  const handleExportMonthly = async () => {
    try {
      const blob = await reportsService.exportMonthlyReport(selectedYear, selectedMonth);
      reportsService.downloadPDF(blob, `monthly_report_${selectedYear}_${selectedMonth}.pdf`);
      toast.success('Report downloaded');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const handleExportYearly = async () => {
    try {
      const blob = await reportsService.exportYearlyReport(selectedYear);
      reportsService.downloadPDF(blob, `yearly_report_${selectedYear}.pdf`);
      toast.success('Report downloaded');
    } catch (error) {
      toast.error('Failed to export report');
    }
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

      {/* Report Generator - 4 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Monthly Report */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Monthly Report</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4 min-h-[40px]">
            Detailed breakdown of income and expenses for a specific month
          </p>

          <div className="space-y-3 mb-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input-field text-sm w-full"
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
              className="input-field text-sm w-full"
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleViewMonthly} isLoading={loading} size="sm" className="flex-1">
              View Report
            </Button>
            <Button variant="secondary" onClick={handleExportMonthly} size="sm" className="flex-1">
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              PDF
            </Button>
          </div>
        </div>

        {/* Yearly Report */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DocumentDuplicateIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Yearly Report</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4 min-h-[40px]">
            Annual summary with monthly breakdown and trends
          </p>

          <div className="space-y-3 mb-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input-field text-sm w-full"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleViewYearly} isLoading={loading} size="sm" className="flex-1">
              View Report
            </Button>
            <Button variant="secondary" onClick={handleExportYearly} size="sm" className="flex-1">
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              PDF
            </Button>
          </div>
        </div>

        {/* Category Report */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Category Report</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4 min-h-[40px]">
            Detailed analysis for a specific category
          </p>

          <div className="space-y-3 mb-4">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(parseInt(e.target.value))}
              className="input-field text-sm w-full"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value))}
              className="input-field text-sm w-full"
            >
              <option value="3">Last 3 months</option>
              <option value="6">Last 6 months</option>
              <option value="12">Last 12 months</option>
              <option value="24">Last 24 months</option>
            </select>
          </div>

          <Button onClick={handleViewCategory} isLoading={loading} size="sm" fullWidth>
            View Report
          </Button>
        </div>

        {/* Period Comparison */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Period Comparison</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4 min-h-[40px]">
            Compare two monthly periods side by side
          </p>

          <div className="space-y-3 mb-4">
            <input
              type="text"
              placeholder="Period 1 (YYYY-MM)"
              value={period1}
              onChange={(e) => setPeriod1(e.target.value)}
              className="input-field text-sm w-full"
            />
            <input
              type="text"
              placeholder="Period 2 (YYYY-MM)"
              value={period2}
              onChange={(e) => setPeriod2(e.target.value)}
              className="input-field text-sm w-full"
            />
          </div>

          <Button onClick={handleViewComparison} isLoading={loading} size="sm" fullWidth>
            Compare
          </Button>
        </div>
      </div>

      {/* Available Reports */}
      {availableReports && availableReports.reports && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availableReports.reports.map((report: any) => (
              <ReportCard
                key={report.type}
                title={report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                description={report.description}
                date="Ready to generate"
                type={report.type}
                onView={() => {
                  // Handle view based on report type
                  if (report.type === 'monthly') {
                    setSelectedYear(new Date().getFullYear());
                    setSelectedMonth(new Date().getMonth() + 1);
                    handleViewMonthly();
                  } else if (report.type === 'yearly') {
                    setSelectedYear(new Date().getFullYear());
                    handleViewYearly();
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Report Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        size="xl"
      >
        {modalType === 'monthly' && monthlyReport && <MonthlyReport report={monthlyReport} />}
        {modalType === 'yearly' && yearlyReport && <YearlyReport report={yearlyReport} />}
        {modalType === 'category' && categoryReport && <CategoryReport report={categoryReport} />}
        {modalType === 'comparison' && comparisonReport && (
          <ComparisonReport report={comparisonReport} />
        )}
      </Modal>
    </div>
  );
};

export default Reports;
