/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status: "sending" | "success" | "error";
  type: "text" | "file" | "text_with_files";
  userRole?: string;
  bossId?: string; // Thêm dòng này
  files?: FileData[];
  data?: FileData;
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
  dataUrl?: string;
  driveLink?: string;
  driveFileId?: string;
}
