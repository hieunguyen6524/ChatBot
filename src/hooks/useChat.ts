import type { Message } from "@/types/chat.type";
import { useCallback, useState } from "react";

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Xin chào! Tôi có thể hiển thị dữ liệu dạng bảng và biểu đồ. Hãy thử hỏi tôi!",
      timestamp: new Date(),
      status: "success",
      type: "text",
    },
  ]);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
      status: "sending",
      type: "text",
    };

    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMsg.id ? { ...m, status: "success" as const } : m
        )
      );

      // Mock AI response with different types
      setTimeout(() => {
        let aiMsg: Message;

        // Example: Table response
        if (
          content.toLowerCase().includes("bảng") ||
          content.toLowerCase().includes("table")
        ) {
          aiMsg = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Đây là bảng dữ liệu bán hàng:",
            timestamp: new Date(),
            status: "success",
            type: "table",
            data: {
              headers: ["Tháng", "Doanh thu", "Đơn hàng", "Tăng trưởng"],
              rows: [
                ["Tháng 1", "50M", "120", "+15%"],
                ["Tháng 2", "65M", "145", "+30%"],
                ["Tháng 3", "72M", "168", "+10%"],
                ["Tháng 4", "85M", "192", "+18%"],
              ],
            },
          };
        }
        // Example: Chart response
        else if (
          content.toLowerCase().includes("biểu đồ") ||
          content.toLowerCase().includes("chart")
        ) {
          aiMsg = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Đây là biểu đồ doanh thu:",
            timestamp: new Date(),
            status: "success",
            type: "chart",
            data: {
              type: "line",
              title: "Doanh thu theo tháng",
              data: [
                { name: "T1", revenue: 50, orders: 120 },
                { name: "T2", revenue: 65, orders: 145 },
                { name: "T3", revenue: 72, orders: 168 },
                { name: "T4", revenue: 85, orders: 192 },
                { name: "T5", revenue: 95, orders: 210 },
                { name: "T6", revenue: 110, orders: 235 },
              ],
              xKey: "name",
              yKeys: ["revenue", "orders"],
            },
          };
        } else if (
          content.toLowerCase().includes("pie") ||
          content.toLowerCase().includes("pie")
        ) {
          aiMsg = {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: "Đây là biểu đồ tỉ lệ doanh thu theo khu vực:",
            timestamp: new Date(),
            status: "success",
            type: "chart",
            data: {
              type: "pie",
              title: "Tỉ lệ doanh thu theo khu vực",
              data: [
                { name: "Miền Bắc", value: 420 },
                { name: "Miền Trung", value: 260 },
                { name: "Miền Nam", value: 580 },
                { name: "Tây Nguyên", value: 190 },
              ],
              dataKey: "value",
              nameKey: "name",
            },
          };
        }
        // Default text response
        else {
          aiMsg = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Tôi đã nhận được: "${content}". Thử hỏi tôi về "bảng" hoặc "biểu đồ"!`,
            timestamp: new Date(),
            status: "success",
            type: "text",
          };
        }

        setMessages((prev) => [...prev, aiMsg]);
      }, 500);
    }, 1000);
  }, []);

  return { messages, sendMessage };
};
