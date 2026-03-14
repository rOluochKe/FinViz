import React, { useState } from 'react';

import { PlusIcon } from '@heroicons/react/24/outline';

import toast from 'react-hot-toast';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import TransactionDetails from '../../components/transactions/TransactionDetails';
import TransactionForm from '../../components/transactions/TransactionForm';
import TransactionTable from '../../components/transactions/TransactionTable';
import api from '../../services/api';
import { Transaction } from '../../types';

const Transactions: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const handleCreate = () => {
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
        // Refresh the table (you might want to use a ref or state to trigger reload)
        window.location.reload();
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
      // Refresh the table
      window.location.reload();
    } catch (error) {
      toast.error(
        selectedTransaction ? 'Failed to update transaction' : 'Failed to create transaction'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your income and expenses</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Filters Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Quick Filters</h3>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200">
            This Month
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200">
            Last Month
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200">
            This Year
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200">
            Income Only
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200">
            Expenses Only
          </span>
        </div>
      </div>

      {/* Transactions Table */}
      <TransactionTable onEdit={handleEdit} onDelete={handleDelete} onView={handleView} />

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
