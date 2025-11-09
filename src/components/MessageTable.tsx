import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ChevronDown, FileSpreadsheet, FileText, Code } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportTableToExcel, exportTableToCSV, exportTableToJSON } from "@/utils/exportExcel";
import toast from "react-hot-toast";

interface MessageTableProps {
  data: {
    headers: string[];
    rows: string[][];
    title?: string;
  };
}

export const MessageTable: React.FC<MessageTableProps> = ({ data }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleExport = (format: "excel" | "csv" | "json") => {
    try {
      switch (format) {
        case "excel":
          exportTableToExcel(data);
          toast.success("Đã tải xuống file Excel thành công!");
          break;
        case "csv":
          exportTableToCSV(data);
          toast.success("Đã tải xuống file CSV thành công!");
          break;
        case "json":
          exportTableToJSON(data);
          toast.success("Đã tải xuống file JSON thành công!");
          break;
      }
      setIsDropdownOpen(false);
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      toast.error(`Không thể xuất file ${format.toUpperCase()}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
    >
      {/* Export button with dropdown */}
      <div className="flex justify-end p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            title="Tải xuống bảng dữ liệu"
          >
            <Download className="w-4 h-4" />
            <span>Tải xuống</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden"
              >
                <button
                  onClick={() => handleExport("excel")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>CSV (.csv)</span>
                </button>
                {/* <button
                  onClick={() => handleExport("json")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700"
                >
                  <Code className="w-4 h-4 text-yellow-600" />
                  <span>JSON (.json)</span>
                </button> */}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="overflow-x-auto max-h-96">
        <Table>
          <TableHeader>
            <TableRow>
              {data.headers.map((header, idx) => (
                <TableHead key={idx} className="font-semibold">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row, rowIdx) => (
              <TableRow key={rowIdx}>
                {row.map((cell, cellIdx) => (
                  <TableCell key={cellIdx}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};
