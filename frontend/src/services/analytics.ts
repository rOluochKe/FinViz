import {
  Anomaly,
  CashFlowData,
  CategoryInsight,
  CategoryReport,
  ForecastData,
  MonthlyReport,
  SpendingPatterns,
  YearlyReport,
} from '../types';
import api from './api';

class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Get spending pattern analysis
   */
  async getSpendingPatterns(months: number = 6): Promise<SpendingPatterns> {
    try {
      const response = await api.get<SpendingPatterns>(
        `/analytics/spending-patterns?months=${months}`
      );
      return response;
    } catch (error) {
      console.error('Failed to get spending patterns:', error);
      // Return a default empty structure
      return {
        period: { start: '', end: '', months: 0 },
        summary: {
          total_spending: 0,
          transaction_count: 0,
          avg_transaction: 0,
          median_transaction: 0,
          avg_monthly_spending: 0,
        },
        by_day: [],
        by_category: [],
        monthly_trend: { growth: 0, is_increasing: false, weekly: [], monthly: [] },
        seasonal: [],
        concentration: { hhi_score: 0, level: 'low', top_categories: {} },
      } as SpendingPatterns;
    }
  }

  /**
   * Detect anomalous transactions
   */
  async getAnomalies(
    days: number = 30,
    threshold: number = 2.0
  ): Promise<{
    total: number;
    anomalies: number;
    threshold: number;
    items: Anomaly[];
  }> {
    try {
      const response = await api.get<any>(
        `/analytics/anomalies?days=${days}&threshold=${threshold}`
      );
      return response;
    } catch (error) {
      console.error('Failed to get anomalies:', error);
      return { total: 0, anomalies: 0, threshold, items: [] };
    }
  }

  /**
   * Get financial forecast
   */
  async getForecast(months: number = 6): Promise<ForecastData> {
    try {
      const response = await api.get<ForecastData>(`/analytics/forecast?months=${months}`);
      return response;
    } catch (error) {
      console.error('Failed to get forecast:', error);
      // Return default forecast data
      return {
        method: 'linear_regression',
        historical_period: { start: '', end: '', months: 0 },
        forecast_periods: [],
        confidence: { score: 0, income_interval: 0, expense_interval: 0, interpretation: 'Low' },
        statistics: {
          historical_avg_income: 0,
          historical_avg_expense: 0,
          historical_trend_income: 0,
          historical_trend_expense: 0,
        },
      } as ForecastData;
    }
  }

  /**
   * Get category-level insights
   */
  async getCategoryInsights(): Promise<CategoryInsight[]> {
    try {
      const response = await api.get<CategoryInsight[]>('/analytics/category-insights');
      return response || [];
    } catch (error) {
      console.error('Failed to get category insights:', error);
      return [];
    }
  }

  /**
   * Get monthly report
   */
  async getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    try {
      const response = await api.get<MonthlyReport>(`/analytics/monthly/${year}/${month}`);
      return response;
    } catch (error) {
      console.error('Failed to get monthly report:', error);
      throw error;
    }
  }

  /**
   * Get yearly report
   */
  async getYearlyReport(year: number): Promise<YearlyReport> {
    try {
      const response = await api.get<YearlyReport>(`/analytics/yearly/${year}`);
      return response;
    } catch (error) {
      console.error('Failed to get yearly report:', error);
      throw error;
    }
  }

  /**
   * Get category-specific report
   */
  async getCategoryReport(categoryId: string, months: number = 12): Promise<CategoryReport> {
    try {
      const response = await api.get<CategoryReport>(
        `/analytics/category/${categoryId}?months=${months}`
      );
      return response;
    } catch (error) {
      console.error('Failed to get category report:', error);
      throw error;
    }
  }

  /**
   * Get spending trends
   */
  async getTrends(groupBy: 'day' | 'week' | 'month' = 'month'): Promise<{
    trends: Array<{
      period: string;
      income: number;
      expense: number;
      net: number;
      count: number;
    }>;
  }> {
    try {
      const response = await api.get<any>(`/analytics/trends?group_by=${groupBy}`);
      return response;
    } catch (error) {
      console.error('Failed to get trends:', error);
      return { trends: [] };
    }
  }

  /**
   * Get cash flow analysis
   */
  async getCashFlow(days: number = 30): Promise<CashFlowData> {
    try {
      const response = await api.get<CashFlowData>(`/analytics/cash-flow?days=${days}`);
      return response;
    } catch (error) {
      console.error('Failed to get cash flow:', error);
      // Return default cash flow data
      return {
        period: { start: '', end: '', days: 0 },
        summary: {
          total_inflow: 0,
          total_outflow: 0,
          net_cashflow: 0,
          avg_monthly_inflow: 0,
          avg_monthly_outflow: 0,
          avg_monthly_net: 0,
          current_balance: 0,
        },
        monthly_data: [],
        daily_data: [],
        patterns: [],
      } as CashFlowData;
    }
  }
}

export default AnalyticsService.getInstance();
