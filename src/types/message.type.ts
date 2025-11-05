export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status: "sending" | "success" | "error";
}
