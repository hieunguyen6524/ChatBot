import type { Message } from "@/types/message.type";
import { useCallback, useState } from "react";

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Xin chào! Tôi là trợ lý AI. Bạn có thể nhắn tin hoặc sử dụng giọng nói để trò chuyện với tôi.",
      timestamp: new Date(),
      status: "success",
    },
  ]);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
      status: "sending",
    };

    setMessages((prev) => [...prev, userMsg]);

    // Simulate API call
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMsg.id ? { ...m, status: "success" as const } : m
        )
      );

      // Mock AI response
      setTimeout(() => {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Tôi đã nhận được tin nhắn: "${content}". Đây là câu trả lời mẫu từ AI.`,
          timestamp: new Date(),
          status: "success",
        };
        setMessages((prev) => [...prev, aiMsg]);
      }, 500);
    }, 1000);
  }, []);

  return { messages, sendMessage };
};
