import { Budget, BudgetCreate, BudgetStatusType, BudgetSuggestion, BudgetUpdate } from '../types';
import api from './api';

class BudgetService {
  private static instance: BudgetService;

  private constructor() {}

  public static getInstance(): BudgetService {
    if (!BudgetService.instance) {
      BudgetService.instance = new BudgetService();
    }
    return BudgetService.instance;
  }

  /**
   * Get all budgets for the current user
   */
  async getBudgets(year?: number, month?: number): Promise<Budget[]> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    const response = await api.get<{ budgets: Budget[] }>(`/budgets?${params.toString()}`);
    return response.budgets || [];
  }

  /**
   * Get a single budget by ID
   */
  async getBudget(id: number): Promise<Budget> {
    const response = await api.get<{ budget: Budget }>(`/budgets/${id}`);
    return response.budget;
  }

  /**
   * Create a new budget
   */
  async createBudget(data: BudgetCreate): Promise<Budget> {
    const response = await api.post<{ budget: Budget }>('/budgets', data);
    return response.budget;
  }

  /**
   * Update an existing budget
   */
  async updateBudget(id: number, data: BudgetUpdate): Promise<Budget> {
    const response = await api.put<{ budget: Budget }>(`/budgets/${id}`, data);
    return response.budget;
  }

  /**
   * Delete a budget
   */
  async deleteBudget(id: number): Promise<void> {
    await api.delete(`/budgets/${id}`);
  }

  /**
   * Get current budget status with alerts
   */
  async getBudgetStatus(
    year?: number,
    month?: number
  ): Promise<{
    period: { year: number; month: number };
    summary: {
      total_budget: number;
      total_spent: number;
      remaining: number;
      percent: number;
      count: number;
    };
    categories: BudgetStatusType[];
    alerts: Array<{
      type: 'over' | 'warning';
      category: string;
      message: string;
    }>;
  }> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    const response = await api.get<any>(`/budgets/status?${params.toString()}`);
    return response;
  }

  /**
   * Get AI-powered budget suggestions
   */
  async getBudgetSuggestions(): Promise<BudgetSuggestion[]> {
    const response = await api.get<{ suggestions: BudgetSuggestion[] }>('/budgets/suggestions');
    return response.suggestions || [];
  }

  /**
   * Get detailed budget progress with projections
   */
  async getBudgetProgress(id: number): Promise<{
    budget: Budget;
    period: {
      start: string;
      end: string;
      days_passed: number;
      days_remaining: number;
      days_total: number;
    };
    daily_progress: Array<{
      date: string;
      day_spent: number;
      cumulative_spent: number;
      remaining: number;
      percentage: number;
    }>;
    projections: {
      average_daily_spend: number;
      projected_total: number;
      will_exceed_budget: boolean;
      projected_excess: number;
      recommended_daily: number;
    };
  }> {
    const response = await api.get<any>(`/budgets/${id}/progress`);
    return response;
  }

  /**
   * Rollover unused budget amounts to next period
   */
  async rolloverBudgets(): Promise<{ message: string; count: number }> {
    const response = await api.post<{ message: string; count: number }>('/budgets/rollover');
    return response;
  }
}

export default BudgetService.getInstance();
