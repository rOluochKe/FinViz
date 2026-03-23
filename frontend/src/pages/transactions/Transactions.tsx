import React, { useEffect, useState } from 'react';

import { MagnifyingGlassIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

import toast from 'react-hot-toast';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import TransactionDetails from '../../components/transactions/TransactionDetails';
import TransactionForm from '../../components/transactions/TransactionForm';
import TransactionTable from '../../components/transactions/TransactionTable';
import api from '../../services/api';
import categoryService from '../../services/categories';
import { Transaction } from '../../types';

const Transactions: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasCategories, setHasCategories] = useState<boolean | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    start_date: '',
    end_date: '',
    search: '',
  });

  // Check if user has categories
  useEffect(() => {
    const checkCategories = async () => {
      try {
        const categories = await categoryService.getCategories();
        if (!categories || categories.length === 0) {
          setHasCategories(false);
          // Prompt to create default categories
          const confirmCreate = window.confirm(
            'No categories found. Would you like to create default categories?'
          );
          if (confirmCreate) {
            const response = await categoryService.createDefaultCategories();
            toast.success(response.message);
            setHasCategories(true);
          }
        } else {
          setHasCategories(true);
        }
      } catch (error) {
        console.error('Failed to check categories:', error);
        setHasCategories(false);
      }
    };
    checkCategories();
  }, []);

  const handleCreate = () => {
    if (!hasCategories) {
      toast.error('Please create categories first');
      return;
    }
    setSelectedTransaction(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleView = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (transaction: Transaction) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.delete(`/transactions/${transaction.id}`);
        toast.success('Transaction deleted successfully');
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        toast.error('Failed to delete transaction');
      }
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (selectedTransaction) {
        await api.put(`/transactions/${selectedTransaction.id}`, data);
        toast.success('Transaction updated successfully');
      } else {
        await api.post('/transactions', data);
        toast.success('Transaction created successfully');
      }
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      toast.error(
        error.message ||
          (selectedTransaction ? 'Failed to update transaction' : 'Failed to create transaction')
      );
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setRefreshKey((prev) => prev + 1);
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      start_date: '',
      end_date: '',
      search: '',
    });
    setRefreshKey((prev) => prev + 1);
  };

  const hasActiveFilters = filters.type || filters.start_date || filters.end_date || filters.search;

  // Show loading while checking categories
  if (hasCategories === null) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your income and expenses</p>
        </div>
        <Button onClick={handleCreate} disabled={!hasCategories}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Warning if no categories */}
      {!hasCategories && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ No categories found. Please go to the Categories page to create categories before
            adding transactions.
          </p>
        </div>
      )}

      {/* Filter Bar - All filters in one row */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Transaction Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>

          {/* Start Date Filter */}
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Start Date"
          />

          {/* End Date Filter */}
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="End Date"
          />

          {/* Clear Filters Button */}
          {hasActiveFilters ? (
            <button
              onClick={handleClearFilters}
              className="flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 mr-2" />
              Clear Filters
            </button>
          ) : (
            <div className="flex items-center justify-center px-4 py-2 text-gray-400">
              <span className="text-sm">No active filters</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500">Active filters:</span>
          {filters.type && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
              Type:{' '}
              {filters.type === 'income'
                ? 'Income'
                : filters.type === 'expense'
                  ? 'Expense'
                  : 'Transfer'}
              <button
                onClick={() => handleFilterChange('type', '')}
                className="ml-2 hover:text-primary-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </span>
          )}
          {filters.start_date && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
              From: {new Date(filters.start_date).toLocaleDateString()}
              <button
                onClick={() => handleFilterChange('start_date', '')}
                className="ml-2 hover:text-primary-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </span>
          )}
          {filters.end_date && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
              To: {new Date(filters.end_date).toLocaleDateString()}
              <button
                onClick={() => handleFilterChange('end_date', '')}
                className="ml-2 hover:text-primary-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </span>
          )}
          {filters.search && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
              Search: {filters.search}
              <button
                onClick={() => handleFilterChange('search', '')}
                className="ml-2 hover:text-primary-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Transactions Table - Pass filters as props */}
      <TransactionTable
        key={refreshKey}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        filters={filters}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={selectedTransaction ? 'Edit Transaction' : 'Add Transaction'}
        size="lg"
      >
        <TransactionForm
          initialData={selectedTransaction || undefined}
          onSubmit={handleSave}
          onCancel={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
          }}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Transaction Details"
        size="md"
      >
        {selectedTransaction && (
          <TransactionDetails
            transaction={selectedTransaction}
            onEdit={() => {
              setIsViewModalOpen(false);
              handleEdit(selectedTransaction);
            }}
            onClose={() => setIsViewModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Transactions;
