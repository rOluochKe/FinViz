import React, { useEffect, useState } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';

import { useForm } from 'react-hook-form';

import * as yup from 'yup';

import api from '../../services/api';
import { Category, CategoryCreate } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';

interface CategoryFormProps {
  initialData?: Category;
  onSubmit: (data: CategoryCreate) => Promise<void>;
  onCancel: () => void;
}

interface CategoryFormData {
  name: string;
  type: 'income' | 'expense' | 'transfer';
  color: string;
  icon?: string;
  description?: string;
  parent_id?: number | null;
}

// Define the API response type
interface CategoriesResponse {
  categories: Category[];
}

const COLOR_PRESETS = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#db2777',
  '#65a30d',
  '#4f46e5',
  '#c2410c',
];

const schema = yup.object().shape({
  name: yup.string().required('Category name is required').max(50),
  type: yup.string().oneOf(['income', 'expense', 'transfer']).required('Type is required'),
  color: yup
    .string()
    .required('Color is required')
    .matches(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  icon: yup.string().optional(),
  description: yup.string().optional().max(200),
  parent_id: yup.number().nullable().optional(),
});

const CategoryForm: React.FC<CategoryFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [customColor, setCustomColor] = useState(initialData?.color || '#2563eb');
  const [showCustomColor, setShowCustomColor] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: initialData
      ? {
          name: initialData.name,
          type: initialData.type,
          color: initialData.color,
          icon: initialData.icon || '',
          description: initialData.description || '',
          parent_id: initialData.parent_id ?? null,
        }
      : {
          type: 'expense',
          color: '#2563eb',
          parent_id: null,
        },
  });

  const selectedType = watch('type');
  const selectedColor = watch('color');

  // Load existing categories for parent selection
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

  // Filter categories by type for parent selection
  const parentCategories = categories.filter(
    (cat) => cat.type === selectedType && cat.id !== initialData?.id
  );

  const onSubmitForm = async (data: CategoryFormData) => {
    setLoading(true);
    try {
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* Category Name */}
      <Input
        label="Category Name"
        type="text"
        placeholder="e.g., Groceries, Salary, Rent"
        error={errors.name?.message}
        {...register('name')}
      />

      {/* Category Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Category Type</label>
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

      {/* Parent Category (Optional) */}
      {parentCategories.length > 0 && (
        <div>
          <label htmlFor="parent" className="input-label">
            Parent Category (Optional)
          </label>
          <select id="parent" {...register('parent_id')} className="input-field">
            <option value="">None (Top Level)</option>
            {parentCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Color Selection */}
      <div>
        <label className="input-label">Category Color</label>
        <div className="space-y-3">
          {/* Color presets */}
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  setValue('color', color);
                  setCustomColor(color);
                  setShowCustomColor(false);
                }}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedColor === color
                    ? 'border-gray-900 scale-110'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <button
              type="button"
              onClick={() => setShowCustomColor(!showCustomColor)}
              className="w-8 h-8 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-300"
            >
              <span className="text-xs">+</span>
            </button>
          </div>

          {/* Custom color input */}
          {showCustomColor && (
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setValue('color', e.target.value);
                }}
                className="w-10 h-10 rounded border border-gray-300"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setValue('color', e.target.value);
                }}
                placeholder="#000000"
                className="input-field flex-1"
              />
            </div>
          )}
        </div>
        {errors.color && <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>}
      </div>

      {/* Icon (Optional) */}
      <Input
        label="Icon (Optional)"
        type="text"
        placeholder="e.g., shopping-cart, wallet, gift"
        error={errors.icon?.message}
        {...register('icon')}
      />

      {/* Description */}
      <div>
        <label htmlFor="description" className="input-label">
          Description (Optional)
        </label>
        <textarea
          id="description"
          rows={3}
          {...register('description')}
          className="input-field"
          placeholder="Brief description of this category..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={loading}>
          {initialData ? 'Update' : 'Create'} Category
        </Button>
      </div>
    </form>
  );
};

export default CategoryForm;
