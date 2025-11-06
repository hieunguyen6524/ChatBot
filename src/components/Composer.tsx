import { Paperclip, Send, X, File } from "lucide-react";
import { useCallback, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VoiceControls from "./VoiceControls";
import { MAX_FILES } from "@/config/env";

type ComposerProps = {
  onSend: (content: string) => void;
  onSendMessageWithFiles?: (content: string, files: File[]) => void;
  onOpenVoice: () => void;
  voiceTranscript?: string; // Transcript từ voice để hiển thị trong input
  onVoiceTranscriptProcessed?: () => void; // Callback khi đã xử lý transcript
};

interface FileWithPreview {
  file: File;
  preview: string | null;
}

function Composer({ onSend, onSendMessageWithFiles, onOpenVoice, voiceTranscript, onVoiceTranscriptProcessed }: ComposerProps) {
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý transcript từ voice
  useEffect(() => {
    if (voiceTranscript && voiceTranscript.trim()) {
      setInput(voiceTranscript.trim());
      // Auto focus và resize textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
      }
      // Notify parent đã xử lý transcript
      if (onVoiceTranscriptProcessed) {
        onVoiceTranscriptProcessed();
      }
    }
  }, [voiceTranscript, onVoiceTranscriptProcessed]);

  const handleSend = useCallback(() => {
    const hasText = input.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;
    
    if (hasText || hasFiles) {
      // Gửi text và files trong cùng 1 message
      if (hasFiles && onSendMessageWithFiles) {
        const files = selectedFiles.map(f => f.file);
        onSendMessageWithFiles(input.trim(), files);
      } else if (hasText) {
        // Chỉ gửi text nếu không có file
        onSend(input.trim());
      }
      
      // Reset
      setInput("");
      setSelectedFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [input, selectedFiles, onSend, onSendMessageWithFiles]);

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

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check giới hạn số file
    const currentCount = selectedFiles.length;
    const remainingSlots = MAX_FILES - currentCount;

    if (remainingSlots <= 0) {
      alert(`Bạn chỉ có thể gửi tối đa ${MAX_FILES} file mỗi tin nhắn.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Lấy số file có thể thêm (không vượt quá giới hạn)
    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    
    if (filesToAdd.length < files.length) {
      alert(`Bạn chỉ có thể thêm tối đa ${remainingSlots} file nữa (tổng tối đa ${MAX_FILES} file).`);
    }

    // Process files để tạo preview
    const processFiles = filesToAdd.map((file): Promise<FileWithPreview> => {
      return new Promise((resolve) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              file,
              preview: event.target?.result as string,
            });
          };
          reader.onerror = () => {
            resolve({
              file,
              preview: null,
            });
          };
          reader.readAsDataURL(file);
        } else {
          resolve({
            file,
            preview: null,
          });
        }
      });
    });

    Promise.all(processFiles).then((filePreviews) => {
      setSelectedFiles((prev) => [...prev, ...filePreviews]);
    });

    // Reset input để có thể chọn lại file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [selectedFiles.length]);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <div className="flex items-end gap-2">
        <div className="flex-1 flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-3xl px-4 py-2">
          {/* <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <Smile className="w-5 h-5 text-gray-500" />
          </button> */}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-transparent resize-none outline-none max-h-[200px] py-1 text-gray-900 dark:text-gray-100 placeholder-gray-500"
            rows={1}
          />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Chọn file"
          />
          <button
            onClick={handleFileButtonClick}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Đính kèm file"
          >
            <Paperclip className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <VoiceControls onOpenVoice={onOpenVoice} />

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={!input.trim() && selectedFiles.length === 0}
          className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Gửi tin nhắn"
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </div>
      
      {/* Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">
            <span className="font-medium">
              {selectedFiles.length} / {MAX_FILES} file{selectedFiles.length > 1 ? "s" : ""}
            </span>
            <button
              onClick={() => {
                setSelectedFiles([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors text-xs font-medium"
            >
              Xóa tất cả
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <AnimatePresence mode="popLayout">
              {selectedFiles.map((fileWithPreview, index) => (
                <motion.div
                  key={`${fileWithPreview.file.name}-${index}`}
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 20 }}
                  className="relative flex-shrink-0 group"
                >
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                    {fileWithPreview.preview ? (
                      <img
                        src={fileWithPreview.preview}
                        alt={fileWithPreview.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                        <File className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 hover:bg-red-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                      aria-label="Xóa file"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <div className="mt-1.5 w-20">
                    <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate text-center leading-tight">
                      {fileWithPreview.file.name}
                    </p>
                    <p className="text-[9px] text-gray-500 dark:text-gray-500 text-center mt-0.5">
                      {fileWithPreview.file.size < 1024 
                        ? `${fileWithPreview.file.size} B`
                        : fileWithPreview.file.size < 1024 * 1024
                        ? `${(fileWithPreview.file.size / 1024).toFixed(1)} KB`
                        : `${(fileWithPreview.file.size / (1024 * 1024)).toFixed(1)} MB`}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

export default Composer;
