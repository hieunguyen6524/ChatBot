import { Paperclip, Send, Smile } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import VoiceControls from "./VoiceControls";

type ComposerProps = {
  onSend: (content: string) => void;
  onOpenVoice: () => void;
};

function Composer({ onSend, onOpenVoice }: ComposerProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (input.trim()) {
      onSend(input.trim());
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [input, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <div className="flex items-end gap-2">
        <div className="flex-1 flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-3xl px-4 py-2">
          <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <Smile className="w-5 h-5 text-gray-500" />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-transparent resize-none outline-none max-h-[200px] py-1 text-gray-900 dark:text-gray-100 placeholder-gray-500"
            rows={1}
          />

          <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <Paperclip className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <VoiceControls onOpenVoice={onOpenVoice} />

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={!input.trim()}
          className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Gửi tin nhắn"
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}

export default Composer;
