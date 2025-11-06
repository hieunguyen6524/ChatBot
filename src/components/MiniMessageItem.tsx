import type { Message, FileData } from "@/types/chat.type";
import { motion } from "framer-motion";
import { File, Image as ImageIcon } from "lucide-react";

type MiniMessageItem = {
  message: Message;
};

function MiniMessageItem({ message }: MiniMessageItem) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isUser
            ? "bg-blue-500 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        }`}
      >
        {/* File message */}
        {message.type === "file" && message.data ? (
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
          <p className="text-sm whitespace-pre-wrap wrap-break-word">
            {message.content}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs opacity-70">
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
