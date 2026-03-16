import React, { useCallback, useEffect, useState } from 'react';

import {
  CalendarIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

import { format } from 'date-fns';
import DataTable from 'react-data-table-component';
import toast from 'react-hot-toast';

import usersService from '../../services/users';
import { User } from '../../types';
import Button from '../common/Button';
import Modal from '../common/Modal';
import UserForm from './UserForm';

interface UserTableProps {
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onActivate?: (user: User) => void;
  onDeactivate?: (user: User) => void;
  refreshTrigger?: number;
}

const UserTable: React.FC<UserTableProps> = ({
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  refreshTrigger = 0,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Load users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await usersService.getUsers(page, perPage, search);
      setUsers(response.users || []);
      setTotalRows(response.total || 0);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, refreshTrigger]);

  // Handle search
  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  // Handle edit
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (data: any) => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const updatedUser = await usersService.updateUser(selectedUser.id, data);
      setUsers(users.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      toast.success('User updated successfully');
      setIsEditModalOpen(false);
      if (onEdit) onEdit(updatedUser);
    } catch (error) {
      toast.error('Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await usersService.deleteUser(selectedUser.id);
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      toast.success('User deleted successfully');
      setIsDeleteModalOpen(false);
      if (onDelete) onDelete(selectedUser);
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle activate/deactivate
  const handleActivate = async (user: User) => {
    try {
      const updatedUser = await usersService.activateUser(user.id);
      setUsers(users.map((u) => (u.id === user.id ? updatedUser : u)));
      toast.success('User activated successfully');
      if (onActivate) onActivate(updatedUser);
    } catch (error) {
      toast.error('Failed to activate user');
    }
  };

  const handleDeactivate = async (user: User) => {
    try {
      const updatedUser = await usersService.deactivateUser(user.id);
      setUsers(users.map((u) => (u.id === user.id ? updatedUser : u)));
      toast.success('User deactivated successfully');
      if (onDeactivate) onDeactivate(updatedUser);
    } catch (error) {
      toast.error('Failed to deactivate user');
    }
  };

  // Column definitions
  const columns = [
    {
      name: 'User',
      selector: (row: User) => `${row.first_name || ''} ${row.last_name || ''}`,
      sortable: true,
      cell: (row: User) => (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
            {row.first_name?.[0] || row.username[0].toUpperCase()}
            {row.last_name?.[0]}
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">
              {row.first_name || row.last_name
                ? `${row.first_name || ''} ${row.last_name || ''}`.trim()
                : row.username}
            </div>
            <div className="text-xs text-gray-500">@{row.username}</div>
          </div>
        </div>
      ),
    },
    {
      name: 'Email',
      selector: (row: User) => row.email,
      sortable: true,
      cell: (row: User) => (
        <div className="flex items-center">
          <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">{row.email}</span>
          {row.email_verified && (
            <CheckCircleIcon className="h-4 w-4 text-green-500 ml-2" title="Email Verified" />
          )}
        </div>
      ),
    },
    {
      name: 'Role',
      selector: (row: User) => row.role,
      sortable: true,
      cell: (row: User) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.role}
        </span>
      ),
    },
    {
      name: 'Status',
      selector: (row: User) => row.status,
      sortable: true,
      cell: (row: User) => {
        const statusColors = {
          active: 'bg-green-100 text-green-800',
          inactive: 'bg-gray-100 text-gray-800',
          suspended: 'bg-red-100 text-red-800',
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[row.status]}`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      name: 'Joined',
      selector: (row: User) => row.created_at,
      sortable: true,
      cell: (row: User) => (
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">
            {format(new Date(row.created_at), 'MMM dd, yyyy')}
          </span>
        </div>
      ),
    },
    {
      name: 'Last Login',
      selector: (row: User) => row.last_login || '',
      sortable: true,
      cell: (row: User) => (
        <span className="text-sm text-gray-600">
          {row.last_login ? format(new Date(row.last_login), 'MMM dd, yyyy') : 'Never'}
        </span>
      ),
    },
    {
      name: 'Actions',
      cell: (row: User) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEditClick(row)}
            className="p-1 text-indigo-600 hover:text-indigo-800 transition-colors"
            title="Edit User"
          >
            <PencilIcon className="h-5 w-5" />
          </button>

          {row.status === 'active' ? (
            <button
              onClick={() => handleDeactivate(row)}
              className="p-1 text-yellow-600 hover:text-yellow-800 transition-colors"
              title="Deactivate User"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => handleActivate(row)}
              className="p-1 text-green-600 hover:text-green-800 transition-colors"
              title="Activate User"
            >
              <CheckCircleIcon className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={() => handleDeleteClick(row)}
            className="p-1 text-red-600 hover:text-red-800 transition-colors"
            title="Delete User"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      width: '140px',
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
        minHeight: '60px',
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
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or username..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="input-field pl-10"
              />
            </div>
          </div>
          <Button onClick={handleSearch} size="sm">
            Search
          </Button>
          {search && (
            <Button variant="secondary" size="sm" onClick={handleClearSearch}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={users}
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
        paginationRowsPerPageOptions={[10, 20, 50, 100]}
        onChangePage={setPage}
        onChangeRowsPerPage={setPerPage}
        customStyles={customStyles}
        highlightOnHover
        pointerOnHover
        responsive
        striped
      />

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
        size="lg"
      >
        {selectedUser && (
          <UserForm
            initialData={selectedUser}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditModalOpen(false)}
            isLoading={actionLoading}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-red-50 rounded-lg">
              <TrashIcon className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-900">Warning</h3>
                <p className="text-sm text-red-700">
                  This action cannot be undone. All data associated with this user will be
                  permanently deleted.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700">User to delete:</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {selectedUser.first_name || selectedUser.last_name
                  ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim()
                  : selectedUser.username}
              </p>
              <p className="text-sm text-gray-500 mt-1">{selectedUser.email}</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDeleteConfirm}
                isLoading={actionLoading}
              >
                Delete User
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserTable;
