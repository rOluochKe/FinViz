import React, { useEffect, useState } from 'react';

import { XMarkIcon } from '@heroicons/react/24/outline';

import { yupResolver } from '@hookform/resolvers/yup';

import { SubmitHandler, useForm } from 'react-hook-form';

import * as yup from 'yup';

import api from '../../services/api';
import { Category, Transaction } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';

interface TransactionFormProps {
  initialData?: Transaction;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

// Define the form data type
interface TransactionFormData {
  category_id: number;
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

// Create schema with proper typing
const schema = yup.object().shape({
  category_id: yup.number().required('Category is required'),
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

// Define API response type
interface CategoriesResponse {
  categories: Category[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: yupResolver(schema) as any, // Type assertion to fix the resolver type issue
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

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get<CategoriesResponse>('/categories');
        setCategories(response.categories || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Filter categories by type
  const filteredCategories = categories.filter(
    (cat) => cat.type === transactionType || transactionType === 'transfer'
  );

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
    setLoading(true);
    try {
      // Prepare data for submission
      const submitData = {
        ...data,
        tags: tags,
      };
      await onSubmit(submitData);
    } finally {
      setLoading(false);
    }
  };

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
          Category
        </label>
        <select id="category" {...register('category_id')} className="input-field">
          <option value="">Select a category</option>
          {filteredCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
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

        {/* Tag list */}
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
        <Button type="submit" isLoading={loading}>
          {initialData ? 'Update' : 'Create'} Transaction
        </Button>
      </div>
    </form>
  );
};

export default TransactionForm;
