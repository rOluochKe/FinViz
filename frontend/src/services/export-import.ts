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
    return api.post('/exports/transactions', options, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Export categories to file
   */
  async exportCategories(
    options: ExportOptions
  ): Promise<{ filename: string; download_url: string }> {
    return api.post('/exports/categories', options, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Export budgets to file
   */
  async exportBudgets(options: ExportOptions): Promise<{ filename: string; download_url: string }> {
    return api.post('/exports/budgets', options, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
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

    return api.post('/imports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Validate import file
   */
  async validateFile(fileId: string): Promise<ImportPreview> {
    return api.post('/imports/validate', { file_id: fileId });
  }

  /**
   * Preview import
   */
  async previewImport(fileId: string, mapping?: Record<string, string>): Promise<ImportPreview> {
    return api.post('/imports/preview', {
      file_id: fileId,
      mapping,
    });
  }

  /**
   * Execute import
   */
  async executeImport(
    fileId: string,
    mapping: Record<string, string>,
    options?: {
      skip_errors?: boolean;
      create_missing_categories?: boolean;
      default_category?: number;
    }
  ): Promise<ImportResult> {
    return api.post('/imports/execute', {
      file_id: fileId,
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
