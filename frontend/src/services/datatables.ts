import 'datatables.net';
import 'datatables.net-buttons';
import 'datatables.net-buttons-dt/css/buttons.dataTables.css';
import 'datatables.net-dt/css/jquery.dataTables.css';
import 'datatables.net-select';
import 'datatables.net-select-dt/css/select.dataTables.css';
import $ from 'jquery';

// Initialize DataTables with default settings
export const initDataTable = (tableId: string, options?: DataTables.Settings): DataTables.Api => {
  const defaultOptions: DataTables.Settings = {
    responsive: true,
    pageLength: 25,
    lengthMenu: [
      [10, 25, 50, 100],
      [10, 25, 50, 100],
    ],
    language: {
      search: 'Search:',
      lengthMenu: 'Show _MENU_ entries',
      info: 'Showing _START_ to _END_ of _TOTAL_ entries',
      infoEmpty: 'Showing 0 to 0 of 0 entries',
      infoFiltered: '(filtered from _MAX_ total entries)',
      zeroRecords: 'No matching records found',
      paginate: {
        first: 'First',
        last: 'Last',
        next: 'Next',
        previous: 'Previous',
      },
    },
    dom: 'Bfrtip',
    buttons: ['copy', 'csv', 'excel', 'pdf', 'print'],
    ...options,
  };

  return $(`#${tableId}`).DataTable(defaultOptions);
};

export default initDataTable;
