// Environment variables configuration
export const MAX_FILES = parseInt(import.meta.env.VITE_MAX_FILES || "5", 10);
export const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || "";

