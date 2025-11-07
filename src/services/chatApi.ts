import axios from "axios";
import type { Message } from "@/types/chat.type";
import { N8N_WEBHOOK_URL } from "@/config/env";

/**
 * Gửi message đến n8n webhook và nhận response
 * @param message Message từ user
 * @returns Message response từ assistant hoặc null nếu có lỗi
 */
export const sendMessageToWebhook = async (
  message: Omit<Message, "id" | "timestamp">
): Promise<Message | null> => {
  try {
    if (!N8N_WEBHOOK_URL) {
      throw new Error("N8N_WEBHOOK_URL chưa được cấu hình");
    }

    // Chuẩn bị payload để gửi đến webhook
    // Theo documentation, chỉ cần gửi các trường: content, userRole, type, files (nếu có)
    const payload: any = {
      content: message.content,
      userRole: message.userRole || "manager",
      type: message.type || "text",
    };

    // Thêm files nếu có
    if (message.files && message.files.length > 0) {
      payload.files = message.files;
    }

    // Thêm data nếu có (cho file message)
    if (message.data) {
      payload.data = message.data;
    }

    // Gửi request đến webhook
    const response = await axios.post(N8N_WEBHOOK_URL, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 giây timeout
    });

    // Xử lý response từ webhook
    // N8N webhook có thể trả về data trong nhiều format:
    // - response.data (trực tiếp)
    // - response.data.body (nếu có wrapper)
    // - response.data[0] (nếu là array)
    let responseData = response.data;

    // N8N có thể wrap response trong body
    if (responseData?.body) {
      responseData = responseData.body;
    }

    // N8N có thể trả về array
    if (Array.isArray(responseData) && responseData.length > 0) {
      responseData = responseData[0];
    }

    // Tạo Message object từ response
    // Nếu response đã có format Message thì dùng luôn, nếu không thì convert
    let aiMessage: Message;

    if (responseData?.id && responseData?.role) {
      // Response đã có format Message đầy đủ
      aiMessage = {
        id: responseData.id || (Date.now() + 1).toString(),
        role: responseData.role || "assistant",
        content: responseData.content || "",
        timestamp: responseData.timestamp
          ? new Date(responseData.timestamp)
          : new Date(),
        status: responseData.status || "success",
        type: responseData.type || "text",
        data: responseData.data,
        files: responseData.files,
      };
    } else if (responseData?.content || responseData?.message) {
      // Response có content hoặc message
      aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseData.content || responseData.message || "Đã nhận được phản hồi",
        timestamp: new Date(),
        status: responseData.status || "success",
        type: responseData.type || "text",
        data: responseData.data,
        files: responseData.files,
      };
    } else {
      // Response không có format mong đợi, tạo message mặc định
      aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: typeof responseData === "string" 
          ? responseData 
          : JSON.stringify(responseData) || "Đã nhận được phản hồi",
        timestamp: new Date(),
        status: "success",
        type: "text",
      };
    }

    return aiMessage;
  } catch (error) {
    console.error("Lỗi khi gửi message đến webhook:", error);

    // Tạo error message
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content:
        axios.isAxiosError(error)
          ? `Lỗi kết nối: ${error.message}`
          : "Đã xảy ra lỗi khi xử lý tin nhắn. Vui lòng thử lại.",
      timestamp: new Date(),
      status: "error",
      type: "text",
    };

    return errorMessage;
  }
};

