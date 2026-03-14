/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly REACT_APP_API_URL: string;
    readonly REACT_APP_ENABLE_DARK_MODE: string;
    readonly REACT_APP_ENABLE_NOTIFICATIONS: string;
    readonly REACT_APP_DEFAULT_PAGE_SIZE: string;
    readonly REACT_APP_MAX_PAGE_SIZE: string;
    readonly REACT_APP_DATE_FORMAT: string;
    readonly REACT_APP_TIME_FORMAT: string;
    readonly REACT_APP_DATETIME_FORMAT: string;
    readonly REACT_APP_DEFAULT_CURRENCY: string;
    readonly REACT_APP_CURRENCY_SYMBOL: string;
    readonly REACT_APP_CACHE_TIMEOUT: string;
  }
}
