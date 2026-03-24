// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
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

// ============================================================================
// Auth Types
// ============================================================================

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

// ============================================================================
// Category Types
// ============================================================================

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  color: string;
  icon?: string | null;
  description?: string | null;
  parent_id?: string | null;
  user_id?: string;
  is_system: boolean;
  is_active: boolean;
  transaction_count?: number;
  total_amount?: number;
  full_path?: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  name: string;
  type: 'income' | 'expense' | 'transfer';
  color?: string | null;
  icon?: string | null;
  description?: string | null;
  parent_id?: string | null;
}

export interface CategoryUpdate {
  name?: string;
  color?: string | null;
  icon?: string | null;
  description?: string | null;
  is_active?: boolean;
}

export interface CategoryStats {
  category_id: string;
  category_name: string;
  category_type: string;
  color: string;
  transaction_count_12m: number;
  total_amount_12m: number;
  monthly_average: number;
  is_system: boolean;
}

export interface CategoryHierarchyNode {
  id: string;
  name: string;
  type: string;
  color: string;
  icon?: string | null;
  transaction_count?: number;
  children: CategoryHierarchyNode[];
}

// ============================================================================
// Transaction Types
// ============================================================================

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  category_name?: string | null;
  category_color?: string | null;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  notes?: string | null;
  receipt_path?: string | null;
  tags: string[];
  is_recurring: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  recurring_end_date?: string | null;
  formatted_amount: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreate {
  category_id: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  notes?: string | null;
  tags?: string[];
  is_recurring?: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  recurring_end_date?: string | null;
}

export interface TransactionUpdate {
  category_id?: string;
  amount?: number;
  description?: string;
  date?: string;
  notes?: string | null;
  tags?: string[];
  is_recurring?: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  recurring_end_date?: string | null;
}

export interface TransactionFilter {
  page?: number;
  per_page?: number;
  start_date?: string;
  end_date?: string;
  category_id?: string;
  type?: 'income' | 'expense' | 'transfer';
  search?: string;
  min_amount?: number;
  max_amount?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
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

// ============================================================================
// Budget Types
// ============================================================================

export interface Budget {
  id: string;
  category_id: string;
  category_name?: string | null;
  category_color?: string | null;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  month?: number | null;
  year: number;
  spent: number;
  remaining: number;
  spent_percentage: number;
  is_over_budget: boolean;
  should_alert: boolean;
  alert_threshold?: number;
  is_active: boolean;
  rollover?: boolean;
  notes?: string | null;
  projection?: any;
  created_at: string;
  updated_at: string;
}

export interface BudgetCreate {
  category_id: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  month?: number | null;
  year: number;
  alert_threshold?: number;
  is_active?: boolean;
  rollover?: boolean;
  notes?: string | null;
}

export interface BudgetUpdate {
  amount?: number;
  alert_threshold?: number;
  is_active?: boolean;
  rollover?: boolean;
  notes?: string | null;
}

export interface BudgetStatusType {
  budget_id: string;
  category_id: string;
  category_name: string;
  category_color: string;
  budget_amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'good' | 'warning' | 'over';
  days_remaining?: number | null;
}

export interface BudgetSuggestion {
  category_id: string;
  category_name: string;
  category_color: string;
  current_avg_monthly: number;
  suggested_budget: number;
  confidence: 'high' | 'medium' | 'low';
  transaction_count_90d: number;
  variability: number;
  is_consistent: boolean;
  notes?: string;
}

// ============================================================================
// Dashboard Types
// ============================================================================

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
  month?: string;
  expense: number;
  net: number;
  savings?: number;
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
  budget_status?: BudgetStatusType[];
}

export interface UpcomingTransaction {
  id: number;
  desc: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  days: number;
  category?: string | null;
}

export interface NetWorthPoint {
  date: string;
  net_worth: number;
}

export interface NetWorthData {
  current: number;
  history: NetWorthPoint[];
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  details?: any;
  status_code?: number;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
  status_code: number;
}

export interface PaginatedApiResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
  per_page: number;
}

// ============================================================================
// Report Types
// ============================================================================

export interface ReportSummary {
  income: number;
  expense: number;
  savings: number;
  rate: number;
  count: number;
}

