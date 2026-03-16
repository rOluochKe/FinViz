import React, { useCallback, useEffect, useState } from 'react';

import { ArrowPathIcon, ExclamationTriangleIcon, UserGroupIcon } from '@heroicons/react/24/outline';

import toast from 'react-hot-toast';

import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import UserStats from '../../components/users/UserStats';
import UserTable from '../../components/users/UserTable';
import { useAuth } from '../../context/AuthContext';
import usersService from '../../services/users';
import { User } from '../../types';

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    admins: 0,
    verified: 0,
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load users and calculate stats
  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await usersService.getUsers(1, 100); // Load up to 100 users for stats
      setUsers(response.users);

      // Calculate stats
      const newStats = {
        total: response.total,
        active: response.users.filter((u) => u.status === 'active').length,
        inactive: response.users.filter((u) => u.status === 'inactive').length,
        suspended: response.users.filter((u) => u.status === 'suspended').length,
        admins: response.users.filter((u) => u.role === 'admin').length,
        verified: response.users.filter((u) => u.email_verified).length,
      };
      setStats(newStats);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    // Recalculate stats
    const newStats = {
      total: stats.total,
      active: users.filter((u) =>
        u.id === updatedUser.id ? updatedUser.status === 'active' : u.status === 'active'
      ).length,
      inactive: users.filter((u) =>
        u.id === updatedUser.id ? updatedUser.status === 'inactive' : u.status === 'inactive'
      ).length,
      suspended: users.filter((u) =>
        u.id === updatedUser.id ? updatedUser.status === 'suspended' : u.status === 'suspended'
      ).length,
      admins: users.filter((u) =>
        u.id === updatedUser.id ? updatedUser.role === 'admin' : u.role === 'admin'
      ).length,
      verified: users.filter((u) =>
        u.id === updatedUser.id ? updatedUser.email_verified : u.email_verified
      ).length,
    };
    setStats(newStats);
  };

  const handleUserDelete = (deletedUser: User) => {
    setUsers(users.filter((u) => u.id !== deletedUser.id));
    // Recalculate stats
    const newStats = {
      total: stats.total - 1,
      active: stats.active - (deletedUser.status === 'active' ? 1 : 0),
      inactive: stats.inactive - (deletedUser.status === 'inactive' ? 1 : 0),
      suspended: stats.suspended - (deletedUser.status === 'suspended' ? 1 : 0),
      admins: stats.admins - (deletedUser.role === 'admin' ? 1 : 0),
      verified: stats.verified - (deletedUser.email_verified ? 1 : 0),
    };
    setStats(newStats);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage system users and their permissions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            isLoading={refreshing}
            disabled={refreshing}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <UserStats stats={stats} />

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <UserGroupIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-blue-800">Admin Access</h3>
          <p className="text-xs text-blue-700 mt-1">
            You are viewing this page as an administrator. You can manage all users, update their
            roles, and activate/deactivate accounts. Changes made here will affect users
            immediately.
          </p>
        </div>
      </div>

      {/* Current User Warning (if applicable) */}
      {currentUser && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Your Account</h3>
            <p className="text-xs text-yellow-700 mt-1">
              You are currently logged in as {currentUser.email}. Be careful when modifying or
              deleting your own account as it will immediately affect your current session.
            </p>
          </div>
        </div>
      )}

      {/* Users Table */}
      <UserTable
        onEdit={handleUserUpdate}
        onDelete={handleUserDelete}
        onActivate={handleUserUpdate}
        onDeactivate={handleUserUpdate}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};

export default Users;
