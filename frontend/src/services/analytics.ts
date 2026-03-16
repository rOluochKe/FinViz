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
    const response = await api.get<SpendingPatterns>(
      `/analytics/spending-patterns?months=${months}`
    );
    return response;
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
    const response = await api.get<any>(`/analytics/anomalies?days=${days}&threshold=${threshold}`);
    return response;
  }

  /**
   * Get financial forecast
   */
  async getForecast(months: number = 6): Promise<ForecastData> {
    const response = await api.get<ForecastData>(`/analytics/forecast?months=${months}`);
    return response;
  }

  /**
   * Get category-level insights
   */
  async getCategoryInsights(): Promise<CategoryInsight[]> {
    const response = await api.get<CategoryInsight[]>('/analytics/category-insights');
    return response;
  }

  /**
   * Get monthly report
   */
  async getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    const response = await api.get<MonthlyReport>(`/analytics/monthly/${year}/${month}`);
    return response;
  }

  /**
   * Get yearly report
   */
  async getYearlyReport(year: number): Promise<YearlyReport> {
    const response = await api.get<YearlyReport>(`/analytics/yearly/${year}`);
    return response;
  }

  /**
   * Get category-specific report
   */
  async getCategoryReport(categoryId: number, months: number = 12): Promise<CategoryReport> {
    const response = await api.get<CategoryReport>(
      `/analytics/category/${categoryId}?months=${months}`
    );
    return response;
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
    const response = await api.get<any>(`/analytics/trends?group_by=${groupBy}`);
    return response;
  }

  /**
   * Get cash flow analysis
   */
  async getCashFlow(days: number = 30): Promise<CashFlowData> {
    const response = await api.get<CashFlowData>(`/analytics/cash-flow?days=${days}`);
    return response;
  }
}

export default AnalyticsService.getInstance();
