// Environment variables configuration
export const MAX_FILES = parseInt(import.meta.env.VITE_MAX_FILES || "5", 10);
export const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || "";

// URL để nhận push messages từ n8n (SSE endpoint hoặc polling endpoint)
// Nếu không set, sẽ không kích hoạt tính năng push messages
export const N8N_PUSH_MESSAGES_URL = import.meta.env.VITE_N8N_PUSH_MESSAGES_URL || "";

// Phương thức nhận push messages: "sse" (Server-Sent Events) hoặc "polling"
// Mặc định: "sse" nếu có URL, nếu không thì "polling"
export const PUSH_MESSAGES_METHOD = import.meta.env.VITE_PUSH_MESSAGES_METHOD || "sse";

// Interval cho polling (milliseconds) - chỉ dùng khi method = "polling"
// Mặc định: 5000 (5 giây)
export const PUSH_MESSAGES_POLL_INTERVAL = parseInt(
  import.meta.env.VITE_PUSH_MESSAGES_POLL_INTERVAL || "5000",
  10
);

// Timeout cho webhook request (milliseconds)
// 0 = không có timeout (chờ vô hạn)
// Không set = mặc định 30000 (30 giây)
const timeoutEnv = import.meta.env.VITE_WEBHOOK_TIMEOUT;
export const WEBHOOK_TIMEOUT = timeoutEnv !== undefined 
  ? (timeoutEnv === "0" ? 0 : parseInt(timeoutEnv, 10) || 30000)
  : 30000;

// Mock data flag - chỉ dùng khi chỉnh UI, không gọi API thật
// Set VITE_USE_MOCK_DATA=true để dùng mock data
// Sau khi chỉnh UI xong, set về false hoặc xóa biến này
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === "true";

export const USER_ROLE = import.meta.env.VITE_USER_ROLE || "sale";

