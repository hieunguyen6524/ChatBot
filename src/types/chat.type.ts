/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status: "sending" | "success" | "error";
  type?: "text" | "table" | "chart" | "file" | "text_with_files";
  data?: any;
  files?: FileData[]; // Array of files attached to the message
  userRole?: string; // Role of the user sending the message (e.g., "manager", "employee", etc.)
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ChartData {
  type: "line" | "bar" | "pie" | "area";
  data: Array<{ name: string; value: number; [key: string]: any }>;
  xKey?: string;
  yKeys?: string[];
  title?: string;
}

export interface FileData {
  name: string;
  size: number;
  type: string;
  url?: string; // URL for preview/download
  dataUrl?: string; // Base64 data URL for images (chỉ để preview trong UI)
  driveLink?: string; // Google Drive shareable link
  driveFileId?: string; // Google Drive file ID
}
