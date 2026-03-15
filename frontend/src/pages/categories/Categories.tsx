import React, { useCallback, useEffect, useState } from 'react';

import {
  ArrowPathIcon,
  ChartBarIcon,
  FolderIcon,
  ListBulletIcon,
  PlusIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

import toast from 'react-hot-toast';

import CategoryCard from '../../components/categories/CategoryCard';
import CategoryForm from '../../components/categories/CategoryForm';
import CategoryHierarchy from '../../components/categories/CategoryHierarchy';
import CategoryStatistics from '../../components/categories/CategoryStatistics';
import CategoryTransactionsModal from '../../components/categories/CategoryTransactionsModal';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import categoryService from '../../services/categories';
import { Category, CategoryHierarchyNode, CategoryStats } from '../../types';

type ViewMode = 'grid' | 'list' | 'hierarchy' | 'stats';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hierarchy, setHierarchy] = useState<CategoryHierarchyNode[]>([]);
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedType, setSelectedType] = useState<string>('');
  const [includeSystem, setIncludeSystem] = useState(true);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Load categories
  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryService.getCategories(selectedType || undefined, includeSystem);
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [selectedType, includeSystem]);

  // Load hierarchy
  const loadHierarchy = useCallback(async () => {
    try {
      const data = await categoryService.getCategoryHierarchy();
      setHierarchy(data);
    } catch (error) {
      console.error('Failed to load hierarchy:', error);
    }
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const data = await categoryService.getCategoryStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  // Load data based on view mode
  useEffect(() => {
    if (viewMode === 'hierarchy') {
      loadHierarchy();
    } else if (viewMode === 'stats') {
      loadStats();
    } else {
      loadCategories();
    }
  }, [viewMode, loadCategories, loadHierarchy, loadStats]);

  // Handlers
  const handleCreate = () => {
    setSelectedCategory(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (category: Category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await categoryService.deleteCategory(category.id);
        toast.success('Category deleted successfully');
        loadCategories();
        loadHierarchy();
        loadStats();
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const handleViewTransactions = (category: Category) => {
    setSelectedCategory(category);
    setIsTransactionsModalOpen(true);
  };

  const handleViewStats = (category: Category) => {
    // This could open a detailed stats modal or navigate to a stats page
    toast.success(`Viewing stats for ${category.name}`);
  };

  const handleSave = async (data: any) => {
    try {
      if (selectedCategory) {
        await categoryService.updateCategory(selectedCategory.id, data);
        toast.success('Category updated successfully');
      } else {
        await categoryService.createCategory(data);
        toast.success('Category created successfully');
      }
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      loadCategories();
      loadHierarchy();
      loadStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save category');
    }
  };

  const handleCreateDefaults = async () => {
    if (window.confirm('This will create default categories. Continue?')) {
      try {
        const response = await categoryService.createDefaultCategories();
        toast.success(response.message || 'Default categories created');
        loadCategories();
        loadHierarchy();
        loadStats();
      } catch (error) {
        toast.error('Failed to create default categories');
      }
    }
  };

  const getTypeCounts = () => {
    const counts = { income: 0, expense: 0, transfer: 0 };
    categories.forEach((cat) => {
      if (cat.type in counts) counts[cat.type as keyof typeof counts]++;
    });
    return counts;
  };

  const counts = getTypeCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">Organize your transactions with categories</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleCreateDefaults} variant="secondary" size="sm">
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Create Defaults
          </Button>
          <Button onClick={handleCreate}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Income Categories</p>
          <p className="text-2xl font-bold text-green-700">{counts.income}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium">Expense Categories</p>
          <p className="text-2xl font-bold text-red-700">{counts.expense}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Transfer Categories</p>
          <p className="text-2xl font-bold text-blue-700">{counts.transfer}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* View mode selector */}
        <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Grid View"
          >
            <Squares2X2Icon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="List View"
          >
            <ListBulletIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('hierarchy')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'hierarchy'
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Hierarchy View"
          >
            <FolderIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('stats')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'stats'
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Statistics View"
          >
            <ChartBarIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Filters (for grid/list views) */}
        {viewMode !== 'stats' && viewMode !== 'hierarchy' && (
          <div className="flex items-center space-x-3">
            <select
              className="input-field text-sm py-1"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
            </select>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeSystem}
                onChange={(e) => setIncludeSystem(e.target.checked)}
                className="h-4 w-4 text-primary-600 rounded"
              />
              <span className="text-sm text-gray-600">Include System</span>
            </label>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewTransactions={handleViewTransactions}
                  onViewStats={handleViewStats}
                />
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transactions
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-medium text-gray-900">{category.name}</span>
                          {category.is_system && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              System
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            category.type === 'income'
                              ? 'bg-green-100 text-green-800'
                              : category.type === 'expense'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {category.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {category.transaction_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <span
                          className={category.type === 'income' ? 'text-green-600' : 'text-red-600'}
                        >
                          ${category.total_amount?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        {!category.is_system && (
                          <button
                            onClick={() => handleDelete(category)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Hierarchy View */}
          {viewMode === 'hierarchy' && (
            <CategoryHierarchy
              data={hierarchy}
              onSelectCategory={(cat) => handleViewTransactions(cat)}
            />
          )}

          {/* Stats View */}
          {viewMode === 'stats' && <CategoryStatistics stats={stats} />}
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={selectedCategory ? 'Edit Category' : 'Add Category'}
        size="lg"
      >
        <CategoryForm
          initialData={selectedCategory || undefined}
          onSubmit={handleSave}
          onCancel={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
          }}
        />
      </Modal>

      {/* Transactions Modal */}
      {isTransactionsModalOpen && selectedCategory && (
        <CategoryTransactionsModal
          category={selectedCategory}
          onClose={() => {
            setIsTransactionsModalOpen(false);
            setSelectedCategory(null);
          }}
        />
      )}
    </div>
  );
};

export default Categories;
