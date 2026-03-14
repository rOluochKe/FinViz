// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  email_verified: boolean;
  preferences: UserPreferences;
  created_at: string;
  last_login?: string;
}

export interface UserPreferences {
  currency: string;
  theme: 'light' | 'dark';
  language: string;
  notifications: {
    email: boolean;
    budget_alerts: boolean;
  };
  dashboard: {
    default_view: 'monthly' | 'yearly';
    chart_type: 'line' | 'bar' | 'pie';
    show_recent: number;
  };
}

// Auth Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user?: User;
  message?: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

export interface PasswordReset {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

// Category Types
export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  color: string;
  icon?: string;
  description?: string;
  parent_id?: number;
  is_system: boolean;
  is_active: boolean;
  transaction_count?: number;
  total_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  name: string;
  type: 'income' | 'expense' | 'transfer';
  color?: string;
  icon?: string;
  description?: string;
  parent_id?: number;
}

// Transaction Types
export interface Transaction {
  id: number;
  user_id: number;
  category_id: number;
  category_name?: string;
  category_color?: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  notes?: string;
  receipt_path?: string;
  tags: string[];
  is_recurring: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurring_end_date?: string;
  formatted_amount: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreate {
  category_id: number;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  notes?: string;
  tags?: string[];
  is_recurring?: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurring_end_date?: string;
}

export interface TransactionUpdate {
  category_id?: number;
  amount?: number;
  description?: string;
  date?: string;
  notes?: string;
  tags?: string[];
}

export interface TransactionFilter {
  page?: number;
  per_page?: number;
  start_date?: string;
  end_date?: string;
  category_id?: number;
  type?: 'income' | 'expense' | 'transfer';
  search?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Budget Types
export interface Budget {
  id: number;
  category_id: number;
  category_name?: string;
  category_color?: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  month?: number;
  year: number;
  spent: number;
  remaining: number;
  spent_percentage: number;
  is_over_budget: boolean;
  should_alert: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetCreate {
  category_id: number;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  month?: number;
  year: number;
  alert_threshold?: number;
  is_active?: boolean;
  notes?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  status_code?: number;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
  status_code: number;
}

// Dashboard Types
export interface DashboardKPI {
  income: {
    current: number;
    previous: number;
    change: number;
    trend: number;
  };
  expense: {
    current: number;
    previous: number;
    change: number;
    trend: number;
  };
  savings: {
    current: number;
    previous: number;
    change: number;
  };
  rate: number;
  count: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percent: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export interface DashboardInsight {
  type: 'success' | 'warning' | 'info';
  title: string;
  msg: string;
  action?: string;
}

export interface DashboardData {
  kpis: DashboardKPI;
  recent_transactions: Transaction[];
  spending_by_category: CategorySpending[];
  trends: TimeSeriesData[];
  insights: DashboardInsight[];
  budget_status?: any;
}
