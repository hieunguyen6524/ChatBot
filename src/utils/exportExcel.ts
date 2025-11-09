import * as XLSX from "xlsx";

export interface TableData {
  headers: string[];
  rows: string[][];
  title?: string;
}

/**
 * Generate filename from title
 */
const generateFilename = (title: string | undefined, extension: string): string => {
  if (title) {
    return `${title.replace(/[^a-z0-9]/gi, "_")}.${extension}`;
  }
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  return `table_data_${dateStr}.${extension}`;
};

/**
 * Export table data to Excel file
 * @param data Table data with headers and rows
 * @param filename Optional filename
 */
export const exportTableToExcel = (
  data: TableData,
  filename?: string
): void => {
  try {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Prepare data for Excel
    // First row: headers
    const excelData: (string | number)[][] = [data.headers];

    // Add rows
    data.rows.forEach((row) => {
      // Convert string values to numbers if possible
      const convertedRow = row.map((cell) => {
        // Remove commas and try to parse as number
        const cleaned = cell.replace(/,/g, "");
        const num = parseFloat(cleaned);
        return isNaN(num) ? cell : num;
      });
      excelData.push(convertedRow);
    });

    // Create worksheet from data
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);

    // Auto-size columns
    const colWidths = data.headers.map((header, colIndex) => {
      let maxLength = header.length;
      excelData.forEach((row) => {
        if (row[colIndex] !== undefined) {
          const cellLength = String(row[colIndex]).length;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        }
      });
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) }; // Min 10, max 50
    });
    worksheet["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Generate filename
    const finalFilename = filename || generateFilename(data.title, "xlsx");

    // Write file
    XLSX.writeFile(workbook, finalFilename);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw new Error("Không thể xuất file Excel");
  }
};

/**
 * Export table data to CSV file
 * @param data Table data with headers and rows
 * @param filename Optional filename
 */
export const exportTableToCSV = (
  data: TableData,
  filename?: string
): void => {
  try {
    // Prepare CSV content
    const lines: string[] = [];

    // Add headers
    lines.push(data.headers.map(escapeCSV).join(","));

    // Add rows
    data.rows.forEach((row) => {
      lines.push(row.map(escapeCSV).join(","));
    });

    // Create CSV content
    const csvContent = lines.join("\n");

    // Add BOM for UTF-8 to support Vietnamese characters in Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || generateFilename(data.title, "csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    throw new Error("Không thể xuất file CSV");
  }
};

/**
 * Export table data to JSON file
 * @param data Table data with headers and rows
 * @param filename Optional filename
 */
export const exportTableToJSON = (
  data: TableData,
  filename?: string
): void => {
  try {
    // Convert to JSON format (array of objects)
    const jsonData = data.rows.map((row) => {
      const obj: Record<string, string> = {};
      data.headers.forEach((header, index) => {
        obj[header] = row[index] || "";
      });
      return obj;
    });

    // Create JSON content
    const jsonContent = JSON.stringify(jsonData, null, 2);

    // Create download link
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || generateFilename(data.title, "json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting to JSON:", error);
    throw new Error("Không thể xuất file JSON");
  }
};

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
const escapeCSV = (value: string): string => {
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

