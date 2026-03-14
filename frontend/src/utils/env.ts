/**
 * Environment variables utility
 * Provides type-safe access to environment variables with fallbacks
 */

export const env = {
  // API Configuration
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',

  // Feature Flags
  ENABLE_DARK_MODE: process.env.REACT_APP_ENABLE_DARK_MODE === 'true',
  ENABLE_NOTIFICATIONS: process.env.REACT_APP_ENABLE_NOTIFICATIONS !== 'false',

  // Pagination
  DEFAULT_PAGE_SIZE: parseInt(process.env.REACT_APP_DEFAULT_PAGE_SIZE || '20', 10),
  MAX_PAGE_SIZE: parseInt(process.env.REACT_APP_MAX_PAGE_SIZE || '100', 10),

  // Date Format
  DATE_FORMAT: process.env.REACT_APP_DATE_FORMAT || 'YYYY-MM-DD',
  TIME_FORMAT: process.env.REACT_APP_TIME_FORMAT || 'HH:mm:ss',
  DATETIME_FORMAT: process.env.REACT_APP_DATETIME_FORMAT || 'YYYY-MM-DD HH:mm:ss',

  // Currency
  DEFAULT_CURRENCY: process.env.REACT_APP_DEFAULT_CURRENCY || 'USD',
  CURRENCY_SYMBOL: process.env.REACT_APP_CURRENCY_SYMBOL || '$',

  // Cache
  CACHE_TIMEOUT: parseInt(process.env.REACT_APP_CACHE_TIMEOUT || '300000', 10),

  // Node environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test',
} as const;

export default env;
