# Chat API Documentation

Tài liệu hướng dẫn sử dụng Chat API - Gửi và nhận message qua n8n Webhook

## Mục lục
1. [Tổng quan](#tổng-quan)
2. [Cấu hình](#cấu-hình)
3. [Format Message](#format-message)
4. [Gửi Message (Request)](#gửi-message-request)
5. [Nhận Message (Response)](#nhận-message-response)
6. [Xử lý File](#xử-lý-file)
7. [Xử lý Lỗi](#xử-lý-lỗi)
8. [Các loại Message](#các-loại-message)
9. [Ví dụ](#ví-dụ)
10. [Best Practices](#best-practices)

---

## Tổng quan

Chat API cho phép người dùng gửi tin nhắn đến chatbot thông qua n8n webhook và nhận phản hồi. Hệ thống hỗ trợ nhiều loại nội dung khác nhau (text, table, chart, file) với validation tự động và thông báo lỗi thân thiện.

### Tính năng chính:
- ✅ Gửi text message
- ✅ Gửi file (hình ảnh, PDF, v.v.)
- ✅ Gửi message kèm nhiều file
- ✅ Nhận response dạng text, table, chart
- ✅ Validation file size tự động
- ✅ Thông báo lỗi bằng react-hot-toast
- ✅ Hỗ trợ dark mode

**Lưu ý quan trọng:**
- Mỗi message từ user phải có trường `userRole` để xác định quyền truy cập
- Backend (n8n workflow) sẽ sử dụng `userRole` để kiểm tra quyền và cung cấp dữ liệu phù hợp
- Hiện tại `userRole` được fix cứng là `"manager"`, sau này sẽ lấy từ user context

---

## Cấu hình

### 1. Biến môi trường

Tạo file `.env` trong thư mục gốc của project với các biến sau:

```env
# URL của n8n webhook (bắt buộc)
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id

# Giới hạn số file có thể gửi trong 1 message (tùy chọn, mặc định: 5)
VITE_MAX_FILES=5

# Giới hạn dung lượng file (MB) (tùy chọn, mặc định: 10 MB)
VITE_MAX_FILE_SIZE_MB=10

# Timeout cho webhook request (milliseconds) (tùy chọn)
# 0 = không có timeout (chờ vô hạn)
# Không set = mặc định 30000 (30 giây)
# Ví dụ: VITE_WEBHOOK_TIMEOUT=60000 (60 giây)
# Ví dụ: VITE_WEBHOOK_TIMEOUT=0 (không timeout)
VITE_WEBHOOK_TIMEOUT=30000

# Region cho mock data (tùy chọn, mặc định: Asia)
# Các giá trị có thể sử dụng:
# - Africa
# - Asia
# - Europe
# - Latin America and the Caribbean
# - Northern America
# - Oceania
VITE_REGION=Asia
```

### 2. Cấu hình n8n Webhook

Trong n8n workflow:
1. Tạo Webhook node
2. Copy webhook URL
3. Đặt URL vào biến môi trường `VITE_N8N_WEBHOOK_URL`
4. Đảm bảo webhook nhận POST request với Content-Type: `application/json`

### 3. Format Request đến n8n Webhook

Webhook sẽ nhận payload dạng JSON:

```json
{
  "content": "Nội dung message",
  "userRole": "manager",
  "type": "text",
  "region": "Asia",
  "files": [], // (tùy chọn)
  "data": {} // (tùy chọn, cho file message)
}
```

### 4. Format Response từ n8n Webhook

Webhook nên trả về response dạng JSON. Hệ thống hỗ trợ nhiều format:

**Format đầy đủ (khuyến nghị):**
```json
{
  "id": "1234567890",
  "role": "assistant",
  "content": "Phản hồi từ chatbot",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "success",
  "type": "text",
  "data": {} // (nếu có)
}
```

**Format đơn giản:**
```json
{
  "content": "Phản hồi từ chatbot",
  "type": "text"
}
```

**Format với wrapper:**
```json
{
  "body": {
    "content": "Phản hồi từ chatbot",
    "type": "text"
  }
}
```

**Format array:**
```json
[
  {
    "content": "Phản hồi từ chatbot",
    "type": "text"
  }
]
```

---

## Format Message

### Cấu trúc Message cơ bản

```typescript
interface Message {
  id: string;                    // Unique ID của message
  role: "user" | "assistant";    // Vai trò: user hoặc assistant
  content: string;               // Nội dung text của message
  timestamp: Date;               // Thời gian gửi/nhận
  status: "sending" | "success" | "error";  // Trạng thái message
  type?: "text" | "table" | "chart" | "file" | "text_with_files";  // Loại message
  data?: any;                    // Dữ liệu bổ sung (cho table, chart, file)
  files?: FileData[];            // Mảng các file đính kèm
  userRole?: string;             // Role của user (chỉ có trong message từ user)
}
```

### FileData

```typescript
interface FileData {
  name: string;        // Tên file
  size: number;        // Kích thước file (bytes)
  type: string;        // MIME type (ví dụ: "image/png", "application/pdf")
  url?: string;        // URL để download file
  dataUrl?: string;    // Base64 data URL (cho preview images)
}
```

### TableData

```typescript
interface TableData {
  headers: string[];   // Mảng tên các cột
  rows: string[][];    // Mảng các hàng dữ liệu (mỗi hàng là mảng string)
}
```

### ChartData

```typescript
interface ChartData {
  type: "line" | "bar" | "pie" | "area";  // Loại biểu đồ
  data: Array<{ name: string; value: number; [key: string]: any }>;  // Dữ liệu
  xKey?: string;       // Key cho trục X (cho line/bar/area chart)
  yKeys?: string[];    // Keys cho trục Y (cho line/bar/area chart)
  title?: string;      // Tiêu đề biểu đồ
  dataKey?: string;    // Key cho dữ liệu (cho pie chart)
  nameKey?: string;    // Key cho tên (cho pie chart)
}
```

---

## Gửi Message (Request)

### 1. Gửi Text Message

**Payload gửi đến webhook:**
```json
{
  "content": "Xin chào, tôi muốn xem báo cáo doanh thu",
  "userRole": "manager",
  "type": "text",
  "region": "Asia"
}
```

**Message object trong app:**
```json
{
  "id": "1234567890",
  "role": "user",
  "content": "Xin chào, tôi muốn xem báo cáo doanh thu",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "sending",
  "type": "text",
  "userRole": "manager"
}
```

### 2. Gửi Message với File

**Payload gửi đến webhook:**
```json
{
  "content": "Đây là file báo cáo",
  "userRole": "manager",
  "type": "text_with_files",
  "region": "Asia",
  "files": [
    {
      "name": "report.pdf",
      "size": 1024000,
      "type": "application/pdf",
      "dataUrl": "data:application/pdf;base64,..."
    },
    {
      "name": "chart.png",
      "size": 512000,
      "type": "image/png",
      "dataUrl": "data:image/png;base64,..."
    }
  ]
}
```

**Lưu ý:**
- Files được convert sang base64 data URL trước khi gửi
- Images sẽ có preview trong UI
- Non-image files sẽ hiển thị icon tương ứng

### 3. Gửi chỉ File (không có text)

**Payload gửi đến webhook:**
```json
{
  "content": "Đã gửi file: document.pdf",
  "userRole": "manager",
  "type": "file",
  "region": "Asia",
  "data": {
    "name": "document.pdf",
    "size": 2048000,
    "type": "application/pdf",
    "dataUrl": "data:application/pdf;base64,..."
  }
}
```

**Lưu ý:**
- Trường `userRole` là **bắt buộc** cho tất cả message từ user
- Giá trị `userRole` phổ biến: `"manager"`, `"employee"`, `"admin"`, etc.
- Backend sẽ kiểm tra `userRole` để quyết định dữ liệu nào được phép truy cập

---

## Nhận Message (Response)

### 1. Response Text Message

**Response từ webhook:**
```json
{
  "id": "1234567892",
  "role": "assistant",
  "content": "Xin chào! Tôi có thể giúp gì cho bạn?",
  "timestamp": "2024-01-15T10:30:05.000Z",
  "status": "success",
  "type": "text"
}
```

### 2. Response Table Message

**Response từ webhook:**
```json
{
  "id": "1234567893",
  "role": "assistant",
  "content": "Đây là bảng dữ liệu bán hàng:",
  "timestamp": "2024-01-15T10:32:00.000Z",
  "status": "success",
  "type": "table",
  "data": {
    "headers": ["Tháng", "Doanh thu", "Đơn hàng", "Tăng trưởng"],
    "rows": [
      ["Tháng 1", "50M", "120", "+15%"],
      ["Tháng 2", "65M", "145", "+30%"],
      ["Tháng 3", "72M", "168", "+10%"],
      ["Tháng 4", "85M", "192", "+18%"]
    ]
  }
}
```

### 3. Response Chart Message

#### Line/Bar/Area Chart

**Response từ webhook:**
```json
{
  "id": "1234567894",
  "role": "assistant",
  "content": "Đây là biểu đồ doanh thu:",
  "timestamp": "2024-01-15T10:33:00.000Z",
  "status": "success",
  "type": "chart",
  "data": {
    "type": "line",
    "title": "Doanh thu theo tháng",
    "xKey": "name",
    "yKeys": ["revenue", "orders"],
    "data": [
      { "name": "T1", "revenue": 50, "orders": 120 },
      { "name": "T2", "revenue": 65, "orders": 145 },
      { "name": "T3", "revenue": 72, "orders": 168 },
      { "name": "T4", "revenue": 85, "orders": 192 }
    ]
  }
}
```

#### Pie Chart

**Response từ webhook:**
```json
{
  "id": "1234567895",
  "role": "assistant",
  "content": "Đây là biểu đồ tỉ lệ doanh thu theo khu vực:",
  "timestamp": "2024-01-15T10:34:00.000Z",
  "status": "success",
  "type": "chart",
  "data": {
    "type": "pie",
    "title": "Tỉ lệ doanh thu theo khu vực",
    "dataKey": "value",
    "nameKey": "name",
    "data": [
      { "name": "Miền Bắc", "value": 420 },
      { "name": "Miền Trung", "value": 260 },
      { "name": "Miền Nam", "value": 580 },
      { "name": "Tây Nguyên", "value": 190 }
    ]
  }
}
```

### 4. Response với Error

**Response từ webhook:**
```json
{
  "id": "1234567896",
  "role": "assistant",
  "content": "Xin lỗi, tôi không thể xử lý yêu cầu này. Vui lòng thử lại.",
  "timestamp": "2024-01-15T10:35:00.000Z",
  "status": "error",
  "type": "text"
}
```

**Lưu ý:**
- Response từ assistant **không có** trường `userRole`
- Trường `status` có thể là: `"sending"`, `"success"`, hoặc `"error"`
- Khi `status` là `"error"`, kiểm tra `content` để biết lý do lỗi

---

## Xử lý File

### Giới hạn File

Hệ thống tự động kiểm tra và giới hạn:

1. **Số lượng file:**
   - Mặc định: tối đa 5 file mỗi message
   - Có thể cấu hình qua `VITE_MAX_FILES` trong `.env`

2. **Dung lượng file:**
   - Mặc định: tối đa 10 MB mỗi file
   - Có thể cấu hình qua `VITE_MAX_FILE_SIZE_MB` trong `.env`
   - Đơn vị: MB

### Validation File

**Trước khi gửi:**
- Kiểm tra số lượng file: Hiển thị toast error nếu vượt quá
- Kiểm tra dung lượng: Hiển thị toast error với danh sách file vượt quá
- Tự động loại bỏ file không hợp lệ, chỉ giữ lại file hợp lệ

**Khi gửi:**
- Kiểm tra lại dung lượng file
- Hiển thị error message trong chat nếu file không hợp lệ

### Supported File Types

- **Images:** PNG, JPG, JPEG, GIF, WebP (có preview)
- **Documents:** PDF, DOC, DOCX, XLS, XLSX, etc.
- **Other:** Tất cả các file types

---

## Xử lý Lỗi

### 1. Lỗi Kết nối Webhook

**Khi không có `VITE_N8N_WEBHOOK_URL`:**
- Error message: "N8N_WEBHOOK_URL chưa được cấu hình"
- Hiển thị trong chat với status: `"error"`

**Khi webhook không phản hồi:**
- Timeout: Có thể cấu hình qua `VITE_WEBHOOK_TIMEOUT` (mặc định: 30 giây)
  - Set `VITE_WEBHOOK_TIMEOUT=0` để tắt timeout (chờ vô hạn)
  - Set giá trị khác (milliseconds) để tùy chỉnh thời gian timeout
- Error message: "Lỗi kết nối: [chi tiết lỗi]"
- Hiển thị trong chat với status: `"error"`

### 2. Lỗi File

**File quá lớn:**
- Toast error: Hiển thị danh sách file vượt quá giới hạn
- Tự động loại bỏ file không hợp lệ
- Toast success: Thông báo số file hợp lệ đã được thêm

**Quá nhiều file:**
- Toast error: "Bạn chỉ có thể gửi tối đa X file mỗi tin nhắn"
- Tự động giới hạn số file được thêm

### 3. Lỗi Response Format

**Response không đúng format:**
- Hệ thống tự động convert sang format Message
- Sử dụng giá trị mặc định cho các trường thiếu
- Log warning trong console (development mode)

### 4. Thông báo Lỗi (Toast)

Hệ thống sử dụng `react-hot-toast` để hiển thị thông báo:

- **Error toast:** Màu đỏ, icon lỗi, duration: 4000ms
- **Success toast:** Màu xanh, icon success, duration: 3000ms
- **Warning toast:** Icon warning, duration: 4000ms

**Vị trí:** Top-right corner
**Dark mode:** Tự động thích ứng với theme

---

## Các loại Message

### 1. Text Message
- **Type:** `"text"`
- **Mô tả:** Message chỉ chứa text
- **Data:** Không có
- **Files:** Không có

### 2. Table Message
- **Type:** `"table"`
- **Mô tả:** Message chứa bảng dữ liệu
- **Data:** `TableData` object
- **Files:** Không có

### 3. Chart Message
- **Type:** `"chart"`
- **Mô tả:** Message chứa biểu đồ
- **Data:** `ChartData` object
- **Files:** Không có
- **Chart types:** `"line"`, `"bar"`, `"pie"`, `"area"`

### 4. File Message
- **Type:** `"file"`
- **Mô tả:** Message chỉ chứa file (không có text)
- **Data:** `FileData` object (single file)
- **Files:** Không có (dùng `data` thay vì `files`)

### 5. Text with Files Message
- **Type:** `"text_with_files"`
- **Mô tả:** Message chứa cả text và nhiều files
- **Data:** Không có
- **Files:** Mảng `FileData[]`

---

## Ví dụ

### Ví dụ 1: Gửi text message và nhận text response

**Request đến webhook:**
```json
{
  "content": "Xin chào",
  "userRole": "manager",
  "type": "text",
  "region": "Asia"
}
```

**Response từ webhook:**
```json
{
  "id": "1234567897",
  "role": "assistant",
  "content": "Xin chào! Tôi có thể giúp gì cho bạn?",
  "timestamp": "2024-01-15T10:40:00.000Z",
  "status": "success",
  "type": "text"
}
```

### Ví dụ 2: Yêu cầu xem bảng dữ liệu

**Request đến webhook:**
```json
{
  "content": "Cho tôi xem bảng doanh thu tháng này",
  "userRole": "manager",
  "type": "text",
  "region": "Asia"
}
```

**Response từ webhook:**
```json
{
  "id": "1234567898",
  "role": "assistant",
  "content": "Đây là bảng dữ liệu bán hàng:",
  "timestamp": "2024-01-15T10:41:00.000Z",
  "status": "success",
  "type": "table",
  "data": {
    "headers": ["Tháng", "Doanh thu", "Đơn hàng", "Tăng trưởng"],
    "rows": [
      ["Tháng 1", "50M", "120", "+15%"],
      ["Tháng 2", "65M", "145", "+30%"]
    ]
  }
}
```

### Ví dụ 3: Yêu cầu xem biểu đồ

**Request đến webhook:**
```json
{
  "content": "Vẽ biểu đồ doanh thu",
  "userRole": "manager",
  "type": "text",
  "region": "Asia"
}
```

**Response từ webhook:**
```json
{
  "id": "1234567899",
  "role": "assistant",
  "content": "Đây là biểu đồ doanh thu:",
  "timestamp": "2024-01-15T10:42:00.000Z",
  "status": "success",
  "type": "chart",
  "data": {
    "type": "line",
    "title": "Doanh thu theo tháng",
    "xKey": "name",
    "yKeys": ["revenue"],
    "data": [
      { "name": "T1", "revenue": 50 },
      { "name": "T2", "revenue": 65 }
    ]
  }
}
```

### Ví dụ 4: Gửi file kèm text

**Request đến webhook:**
```json
{
  "content": "Xin xem xét file báo cáo này",
  "userRole": "manager",
  "type": "text_with_files",
  "region": "Asia",
  "files": [
    {
      "name": "report.pdf",
      "size": 1024000,
      "type": "application/pdf",
      "dataUrl": "data:application/pdf;base64,..."
    }
  ]
}
```

**Response từ webhook:**
```json
{
  "id": "1234567900",
  "role": "assistant",
  "content": "Tôi đã nhận được file báo cáo. Đang xử lý...",
  "timestamp": "2024-01-15T10:43:00.000Z",
  "status": "success",
  "type": "text"
}
```

---

## Xử lý Quyền (User Role)

### Các Role phổ biến:
- `"manager"` - Quản lý: Có quyền xem tất cả dữ liệu
- `"employee"` - Nhân viên: Chỉ xem dữ liệu của bản thân/phòng ban
- `"admin"` - Quản trị viên: Toàn quyền
- `"guest"` - Khách: Quyền hạn chế

### Backend xử lý:
1. Nhận message từ user kèm `userRole`
2. Kiểm tra quyền truy cập dựa trên `userRole`
3. Lọc dữ liệu phù hợp với quyền
4. Trả về response với dữ liệu đã được lọc

### Ví dụ xử lý quyền:

**Request từ manager:**
```json
{
  "content": "Xem báo cáo doanh thu toàn công ty",
  "userRole": "manager"
}
```
→ Response: Dữ liệu toàn công ty

**Request từ employee:**
```json
{
  "content": "Xem báo cáo doanh thu toàn công ty",
  "userRole": "employee"
}
```
→ Response: Chỉ dữ liệu của phòng ban nhân viên đó, hoặc thông báo không có quyền

---

## Status Codes

### Message Status:
- `"sending"` - Message đang được gửi/xử lý
- `"success"` - Message đã được xử lý thành công
- `"error"` - Message xử lý thất bại

### HTTP Status Codes:
- `200 OK` - Request thành công
- `400 Bad Request` - Request không hợp lệ (thiếu `userRole`, format sai, etc.)
- `401 Unauthorized` - Không có quyền truy cập
- `403 Forbidden` - `userRole` không đủ quyền
- `500 Internal Server Error` - Lỗi server
- Timeout: Có thể cấu hình qua `VITE_WEBHOOK_TIMEOUT` (mặc định: 30 giây)
  - `0` = Không có timeout (chờ vô hạn)
  - Giá trị khác = Timeout sau số milliseconds tương ứng

---

## Best Practices

1. **Luôn gửi `userRole`** trong mọi message từ user
2. **Kiểm tra `status`** trước khi hiển thị message
3. **Xử lý error** khi `status` là `"error"`
4. **Validate data** trước khi render table/chart
5. **Xử lý file size** - giới hạn kích thước file upload (cấu hình trong `.env`)
6. **Cache messages** để tránh gửi lại khi cần
7. **Handle loading state** khi `status` là `"sending"`
8. **Sử dụng toast notifications** cho feedback người dùng
9. **Kiểm tra response format** từ webhook trước khi xử lý
10. **Log errors** trong development mode để debug

### Khuyến nghị cho n8n Workflow:

1. **Response Format:** Nên trả về format Message đầy đủ với tất cả các trường
2. **Error Handling:** Trả về response với `status: "error"` khi có lỗi
3. **Timeout:** Xử lý request trong vòng 30 giây
4. **Validation:** Validate `userRole` và các trường bắt buộc
5. **File Handling:** Xử lý base64 data URL từ files array

---

## Changelog

### Version 2.1.0 (2024-01-15)
- ✅ Thêm cấu hình timeout cho webhook (có thể set trong `.env`)
- ✅ Hỗ trợ tắt timeout (set `VITE_WEBHOOK_TIMEOUT=0`)

### Version 2.0.0 (2024-01-15)
- ✅ Tích hợp n8n webhook
- ✅ Thêm giới hạn dung lượng file (có thể cấu hình)
- ✅ Thêm validation file tự động
- ✅ Sử dụng react-hot-toast cho thông báo
- ✅ Hỗ trợ dark mode cho toast
- ✅ Xử lý nhiều format response từ webhook
- ✅ Timeout 30 giây cho webhook requests (mặc định, có thể cấu hình)

### Version 1.0.0 (2024-01-15)
- Thêm trường `userRole` vào message từ user
- Hỗ trợ các loại message: text, table, chart, file, text_with_files
- Hỗ trợ multiple files trong một message

---

## Troubleshooting

### Lỗi: "N8N_WEBHOOK_URL chưa được cấu hình"
**Giải pháp:** Kiểm tra file `.env` có biến `VITE_N8N_WEBHOOK_URL` và đã restart dev server

### Lỗi: File quá lớn
**Giải pháp:** Tăng giá trị `VITE_MAX_FILE_SIZE_MB` trong `.env` hoặc giảm kích thước file

### Lỗi: Timeout
**Giải pháp:** 
- Tăng giá trị `VITE_WEBHOOK_TIMEOUT` trong `.env` (ví dụ: `60000` cho 60 giây)
- Hoặc set `VITE_WEBHOOK_TIMEOUT=0` để tắt timeout (chờ vô hạn)
- Kiểm tra n8n workflow có xử lý quá lâu
- Kiểm tra kết nối mạng

### Response không hiển thị đúng
**Giải pháp:** Kiểm tra format response từ webhook có đúng với documentation không

---

## Liên hệ

Nếu có thắc mắc hoặc cần hỗ trợ, vui lòng liên hệ team phát triển.
