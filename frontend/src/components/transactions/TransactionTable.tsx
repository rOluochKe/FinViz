import React, { useCallback, useEffect, useState } from 'react';

import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

import { format } from 'date-fns';
import DataTable from 'react-data-table-component';
import toast from 'react-hot-toast';

import api from '../../services/api';
import { Transaction } from '../../types';
import Button from '../common/Button';

interface TransactionTableProps {
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  onView?: (transaction: Transaction) => void;
  filters?: {
    type: string;
    start_date: string;
    end_date: string;
    search: string;
  };
}

interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  pages: number;
  per_page: number;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  onEdit,
  onDelete,
  onView,
  filters: externalFilters = { type: '', start_date: '', end_date: '', search: '' },
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedRows, setSelectedRows] = useState<Transaction[]>([]);
  const [filterDebounceTimer] = useState<NodeJS.Timeout | null>(null);

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

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        per_page: perPage,
        ...(externalFilters.type && { type: externalFilters.type }),
        ...(externalFilters.start_date && { start_date: externalFilters.start_date }),
        ...(externalFilters.end_date && { end_date: externalFilters.end_date }),
        ...(externalFilters.search && { search: externalFilters.search }),
      };

      if (sortColumn) params.sort_by = sortColumn;
      if (sortDirection) params.sort_dir = sortDirection;

      const response = await api.get<TransactionsResponse>('/transactions', { params });
      setTransactions(response.transactions || []);
      setTotalRows(response.total || 0);
    } catch (error: any) {
      if (error.status_code === 429) {
        console.warn('Rate limit hit, waiting before retry...');
        setTimeout(() => loadTransactions(), 1000);
      } else {
        console.error('Failed to load transactions:', error);
        toast.error('Failed to load transactions');
      }
    } finally {
      setLoading(false);
    }
  }, [page, perPage, sortColumn, sortDirection, externalFilters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePerRowsChange = (newPerPage: number, newPage: number) => {
    setPerPage(newPerPage);
    setPage(newPage);
  };

  const handleSort = (column: any, direction: string) => {
    setSortColumn(column.sortField || column.selector);
    setSortDirection(direction as 'asc' | 'desc');
  };

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

  const handleExport = () => {
    if (!selectedRows.length) {
      toast.error('No rows selected');
      return;
    }
    window.open(`/api/transactions/export?ids=${selectedRows.map((r) => r.id).join(',')}`);
  };

  useEffect(() => {
    return () => {
      if (filterDebounceTimer) {
        clearTimeout(filterDebounceTimer);
      }
    };
  }, [filterDebounceTimer]);

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
        <div className="flex items-center space-x-2">
          {row.category_color && row.category_name !== 'Uncategorized' && (
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.category_color }} />
          )}
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              row.category_name === 'Uncategorized' ? 'bg-gray-100 text-gray-600' : ''
            }`}
            style={
              row.category_name !== 'Uncategorized' && row.category_color
                ? {
                    backgroundColor: `${row.category_color}20`,
                    color: row.category_color,
                  }
                : {}
            }
          >
            {row.category_name || 'Uncategorized'}
          </span>
        </div>
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
          {row.tags?.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs font-medium text-gray-600"
            >
              {tag}
            </span>
          ))}
          {row.tags && row.tags.length > 2 && (
            <span className="text-xs text-gray-500">+{row.tags.length - 2}</span>
          )}
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
              className="text-blue-600 hover:text-blue-800 transition-colors"
              title="View"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(row)}
              className="text-indigo-600 hover:text-indigo-800 transition-colors"
              title="Edit"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(row)}
              className="text-red-600 hover:text-red-800 transition-colors"
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

  // Check if there are any active filters
  const hasActiveFilters =
    externalFilters.type ||
    externalFilters.start_date ||
    externalFilters.end_date ||
    externalFilters.search;

  return (
    <div className="space-y-4">
      {/* Toolbar - Only show bulk actions when there are selected rows */}
      {selectedRows.length > 0 && (
        <div className="flex justify-between items-center flex-wrap gap-2 bg-gray-50 p-3 rounded-lg">
          <div className="flex space-x-2">
            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
              Delete Selected ({selectedRows.length})
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              Export CSV
            </Button>
          </div>
          <span className="text-sm text-gray-500">
            {selectedRows.length} transaction{selectedRows.length !== 1 ? 's' : ''} selected
          </span>
        </div>
      )}

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

      {/* Summary with filter info */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>
          Showing {transactions.length} of {totalRows} transactions
        </span>
        {hasActiveFilters && <span className="text-primary-600">Filtered results</span>}
      </div>
    </div>
  );
};

export default TransactionTable;
