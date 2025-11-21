import { useEffect, useRef } from "react";
import { pushMessagesService, type PushMessageCallback } from "@/services/pushMessagesService";
import { useChatStore } from "@/store/chatStore";
import type { Message } from "@/types/chat.type";

/**
 * Hook để nhận push messages từ n8n
 * Tự động kết nối khi component mount và ngắt kết nối khi unmount
 */
export const usePushMessages = (enabled: boolean = true) => {
  const append = useChatStore((s) => s.append);
  const callbackRef = useRef<PushMessageCallback | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Tạo callback để xử lý message mới
    const handlePushMessage: PushMessageCallback = (message: Message) => {
      // Kiểm tra xem message đã tồn tại chưa (tránh duplicate)
      const existingMessages = useChatStore.getState().messages;
      const exists = existingMessages.some((m) => m.id === message.id);
      
      if (!exists) {
        console.log("[Push Messages] Nhận được message mới từ n8n:", message);
        append(message);
        
        // Phát âm thanh thông báo (nếu browser hỗ trợ và user đã tương tác với trang)
        try {
          // Chỉ phát âm thanh nếu user đã tương tác với trang (tránh autoplay policy)
          if (document.hasFocus()) {
            // Tạo một beep sound đơn giản
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = "sine";
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
          }
        } catch (error) {
          // Ignore audio errors (có thể do browser không hỗ trợ hoặc autoplay policy)
          console.debug("[Push Messages] Không thể phát âm thanh thông báo:", error);
        }
      }
    };

    callbackRef.current = handlePushMessage;

    // Kết nối và nhận cleanup function
    const disconnect = pushMessagesService.connect(handlePushMessage);

    // Cleanup khi unmount
    return () => {
      disconnect();
    };
  }, [enabled, append]);
};

