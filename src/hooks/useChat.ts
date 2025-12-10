import type { Message, FileData } from "@/types/chat.type";
import { useCallback } from "react";
import { useChatStore } from "@/store/chatStore";
import { sendMessageToWebhook } from "@/services/chatApi";
import { uploadFileToGoogleDrive } from "@/services/googleDriveService";
import { USER_ROLE } from "@/config/env";
import {BOSS_ID} from "@/config/env";
import toast from "react-hot-toast";

const MAX_FILE_SIZE_MB = parseFloat(
  import.meta.env.VITE_MAX_FILE_SIZE_MB || "10"
);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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

  const sendMessage = useCallback(
    async (content: string) => {
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

      const typingMsgId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
        replaceMessage(userMsg.id, (m) => ({
          ...m,
          status: "success" as const,
        }));

        const aiMsg = await sendMessageToWebhook({
          role: "user",
          content,
          status: "sending",
          type: "text",
          userRole: USER_ROLE,
          bossId: BOSS_ID,
        });

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
        replaceMessage(userMsg.id, (m) => ({
          ...m,
          status: "error" as const,
        }));

        replaceMessage(typingMsgId, (m) => ({
          ...m,
          status: "error" as const,
          content: "Đã xảy ra lỗi khi xử lý tin nhắn. Vui lòng thử lại.",
        }));
      }
    },
    [append, replaceMessage]
  );

  const sendFile = useCallback(
    async (file: File) => {
      const validation = validateFileSize(file);
      if (!validation.valid) {
        const errorMsg: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: validation.errorMessage || "File quá lớn.",
          timestamp: new Date(),
          status: "error",
          type: "text",
        };
        append(errorMsg);
        return;
      }

      let driveLink: string | undefined;
      let driveFileId: string | undefined;

      try {
        toast.loading("Đang upload file lên Google Drive...", { id: "upload-file" });
        const driveResult = await uploadFileToGoogleDrive(file);
        driveLink = driveResult.webViewLink;
        driveFileId = driveResult.fileId;
        toast.success("Upload file thành công!", { id: "upload-file" });
      } catch (error) {
        console.error("[useChat] Lỗi khi upload file lên Google Drive:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Lỗi khi upload file lên Google Drive. Vui lòng thử lại.";
        toast.error(errorMessage, { id: "upload-file", duration: 5000 });
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;

        const fileData: FileData = {
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: file.type.startsWith("image/") ? dataUrl : undefined,
          driveLink: driveLink,
          driveFileId: driveFileId,
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

        const typingMsgId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
          replaceMessage(userMsg.id, (m) => ({
            ...m,
            status: "success" as const,
          }));

          const aiMsg = await sendMessageToWebhook({
            role: "user",
            content: `Đã gửi file: ${file.name}`,
            status: "sending",
            type: "file",
            data: {
              name: file.name,
              size: file.size,
              type: file.type,
              driveLink: driveLink,
              driveFileId: driveFileId,
            },
            userRole: USER_ROLE,
            bossId: BOSS_ID
          });

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
          replaceMessage(userMsg.id, (m) => ({
            ...m,
            status: "error" as const,
          }));

          const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Đã xảy ra lỗi khi xử lý file. Vui lòng thử lại.",
            timestamp: new Date(),
            status: "error",
            type: "text",
          };
          append(errorMsg);
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

        const typingMsgId = (Date.now() + 1).toString();
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
            replaceMessage(userMsg.id, (m) => ({
              ...m,
              status: "success" as const,
            }));

            const aiMsg = await sendMessageToWebhook({
              role: "user",
              content: `Đã gửi file: ${file.name}`,
              status: "sending",
              type: "file",
              data: fileData,
              userRole: USER_ROLE,
              bossId: BOSS_ID,
            });

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
            replaceMessage(userMsg.id, (m) => ({
              ...m,
              status: "error" as const,
            }));

            replaceMessage(typingMsgId, (m) => ({
              ...m,
              status: "error" as const,
              content: "Đã xảy ra lỗi khi xử lý file. Vui lòng thử lại.",
            }));
          }
        })();
      }
    },
    [append, replaceMessage]
  );

  const sendMessageWithFiles = useCallback(
    async (content: string, files: File[]) => {
      const invalidFiles: { file: File; error: string }[] = [];
      files.forEach((file) => {
        const validation = validateFileSize(file);
        if (!validation.valid && validation.errorMessage) {
          invalidFiles.push({ file, error: validation.errorMessage });
        }
      });

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
        return;
      }

      const processFiles = async (): Promise<FileData[]> => {
        toast.loading(`Đang upload ${files.length} file lên Google Drive...`, { id: "upload-files" });
        
        const fileDataPromises = files.map(async (file): Promise<FileData> => {
          let driveLink: string | undefined;
          let driveFileId: string | undefined;

          try {
            const driveResult = await uploadFileToGoogleDrive(file);
            driveLink = driveResult.webViewLink;
            driveFileId = driveResult.fileId;
          } catch (error) {
            console.error(`[useChat] Lỗi khi upload file ${file.name}:`, error);
            throw error;
          }

          if (file.type.startsWith("image/")) {
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                resolve({
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  dataUrl,
                  driveLink: driveLink,
                  driveFileId: driveFileId,
                });
              };
              reader.onerror = () => {
                resolve({
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  driveLink: driveLink,
                  driveFileId: driveFileId,
                });
              };
              reader.readAsDataURL(file);
            });
          } else {
            return {
              name: file.name,
              size: file.size,
              type: file.type,
              driveLink: driveLink,
              driveFileId: driveFileId,
            };
          }
        });

        try {
          const fileDataArray = await Promise.all(fileDataPromises);
          toast.success(`Đã upload ${fileDataArray.length} file thành công!`, { id: "upload-files" });
          return fileDataArray;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Lỗi khi upload files lên Google Drive. Vui lòng thử lại.";
          toast.error(errorMessage, { id: "upload-files", duration: 5000 });
          throw error;
        }
      };

      const fileDataArray = await processFiles();

      const hasText = content.trim().length > 0;
      const hasFiles = fileDataArray.length > 0;
      const messageType =
        hasText && hasFiles ? "text_with_files" : hasFiles ? "file" : "text";

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

      const typingMsgId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
        replaceMessage(userMsg.id, (m) => ({
          ...m,
          status: "success" as const,
        }));

        const filesForWebhook = hasFiles
          ? fileDataArray.map((f) => ({
              name: f.name,
              size: f.size,
              type: f.type,
              driveLink: f.driveLink,
              driveFileId: f.driveFileId,
            }))
          : undefined;

        const aiMsg = await sendMessageToWebhook({
          role: "user",
          content: messageContent,
          status: "sending",
          type: messageType,
          files: filesForWebhook,
          userRole: USER_ROLE,
          bossId: BOSS_ID,
        });

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
        replaceMessage(userMsg.id, (m) => ({
          ...m,
          status: "error" as const,
        }));

        replaceMessage(typingMsgId, (m) => ({
          ...m,
          status: "error" as const,
          content: "Đã xảy ra lỗi khi xử lý tin nhắn. Vui lòng thử lại.",
        }));
      }
    },
    [append, replaceMessage]
  );

  return { messages, sendMessage, sendFile, sendMessageWithFiles };
};