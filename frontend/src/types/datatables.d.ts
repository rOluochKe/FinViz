declare namespace DataTables {
  interface Settings {
    responsive?: boolean | any;
    pageLength?: number;
    lengthMenu?: number[][] | Array<Array<number | string>>;
    language?: LanguageSettings;
    dom?: string;
    buttons?: string[] | ButtonSettings[];
    serverSide?: boolean;
    processing?: boolean;
    ajax?: any;
    columns?: ColumnSettings[];
    order?: Array<Array<number | string>>;
    rowCallback?: (row: Node, data: any[] | object, index: number) => void;
    drawCallback?: (settings: Settings) => void;
    initComplete?: (settings: Settings, json: any) => void;
    [key: string]: any;
  }

  interface LanguageSettings {
    search?: string;
    lengthMenu?: string;
    info?: string;
    infoEmpty?: string;
    infoFiltered?: string;
    zeroRecords?: string;
    paginate?: {
      first?: string;
      last?: string;
      next?: string;
      previous?: string;
    };
    [key: string]: any;
  }

  interface ColumnSettings {
    data?: string | number | null;
    title?: string;
    orderable?: boolean;
    searchable?: boolean;
    width?: string;
    className?: string;
    render?: (data: any, type: string, row: any, meta: any) => any;
    [key: string]: any;
  }

  interface ButtonSettings {
    text?: string;
    extend?: string;
    className?: string;
    [key: string]: any;
  }

  interface Api {
    destroy(): void;
    ajax: {
      reload(callback?: (json: any) => void, resetPaging?: boolean): void;
    };
    rows: {
      (selector?: any): any;
    };
    row: {
      (selector?: any): any;
    };
    column: {
      (selector?: any): any;
    };
    on(event: string, callback: (...args: any[]) => void): Api;
    off(event: string): Api;
    draw(page?: string | boolean): Api;
    clear(): Api;
    [key: string]: any;
  }
}
