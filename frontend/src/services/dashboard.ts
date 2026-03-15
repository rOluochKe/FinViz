import {
  CategorySpending,
  DashboardData,
  DashboardInsight,
  DashboardKPI,
  TimeSeriesData,
  Transaction,
} from '../types';
import api from './api';

class DashboardService {
  private static instance: DashboardService;

  private constructor() {}

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  /**
   * Get complete dashboard data (all-in-one endpoint)
   */
  async getFullDashboard(days: number = 30): Promise<DashboardData> {
    const response = await api.get<any>(`/dashboard/summary?days=${days}`);
    return response;
  }

  /**
   * Get KPIs only
   */
  async getKPIs(days: number = 30): Promise<DashboardKPI> {
    const response = await api.get<any>(`/dashboard/kpis?days=${days}`);
    return response;
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    const response = await api.get<any>(`/dashboard/recent?limit=${limit}`);
    return response.recent || response;
  }

  /**
   * Get spending breakdown by category
   */
  async getSpendingByCategory(days: number = 30): Promise<CategorySpending[]> {
    const response = await api.get<any>(`/dashboard/spending-by-category?days=${days}`);
    return response.categories || response;
  }

  /**
   * Get monthly trends
   */
  async getMonthlyTrends(months: number = 6): Promise<TimeSeriesData[]> {
    const response = await api.get<any>(`/dashboard/monthly-trends?months=${months}`);
    return response.trends || response;
  }

  /**
   * Get insights
   */
  async getInsights(): Promise<DashboardInsight[]> {
    const response = await api.get<any>('/dashboard/insights');
    return response.insights || response;
  }

  /**
   * Get budget status
   */
  async getBudgetStatus(year?: number, month?: number): Promise<any> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    const response = await api.get<any>(`/dashboard/budget-status?${params.toString()}`);
    return response;
  }

  /**
   * Get upcoming transactions
   */
  async getUpcomingTransactions(): Promise<any[]> {
    const response = await api.get<any>('/dashboard/upcoming');
    return response.upcoming || response;
  }

  /**
   * Get net worth history
   */
  async getNetWorth(): Promise<{
    current: number;
    history: { date: string; net_worth: number }[];
  }> {
    const response = await api.get<any>('/dashboard/net-worth');
    return response;
  }
}

export default DashboardService.getInstance();
