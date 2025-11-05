import type { Message } from "@/types/message.type";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import Avatar from "./Avatar";

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
      <Avatar role={message.role} />
      <div
        className={`flex flex-col ${
          isUser ? "items-end" : "items-start"
        } max-w-[70%]`}
      >
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
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {message.timestamp.toLocaleTimeString("vi-VN", {
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
