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

// Region configuration for mock data
// Possible values: Africa, Asia, Europe, Latin America and the Caribbean, Northern America, Oceania
export const REGION = import.meta.env.VITE_REGION || "Asia";
export const BOSS_ID = import.meta.env.VITE_BOSS_ID || "2";

// Google Drive API configuration
// Folder ID để upload file (từ Google Drive folder URL)
// Ví dụ: https://drive.google.com/drive/folders/1Wu2quY7SGIYusK1v7JyizXKMUaHp2l3V
// Folder ID là: 1Wu2quY7SGIYusK1v7JyizXKMUaHp2l3V
export const GOOGLE_DRIVE_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || "1Wu2quY7SGIYusK1v7JyizXKMUaHp2l3V";

// Google OAuth2 Access Token để upload file
// Có thể lấy từ OAuth2 flow hoặc set từ env
export const GOOGLE_DRIVE_ACCESS_TOKEN = import.meta.env.VITE_GOOGLE_DRIVE_ACCESS_TOKEN || "";

