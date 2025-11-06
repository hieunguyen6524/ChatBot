import type { Message, FileData } from "@/types/chat.type";
import { motion } from "framer-motion";
import { Volume2, File, Download, Image as ImageIcon } from "lucide-react";
import CustomAvatar from "./CustomAvatar";
import { MessageTable } from "./MessageTable";
import { MessageChart } from "./MessageChart";
import { MessageCard } from "./MessageCard";

type MessageItemProps = {
  message: Message;
  onSpeak: (text: string) => void;
};

function MessageItem({ message, onSpeak }: MessageItemProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} mb-4`}
    >
      <CustomAvatar role={message.role} />
      <div
        className={`flex flex-col ${
          isUser ? "items-end" : "items-start"
        } max-w-[70%]`}
      >
        {/* Text message */}
        {(!message.type || message.type === "text") && !message.files && (
          <div
            className={`rounded-2xl px-4 py-2 ${
              isUser
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            }`}
          >
            <p className="whitespace-pre-wrap wrap-break-word">
              {message.content}
            </p>
          </div>
        )}

        {/* Text with files message */}
        {(message.type === "text_with_files" || ((!message.type || message.type === "text") && message.files)) && (
          <div className="space-y-2">
            {/* Text content */}
            {message.content && message.content.trim() && (
              <div
                className={`rounded-2xl px-4 py-2 ${
                  isUser
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                }`}
              >
                <p className="whitespace-pre-wrap wrap-break-word">
                  {message.content}
                </p>
              </div>
            )}
            
            {/* Files */}
            {message.files && message.files.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {message.files.map((fileData, index) => (
                  <div
                    key={`${fileData.name}-${index}`}
                    className={`rounded-xl p-3 ${
                      isUser
                        ? "bg-blue-500/80 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {fileData.dataUrl ? (
                      <img
                        src={fileData.dataUrl}
                        alt={fileData.name}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-2">
                        <File className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {fileData.type?.startsWith("image/") ? (
                          <ImageIcon className="w-3 h-3 flex-shrink-0" />
                        ) : (
                          <File className="w-3 h-3 flex-shrink-0" />
                        )}
                        <p className="text-xs font-medium truncate">
                          {fileData.name}
                        </p>
                      </div>
                      <p className="text-xs opacity-70">
                        {(fileData.size / 1024).toFixed(2)} KB
                      </p>
                      {fileData.dataUrl && (
                        <a
                          href={fileData.dataUrl}
                          download={fileData.name}
                          className="inline-flex items-center gap-1 mt-1 text-xs hover:underline opacity-70 hover:opacity-100"
                        >
                          <Download className="w-3 h-3" />
                          Tải xuống
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Table message */}
        {message.type === "table" && message.data && (
          <MessageCard title={message.data.title} description={message.content}>
            <MessageTable data={message.data} />
          </MessageCard>
        )}

        {/* Chart message */}
        {message.type === "chart" && message.data && (
          <MessageChart data={message.data} />
        )}

        {/* File message (single file, old format) */}
        {message.type === "file" && message.data && !message.files && (
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            }`}
          >
            <div className="flex items-start gap-3">
              {(message.data as FileData).dataUrl ? (
                <div className="flex-shrink-0">
                  <img
                    src={(message.data as FileData).dataUrl}
                    alt={(message.data as FileData).name}
                    className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0">
                  <File className="w-8 h-8" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {(message.data as FileData).type?.startsWith("image/") ? (
                    <ImageIcon className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <File className="w-4 h-4 flex-shrink-0" />
                  )}
                  <p className="font-medium truncate">
                    {(message.data as FileData).name}
                  </p>
                </div>
                <p className="text-xs opacity-70">
                  {(message.data as FileData).size
                    ? `${((message.data as FileData).size / 1024).toFixed(2)} KB`
                    : ""}
                  {(message.data as FileData).type &&
                    ` • ${(message.data as FileData).type}`}
                </p>
                {(message.data as FileData).dataUrl && (
                  <a
                    href={(message.data as FileData).dataUrl}
                    download={(message.data as FileData).name}
                    className="inline-flex items-center gap-1 mt-2 text-xs hover:underline"
                  >
                    <Download className="w-3 h-3" />
                    Tải xuống
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {new Date(message.timestamp).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {message.status === "sending" && (
            <span className="flex items-center gap-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </span>
          )}
          {!isUser && message.status === "success" && (
            <button
              onClick={() => onSpeak(message.content)}
              className="hover:text-blue-500 transition-colors"
              aria-label="Đọc tin nhắn"
            >
              <Volume2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default MessageItem;
