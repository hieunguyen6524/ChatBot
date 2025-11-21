import type { Message } from "@/types/chat.type";
import {
  N8N_PUSH_MESSAGES_URL,
  PUSH_MESSAGES_METHOD,
  PUSH_MESSAGES_POLL_INTERVAL,
  USE_MOCK_DATA,
} from "@/config/env";

export type PushMessageCallback = (message: Message) => void;

/**
 * Service để nhận push messages từ n8n
 * Hỗ trợ 2 phương thức: SSE (Server-Sent Events) và Polling
 */
class PushMessagesService {
  private eventSource: EventSource | null = null;
  private pollingInterval: number | null = null;
  private callbacks: Set<PushMessageCallback> = new Set();
  private lastMessageId: string | null = null;
  private isConnected: boolean = false;

  /**
   * Kết nối và bắt đầu nhận push messages
   */
  connect(onMessage: PushMessageCallback): () => void {
    // Thêm callback
    this.callbacks.add(onMessage);

    // Nếu đã kết nối, không cần kết nối lại
    if (this.isConnected) {
      return () => this.disconnect(onMessage);
    }

    // Nếu không có URL, không kết nối
    if (!N8N_PUSH_MESSAGES_URL) {
      console.warn(
        "[Push Messages] N8N_PUSH_MESSAGES_URL chưa được cấu hình. Tính năng push messages sẽ không hoạt động."
      );
      return () => this.disconnect(onMessage);
    }

    // Nếu đang dùng mock data, không kết nối
    if (USE_MOCK_DATA) {
      console.log("[Push Messages] Mock mode - không kết nối push messages");
      return () => this.disconnect(onMessage);
    }

    this.isConnected = true;

    if (PUSH_MESSAGES_METHOD === "sse") {
      this.connectSSE();
    } else {
      this.connectPolling();
    }

    return () => this.disconnect(onMessage);
  }

  /**
   * Kết nối bằng Server-Sent Events (SSE)
   */
  private connectSSE() {
    try {
      this.eventSource = new EventSource(N8N_PUSH_MESSAGES_URL);

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const message = this.parseMessage(data);
          if (message) {
            this.notifyCallbacks(message);
          }
        } catch (error) {
          console.error("[Push Messages] Lỗi khi parse message từ SSE:", error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error("[Push Messages] Lỗi kết nối SSE:", error);
        // Tự động reconnect sau 5 giây
        setTimeout(() => {
          if (this.isConnected && !this.eventSource) {
            this.connectSSE();
          }
        }, 5000);
      };

      this.eventSource.onopen = () => {
        console.log("[Push Messages] Đã kết nối SSE thành công");
      };
    } catch (error) {
      console.error("[Push Messages] Lỗi khi tạo EventSource:", error);
      this.isConnected = false;
    }
  }

  /**
   * Kết nối bằng Polling
   */
  private connectPolling() {
    const poll = async () => {
      try {
        // Gửi request để lấy messages mới
        // N8N endpoint nên trả về messages mới hơn lastMessageId
        const url = new URL(N8N_PUSH_MESSAGES_URL);
        if (this.lastMessageId) {
          url.searchParams.append("since", this.lastMessageId);
        }

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Xử lý response - có thể là array hoặc single message
        const messages = Array.isArray(data) ? data : data.messages || [data];
        
        for (const msgData of messages) {
          const message = this.parseMessage(msgData);
          if (message) {
            this.lastMessageId = message.id;
            this.notifyCallbacks(message);
          }
        }
      } catch (error) {
        console.error("[Push Messages] Lỗi khi polling:", error);
      }
    };

    // Poll ngay lập tức
    poll();

    // Sau đó poll theo interval
    this.pollingInterval = window.setInterval(poll, PUSH_MESSAGES_POLL_INTERVAL);
  }

  /**
   * Parse data từ n8n thành Message object
   */
  private parseMessage(data: any): Message | null {
    try {
      // Nếu đã có format Message đầy đủ
      if (data.id && data.role) {
        return {
          id: data.id || Date.now().toString(),
          role: data.role || "assistant",
          content: data.content || "",
          timestamp: data.timestamp
            ? new Date(data.timestamp)
            : new Date(),
          status: data.status || "success",
          type: data.type || "text",
          data: data.data,
          files: data.files,
        };
      }

      // Nếu có content hoặc message
      if (data.content || data.message) {
        return {
          id: data.id || Date.now().toString(),
          role: "assistant",
          content: data.content || data.message || "",
          timestamp: data.timestamp
            ? new Date(data.timestamp)
            : new Date(),
          status: data.status || "success",
          type: data.type || "text",
          data: data.data,
          files: data.files,
        };
      }

      // Nếu không có format hợp lệ
      console.warn("[Push Messages] Không thể parse message:", data);
      return null;
    } catch (error) {
      console.error("[Push Messages] Lỗi khi parse message:", error);
      return null;
    }
  }

  /**
   * Thông báo tất cả callbacks về message mới
   */
  private notifyCallbacks(message: Message) {
    this.callbacks.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {
        console.error("[Push Messages] Lỗi trong callback:", error);
      }
    });
  }

  /**
   * Ngắt kết nối
   */
  disconnect(callback?: PushMessageCallback) {
    if (callback) {
      this.callbacks.delete(callback);
    }

    // Nếu không còn callback nào, đóng kết nối
    if (this.callbacks.size === 0) {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      if (this.pollingInterval !== null) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }

      this.isConnected = false;
      this.lastMessageId = null;
      console.log("[Push Messages] Đã ngắt kết nối");
    }
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const pushMessagesService = new PushMessagesService();

