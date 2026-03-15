import React, { useCallback, useEffect, useState } from 'react';

import { ArrowPathIcon } from '@heroicons/react/24/outline';

import toast from 'react-hot-toast';

import Button from '../../components/common/Button';
import BudgetStatus from '../../components/dashboard/BudgetStatus';
import Insights from '../../components/dashboard/Insights';
import KPICards from '../../components/dashboard/KPICards';
import NetWorthChart from '../../components/dashboard/NetWorthChart';
import PeriodSelector from '../../components/dashboard/PeriodSelector';
import RecentTransactions from '../../components/dashboard/RecentTransactions';
import SpendingChart from '../../components/dashboard/SpendingChart';
import UpcomingTransactions from '../../components/dashboard/UpcomingTransactions';
import dashboardService from '../../services/dashboard';
import {
  CategorySpending,
  DashboardInsight,
  DashboardKPI,
  TimeSeriesData,
  Transaction,
} from '../../types';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('30d');

  // Dashboard data states
  const [kpis, setKpis] = useState<DashboardKPI | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [spendingByCategory, setSpendingByCategory] = useState<CategorySpending[]>([]);
  const [trends, setTrends] = useState<TimeSeriesData[]>([]);
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<any>(null);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [netWorth, setNetWorth] = useState<{ current: number; history: any[] }>({
    current: 0,
    history: [],
  });

  const loadDashboardData = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        // Try to load all data in parallel for better performance
        const [
          kpisData,
          recentData,
          spendingData,
          trendsData,
          insightsData,
          budgetData,
          upcomingData,
          netWorthData,
        ] = await Promise.allSettled([
          dashboardService.getKPIs(parseInt(period)),
          dashboardService.getRecentTransactions(10),
          dashboardService.getSpendingByCategory(parseInt(period)),
          dashboardService.getMonthlyTrends(6),
          dashboardService.getInsights(),
          dashboardService.getBudgetStatus(),
          dashboardService.getUpcomingTransactions(),
          dashboardService.getNetWorth(),
        ]);

        // Handle each promise result
        if (kpisData.status === 'fulfilled') setKpis(kpisData.value);
        else console.error('Failed to load KPIs:', kpisData.reason);

        if (recentData.status === 'fulfilled') setRecentTransactions(recentData.value);
        else console.error('Failed to load recent transactions:', recentData.reason);

        if (spendingData.status === 'fulfilled') setSpendingByCategory(spendingData.value);
        else console.error('Failed to load spending by category:', spendingData.reason);

        if (trendsData.status === 'fulfilled') setTrends(trendsData.value);
        else console.error('Failed to load trends:', trendsData.reason);

        if (insightsData.status === 'fulfilled') setInsights(insightsData.value);
        else console.error('Failed to load insights:', insightsData.reason);

        if (budgetData.status === 'fulfilled') setBudgetStatus(budgetData.value);
        else console.error('Failed to load budget status:', budgetData.reason);

        if (upcomingData.status === 'fulfilled') setUpcoming(upcomingData.value);
        else console.error('Failed to load upcoming transactions:', upcomingData.reason);

        if (netWorthData.status === 'fulfilled') setNetWorth(netWorthData.value);
        else console.error('Failed to load net worth:', netWorthData.reason);
      } catch (error) {
        console.error('Dashboard data loading error:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period]
  );

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's your financial overview.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <PeriodSelector period={period} onPeriodChange={handlePeriodChange} />
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

      {/* KPI Cards */}
      {kpis && <KPICards kpis={kpis} period={period} />}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
          <SpendingChart type="pie" data={spendingByCategory} height={300} />
        </div>

        {/* Income vs Expenses Trend */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
          <SpendingChart type="line" data={trends} height={300} />
        </div>
      </div>

      {/* Middle Row - Insights and Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights */}
        <div className="lg:col-span-2">
          <Insights insights={insights} />
        </div>

        {/* Budget Status */}
        <div>{budgetStatus && <BudgetStatus budgets={budgetStatus.category_status || []} />}</div>
      </div>

      {/* Bottom Row - Transactions, Upcoming, Net Worth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <RecentTransactions transactions={recentTransactions} limit={5} />
        </div>

        {/* Upcoming Transactions */}
        <div>
          <UpcomingTransactions upcoming={upcoming} />
        </div>
      </div>

      {/* Net Worth Chart */}
      <div className="mt-6">
        <NetWorthChart data={netWorth.history} currentNetWorth={netWorth.current} />
      </div>
    </div>
  );
};

export default Dashboard;
