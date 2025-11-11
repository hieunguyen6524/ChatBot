import { AnimatePresence } from "framer-motion";
import MessageItem from "./MessageItem";
import type { Message } from "@/types/chat.type";
import { useEffect, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { MAX_FILES } from "@/config/env";

// Đọc giới hạn dung lượng file từ env (đơn vị MB), mặc định 10MB
const MAX_FILE_SIZE_MB = parseFloat(
  import.meta.env.VITE_MAX_FILE_SIZE_MB || "10"
);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // Chuyển MB sang bytes

type MessageListProps = {
  messages: Message[];
  onSpeak: (text: string) => void;
  onFilesDropped?: (files: File[]) => void;
};

function MessageList({ messages, onSpeak, onFilesDropped }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  const validateFiles = useCallback((files: File[]): File[] => {
    const validFiles: File[] = [];
    const oversizedFiles: File[] = [];

    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        oversizedFiles.push(file);
      } else {
        validFiles.push(file);
      }
    });

    if (oversizedFiles.length > 0) {
      const fileList = oversizedFiles
        .map((f) => `• ${f.name} (${(f.size / (1024 * 1024)).toFixed(2)} MB)`)
        .join("\n");
      toast.error(
        `Các file sau vượt quá giới hạn ${MAX_FILE_SIZE_MB} MB:\n${fileList}\n\nVui lòng chọn file nhỏ hơn.`,
        {
          duration: 5000,
        }
      );
    }

    if (validFiles.length > MAX_FILES) {
      toast.error(`Bạn chỉ có thể gửi tối đa ${MAX_FILES} file mỗi tin nhắn.`);
      return validFiles.slice(0, MAX_FILES);
    }

    return validFiles;
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Chỉ set isDragging = false nếu rời khỏi container chính
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      if (!onFilesDropped) {
        toast.error("Không thể xử lý file. Vui lòng thử lại.");
        return;
      }

      const validFiles = validateFiles(files);
      if (validFiles.length > 0) {
        onFilesDropped(validFiles);
        toast.success(`Đã thêm ${validFiles.length} file${validFiles.length > 1 ? "s" : ""}`);
      }
    },
    [onFilesDropped, validateFiles]
  );

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`flex-1 overflow-y-auto px-0 py-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-600 relative transition-all ${
        isDragging
          ? "bg-blue-50/50 dark:bg-blue-900/20 border-2 border-dashed border-blue-400 dark:border-blue-500"
          : ""
      }`}
      style={{
        scrollBehavior: 'smooth',
      }}
    >
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm z-10 pointer-events-none">
          <div className="text-center">
            <div className="text-6xl mb-4">📎</div>
            <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
              Thả file vào đây để gửi
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Hoặc dán ảnh vào ô nhập tin nhắn
            </p>
          </div>
        </div>
      )}
     
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <MessageItem key={index} message={message} onSpeak={onSpeak} />
          ))}
        </AnimatePresence>
      </div>
    
  );
}

export default MessageList;
