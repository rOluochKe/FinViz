import React, { useEffect, useState } from 'react';

import {
  ArrowTrendingUpIcon,
  CalendarIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

import toast from 'react-hot-toast';

import Anomalies from '../../components/analytics/Anomalies';
import CashFlow from '../../components/analytics/CashFlow';
import Forecast from '../../components/analytics/Forecast';
import SpendingPatterns from '../../components/analytics/SpendingPatterns';
import SummaryCards from '../../components/analytics/SummaryCards';
import Trends from '../../components/analytics/Trends';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import analyticsService from '../../services/analytics';
import {
  CashFlowData,
  CategoryInsight,
  CategoryReport,
  ForecastData,
  MonthlyReport,
  SpendingPatterns as SpendingPatternsType,
  YearlyReport,
} from '../../types';

type AnalyticsView =
  | 'overview'
  | 'patterns'
  | 'anomalies'
  | 'forecast'
  | 'cashflow'
  | 'trends'
  | 'reports';

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<AnalyticsView>('overview');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Data states
  const [patterns, setPatterns] = useState<SpendingPatternsType | null>(null);
  const [anomalies, setAnomalies] = useState<any>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [cashflow, setCashFlow] = useState<CashFlowData | null>(null);
  const [trends, setTrends] = useState<any>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [yearlyReport, setYearlyReport] = useState<YearlyReport | null>(null);
  const [categoryReport, setCategoryReport] = useState<CategoryReport | null>(null);
  const [categoryInsights, setCategoryInsights] = useState<CategoryInsight[]>([]);

  // Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Load data based on view
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        switch (view) {
          case 'patterns':
            const patternsData = await analyticsService.getSpendingPatterns(12);
            setPatterns(patternsData);
            break;
          case 'anomalies':
            const anomaliesData = await analyticsService.getAnomalies(30, 2.0);
            setAnomalies(anomaliesData);
            break;
          case 'forecast':
            const forecastData = await analyticsService.getForecast(6);
            setForecast(forecastData);
            break;
          case 'cashflow':
            const cashflowData = await analyticsService.getCashFlow(90);
            setCashFlow(cashflowData);
            break;
          case 'trends':
            const trendsData = await analyticsService.getTrends('month');
            setTrends(trendsData);
            break;
          default:
            // Load overview data
            const [patternsOverview, anomaliesOverview, insightsOverview] = await Promise.all([
              analyticsService.getSpendingPatterns(6),
              analyticsService.getAnomalies(30, 2.0),
              analyticsService.getCategoryInsights(),
            ]);
            setPatterns(patternsOverview);
            setAnomalies(anomaliesOverview);
            setCategoryInsights(insightsOverview);
            break;
        }
      } catch (error) {
        console.error('Failed to load analytics data:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [view]);

  // Load monthly report
  const loadMonthlyReport = async () => {
    try {
      const data = await analyticsService.getMonthlyReport(selectedYear, selectedMonth);
      setMonthlyReport(data);
      setIsReportModalOpen(true);
    } catch (error) {
      toast.error('Failed to load monthly report');
    }
  };

  // Load yearly report
  const loadYearlyReport = async () => {
    try {
      const data = await analyticsService.getYearlyReport(selectedYear);
      setYearlyReport(data);
      setIsReportModalOpen(true);
    } catch (error) {
      toast.error('Failed to load yearly report');
    }
  };

  // Load category report
  const loadCategoryReport = async (categoryId: number) => {
    try {
      const data = await analyticsService.getCategoryReport(categoryId, 12);
      setCategoryReport(data);
      setIsCategoryModalOpen(true);
    } catch (error) {
      toast.error('Failed to load category report');
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Deep insights into your financial patterns</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm" onClick={loadMonthlyReport}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            Monthly Report
          </Button>
          <Button variant="secondary" size="sm" onClick={loadYearlyReport}>
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Yearly Report
          </Button>
        </div>
      </div>

      {/* Report Period Selector (when report modal is open) */}
      {isReportModalOpen && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input-field text-sm py-1 w-24"
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
              className="input-field text-sm py-1 w-32"
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={loadMonthlyReport}>
              Load Report
            </Button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex space-x-8 min-w-max" aria-label="Analytics Views">
          <button
            onClick={() => setView('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              view === 'overview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setView('patterns')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              view === 'patterns'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ChartBarIcon className="h-4 w-4 inline-block mr-2" />
            Spending Patterns
          </button>
          <button
            onClick={() => setView('anomalies')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              view === 'anomalies'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ExclamationTriangleIcon className="h-4 w-4 inline-block mr-2" />
            Anomalies
          </button>
          <button
            onClick={() => setView('forecast')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              view === 'forecast'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ArrowTrendingUpIcon className="h-4 w-4 inline-block mr-2" />
            Forecast
          </button>
          <button
            onClick={() => setView('cashflow')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              view === 'cashflow'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CurrencyDollarIcon className="h-4 w-4 inline-block mr-2" />
            Cash Flow
          </button>
          <button
            onClick={() => setView('trends')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              view === 'trends'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ArrowTrendingUpIcon className="h-4 w-4 inline-block mr-2" />
            Trends
          </button>
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div>
          {/* Overview View */}
          {view === 'overview' && patterns && anomalies && (
            <div className="space-y-6">
              <SummaryCards
                data={{
                  total_income: patterns.summary.total_spending,
                  total_expense: patterns.summary.total_spending,
                  net_savings: patterns.summary.total_spending * 0.2,
                  savings_rate: 20,
                  transaction_count: patterns.summary.transaction_count,
                }}
                period="Last 6 months"
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SpendingPatterns data={patterns} />
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Insights</h3>
                    <div className="space-y-3">
                      {categoryInsights.slice(0, 5).map((insight) => (
                        <div
                          key={insight.category_id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                          onClick={() => loadCategoryReport(insight.category_id)}
                        >
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: insight.color }}
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {insight.category}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {insight.count} transactions
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Anomalies Summary</h3>
                    <p className="text-3xl font-bold text-red-600">{anomalies.anomalies}</p>
                    <p className="text-sm text-gray-500">anomalies detected</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={() => setView('anomalies')}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Specific Views */}
          {view === 'patterns' && patterns && <SpendingPatterns data={patterns} />}
          {view === 'anomalies' && anomalies && (
            <Anomalies
              data={anomalies}
              onViewTransaction={(id) => {
                // Navigate to transaction or show details
                toast.success(`Viewing transaction ${id}`);
              }}
            />
          )}
          {view === 'forecast' && forecast && <Forecast data={forecast} />}
          {view === 'cashflow' && cashflow && <CashFlow data={cashflow} />}
          {view === 'trends' && trends && <Trends data={trends} />}
        </div>
      )}

      {/* Monthly/Yearly Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={
          monthlyReport
            ? `Monthly Report - ${monthlyReport.period}`
            : `Yearly Report - ${selectedYear}`
        }
        size="xl"
      >
        {monthlyReport && (
          <div className="space-y-4">
            <SummaryCards
              data={{
                total_income: monthlyReport.summary.income,
                total_expense: monthlyReport.summary.expense,
                net_savings: monthlyReport.summary.savings,
                savings_rate: monthlyReport.summary.rate,
                transaction_count: monthlyReport.summary.count,
              }}
              period={monthlyReport.period}
            />
            {/* Add more report details here */}
          </div>
        )}
        {yearlyReport && (
          <div className="space-y-4">
            <SummaryCards
              data={{
                total_income: yearlyReport.summary.income,
                total_expense: yearlyReport.summary.expense,
                net_savings: yearlyReport.summary.savings,
                savings_rate: yearlyReport.summary.rate,
                transaction_count: yearlyReport.summary.count,
              }}
              period={`Year ${yearlyReport.year}`}
            />
            {/* Add more report details here */}
          </div>
        )}
      </Modal>

      {/* Category Report Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Category Report"
        size="lg"
      >
        {categoryReport && (
          <div className="space-y-4">
            <div className="flex items-center">
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: categoryReport.category.color }}
              />
              <h3 className="text-xl font-semibold text-gray-900">
                {categoryReport.category.name}
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                    categoryReport.summary.total
                  )}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Average</p>
                <p className="text-xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                    categoryReport.summary.avg
                  )}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Count</p>
                <p className="text-xl font-bold text-gray-900">{categoryReport.summary.count}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Analytics;
