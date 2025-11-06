import type { Message, FileData } from "@/types/chat.type";
import { motion } from "framer-motion";
import { File, Image as ImageIcon, Table, BarChart3, ExternalLink } from "lucide-react";

type MiniMessageItem = {
  message: Message;
  onMaximize?: () => void;
};

function MiniMessageItem({ message, onMaximize }: MiniMessageItem) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3.5`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
          isUser
            ? "bg-blue-500 text-white shadow-blue-500/20"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700"
        }`}
      >
        {/* Table or Chart message - show notification with link to full chat */}
        {(message.type === "table" || message.type === "chart") ? (
          <div className="space-y-3">
            {/* Text content */}
            {message.content && message.content.trim() && (
              <p className="text-sm whitespace-pre-wrap wrap-break-word leading-relaxed">
                {message.content}
              </p>
            )}
            {/* Notification card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3.5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {message.type === "table" ? (
                    <Table className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    {message.type === "table" ? "Bảng dữ liệu" : "Biểu đồ"} không thể hiển thị đầy đủ
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-3 leading-relaxed">
                    Vui lòng chuyển sang trang chat để xem {message.type === "table" ? "bảng" : "biểu đồ"} đầy đủ.
                  </p>
                  {onMaximize && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onMaximize}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <span>Mở trang chat đầy đủ</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (message.type === "text_with_files" || ((!message.type || message.type === "text") && message.files)) ? (
          <div className="space-y-2">
            {/* Text content */}
            {message.content && message.content.trim() && (
              <p className="text-sm whitespace-pre-wrap wrap-break-word leading-relaxed">
                {message.content}
              </p>
            )}
            {/* Files count */}
            {message.files && message.files.length > 0 && (
              <p className="text-xs opacity-70">
                📎 {message.files.length} file{message.files.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
        ) : message.type === "file" && message.data ? (
          /* File message (single file, old format) */
          <div className="flex items-start gap-2">
            {(message.data as FileData).dataUrl ? (
              <div className="flex-shrink-0">
                <img
                  src={(message.data as FileData).dataUrl}
                  alt={(message.data as FileData).name}
                  className="max-w-[120px] max-h-[120px] rounded-lg object-cover"
                />
              </div>
            ) : (
              <div className="flex-shrink-0">
                <File className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1">
                {(message.data as FileData).type?.startsWith("image/") ? (
                  <ImageIcon className="w-3 h-3 flex-shrink-0" />
                ) : (
                  <File className="w-3 h-3 flex-shrink-0" />
                )}
                <p className="text-xs font-medium truncate">
                  {(message.data as FileData).name}
                </p>
              </div>
              <p className="text-xs opacity-70">
                {(message.data as FileData).size
                  ? `${((message.data as FileData).size / 1024).toFixed(2)} KB`
                  : ""}
              </p>
            </div>
          </div>
        ) : (
          /* Text message only */
          <p className="text-sm whitespace-pre-wrap wrap-break-word leading-relaxed">
            {message.content}
          </p>
        )}
        <div className={`flex items-center gap-2 mt-1.5 ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] opacity-70 font-medium">
            {new Date(message.timestamp).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {message.status === "sending" && (
            <span className="flex items-center gap-1">
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default MiniMessageItem;
