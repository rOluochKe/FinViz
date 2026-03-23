import {
  ExportFilesResponse,
  ExportFormatInfo,
  ExportOptions,
  ImportPreview,
  ImportResult,
  ImportTemplate,
  ReportExportRequest,
} from '../types';
import api from './api';

class ExportImportService {
  // ============================================================================
  // Export Operations
  // ============================================================================

  /**
   * Get available export formats
   */
  async getExportFormats(): Promise<ExportFormatInfo[]> {
    return api.get('/exports/formats');
  }

  /**
   * Export transactions to file
   */
  async exportTransactions(
    options: ExportOptions
  ): Promise<{ filename: string; download_url: string }> {
    const params = new URLSearchParams();
    params.append('format', options.format);

    if (options.start_date) {
      params.append('start_date', options.start_date);
    }
    if (options.end_date) {
      params.append('end_date', options.end_date);
    }
    if (options.category_id) {
      params.append('category_id', options.category_id);
    }

    return api.get(`/exports/transactions?${params.toString()}`);
  }

  /**
   * Export categories to file
   */
  async exportCategories(
    options: ExportOptions
  ): Promise<{ filename: string; download_url: string }> {
    const params = new URLSearchParams();
    params.append('format', options.format);

    if (options.start_date) {
      params.append('start_date', options.start_date);
    }
    if (options.end_date) {
      params.append('end_date', options.end_date);
    }
    if (options.category_id) {
      params.append('category_id', options.category_id);
    }

    return api.get(`/exports/categories?${params.toString()}`);
  }

  /**
   * Export budgets to file
   */
  async exportBudgets(options: ExportOptions): Promise<{ filename: string; download_url: string }> {
    const params = new URLSearchParams();
    params.append('format', options.format);

    if (options.start_date) {
      params.append('start_date', options.start_date);
    }
    if (options.end_date) {
      params.append('end_date', options.end_date);
    }
    if (options.category_id) {
      params.append('category_id', options.category_id);
    }

    return api.get(`/exports/budgets?${params.toString()}`);
  }

  /**
   * Export custom report
   */
  async exportReport(
    request: ReportExportRequest
  ): Promise<{ filename: string; download_url: string }> {
    return api.post('/exports/report', request, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * List exported files and storage usage
   */
  async listExportedFiles(): Promise<ExportFilesResponse> {
    return api.get('/exports/files');
  }

  /**
   * Download exported file
   */
  async downloadFile(filename: string): Promise<Blob> {
    const response = await api.get(`/exports/download/${filename}`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }

  /**
   * Trigger file download in browser
   */
  triggerDownload(filename: string, blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // ============================================================================
  // Import Operations
  // ============================================================================

  /**
   * Get supported import formats
   */
  async getSupportedFormats(): Promise<ExportFormatInfo[]> {
    return api.get('/imports/supported-formats');
  }

  /**
   * Get import template
   */
  async getImportTemplate(format: string): Promise<ImportTemplate> {
    return api.get(`/imports/template?format=${format}`);
  }

  /**
   * Upload file for import
   */
  async uploadFile(file: File): Promise<{ file_id: string; filename: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{
      message: string;
      file: { filename: string; original: string; size: number };
    }>('/imports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Extract the filename from the response
    return {
      file_id: response.file.filename,
      filename: response.file.filename,
      size: response.file.size,
    };
  }

  /**
   * Validate import file
   */
  async validateFile(filename: string): Promise<ImportPreview> {
    return api.post('/imports/validate', { filename });
  }

  /**
   * Preview import
   */
  async previewImport(filename: string, mapping?: Record<string, string>): Promise<ImportPreview> {
    const payload: { filename: string; mapping?: Record<string, string> } = {
      filename: filename,
    };

    if (mapping && Object.keys(mapping).length > 0) {
      payload.mapping = mapping;
    }

    return api.post('/imports/preview', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Execute import
   */
  async executeImport(
    filename: string,
    mapping: Record<string, string>,
    options?: {
      skip_errors?: boolean;
      create_missing_categories?: boolean;
      default_category?: number;
    }
  ): Promise<ImportResult> {
    return api.post('/imports/execute', {
      filename: filename,
      mapping,
      options,
    });
  }

  /**
   * Clear temporary files
   */
  async clearTempFiles(): Promise<{ message: string; count: number }> {
    return api.delete('/imports/clear-temp');
  }

  /**
   * Download sample template
   */
  downloadTemplate(format: string): void {
    const url = `/imports/template?format=${format}&download=true`;
    window.open(url, '_blank');
  }
}

const exportImportService = new ExportImportService();
export default exportImportService;
