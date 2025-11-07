// Environment variables configuration
export const MAX_FILES = parseInt(import.meta.env.VITE_MAX_FILES || "5", 10);
export const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || "";

// Timeout cho webhook request (milliseconds)
// 0 = không có timeout (chờ vô hạn)
// Không set = mặc định 30000 (30 giây)
const timeoutEnv = import.meta.env.VITE_WEBHOOK_TIMEOUT;
export const WEBHOOK_TIMEOUT = timeoutEnv !== undefined 
  ? (timeoutEnv === "0" ? 0 : parseInt(timeoutEnv, 10) || 30000)
  : 30000;

