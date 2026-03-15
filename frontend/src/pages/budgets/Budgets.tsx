import React, { useCallback, useEffect, useState } from 'react';

import {
  ArrowPathIcon,
  CalendarIcon,
  ChartBarIcon,
  LightBulbIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import toast from 'react-hot-toast';

import BudgetCard from '../../components/budgets/BudgetCard';
import BudgetForm from '../../components/budgets/BudgetForm';
import BudgetProgress from '../../components/budgets/BudgetProgress';
import BudgetStatus from '../../components/budgets/BudgetStatus';
import BudgetSuggestions from '../../components/budgets/BudgetSuggestions';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import budgetService from '../../services/budgets';
import { Budget, BudgetStatusType, BudgetSuggestion } from '../../types';

type ViewMode = 'grid' | 'status' | 'suggestions';

// Define the complete status response type
interface BudgetStatusResponse {
  period: { year: number; month: number };
  summary: {
    total_budget: number;
    total_spent: number;
    remaining: number;
    percent: number;
    count: number;
  };
  categories: BudgetStatusType[];
  alerts: Array<{
    type: 'over' | 'warning';
    category: string;
    message: string;
  }>;
}

const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [statusData, setStatusData] = useState<BudgetStatusResponse | null>(null);
  const [suggestions, setSuggestions] = useState<BudgetSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [progressData, setProgressData] = useState<any>(null);

  // Load budgets
  const loadBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await budgetService.getBudgets(selectedYear, selectedMonth);
      setBudgets(data);
    } catch (error) {
      console.error('Failed to load budgets:', error);
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  // Load budget status
  const loadStatus = useCallback(async () => {
    try {
      const data = await budgetService.getBudgetStatus(selectedYear, selectedMonth);
      setStatusData(data);
    } catch (error) {
      console.error('Failed to load budget status:', error);
    }
  }, [selectedYear, selectedMonth]);

  // Load suggestions
  const loadSuggestions = useCallback(async () => {
    try {
      const data = await budgetService.getBudgetSuggestions();
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  }, []);

  // Load data based on view mode
  useEffect(() => {
    if (viewMode === 'status') {
      loadStatus();
    } else if (viewMode === 'suggestions') {
      loadSuggestions();
    } else {
      loadBudgets();
    }
  }, [viewMode, loadBudgets, loadStatus, loadSuggestions]);

  // Handle create
  const handleCreate = () => {
    setSelectedBudget(null);
    setIsCreateModalOpen(true);
  };

  // Handle edit
  const handleEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsEditModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (budget: Budget) => {
    if (window.confirm(`Are you sure you want to delete the budget for ${budget.category_name}?`)) {
      try {
        await budgetService.deleteBudget(budget.id);
        toast.success('Budget deleted successfully');
        loadBudgets();
        loadStatus();
      } catch (error) {
        toast.error('Failed to delete budget');
      }
    }
  };

  // Handle view progress
  const handleViewProgress = async (budget: Budget) => {
    setSelectedBudget(budget);
    try {
      const data = await budgetService.getBudgetProgress(budget.id);
      setProgressData(data);
      setIsProgressModalOpen(true);
    } catch (error) {
      toast.error('Failed to load budget progress');
    }
  };

  // Handle save
  const handleSave = async (data: any) => {
    try {
      if (selectedBudget) {
        await budgetService.updateBudget(selectedBudget.id, data);
        toast.success('Budget updated successfully');
      } else {
        await budgetService.createBudget(data);
        toast.success('Budget created successfully');
      }
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      loadBudgets();
      loadStatus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save budget');
    }
  };

  // Handle apply suggestion
  const handleApplySuggestion = async (suggestion: BudgetSuggestion) => {
    const budgetData = {
      category_id: suggestion.category_id,
      amount: suggestion.suggested_budget,
      period: 'monthly' as const,
      month: selectedMonth,
      year: selectedYear,
      alert_threshold: 80,
      is_active: true,
    };

    try {
      await budgetService.createBudget(budgetData);
      toast.success(`Budget created for ${suggestion.category_name}`);
      loadBudgets();
      loadSuggestions();
      setViewMode('grid');
    } catch (error) {
      toast.error('Failed to create budget from suggestion');
    }
  };

  // Handle rollover
  const handleRollover = async () => {
    if (window.confirm('Roll over unused budget amounts to next month?')) {
      try {
        const response = await budgetService.rolloverBudgets();
        toast.success(response.message);
        loadBudgets();
        loadStatus();
      } catch (error) {
        toast.error('Failed to rollover budgets');
      }
    }
  };

  // Month options
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

  // Year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="mt-1 text-sm text-gray-500">Plan and track your spending limits</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleRollover} variant="secondary" size="sm">
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Rollover
          </Button>
          <Button onClick={handleCreate}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Budget
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">Period:</span>
          </div>
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
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Budget Views">
          <button
            onClick={() => setViewMode('grid')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'grid'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ChartBarIcon className="h-5 w-5 inline-block mr-2" />
            Budgets
          </button>
          <button
            onClick={() => setViewMode('status')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'status'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ChartBarIcon className="h-5 w-5 inline-block mr-2" />
            Status Overview
          </button>
          <button
            onClick={() => setViewMode('suggestions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'suggestions'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <LightBulbIcon className="h-5 w-5 inline-block mr-2" />
            AI Suggestions
          </button>
        </nav>
      </div>

      {/* Content */}
      {loading && viewMode === 'grid' ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgets.length > 0 ? (
                budgets.map((budget) => (
                  <BudgetCard
                    key={budget.id}
                    budget={budget}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewProgress={handleViewProgress}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
                  <ChartBarIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Budgets Found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Create your first budget to start tracking your spending.
                  </p>
                  <Button onClick={handleCreate}>Create Budget</Button>
                </div>
              )}
            </div>
          )}

          {/* Status View */}
          {viewMode === 'status' && statusData && <BudgetStatus status={statusData} />}

          {/* Suggestions View */}
          {viewMode === 'suggestions' && (
            <BudgetSuggestions
              suggestions={suggestions}
              onApplySuggestion={handleApplySuggestion}
            />
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={selectedBudget ? 'Edit Budget' : 'Create Budget'}
        size="lg"
      >
        <BudgetForm
          initialData={selectedBudget || undefined}
          onSubmit={handleSave}
          onCancel={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
          }}
        />
      </Modal>

      {/* Progress Modal */}
      <Modal
        isOpen={isProgressModalOpen}
        onClose={() => {
          setIsProgressModalOpen(false);
          setSelectedBudget(null);
          setProgressData(null);
        }}
        title="Budget Progress"
        size="xl"
      >
        {progressData && <BudgetProgress progress={progressData} />}
      </Modal>
    </div>
  );
};

export default Budgets;
