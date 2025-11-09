import { AnimatePresence } from "framer-motion";
import MessageItem from "./MessageItem";
import type { Message } from "@/types/chat.type";
import { useEffect, useRef, useState } from "react";

type MessageListProps = {
  messages: Message[];
  onSpeak: (text: string) => void;
};

function MessageList({ messages, onSpeak }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

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

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-0 py-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-600"
      style={{
        scrollBehavior: 'smooth',
      }}
    >
     
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <MessageItem key={index} message={message} onSpeak={onSpeak} />
          ))}
        </AnimatePresence>
      </div>
    
  );
}

export default MessageList;