export interface MonthlyReport extends ReportSummary {
  period: string;
  categories: Array<{
    name: string;
    amount: number;
    count: number;
    color: string;
  }>;
  daily: Array<{
    day: number;
    amount: number;
  }>;
  budgets: Array<{
    category: string;
    budget: number;
    spent: number;
    remaining: number;
    percent: number;
  }>;
}

export interface YearlyReport extends ReportSummary {
  year: number;
  monthly: Array<{
    month: number;
    name: string;
    income: number;
    expense: number;
    savings: number;
  }>;
  top_categories: Array<{
    name: string;
    color: string;
    amount: number;
  }>;
  best_month?: {
    month: number;
    name: string;
    savings: number;
  } | null;
  worst_month?: {
    month: number;
    name: string;
    savings: number;
  } | null;
}

export interface CategoryReport {
  category: {
    id: string;
    name: string;
    color: string;
    type: string;
  };
  period: string;
  summary: {
    total: number;
    avg: number;
    max: number;
    min: number;
    count: number;
  };
  monthly: Array<{
    month: string;
    amount: number;
  }>;
  recent: Transaction[];
}

// ============================================================================
// Export/Import Types
// ============================================================================

export type ExportFormat = 'csv' | 'json' | 'excel' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  start_date?: string;
  end_date?: string;
  category_id?: string;
}

export interface ImportMapping {
  date: string;
  amount: string;
  description: string;
  category?: string;
  type?: string;
  notes?: string;
}

export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  successful: Array<{
    index: number;
    data: any;
  }>;
  failedItems: Array<{
    index: number;
    error: string;
  }>;
}

// ============================================================================
// Settings Types
// ============================================================================

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  budget_alerts: boolean;
  weekly_summary: boolean;
  large_transaction_alerts: boolean;
}

export interface SecuritySettings {
  two_factor_enabled: boolean;
  session_timeout: number;
  login_notifications: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  density: 'comfortable' | 'compact';
  animations: boolean;
}

