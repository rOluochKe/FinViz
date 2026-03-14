import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

import { ApiError, ApiResponse, AuthTokens } from '../types';
import env from '../utils/env';

class ApiService {
  private api: AxiosInstance;
  private static instance: ApiService;

  private constructor() {
    this.api = axios.create({
      baseURL: env.API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshed = await this.refreshToken();
            if (refreshed) {
              const token = this.getAccessToken();
              if (token && originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private setTokens(tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('token_type', tokens.token_type);
    localStorage.setItem('expires_in', tokens.expires_in.toString());
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('expires_in');
    localStorage.removeItem('user');
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await axios.post(
        `${env.API_URL}/auth/refresh`,
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );

      if (response.data.access_token) {
        const tokens: AuthTokens = {
          access_token: response.data.access_token,
          refresh_token: refreshToken,
          token_type: 'bearer',
          expires_in: 3600,
        };
        this.setTokens(tokens);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      return {
        error: (error.response.data as any)?.error || 'An error occurred',
        message: (error.response.data as any)?.message || error.message,
        details: (error.response.data as any)?.details,
        status_code: error.response.status,
      };
    } else if (error.request) {
      return {
        error: 'Network Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        status_code: 0,
      };
    } else {
      return {
        error: 'Request Error',
        message: error.message,
        status_code: 0,
      };
    }
  }

  // Generic request methods
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.get(url, config);
    return response.data as T;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.post(url, data, config);
    return response.data as T;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.put(url, data, config);
    return response.data as T;
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.patch(url, data, config);
    return response.data as T;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.delete(url, config);
    return response.data as T;
  }

  // Auth methods
  public async login(credentials: { username: string; password: string }): Promise<any> {
    const response = await this.api.post('/auth/login', credentials);
    if (response.data.tokens) {
      this.setTokens(response.data.tokens);
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    return response.data;
  }

  public async register(userData: any): Promise<any> {
    const response = await this.api.post('/auth/register', userData);
    if (response.data.tokens) {
      this.setTokens(response.data.tokens);
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    return response.data;
  }

  public async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } finally {
      this.clearTokens();
    }
  }

  public async getCurrentUser(): Promise<any> {
    const response = await this.api.get('/auth/me');
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  public async changePassword(data: {
    current_password: string;
    new_password: string;
  }): Promise<any> {
    return this.api.post('/auth/change-password', data);
  }

  public async forgotPassword(email: string): Promise<any> {
    return this.api.post('/auth/forgot-password', { email });
  }

  public async resetPassword(token: string, new_password: string): Promise<any> {
    return this.api.post('/auth/reset-password', { token, new_password });
  }

  public async verifyEmail(token: string): Promise<any> {
    return this.api.post('/auth/verify-email', { token });
  }

  public isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  public getUser(): any {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export default ApiService.getInstance();
