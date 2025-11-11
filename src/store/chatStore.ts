import { create } from "zustand";
// import { persist } from "zustand/middleware";
import type { Message } from "@/types/chat.type";

type ChatState = {
  messages: Message[];
  append: (message: Message) => void;
  replaceMessage: (id: string, updater: (message: Message) => Message) => void;
  removeMessage: (id: string) => void;
  clear: () => void;
};

const DEFAULT_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Xin chào! Tôi có thể hiển thị dữ liệu dạng bảng và biểu đồ. Hãy thử hỏi tôi!",
    timestamp: new Date(),
    status: "success",
    type: "text",
  },
];

// lưu trong localstorage
// export const useChatStore = create<ChatState>()(
//   persist(
//     (set, get) => ({
//       messages: DEFAULT_MESSAGES,
//       append: (message) =>
//         set((state) => ({ messages: [...state.messages, message] })),
//       replaceMessage: (id, updater) =>
//         set((state) => ({
//           messages: state.messages.map((m) => (m.id === id ? updater(m) : m)),
//         })),
//       clear: () => set({ messages: [] }),
//     }),
//     {
//       name: "chat-messages",
//       partialize: (state) => ({ messages: state.messages }),
//       version: 1,
//       // Convert Date objects when rehydrating
//       onRehydrateStorage: () => (state) => {
//         if (!state) return;
//         set((s: any) => ({
//           messages: s.messages.map((m) => ({
//             ...m,
//             timestamp: new Date(m.timestamp as unknown as string),
//           })),
//         }));
//       },
//     }
//   )
// );

// Không lưu tỏng local
export const useChatStore = create<ChatState>((set) => ({
  messages: DEFAULT_MESSAGES,
  append: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  replaceMessage: (id, updater) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? updater(m) : m)),
    })),
  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    })),
  clear: () => set({ messages: [] }),
}));