export interface Settings {
  notifications: NotificationSettings;
  security: SecuritySettings;
  appearance: AppearanceSettings;
  currency: string;
  language: string;
  timezone: string;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface WebhookEvent {
  id: string;
  type: string;
  created: number;
  data: any;
}

export interface PlaidWebhook extends WebhookEvent {
  webhook_type: string;
  webhook_code: string;
  item_id: string;
}

export interface StripeWebhook extends WebhookEvent {
  api_version: string;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
}

export interface GitHubWebhook {
  ref: string;
  before: string;
  after: string;
  repository: any;
  pusher: any;
  commits: any[];
}

export interface SendGridEvent {
  email: string;
  event: 'open' | 'click' | 'bounce' | 'delivered' | 'dropped' | 'spamreport';
  timestamp: number;
  sg_event_id: string;
  sg_message_id: string;
  category?: string;
  useragent?: string;
  ip?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DateRange =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'last_30_days'
  | 'last_90_days'
  | 'last_12_months'
  | 'custom';

export interface DateRangeValue {
  start: string;
  end: string;
  label: string;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// ============================================================================
// Form Types
// ============================================================================

export interface FormField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'textarea'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'date';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: SelectOption[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
}

// ============================================================================
// Chart Types
// ============================================================================

export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: ChartDataPoint[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
  height?: number;
  stacked?: boolean;
}

// ============================================================================
// Table Types
// ============================================================================

export interface TableColumn<T = any> {
  key: keyof T | string;
  header: string;
  width?: string | number;
  sortable?: boolean;
  filterable?: boolean;
  cell?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface TableSort {
  key: string;
  direction: 'asc' | 'desc';
}

export interface TableFilter {
  key: string;
  value: any;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface SpendingPatterns {
  period: {
    start: string;
    end: string;
    months: number;
  };
  summary: {
    total_spending: number;
    transaction_count: number;
    avg_transaction: number;
    median_transaction: number;
    avg_monthly_spending: number;
  };
  by_day: Array<{
    day_name: string;
    sum: number;
    mean: number;
    count: number;
  }>;
  by_category: Array<{
    category: string;
    sum: number;
    count: number;
  }>;
  monthly_trend: {
    growth: number;
    is_increasing: boolean;
    weekly: Array<{ week: string; amount: number }>;
    monthly: Array<{ period: string; amount: number }>;
  };
  seasonal: Array<{
    month: number;
    month_name: string;
    avg_spending: number;
    total_spending: number;
    transaction_count: number;
  }>;
  concentration: {
    hhi_score: number;
    level: 'low' | 'medium' | 'high';
    top_categories: Record<string, number>;
  };
}

export interface Anomaly {
  id?: string;
  transaction_id?: string;
  date: string;
  amount: number;
  desc?: string;
  description?: string;
  category?: string | null;
  z_score: number;
  type?: string;
  reason?: string;
}

export interface ForecastData {
  method: string;
  historical_period: {
    start: string;
    end: string;
    months: number;
  };
  forecast_periods: Array<{
    year: number;
    month: number;
    period: string;
    forecast_income: number;
    forecast_expense: number;
    forecast_net: number;
    confidence_lower?: number;
    confidence_upper?: number;
  }>;
  confidence: {
    score: number;
    income_interval: number;
    expense_interval: number;
    interpretation: 'High' | 'Medium' | 'Low';
  };
  statistics: {
    historical_avg_income: number;
    historical_avg_expense: number;
    historical_trend_income: number;
    historical_trend_expense: number;
  };
}

export interface CategoryInsight {
  category_id: string;
  category: string;
  color: string;
  total: number;
  avg: number;
  max: number;
  min: number;
  count: number;
  frequency: string;
}

export interface MonthlyReport {
  period: string;
  summary: {
    income: number;
    expense: number;
    savings: number;
    rate: number;
    count: number;
  };
  categories: Array<{
    name: string;
    amount: number;
    count: number;
    color: string;
  }>;
  daily: Array<{
    day: number;
    amount: number;
  }>;
  budgets: Array<{
    category: string;
    budget: number;
    spent: number;
    remaining: number;
    percent: number;
  }>;
}

export interface YearlyReport {
  year: number;
  summary: {
    income: number;
    expense: number;
    savings: number;
    rate: number;
    count: number;
  };
  monthly: Array<{
    month: number;
    name: string;
    income: number;
    expense: number;
    savings: number;
  }>;
  top_categories: Array<{
    name: string;
    color: string;
    amount: number;
  }>;
  best_month?: {
    month: number;
    name: string;
    savings: number;
  } | null;
  worst_month?: {
    month: number;
    name: string;
    savings: number;
  } | null;
}

export interface CategoryReport {
  category: {
    id: string;
    name: string;
    color: string;
    type: string;
  };
  period: string;
  summary: {
    total: number;
    avg: number;
    max: number;
    min: number;
    count: number;
  };
  monthly: Array<{
    month: string;
    amount: number;
  }>;
  recent: Transaction[];
}

export interface CashFlowData {
  period: {
    start: string;
    end: string;
    days: number;
  };
  summary: {
    total_inflow: number;
    total_outflow: number;
    net_cashflow: number;
    avg_monthly_inflow: number;
    avg_monthly_outflow: number;
    avg_monthly_net: number;
    current_balance: number;
  };
  monthly_data: Array<{
    month: string;
    inflow: number;
    outflow: number;
    net: number;
    start_balance: number;
    end_balance: number;
    savings_rate: number;
  }>;
  daily_data: Array<{
    date: string;
    inflow: number;
    outflow: number;
    balance: number;
  }>;
  patterns: Array<{
    type: 'positive' | 'good' | 'info';
    description: string;
    details: string;
  }>;
}

export interface TrendDataPoint {
  period: string;
  date?: string;
  income: number;
  expense: number;
  net: number;
  count: number;
  income_ma3?: number | null;
  expense_ma3?: number | null;
  net_ma3?: number | null;
  income_trend?: string | null;
  expense_trend?: string | null;
}

// ============================================================================
// Reports Types
// ============================================================================

export interface ComparisonReport {
  period1: MonthlyReport;
  period2: MonthlyReport;
  differences: {
    income: number;
    expense: number;
    savings: number;
    rate: number;
    count: number;
  };
}

export interface YearSummary {
  summary: {
    income: number;
    expense: number;
    savings: number;
    rate: number;
    count: number;
  };
  best_month?: {
    month: number;
    name: string;
    savings: number;
  } | null;
  worst_month?: {
    month: number;
    name: string;
    savings: number;
  } | null;
}

export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  category_id?: string;
  type?: 'income' | 'expense' | 'transfer';
  group_by?: 'day' | 'week' | 'month';
}

// ============================================================================
// Setting Types
// ============================================================================

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  budget_alerts: boolean;
  weekly_summary: boolean;
  large_transaction_alerts: boolean;
  marketing_emails: boolean;
}

export interface SecuritySettings {
  two_factor_enabled: boolean;
  session_timeout: number; // in minutes
  login_notifications: boolean;
  device_management: boolean;
  last_password_change?: string;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  density: 'comfortable' | 'compact';
  animations: boolean;
  reduced_motion: boolean;
  high_contrast: boolean;
}

export interface ProfileSettings {
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  timezone: string;
  date_format: string;
  currency: string;
  language: string;
}

export interface Settings {
  profile: ProfileSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  appearance: AppearanceSettings;
}

// ============================================================================
// Admin Types
// ============================================================================

export interface SystemStats {
  users: number;
  transactions: number;
  categories: number;
  budgets: number;
}

export interface CacheStats {
  backend: string;
  hits?: number;
  misses?: number;
  memory?: string;
  keys?: number;
}

export interface DiskUsage {
  total_gb: number;
  used_gb: number;
  free_gb: number;
  percent: number;
}

export interface StorageStats {
  disk: DiskUsage;
  uploads: {
    total_size_mb: number;
    total_users: number;
    users: Array<{
      user_id: string;
      usage: {
        receipts: { count: number; size: number; mb: number };
        exports: { count: number; size: number; mb: number };
        total: { count: number; size: number; mb: number };
      };
    }>;
  };
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  components: {
    database?: { status: string; error?: string };
    cache?: { status: string; error?: string };
    disk?: { status: string; free_gb: number; total_gb: number };
    memory?: { status: string; percent: number; available_gb: number; total_gb: number };
  };
}

export interface EnvInfo {
  environment: string;
  debug: boolean;
  database: string;
  cache: string;
}

export interface MigrationResult {
  message: string;
  output: string;
  error?: string;
}

export interface CleanupResult {
  message: string;
  count: number;
}

// ============================================================================
// Export Types
// ============================================================================
export interface ExportOptions {
  format: ExportFormat;
  start_date?: string;
  end_date?: string;
  category_id?: string;
}

export interface ExportFile {
  filename: string;
  size: number;
  size_formatted: string;
  created_at: string;
  download_url: string;
  type: 'transactions' | 'categories' | 'budgets' | 'report';
}

export interface ExportFilesResponse {
  files: ExportFile[];
  total_size: number;
  total_size_formatted: string;
  count: number;
  storage: {
    used: number;
    used_formatted: string;
    limit: number;
    limit_formatted: string;
    percent_used: number;
  };
}

export interface ExportFormatInfo {
  format: ExportFormat;
  name: string;
  mime_type: string;
  extension: string;
  features: string[];
  max_size_mb: number;
}

// ============================================================================
// Imports Types
// ============================================================================

export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ImportFile {
  id: string;
  filename: string;
  size: number;
  size_formatted: string;
  uploaded_at: string;
  status: ImportStatus;
  record_count?: number;
  error?: string;
}

export interface ImportPreview {
  filename: string;
  total_rows: number;
  columns: string[];
  sample: Array<Record<string, any>>;
  mapping: Record<string, string>;
  warnings?: string[];
  errors?: Array<{
    row: number;
    column: string;
    message: string;
  }>;
}

export interface ImportMapping {
  date: string;
  amount: string;
  description: string;
  category?: string;
  type?: string;
  notes?: string;
  tags?: string;
}

export interface ImportResult {
  id: string;
  filename: string;
  total_rows: number;
  processed: number;
  succeeded: number;
  failed: number;
  errors?: Array<{
    row: number;
    error: string;
    data?: Record<string, any>;
  }>;
  created_at: string;
  completed_at?: string;
  status: ImportStatus;
}

export interface ImportTemplate {
  format: ExportFormat;
  headers: string[];
  sample: Record<string, any>[];
  description: string;
  required_fields: string[];
  optional_fields: string[];
}

export interface ReportExportRequest {
  format: ExportFormat;
  start_date: string;
  end_date: string;
  report_type: 'summary' | 'detailed' | 'category' | 'comparison';
  include_charts?: boolean;
  group_by?: 'day' | 'week' | 'month';
}

export interface ExportSectionProps {
  onExportComplete?: (file: ExportFile) => void;
  onError?: (error: string) => void;
}

export interface ImportSectionProps {
  onImportComplete?: (result: ImportResult) => void;
  onError?: (error: string) => void;
}
