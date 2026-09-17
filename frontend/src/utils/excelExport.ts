import * as XLSX from 'xlsx';

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
  columnWidths?: number[];
}

/**
 * Generates and downloads a real Microsoft Excel (.xlsx) file using SheetJS
 */
export function exportToXLSX({
  filename,
  sheetName = 'Sheet1',
  headers,
  rows,
  columnWidths
}: ExcelExportOptions): void {
  const data = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Auto-calculate or apply column widths
  if (columnWidths && columnWidths.length > 0) {
    worksheet['!cols'] = columnWidths.map(w => ({ wch: w }));
  } else {
    // Auto calculate column widths based on maximum content length
    const colWidths = headers.map((header, colIndex) => {
      let maxLen = header.length;
      rows.forEach(row => {
        const val = row[colIndex];
        if (val !== null && val !== undefined) {
          const s = String(val);
          if (s.length > maxLen) maxLen = s.length;
        }
      });
      return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
    });
    worksheet['!cols'] = colWidths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

  // Ensure .xlsx extension
  const cleanFilename = filename.endsWith('.xlsx')
    ? filename
    : filename.replace(/\.(xls|csv|txt)$/i, '') + '.xlsx';

  XLSX.writeFile(workbook, cleanFilename);
}
