import axios from "axios";
import {
  GOOGLE_DRIVE_FOLDER_ID,
  GOOGLE_DRIVE_ACCESS_TOKEN,
} from "@/config/env";

export interface GoogleDriveUploadResult {
  fileId: string;
  webViewLink: string;
  name: string;
  mimeType: string;
  size: number;
}

/**
 * Upload file lên Google Drive
 * @param file File cần upload
 * @returns Thông tin file đã upload (fileId, link, ...)
 */
export const uploadFileToGoogleDrive = async (
  file: File
): Promise<GoogleDriveUploadResult> => {
  try {
    // Kiểm tra cấu hình
    if (!GOOGLE_DRIVE_FOLDER_ID) {
      throw new Error("GOOGLE_DRIVE_FOLDER_ID chưa được cấu hình");
    }

    if (!GOOGLE_DRIVE_ACCESS_TOKEN) {
      throw new Error(
        "GOOGLE_DRIVE_ACCESS_TOKEN chưa được cấu hình. Vui lòng cấu hình trong .env"
      );
    }

    console.log("[Google Drive] Bắt đầu upload file:", file.name);
    console.log("[Google Drive] Folder ID:", GOOGLE_DRIVE_FOLDER_ID);

    // Tạo metadata
    const metadata = {
      name: file.name,
      parents: [GOOGLE_DRIVE_FOLDER_ID],
    };

    // Upload file sử dụng multipart upload
    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", file);

    console.log("[Google Drive] Đang upload file lên Google Drive...");

    const response = await axios.post(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink",
      form,
      {
        headers: {
          Authorization: `Bearer ${GOOGLE_DRIVE_ACCESS_TOKEN}`,
          "Content-Type": "multipart/related",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`[Google Drive] Upload progress: ${percentCompleted}%`);
          }
        },
      }
    );

    const fileId = response.data.id;
    let webViewLink = response.data.webViewLink;

    // Nếu chưa có webViewLink, tạo shareable link
    if (!webViewLink) {
      try {
        // Tạo permission để file có thể share
        await axios.post(
          `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
          {
            role: "reader",
            type: "anyone",
          },
          {
            headers: {
              Authorization: `Bearer ${GOOGLE_DRIVE_ACCESS_TOKEN}`,
            },
          }
        );

        // Lấy lại file info để có webViewLink
        const fileInfo = await axios.get(
          `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`,
          {
            headers: {
              Authorization: `Bearer ${GOOGLE_DRIVE_ACCESS_TOKEN}`,
            },
          }
        );

        webViewLink = fileInfo.data.webViewLink;
      } catch (error) {
        console.warn(
          "[Google Drive] Không thể tạo shareable link, sử dụng fileId:",
          error
        );
        // Fallback: tạo link từ fileId
        webViewLink = `https://drive.google.com/file/d/${fileId}/view`;
      }
    }

    console.log("[Google Drive] Upload thành công!");
    console.log("[Google Drive] File ID:", fileId);
    console.log("[Google Drive] File link:", webViewLink);

    return {
      fileId: fileId,
      webViewLink: webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
      name: response.data.name,
      mimeType: response.data.mimeType,
      size: parseInt(response.data.size || file.size.toString(), 10),
    };
  } catch (error) {
    console.error("[Google Drive] Lỗi khi upload file:", error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      
      if (status === 401) {
        throw new Error(
          "Token Google Drive không hợp lệ hoặc đã hết hạn. Vui lòng cập nhật GOOGLE_DRIVE_ACCESS_TOKEN trong .env"
        );
      }
      
      if (status === 403) {
        throw new Error(
          `Không có quyền upload file vào folder. Vui lòng kiểm tra quyền truy cập folder: ${GOOGLE_DRIVE_FOLDER_ID}`
        );
      }
      
      if (status === 404) {
        throw new Error(
          `Folder không tồn tại hoặc không có quyền truy cập. Folder ID: ${GOOGLE_DRIVE_FOLDER_ID}`
        );
      }
      
      throw new Error(
        `Lỗi khi upload file lên Google Drive: ${errorData?.error?.message || error.message}`
      );
    }
    
    throw error;
  }
};

