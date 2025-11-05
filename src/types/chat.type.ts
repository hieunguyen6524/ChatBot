/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status: "sending" | "success" | "error";
  type?: "text" | "table" | "chart";
  data?: any;
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
