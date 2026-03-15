import React, { useEffect, useState } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';

import { useForm } from 'react-hook-form';

import * as yup from 'yup';

import api from '../../services/api';
import { Budget, BudgetCreate, Category } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';

interface BudgetFormProps {
  initialData?: Budget;
  onSubmit: (data: BudgetCreate) => Promise<void>;
  onCancel: () => void;
}

interface BudgetFormData {
  category_id: number;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  month?: number | null;
  year: number;
  alert_threshold?: number;
  is_active?: boolean;
  notes?: string | null;
}

const schema = yup.object().shape({
  category_id: yup.number().required('Category is required'),
  amount: yup
    .number()
    .required('Budget amount is required')
    .positive('Amount must be positive')
    .typeError('Amount must be a number'),
  period: yup.string().oneOf(['monthly', 'quarterly', 'yearly']).required('Period is required'),
  month: yup
    .number()
    .nullable()
    .optional()
    .min(1, 'Month must be between 1-12')
    .max(12, 'Month must be between 1-12'),
  year: yup
    .number()
    .required('Year is required')
    .min(2000, 'Year must be at least 2000')
    .max(2100, 'Year must be at most 2100'),
  alert_threshold: yup
    .number()
    .optional()
    .min(0, 'Alert threshold must be between 0-100')
    .max(100, 'Alert threshold must be between 0-100'),
  is_active: yup.boolean().optional(),
  notes: yup.string().nullable().optional().max(500, 'Notes must be at most 500 characters'),
});

const BudgetForm: React.FC<BudgetFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Prepare default values safely
  const getDefaultValues = () => {
    if (initialData) {
      return {
        category_id: initialData.category_id,
        amount: initialData.amount,
        period: initialData.period,
        month: initialData.month,
        year: initialData.year,
        // Since Budget type doesn't have alert_threshold, use default
        alert_threshold: 80,
        is_active: initialData.is_active ?? true,
        notes: initialData.notes || '',
      };
    }
    return {
      period: 'monthly' as const,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      alert_threshold: 80,
      is_active: true,
    };
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: getDefaultValues(),
  });

  const selectedPeriod = watch('period');

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get<{ categories: Category[] }>('/categories?type=expense');
        setCategories(response.categories || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear + i);

  // Generate month options
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

  const onSubmitForm = async (data: BudgetFormData) => {
    setLoading(true);
    try {
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* Category Selection */}
      <div>
        <label htmlFor="category" className="input-label">
          Category <span className="text-red-500">*</span>
        </label>
        <select id="category" {...register('category_id')} className="input-field">
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category_id && <p className="input-error">{errors.category_id.message}</p>}
      </div>

      {/* Budget Amount */}
      <Input
        label="Budget Amount"
        type="number"
        step="0.01"
        placeholder="0.00"
        error={errors.amount?.message}
        {...register('amount')}
      />

      {/* Period Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="period" className="input-label">
            Period <span className="text-red-500">*</span>
          </label>
          <select id="period" {...register('period')} className="input-field">
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          {errors.period && <p className="input-error">{errors.period.message}</p>}
        </div>

        <div>
          <label htmlFor="year" className="input-label">
            Year <span className="text-red-500">*</span>
          </label>
          <select id="year" {...register('year')} className="input-field">
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {errors.year && <p className="input-error">{errors.year.message}</p>}
        </div>
      </div>

      {/* Month Selection (for monthly/quarterly) */}
      {(selectedPeriod === 'monthly' || selectedPeriod === 'quarterly') && (
        <div>
          <label htmlFor="month" className="input-label">
            {selectedPeriod === 'monthly' ? 'Month' : 'Starting Month'}{' '}
            <span className="text-red-500">*</span>
          </label>
          <select id="month" {...register('month')} className="input-field">
            <option value="">Select month</option>
            {monthOptions.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          {errors.month && <p className="input-error">{errors.month.message}</p>}
        </div>
      )}

      {/* Alert Threshold */}
      <div>
        <label htmlFor="alert_threshold" className="input-label">
          Alert Threshold (%)
        </label>
        <input
          type="range"
          id="alert_threshold"
          min="0"
          max="100"
          step="5"
          {...register('alert_threshold')}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span className="text-primary-600 font-medium">{watch('alert_threshold') || 80}%</span>
          <span>100%</span>
        </div>
        {errors.alert_threshold && <p className="input-error">{errors.alert_threshold.message}</p>}
      </div>

      {/* Active Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          {...register('is_active')}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
        />
        <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
          Active Budget
        </label>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="input-label">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          {...register('notes')}
          className="input-field"
          placeholder="Additional notes about this budget..."
        />
        {errors.notes && <p className="input-error">{errors.notes.message}</p>}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={loading}>
          {initialData ? 'Update' : 'Create'} Budget
        </Button>
      </div>
    </form>
  );
};

export default BudgetForm;
