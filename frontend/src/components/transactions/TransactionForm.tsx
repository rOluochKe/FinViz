import React, { useEffect, useState } from 'react';

import { XMarkIcon } from '@heroicons/react/24/outline';

import { yupResolver } from '@hookform/resolvers/yup';

import { SubmitHandler, useForm } from 'react-hook-form';

import * as yup from 'yup';

import toast from 'react-hot-toast';

import api from '../../services/api';
import { Category, Transaction } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';

interface TransactionFormProps {
  initialData?: Transaction;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

interface TransactionFormData {
  category_id: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  notes?: string | null;
  tags?: string[];
  is_recurring?: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  recurring_end_date?: string | null;
}

const schema = yup.object().shape({
  category_id: yup.string().required('Category is required'),
  amount: yup
    .number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .typeError('Amount must be a number'),
  description: yup.string().required('Description is required').max(200),
  date: yup.string().required('Date is required'),
  type: yup.string().oneOf(['income', 'expense', 'transfer']).required('Type is required'),
  notes: yup.string().nullable().optional(),
  tags: yup.array().of(yup.string()).optional().default([]),
  is_recurring: yup.boolean().optional().default(false),
  recurring_frequency: yup.mixed<'daily' | 'weekly' | 'monthly' | 'yearly'>().when('is_recurring', {
    is: true,
    then: (schema) =>
      schema
        .oneOf(['daily', 'weekly', 'monthly', 'yearly'] as const)
        .required('Frequency is required'),
    otherwise: (schema) => schema.nullable().optional(),
  }),
  recurring_end_date: yup.string().nullable().optional(),
});

// Helper function for warning toast
const showWarningToast = (message: string) => {
  toast(message, {
    icon: '⚠️',
    duration: 5000,
    style: {
      background: '#FEF3C7',
      color: '#92400E',
      border: '1px solid #F59E0B',
    },
  });
};

const TransactionForm: React.FC<TransactionFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: initialData
      ? {
          category_id: initialData.category_id,
          amount: initialData.amount,
          description: initialData.description,
          date: initialData.date,
          type: initialData.type,
          notes: initialData.notes,
          tags: initialData.tags || [],
          is_recurring: initialData.is_recurring,
          recurring_frequency: initialData.recurring_frequency as any,
          recurring_end_date: initialData.recurring_end_date,
        }
      : {
          type: 'expense',
          date: new Date().toISOString().split('T')[0],
          is_recurring: false,
          tags: [],
        },
  });

  const isRecurring = watch('is_recurring');
  const transactionType = watch('type');
  const selectedCategoryId = watch('category_id');

  // Load all categories first
  useEffect(() => {
    const loadAllCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await api.get<Category[]>('/categories');
        const allCats = response || [];
        setAllCategories(allCats);

        // Filter based on transaction type
        const filtered = allCats.filter(
          (cat) => cat.type === transactionType || transactionType === 'transfer'
        );
        setCategories(filtered);

        // If editing, ensure the selected category is in the list
        if (initialData?.category_id) {
          const selectedCat = allCats.find((cat) => cat.id === initialData.category_id);
          if (
            selectedCat &&
            selectedCat.type !== transactionType &&
            transactionType !== 'transfer'
          ) {
            // Category type doesn't match current transaction type - show warning
            showWarningToast(
              `This transaction's category "${selectedCat.name}" is for ${selectedCat.type}, but transaction type is ${transactionType}.`
            );
          }
        }

        // If no categories exist, show message
        if (filtered.length === 0 && allCats.length > 0) {
          toast.error(`No ${transactionType} categories found. Please create one first.`);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setLoadingCategories(false);
      }
    };
    loadAllCategories();
  }, [transactionType, initialData]);

  // Handle tag addition
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);
    setValue('tags', newTags);
  };

  // Handle key press for tag input
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const onSubmitForm: SubmitHandler<TransactionFormData> = async (data) => {
    // Validate category is selected
    if (!data.category_id) {
      toast.error('Please select a category');
      return;
    }

    // Validate category exists in all categories
    const selectedCat = allCategories.find((cat) => cat.id === data.category_id);
    if (!selectedCat) {
      toast.error('Selected category not found');
      return;
    }

    // Validate category type matches transaction type
    if (selectedCat.type !== data.type && data.type !== 'transfer') {
      toast.error(
        `Category "${selectedCat.name}" is for ${selectedCat.type}, but transaction type is ${data.type}. Please select a different category.`
      );
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...data,
        tags: tags,
      };
      await onSubmit(submitData);
    } finally {
      setLoading(false);
    }
  };

  // Get selected category name for display
  const selectedCategory = allCategories.find((cat) => cat.id === selectedCategoryId);

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* Transaction Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="income"
              {...register('type')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Income</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="expense"
              {...register('type')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Expense</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="transfer"
              {...register('type')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Transfer</span>
          </label>
        </div>
        {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="input-label">
          Category <span className="text-red-500">*</span>
        </label>

        {/* Show selected category name if editing and it's not in the filtered list */}
        {initialData &&
          selectedCategory &&
          !categories.find((c) => c.id === selectedCategory.id) && (
            <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              Current category: <strong>{selectedCategory.name}</strong> (Type:{' '}
              {selectedCategory.type})
              <br />
              <span className="text-xs">
                This category may not match the selected transaction type.
              </span>
            </div>
          )}

        <select
          id="category"
          {...register('category_id')}
          className="input-field"
          disabled={loadingCategories}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name} {category.is_system ? '(System)' : ''} - {category.type}
            </option>
          ))}
        </select>

        {loadingCategories && <p className="text-xs text-gray-500 mt-1">Loading categories...</p>}
        {!loadingCategories && categories.length === 0 && allCategories.length > 0 && (
          <p className="text-xs text-red-500 mt-1">
            No {transactionType} categories found. Please create a {transactionType} category first.
          </p>
        )}
        {!loadingCategories && allCategories.length === 0 && (
          <p className="text-xs text-red-500 mt-1">
            No categories found. Please create categories first.
          </p>
        )}
        {errors.category_id && <p className="input-error">{errors.category_id.message}</p>}
      </div>

      {/* Amount and Date */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.amount?.message}
          {...register('amount')}
        />

        <Input label="Date" type="date" error={errors.date?.message} {...register('date')} />
      </div>

      {/* Description */}
      <Input
        label="Description"
        type="text"
        placeholder="Enter description"
        error={errors.description?.message}
        {...register('description')}
      />

      {/* Tags */}
      <div>
        <label className="input-label">Tags</label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleTagKeyPress}
            placeholder="Add a tag"
            className="input-field"
          />
          <Button type="button" onClick={handleAddTag} variant="secondary">
            Add
          </Button>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-primary-600 hover:text-primary-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="input-label">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          {...register('notes')}
          className="input-field"
          placeholder="Additional notes..."
        />
      </div>

      {/* Recurring Transaction */}
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_recurring"
            {...register('is_recurring')}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
          />
          <label htmlFor="is_recurring" className="ml-2 text-sm text-gray-700">
            This is a recurring transaction
          </label>
        </div>

        {isRecurring && (
          <div className="grid grid-cols-2 gap-4 pl-6">
            <div>
              <label htmlFor="frequency" className="input-label">
                Frequency
              </label>
              <select id="frequency" {...register('recurring_frequency')} className="input-field">
                <option value="">Select frequency</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              {errors.recurring_frequency && (
                <p className="input-error">{errors.recurring_frequency.message}</p>
              )}
            </div>

            <Input label="End Date (Optional)" type="date" {...register('recurring_end_date')} />
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={loading}
          disabled={categories.length === 0 && allCategories.length > 0}
        >
          {initialData ? 'Update' : 'Create'} Transaction
        </Button>
      </div>
    </form>
  );
};

export default TransactionForm;
