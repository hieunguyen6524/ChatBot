import type { Message } from "@/types/chat.type";
import { motion } from "framer-motion";

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
        <p className="text-sm whitespace-pre-wrap wrap-break-word">
          {message.content}
        </p>
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
