import type { Message, FileData } from "@/types/chat.type";
import { motion } from "framer-motion";
import { Volume2, File, Download, Image as ImageIcon } from "lucide-react";
import CustomAvatar from "./CustomAvatar";
import { MessageTable } from "./MessageTable";
import { MessageChart } from "./MessageChart";
import { MessageCard } from "./MessageCard";
import { TypingIndicator } from "./TypingIndicator";
import { LinkifyText } from "@/utils/linkify";

type MessageItemProps = {
  message: Message;
  onSpeak: (text: string) => void;
};

function MessageItem({ message, onSpeak }: MessageItemProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"} mb-6 px-4 sm:px-6`}
    >
      <div className="flex-shrink-0">
        <CustomAvatar role={message.role} />
      </div>
      <div
        className={`flex flex-col ${
          isUser ? "items-end" : "items-start"
        } max-w-[80%] sm:max-w-[75%] min-w-0 flex-1`}
      >
        {/* Typing indicator - hiển thị khi đang chờ response từ assistant */}
        {!isUser && message.status === "sending" && (!message.content || message.content.trim() === "") && (
          <div
            className="rounded-2xl px-5 py-3 shadow-lg bg-white dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 shadow-gray-200/60 dark:shadow-gray-900/60 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
          >
            <TypingIndicator />
          </div>
        )}

        {/* Text message */}
        {(!message.type || message.type === "text") && !message.files && message.content && message.content.trim() !== "" && (
          <div
            className={`rounded-2xl px-5 py-3 shadow-lg ${
              isUser
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/30"
                : "bg-white dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 shadow-gray-200/60 dark:shadow-gray-900/60 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
            }`}
          >
            <p className="whitespace-pre-wrap break-words leading-relaxed text-[15px] font-normal">
              <LinkifyText text={message.content} isUserMessage={isUser} />
            </p>
          </div>
        )}

        {/* Text with files message */}
        {(message.type === "text_with_files" || ((!message.type || message.type === "text") && message.files)) && (
          <div className="space-y-3">
            {/* Text content */}
            {message.content && message.content.trim() && (
              <div
                className={`rounded-2xl px-5 py-3 shadow-lg ${
                  isUser
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/30"
                    : "bg-white dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 shadow-gray-200/60 dark:shadow-gray-900/60 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
                }`}
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed text-[15px] font-normal">
                  <LinkifyText text={message.content} isUserMessage={isUser} />
                </p>
              </div>
            )}
            
            {/* Files */}
            {message.files && message.files.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {message.files.map((fileData, index) => (
                  <motion.div
                    key={`${fileData.name}-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className={`rounded-xl p-3 shadow-md hover:shadow-lg transition-all ${
                      isUser
                        ? "bg-gradient-to-br from-blue-500/95 to-blue-600/95 text-white shadow-blue-500/25"
                        : "bg-white dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 shadow-gray-200/60 dark:shadow-gray-900/60 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
                    }`}
                  >
                    {fileData.dataUrl ? (
                      <img
                        src={fileData.dataUrl}
                        alt={fileData.name}
                        className="w-full h-32 object-cover rounded-lg mb-2 shadow-sm"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center mb-2">
                        <File className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        {fileData.type?.startsWith("image/") ? (
                          <ImageIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isUser ? "text-white/90" : "text-gray-500"}`} />
                        ) : (
                          <File className={`w-3.5 h-3.5 flex-shrink-0 ${isUser ? "text-white/90" : "text-gray-500"}`} />
                        )}
                        <p className={`text-xs font-semibold truncate ${isUser ? "text-white/90" : "text-gray-700 dark:text-gray-300"}`}>
                          {fileData.name}
                        </p>
                      </div>
                      <p className={`text-xs ${isUser ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}>
                        {(fileData.size / 1024).toFixed(2)} KB
                      </p>
                      {fileData.dataUrl && (
                        <a
                          href={fileData.dataUrl}
                          download={fileData.name}
                          className={`inline-flex items-center gap-1 mt-1.5 text-xs hover:underline transition-colors ${
                            isUser 
                              ? "text-white/80 hover:text-white" 
                              : "text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                          }`}
                        >
                          <Download className="w-3 h-3" />
                          Tải xuống
                        </a>
                      )}
                    </div>
                  </motion.div>
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
            className={`rounded-2xl px-5 py-4 shadow-lg ${
              isUser
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/30"
                : "bg-white dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 shadow-gray-200/60 dark:shadow-gray-900/60 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
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

        {/* Chỉ hiển thị timestamp và controls khi không phải typing indicator */}
        {!(!isUser && message.status === "sending" && (!message.content || message.content.trim() === "")) && (
          <div className={`flex items-center gap-2.5 mt-2 text-xs ${isUser ? "flex-row-reverse" : ""}`}>
            <span className={`font-medium ${isUser ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}>
              {new Date(message.timestamp).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {message.status === "sending" && message.content && message.content.trim() !== "" && (
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </span>
            )}
            {!isUser && message.status === "success" && message.content && (
              <button
                onClick={() => onSpeak(message.content)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all duration-200"
                aria-label="Đọc tin nhắn"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default MessageItem;
