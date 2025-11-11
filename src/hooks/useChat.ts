import type { Message, FileData } from "@/types/chat.type";
import { useCallback, useRef, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { sendMessageToWebhook } from "@/services/chatApi";
import { USER_ROLE } from "@/config/env";



// Đọc giới hạn dung lượng file từ env (đơn vị MB), mặc định 10MB
const MAX_FILE_SIZE_MB = parseFloat(
  import.meta.env.VITE_MAX_FILE_SIZE_MB || "10"
);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // Chuyển MB sang bytes

/**
 * Kiểm tra kích thước file có vượt quá giới hạn không
 * @param file File cần kiểm tra
 * @returns true nếu file hợp lệ, false nếu vượt quá giới hạn
 */
const validateFileSize = (
  file: File
): { valid: boolean; errorMessage?: string } => {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      errorMessage: `File "${file.name}" có kích thước ${fileSizeMB} MB, vượt quá giới hạn ${MAX_FILE_SIZE_MB} MB.`,
    };
  }
  return { valid: true };
};

export const useChat = () => {
  const messages = useChatStore((s) => s.messages);
  const append = useChatStore((s) => s.append);
  const replaceMessage = useChatStore((s) => s.replaceMessage);
  const removeMessage = useChatStore((s) => s.removeMessage);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const typingMsgIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      // Hủy request trước đó nếu có
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Tạo AbortController mới
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setIsLoading(true);

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
        status: "sending",
        type: "text",
        userRole: USER_ROLE,
      };
      append(userMsg);

      // Tạo typing indicator message ngay sau khi gửi user message
      // Dùng timestamp + random để đảm bảo unique ID
      const typingMsgId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      typingMsgIdRef.current = typingMsgId;
      const typingMsg: Message = {
        id: typingMsgId,
        role: "assistant",
        content: "", // Empty content để hiển thị typing indicator
        timestamp: new Date(),
        status: "sending",
        type: "text",
      };
      append(typingMsg);

      try {
        // Cập nhật status của user message thành success
        replaceMessage(userMsg.id, (m) => ({
          ...m,
          status: "success" as const,
        }));

        // Gửi message đến n8n webhook với abort signal
        const aiMsg = await sendMessageToWebhook({
          role: "user",
          content,
          status: "sending",
          type: "text",
          userRole: USER_ROLE,
        }, abortController.signal);

        // Kiểm tra nếu request bị hủy
        if (abortController.signal.aborted) {
          // Xóa typing message nếu bị hủy
          removeMessage(typingMsgId);
          setIsLoading(false);
          typingMsgIdRef.current = null;
          return;
        }

        // Thay thế typing message bằng response thật
        if (aiMsg) {
          replaceMessage(typingMsgId, () => aiMsg);
        } else {
          // Nếu không có response, xóa typing message
          replaceMessage(typingMsgId, (m) => ({
            ...m,
            status: "error" as const,
            content: "Không nhận được phản hồi từ server.",
          }));
        }
      } catch (error) {
        // Nếu có lỗi, cập nhật status của user message thành error
        console.log(error);
        replaceMessage(userMsg.id, (m) => ({
          ...m,
          status: "error" as const,
        }));

        // Thay thế typing message bằng error message
        replaceMessage(typingMsgId, (m) => ({
          ...m,
          status: "error" as const,
          content: "Đã xảy ra lỗi khi xử lý tin nhắn. Vui lòng thử lại.",
        }));
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [append, replaceMessage, removeMessage]
  );

  const sendFile = useCallback(
    async (file: File) => {
      // Hủy request trước đó nếu có
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Tạo AbortController mới
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setIsLoading(true);

      // Kiểm tra kích thước file
      const validation = validateFileSize(file);
      if (!validation.valid) {
        // Hiển thị error message
        const errorMsg: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: validation.errorMessage || "File quá lớn.",
          timestamp: new Date(),
          status: "error",
          type: "text",
        };
        append(errorMsg);
        setIsLoading(false);
        abortControllerRef.current = null;
        return;
      }

      // Convert file to base64 for preview
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (abortController.signal.aborted) {
          setIsLoading(false);
          return;
        }

        const dataUrl = e.target?.result as string;

        const fileData: FileData = {
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: file.type.startsWith("image/") ? dataUrl : undefined,
        };

        const userMsg: Message = {
          id: Date.now().toString(),
          role: "user",
          content: `Đã gửi file: ${file.name}`,
          timestamp: new Date(),
          status: "sending",
          type: "file",
          data: fileData,
          userRole: USER_ROLE,
        };

        append(userMsg);

        // Tạo typing indicator message ngay sau khi gửi user message
        const typingMsgId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        typingMsgIdRef.current = typingMsgId;
        const typingMsg: Message = {
          id: typingMsgId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          status: "sending",
          type: "text",
        };
        append(typingMsg);

        try {
          // Cập nhật status của user message thành success
          replaceMessage(userMsg.id, (m) => ({
            ...m,
            status: "success" as const,
          }));

          // Gửi file message đến n8n webhook với abort signal
          const aiMsg = await sendMessageToWebhook({
            role: "user",
            content: `Đã gửi file: ${file.name}`,
            status: "sending",
            type: "file",
            data: fileData,
            userRole: USER_ROLE,
          }, abortController.signal);

          // Kiểm tra nếu request bị hủy
          if (abortController.signal.aborted) {
            removeMessage(typingMsgId);
            setIsLoading(false);
            abortControllerRef.current = null;
            typingMsgIdRef.current = null;
            return;
          }

          // Thay thế typing message bằng response thật
          if (aiMsg) {
            replaceMessage(typingMsgId, () => aiMsg);
          } else {
            replaceMessage(typingMsgId, (m) => ({
              ...m,
              status: "error" as const,
              content: "Không nhận được phản hồi từ server.",
            }));
          }
        } catch (error) {
          console.log(error);
          // Nếu có lỗi, cập nhật status của user message thành error
          replaceMessage(userMsg.id, (m) => ({
            ...m,
            status: "error" as const,
          }));

          // Thêm error message từ assistant
          const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Đã xảy ra lỗi khi xử lý file. Vui lòng thử lại.",
            timestamp: new Date(),
            status: "error",
            type: "text",
          };
          append(errorMsg);
        } finally {
          setIsLoading(false);
          abortControllerRef.current = null;
          typingMsgIdRef.current = null;
        }
      };

      reader.onerror = () => {
        const userMsg: Message = {
          id: Date.now().toString(),
          role: "user",
          content: `Lỗi khi đọc file: ${file.name}`,
          timestamp: new Date(),
          status: "error",
          type: "file",
          data: {
            name: file.name,
            size: file.size,
            type: file.type,
          },
          userRole: USER_ROLE,
        };
        append(userMsg);
      };

      if (file.type.startsWith("image/")) {
        reader.readAsDataURL(file);
      } else {
        // For non-image files, create message without preview
        const fileData: FileData = {
          name: file.name,
          size: file.size,
          type: file.type,
        };

        const userMsg: Message = {
          id: Date.now().toString(),
          role: "user",
          content: `Đã gửi file: ${file.name}`,
          timestamp: new Date(),
          status: "sending",
          type: "file",
          data: fileData,
          userRole: USER_ROLE,
        };

        append(userMsg);

        // Tạo typing indicator message
        const typingMsgId = (Date.now() + 1).toString();
        typingMsgIdRef.current = typingMsgId;
        const typingMsg: Message = {
          id: typingMsgId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          status: "sending",
          type: "text",
        };
        append(typingMsg);

        (async () => {
          try {
            // Cập nhật status của user message thành success
            replaceMessage(userMsg.id, (m) => ({
              ...m,
              status: "success" as const,
            }));

            // Gửi file message đến n8n webhook với abort signal
            const aiMsg = await sendMessageToWebhook({
              role: "user",
              content: `Đã gửi file: ${file.name}`,
              status: "sending",
              type: "file",
              data: fileData,
              userRole: USER_ROLE,
            }, abortController.signal);

            // Kiểm tra nếu request bị hủy
            if (abortController.signal.aborted) {
              replaceMessage(typingMsgId, (m) => ({
                ...m,
                status: "error" as const,
                content: "",
              }));
              setIsLoading(false);
              abortControllerRef.current = null;
              return;
            }

            // Thay thế typing message bằng response thật
            if (aiMsg) {
              replaceMessage(typingMsgId, () => aiMsg);
            } else {
              replaceMessage(typingMsgId, (m) => ({
                ...m,
                status: "error" as const,
                content: "Không nhận được phản hồi từ server.",
              }));
            }
          } catch (error) {
            console.log(error);
            // Nếu có lỗi, cập nhật status của user message thành error
            replaceMessage(userMsg.id, (m) => ({
              ...m,
              status: "error" as const,
            }));

            // Thay thế typing message bằng error message
            replaceMessage(typingMsgId, (m) => ({
              ...m,
              status: "error" as const,
              content: "Đã xảy ra lỗi khi xử lý file. Vui lòng thử lại.",
            }));
          } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
            typingMsgIdRef.current = null;
          }
        })();
      }
    },
    [append, replaceMessage, removeMessage]
  );

  const sendMessageWithFiles = useCallback(
    async (content: string, files: File[]) => {
      // Hủy request trước đó nếu có
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Tạo AbortController mới
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setIsLoading(true);

      // Kiểm tra kích thước của tất cả files
      const invalidFiles: { file: File; error: string }[] = [];
      files.forEach((file) => {
        const validation = validateFileSize(file);
        if (!validation.valid && validation.errorMessage) {
          invalidFiles.push({ file, error: validation.errorMessage });
        }
      });

      // Nếu có file vượt quá giới hạn, hiển thị lỗi và dừng
      if (invalidFiles.length > 0) {
        const errorMessages = invalidFiles.map((item) => item.error).join("\n");
        const errorMsg: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: errorMessages,
          timestamp: new Date(),
          status: "error",
          type: "text",
        };
        append(errorMsg);
        setIsLoading(false);
        abortControllerRef.current = null;
        return;
      }

      // Process all files to get FileData
      const processFiles = async (): Promise<FileData[]> => {
        const fileDataPromises = files.map((file): Promise<FileData> => {
          return new Promise((resolve) => {
            if (file.type.startsWith("image/")) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                resolve({
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  dataUrl,
                });
              };
              reader.onerror = () => {
                resolve({
                  name: file.name,
                  size: file.size,
                  type: file.type,
                });
              };
              reader.readAsDataURL(file);
            } else {
              resolve({
                name: file.name,
                size: file.size,
                type: file.type,
              });
            }
          });
        });
        return Promise.all(fileDataPromises);
      };

      const fileDataArray = await processFiles();

      // Determine message type and content
      const hasText = content.trim().length > 0;
      const hasFiles = fileDataArray.length > 0;
      const messageType =
        hasText && hasFiles ? "text_with_files" : hasFiles ? "file" : "text";

      // Build content message
      let messageContent = content.trim();
      if (!messageContent && hasFiles) {
        messageContent = `Đã gửi ${fileDataArray.length} file${
          fileDataArray.length > 1 ? "s" : ""
        }`;
      }

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: messageContent,
        timestamp: new Date(),
        status: "sending",
        type: messageType,
        files: hasFiles ? fileDataArray : undefined,
        userRole: USER_ROLE,
      };

      append(userMsg);

      // Tạo typing indicator message ngay sau khi gửi user message
      const typingMsgId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      typingMsgIdRef.current = typingMsgId;
      const typingMsg: Message = {
        id: typingMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        status: "sending",
        type: "text",
      };
      append(typingMsg);

      try {
        // Cập nhật status của user message thành success
        replaceMessage(userMsg.id, (m) => ({
          ...m,
          status: "success" as const,
        }));

        // Gửi message với files đến n8n webhook với abort signal
        const aiMsg = await sendMessageToWebhook({
          role: "user",
          content: messageContent,
          status: "sending",
          type: messageType,
          files: hasFiles ? fileDataArray : undefined,
          userRole: USER_ROLE,
        }, abortController.signal);

        // Kiểm tra nếu request bị hủy
        if (abortController.signal.aborted) {
          removeMessage(typingMsgId);
          setIsLoading(false);
          abortControllerRef.current = null;
          typingMsgIdRef.current = null;
          return;
        }

        // Thay thế typing message bằng response thật
        if (aiMsg) {
          replaceMessage(typingMsgId, () => aiMsg);
        } else {
          replaceMessage(typingMsgId, (m) => ({
            ...m,
            status: "error" as const,
            content: "Không nhận được phản hồi từ server.",
          }));
        }
      } catch (error) {
        console.log(error);
        // Nếu có lỗi, cập nhật status của user message thành error
        replaceMessage(userMsg.id, (m) => ({
          ...m,
          status: "error" as const,
        }));

        // Thay thế typing message bằng error message
        replaceMessage(typingMsgId, (m) => ({
          ...m,
          status: "error" as const,
          content: "Đã xảy ra lỗi khi xử lý tin nhắn. Vui lòng thử lại.",
        }));
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
        typingMsgIdRef.current = null;
      }
    },
    [append, replaceMessage, removeMessage]
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      
      // Xóa typing message nếu có
      if (typingMsgIdRef.current) {
        const messages = useChatStore.getState().messages;
        const typingMsg = messages.find(m => m.id === typingMsgIdRef.current);
        if (typingMsg && typingMsg.content === "" && typingMsg.status === "sending") {
          // Xóa typing message hoàn toàn khỏi UI
          removeMessage(typingMsgIdRef.current);
        }
        typingMsgIdRef.current = null;
      }
    }
  }, [removeMessage]);

  return { messages, sendMessage, sendFile, sendMessageWithFiles, isLoading, stop };
};
