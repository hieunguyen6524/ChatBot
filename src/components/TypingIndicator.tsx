import { motion } from "framer-motion";

type TypingIndicatorProps = {
  className?: string;
};

/**
 * Typing indicator component - hiển thị animation khi đang chờ response
 */
export function TypingIndicator({ className = "" }: TypingIndicatorProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <motion.div
        className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.4,
        }}
      />
    </div>
  );
}

