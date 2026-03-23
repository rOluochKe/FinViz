import { CategoryReport, ComparisonReport, MonthlyReport, YearlyReport } from '../types';
import api from './api';

class ReportsService {
  private static instance: ReportsService;

  private constructor() {}

  public static getInstance(): ReportsService {
    if (!ReportsService.instance) {
      ReportsService.instance = new ReportsService();
    }
    return ReportsService.instance;
  }

  /**
   * Get available report types
   */
  async getAvailableReports(): Promise<{
    reports: Array<{
      type: string;
      description: string;
      endpoint: string;
      export?: string;
      parameters: string[];
    }>;
    export_formats: string[];
  }> {
    const response = await api.get<any>('/reports/available');
    return response;
  }

  /**
   * Get monthly report
   */
  async getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    const response = await api.get<MonthlyReport>(`/reports/monthly/${year}/${month}`);
    return response;
  }

  /**
   * Get yearly report
   */

  async getYearlyReport(year: number): Promise<YearlyReport> {
    const response = await api.get<YearlyReport>(`/reports/yearly/${year}`);
    return response;
  }

  /**
   * Get category-specific report - Use string ID for UUID
   */
  async getCategoryReport(categoryId: string, months: number = 12): Promise<CategoryReport> {
    const response = await api.get<CategoryReport>(
      `/reports/category/${categoryId}?months=${months}`
    );
    return response;
  }

  /**
   * Compare two periods
   */
  async comparePeriods(period1: string, period2: string): Promise<ComparisonReport> {
    const response = await api.get<ComparisonReport>(
      `/reports/comparison?period1=${period1}&period2=${period2}`
    );
    return response;
  }

  /**
   * Get year summary
   */
  async getYearSummary(year: number): Promise<{
    summary: {
      income: number;
      expense: number;
      savings: number;
      rate: number;
      count: number;
    };
    best_month?: any;
    worst_month?: any;
  }> {
    try {
      const response = await api.get<any>(`/reports/summary/${year}`);
      return response;
    } catch (error: any) {
      if (error.status_code === 404) {
        return {
          summary: {
            income: 0,
            expense: 0,
            savings: 0,
            rate: 0,
            count: 0,
          },
          best_month: null,
          worst_month: null,
        };
      }
      throw error;
    }
  }

  /**
   * Export monthly report as PDF
   */
  async exportMonthlyReport(year: number, month: number): Promise<Blob> {
    const response = await api.get(`/reports/export/monthly/${year}/${month}`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }

  /**
   * Export yearly report as PDF
   */
  async exportYearlyReport(year: number): Promise<Blob> {
    try {
      const response = await api.get(`/reports/export/yearly/${year}`, {
        responseType: 'blob',
      });
      return response as unknown as Blob;
    } catch (error: any) {
      // If no data, return empty blob
      if (error.status_code === 404) {
        throw new Error(`No data available for year ${year}`);
      }
      throw error;
    }
  }

  /**
   * Download and save PDF file
   */
  downloadPDF(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export default ReportsService.getInstance();
