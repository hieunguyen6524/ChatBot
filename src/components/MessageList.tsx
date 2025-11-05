import { AnimatePresence } from "framer-motion";
import MessageItem from "./MessageItem";
import type { Message } from "@/types/message.type";
import { useEffect, useRef, useState } from "react";

const MessageList: React.FC<{
  messages: Message[];
  onSpeak: (text: string) => void;
}> = ({ messages, onSpeak }) => {
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
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
    >
      <AnimatePresence>
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} onSpeak={onSpeak} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MessageList;
