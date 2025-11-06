import type { Message, FileData } from "@/types/chat.type";
import { useCallback } from "react";
import { useChatStore } from "@/store/chatStore";

export const useChat = () => {
  const messages = useChatStore((s) => s.messages);
  const append = useChatStore((s) => s.append);
  const replaceMessage = useChatStore((s) => s.replaceMessage);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
      status: "sending",
      type: "text",
    };

    append(userMsg);

    setTimeout(() => {
      replaceMessage(userMsg.id, (m) => ({ ...m, status: "success" as const }));

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

        append(aiMsg);
      }, 500);
    }, 1000);
  }, [append, replaceMessage]);

  const sendFile = useCallback(async (file: File) => {
    // Convert file to base64 for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      const fileData: FileData = {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: file.type.startsWith("image/") ? dataUrl : undefined,
      };

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: `Đã gửi file: ${file.name}`,
        timestamp: new Date(),
        status: "sending",
        type: "file",
        data: fileData,
      };

      append(userMsg);

      // Simulate upload
      setTimeout(() => {
        replaceMessage(userMsg.id, (m) => ({ ...m, status: "success" as const }));

        // Mock AI response
        setTimeout(() => {
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Tôi đã nhận được file "${file.name}" (${(file.size / 1024).toFixed(2)} KB). Loại file: ${file.type || "unknown"}`,
            timestamp: new Date(),
            status: "success",
            type: "text",
          };

          append(aiMsg);
        }, 500);
      }, 1000);
    };

    reader.onerror = () => {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: `Lỗi khi đọc file: ${file.name}`,
        timestamp: new Date(),
        status: "error",
        type: "file",
        data: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      };
      append(userMsg);
    };

    if (file.type.startsWith("image/")) {
      reader.readAsDataURL(file);
    } else {
      // For non-image files, create message without preview
      const fileData: FileData = {
        name: file.name,
        size: file.size,
        type: file.type,
      };

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: `Đã gửi file: ${file.name}`,
        timestamp: new Date(),
        status: "sending",
        type: "file",
        data: fileData,
      };

      append(userMsg);

      setTimeout(() => {
        replaceMessage(userMsg.id, (m) => ({ ...m, status: "success" as const }));

        setTimeout(() => {
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Tôi đã nhận được file "${file.name}" (${(file.size / 1024).toFixed(2)} KB). Loại file: ${file.type || "unknown"}`,
            timestamp: new Date(),
            status: "success",
            type: "text",
          };

          append(aiMsg);
        }, 500);
      }, 1000);
    }
  }, [append, replaceMessage]);

  const sendMessageWithFiles = useCallback(async (content: string, files: File[]) => {
    // Process all files to get FileData
    const processFiles = async (): Promise<FileData[]> => {
      const fileDataPromises = files.map((file): Promise<FileData> => {
        return new Promise((resolve) => {
          if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string;
              resolve({
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl,
              });
            };
            reader.onerror = () => {
              resolve({
                name: file.name,
                size: file.size,
                type: file.type,
              });
            };
            reader.readAsDataURL(file);
          } else {
            resolve({
              name: file.name,
              size: file.size,
              type: file.type,
            });
          }
        });
      });
      return Promise.all(fileDataPromises);
    };

    const fileDataArray = await processFiles();

    // Determine message type and content
    const hasText = content.trim().length > 0;
    const hasFiles = fileDataArray.length > 0;
    const messageType = hasText && hasFiles ? "text_with_files" : hasFiles ? "file" : "text";
    
    // Build content message
    let messageContent = content.trim();
    if (!messageContent && hasFiles) {
      messageContent = `Đã gửi ${fileDataArray.length} file${fileDataArray.length > 1 ? "s" : ""}`;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
      status: "sending",
      type: messageType,
      files: hasFiles ? fileDataArray : undefined,
    };

    append(userMsg);

    // Simulate upload
    setTimeout(() => {
      replaceMessage(userMsg.id, (m) => ({ ...m, status: "success" as const }));

      // Mock AI response
      setTimeout(() => {
        const fileNames = fileDataArray.map(f => f.name).join(", ");
        const fileCount = fileDataArray.length;
        const totalSize = fileDataArray.reduce((sum, f) => sum + f.size, 0);
        
        let aiContent = "";
        if (hasText && hasFiles) {
          aiContent = `Tôi đã nhận được tin nhắn: "${messageContent}" kèm theo ${fileCount} file${fileCount > 1 ? "s" : ""} (${(totalSize / 1024).toFixed(2)} KB).`;
        } else if (hasFiles) {
          aiContent = `Tôi đã nhận được ${fileCount} file${fileCount > 1 ? "s" : ""}: ${fileNames} (${(totalSize / 1024).toFixed(2)} KB).`;
        } else {
          aiContent = `Tôi đã nhận được: "${messageContent}". Thử hỏi tôi về "bảng" hoặc "biểu đồ"!`;
        }

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiContent,
          timestamp: new Date(),
          status: "success",
          type: "text",
        };

        append(aiMsg);
      }, 500);
    }, 1000);
  }, [append, replaceMessage]);

  return { messages, sendMessage, sendFile, sendMessageWithFiles };
};
