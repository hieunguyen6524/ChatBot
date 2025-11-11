import axios from "axios";
import type { Message } from "@/types/chat.type";
import { N8N_WEBHOOK_URL, WEBHOOK_TIMEOUT, USE_MOCK_DATA } from "@/config/env";
import { getMockResponse, simulateDelay } from "./mockData";

/**
 * Gửi message đến n8n webhook và nhận response
 * @param message Message từ user
 * @param abortSignal Signal để hủy request
 * @returns Message response từ assistant hoặc null nếu có lỗi
 */
export const sendMessageToWebhook = async (
  message: Omit<Message, "id" | "timestamp">,
  abortSignal?: AbortSignal
): Promise<Message | null> => {
  try {
    // Nếu đang dùng mock data, trả về mock response
    if (USE_MOCK_DATA) {
      console.log("[MOCK MODE] Sử dụng mock data thay vì gọi API thật");
      // Simulate delay giống như gọi API thật (1-2 giây)
      // Kiểm tra abort signal trong quá trình delay
      const delay = 1000 + Math.random() * 1000;
      const startTime = Date.now();
      while (Date.now() - startTime < delay) {
        if (abortSignal?.aborted) {
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (abortSignal?.aborted) {
        return null;
      }
      const mockResponse = getMockResponse(message.content);
      return mockResponse;
    }

    // Gọi API thật
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
    // Nếu WEBHOOK_TIMEOUT = 0 thì không có timeout (chờ vô hạn)
    const axiosConfig: any = {
      headers: {
        "Content-Type": "application/json",
      },
      signal: abortSignal, // Thêm AbortSignal để hủy request
    };
    
    // Chỉ set timeout nếu giá trị > 0
    if (WEBHOOK_TIMEOUT > 0) {
      axiosConfig.timeout = WEBHOOK_TIMEOUT;
    }
    
    const response = await axios.post(N8N_WEBHOOK_URL, payload, axiosConfig);

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
    // Nếu request bị hủy, không tạo error message
    if (axios.isCancel(error) || (error instanceof Error && error.name === 'AbortError')) {
      console.log("Request đã bị hủy");
      return null;
    }

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

