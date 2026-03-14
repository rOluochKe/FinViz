import React, { useEffect, useState } from 'react';

import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

import { format } from 'date-fns';
import DataTable from 'react-data-table-component';
import toast from 'react-hot-toast';

import api from '../../services/api';
import { Transaction, TransactionFilter } from '../../types';
import Button from '../common/Button';

interface TransactionTableProps {
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  onView?: (transaction: Transaction) => void;
}

// Define API response type
interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  pages: number;
  per_page: number;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ onEdit, onDelete, onView }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<TransactionFilter>({});
  const [selectedRows, setSelectedRows] = useState<Transaction[]>([]);

  // Format currency
  const formatCurrency = (amount: number, type: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    if (type === 'income') {
      return `+${formatter.format(amount)}`;
    } else if (type === 'expense') {
      return `-${formatter.format(amount)}`;
    }
    return formatter.format(amount);
  };

  // Load transactions
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params: TransactionFilter = {
        page,
        per_page: perPage,
        ...filters,
      };

      const response = await api.get<TransactionsResponse>('/transactions', { params });
      setTransactions(response.transactions || []);
      setTotalRows(response.total || 0);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [page, perPage, sortColumn, sortDirection, filters]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle per page change
  const handlePerRowsChange = (newPerPage: number, newPage: number) => {
    setPerPage(newPerPage);
    setPage(newPage);
  };

  // Handle sort
  const handleSort = (column: any, direction: string) => {
    setSortColumn(column.sortField || column.selector);
    setSortDirection(direction as 'asc' | 'desc');
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!selectedRows.length) return;

    if (window.confirm(`Delete ${selectedRows.length} selected transactions?`)) {
      try {
        await Promise.all(selectedRows.map((row) => api.delete(`/transactions/${row.id}`)));
        loadTransactions();
        toast.success(`Deleted ${selectedRows.length} transactions`);
        setSelectedRows([]);
      } catch (error) {
        toast.error('Failed to delete some transactions');
      }
    }
  };

  // Handle export
  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (!selectedRows.length) {
      toast.error('No rows selected');
      return;
    }

    window.open(
      `/api/transactions/export?format=${format}&ids=${selectedRows.map((r) => r.id).join(',')}`
    );
  };

  // Column definitions
  const columns = [
    {
      name: 'Date',
      selector: (row: Transaction) => row.date,
      sortable: true,
      sortField: 'date',
      format: (row: Transaction) => format(new Date(row.date), 'MMM dd, yyyy'),
      width: '120px',
    },
    {
      name: 'Description',
      selector: (row: Transaction) => row.description,
      sortable: true,
      sortField: 'description',
      wrap: true,
      minWidth: '200px',
    },
    {
      name: 'Category',
      selector: (row: Transaction) => row.category_name || 'Uncategorized',
      sortable: true,
      sortField: 'category_name',
      cell: (row: Transaction) => (
        <span
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: row.category_color ? `${row.category_color}20` : '#80808020',
            color: row.category_color || '#808080',
          }}
        >
          {row.category_name || 'Uncategorized'}
        </span>
      ),
    },
    {
      name: 'Amount',
      selector: (row: Transaction) => row.amount,
      sortable: true,
      sortField: 'amount',
      right: true,
      cell: (row: Transaction) => {
        const formatted = formatCurrency(row.amount, row.type);
        const color = row.type === 'income' ? 'text-green-600' : 'text-red-600';
        return <span className={`font-medium ${color}`}>{formatted}</span>;
      },
    },
    {
      name: 'Type',
      selector: (row: Transaction) => row.type,
      sortable: true,
      sortField: 'type',
      cell: (row: Transaction) => {
        const types = {
          income: { label: 'Income', class: 'bg-green-100 text-green-800' },
          expense: { label: 'Expense', class: 'bg-red-100 text-red-800' },
          transfer: { label: 'Transfer', class: 'bg-blue-100 text-blue-800' },
        };
        const type = types[row.type] || types.expense;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${type.class}`}>
            {type.label}
          </span>
        );
      },
    },
    {
      name: 'Tags',
      selector: (row: Transaction) => row.tags?.join(', ') || '',
      sortable: false,
      cell: (row: Transaction) => (
        <div className="flex flex-wrap gap-1">
          {row.tags?.map((tag, index) => (
            <span
              key={index}
              className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs font-medium text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      ),
    },
    {
      name: 'Actions',
      cell: (row: Transaction) => (
        <div className="flex space-x-2">
          {onView && (
            <button
              onClick={() => onView(row)}
              className="text-blue-600 hover:text-blue-800"
              title="View"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(row)}
              className="text-indigo-600 hover:text-indigo-800"
              title="Edit"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(row)}
              className="text-red-600 hover:text-red-800"
              title="Delete"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '120px',
    },
  ];

  // Custom styles for DataTable
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#f9fafb',
        borderBottomWidth: '1px',
        borderBottomColor: '#e5e7eb',
      },
    },
    headCells: {
      style: {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#4b5563',
        paddingTop: '0.75rem',
        paddingBottom: '0.75rem',
      },
    },
    rows: {
      style: {
        fontSize: '0.875rem',
        color: '#1f2937',
        minHeight: '48px',
        '&:hover': {
          backgroundColor: '#f3f4f6',
        },
      },
    },
    cells: {
      style: {
        paddingTop: '0.75rem',
        paddingBottom: '0.75rem',
      },
    },
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          {selectedRows.length > 0 && (
            <>
              <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                Delete Selected ({selectedRows.length})
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleExport('csv')}>
                Export CSV
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleExport('excel')}>
                Export Excel
              </Button>
            </>
          )}
        </div>

        {/* Filter inputs */}
        <div className="flex space-x-2">
          <select
            className="input-field text-sm py-1"
            onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
            value={filters.type || ''}
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>

          <input
            type="date"
            className="input-field text-sm py-1"
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            value={filters.start_date || ''}
          />

          <input
            type="date"
            className="input-field text-sm py-1"
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            value={filters.end_date || ''}
          />

          <input
            type="text"
            placeholder="Search..."
            className="input-field text-sm py-1"
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            value={filters.search || ''}
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={transactions}
        progressPending={loading}
        progressComponent={
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        }
        pagination
        paginationServer
        paginationTotalRows={totalRows}
        paginationDefaultPage={page}
        paginationPerPage={perPage}
        paginationRowsPerPageOptions={[10, 25, 50, 100]}
        onChangePage={handlePageChange}
        onChangeRowsPerPage={handlePerRowsChange}
        sortServer
        onSort={handleSort}
        defaultSortFieldId={1}
        defaultSortAsc={false}
        selectableRows
        onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows as Transaction[])}
        selectableRowsHighlight
        clearSelectedRows={selectedRows.length === 0}
        customStyles={customStyles}
        dense
        highlightOnHover
        pointerOnHover
        responsive
        striped
      />

      {/* Summary */}
      <div className="text-sm text-gray-500">
        Showing {transactions.length} of {totalRows} transactions
      </div>
    </div>
  );
};

export default TransactionTable;
