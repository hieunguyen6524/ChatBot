# Hướng dẫn cấu hình Google Drive Upload

## Tổng quan

Khi người dùng gửi file hoặc ảnh:
1. File được upload lên Google Drive folder được chỉ định
2. Lấy shareable link từ Google Drive
3. Gửi link (thay vì file data) xuống n8n webhook

## Cấu hình

### 1. Tạo Google Cloud Project và kích hoạt Google Drive API

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Kích hoạt **Google Drive API**:
   - Vào "APIs & Services" > "Library"
   - Tìm "Google Drive API"
   - Click "Enable"

### 2. Tạo OAuth2 Credentials

1. Vào "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Chọn "Web application"
4. Thêm Authorized JavaScript origins:
   - `http://localhost:5173` (cho dev)
   - Domain production của bạn
5. Copy **Client ID**

### 3. Lấy Google Drive Folder ID

Từ Google Drive folder URL:
```
https://drive.google.com/drive/folders/1Wu2quY7SGIYusK1v7JyizXKMUaHp2l3V?usp=drive_link
```

Folder ID là: `1Wu2quY7SGIYusK1v7JyizXKMUaHp2l3V`

### 4. Lấy Access Token

Có 2 cách:

#### Cách 1: Sử dụng OAuth2 Playground (Khuyến nghị cho test)

1. Truy cập [OAuth2 Playground](https://developers.google.com/oauthplayground/)
2. Click "Settings" (bánh răng) > Check "Use your own OAuth credentials"
3. Nhập Client ID và Client Secret
4. Tìm "Drive API v3" > Chọn scope: `https://www.googleapis.com/auth/drive.file`
5. Click "Authorize APIs"
6. Đăng nhập và cấp quyền
7. Click "Exchange authorization code for tokens"
8. Copy **Access token**

#### Cách 2: Sử dụng Service Account (Khuyến nghị cho production)

1. Vào "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service account"
3. Tạo service account mới
4. Vào service account > "Keys" > "Add Key" > "Create new key"
5. Chọn JSON format và download file
6. Share Google Drive folder với email của service account
7. Sử dụng service account để lấy access token (cần server-side)

### 5. Cấu hình biến môi trường

Thêm vào file `.env`:

```env
# Google Drive Folder ID (từ folder URL)
VITE_GOOGLE_DRIVE_FOLDER_ID=1Wu2quY7SGIYusK1v7JyizXKMUaHp2l3V

# Google OAuth2 Access Token
VITE_GOOGLE_DRIVE_ACCESS_TOKEN=your_access_token_here
```

## Lưu ý quan trọng

1. **Access Token có thời hạn**: Token thường hết hạn sau 1 giờ. Cần refresh hoặc lấy token mới định kỳ.

2. **Quyền truy cập folder**: Google Account được dùng để lấy access token phải có quyền truy cập folder:
   - Mở Google Drive
   - Tìm folder với ID: `1Wu2quY7SGIYusK1v7JyizXKMUaHp2l3V`
   - Click chuột phải > "Share" hoặc "Chia sẻ"
   - Đảm bảo Google Account có quyền "Editor" hoặc "Viewer" + upload

3. **Scope cần thiết**: `https://www.googleapis.com/auth/drive.file`

## Format gửi đến n8n

Sau khi upload file lên Google Drive, payload gửi đến n8n sẽ có format:

```json
{
  "content": "Đã gửi file: example.pdf",
  "userRole": "manager",
  "type": "file",
  "data": {
    "name": "example.pdf",
    "size": 1024000,
    "type": "application/pdf",
    "driveLink": "https://drive.google.com/file/d/1abc123xyz/view",
    "driveFileId": "1abc123xyz"
  }
}
```

Hoặc với nhiều files:

```json
{
  "content": "Đã gửi 2 files",
  "userRole": "manager",
  "type": "text_with_files",
  "files": [
    {
      "name": "image1.png",
      "size": 512000,
      "type": "image/png",
      "driveLink": "https://drive.google.com/file/d/1abc123xyz/view",
      "driveFileId": "1abc123xyz"
    },
    {
      "name": "document.pdf",
      "size": 1024000,
      "type": "application/pdf",
      "driveLink": "https://drive.google.com/file/d/1def456uvw/view",
      "driveFileId": "1def456uvw"
    }
  ]
}
```

## Troubleshooting

### Lỗi 401: Token không hợp lệ
- Token đã hết hạn, cần lấy token mới
- Kiểm tra token đúng chưa

### Lỗi 403: Không có quyền
- Kiểm tra Google Account có quyền truy cập folder không
- Share folder với Google Account

### Lỗi 404: Folder không tồn tại
- Kiểm tra Folder ID đúng chưa
- Kiểm tra folder có tồn tại không

### File không xuất hiện trong Google Drive
- Kiểm tra quyền truy cập folder
- Kiểm tra console logs để xem File ID
- Mở link: `https://drive.google.com/file/d/{fileId}/view` để kiểm tra file

