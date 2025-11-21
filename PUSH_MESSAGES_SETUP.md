# Hướng dẫn cấu hình Push Messages từ n8n

Tài liệu này hướng dẫn cách cấu hình n8n để chủ động gửi tin nhắn đến client mà không cần request từ phía client.

## Tổng quan

Tính năng Push Messages cho phép n8n chủ động gửi tin nhắn đến client (ví dụ: nhắc nhở vào 12h đi ăn trưa). Client sẽ tự động nhận và hiển thị tin nhắn trong chat.

Hệ thống hỗ trợ 2 phương thức:
1. **Server-Sent Events (SSE)** - Real-time, hiệu quả nhất (khuyến nghị)
2. **Polling** - Client định kỳ hỏi server có tin nhắn mới không

## Cấu hình Client

### 1. Biến môi trường

Thêm vào file `.env`:

```env
# URL để nhận push messages từ n8n
# Cho SSE: URL của SSE endpoint từ n8n
# Cho Polling: URL của API endpoint trả về messages mới
VITE_N8N_PUSH_MESSAGES_URL=https://your-n8n-instance.com/api/push-messages

# Phương thức nhận push messages: "sse" hoặc "polling"
# Mặc định: "sse"
VITE_PUSH_MESSAGES_METHOD=sse

# Interval cho polling (milliseconds) - chỉ dùng khi method = "polling"
# Mặc định: 5000 (5 giây)
VITE_PUSH_MESSAGES_POLL_INTERVAL=5000
```

### 2. Ví dụ cấu hình

**Sử dụng SSE:**
```env
VITE_N8N_PUSH_MESSAGES_URL=https://your-n8n.com/api/sse/messages
VITE_PUSH_MESSAGES_METHOD=sse
```

**Sử dụng Polling:**
```env
VITE_N8N_PUSH_MESSAGES_URL=https://your-n8n.com/api/messages/new
VITE_PUSH_MESSAGES_METHOD=polling
VITE_PUSH_MESSAGES_POLL_INTERVAL=5000
```

## Cấu hình n8n

### Phương thức 1: Server-Sent Events (SSE) - Khuyến nghị

#### Bước 1: Tạo SSE Endpoint trong n8n

1. Tạo một workflow mới trong n8n
2. Thêm node **Webhook** (GET method)
3. Cấu hình:
   - **Method**: GET
   - **Path**: `/api/sse/messages` (hoặc path bạn muốn)
   - **Response Mode**: "Response Node"
   - **Response Code**: 200

4. Thêm node **Respond to Webhook**:
   - **Response Headers**:
     ```
     Content-Type: text/event-stream
     Cache-Control: no-cache
     Connection: keep-alive
     ```
   - **Response Data**: 
     ```json
     {
       "id": "{{ $json.id }}",
       "role": "assistant",
       "content": "{{ $json.content }}",
       "timestamp": "{{ $json.timestamp }}",
       "status": "success",
       "type": "text"
     }
     ```

5. Khi cần gửi push message, gửi event đến SSE connection:
   ```javascript
   // Trong n8n workflow khác, khi cần gửi push message
   // Ví dụ: vào 12h gửi nhắc nhở
   {
     "id": "msg_" + Date.now(),
     "role": "assistant",
     "content": "Đã đến 12h rồi! Đi ăn trưa thôi! 🍽️",
     "timestamp": new Date().toISOString(),
     "status": "success",
     "type": "text"
   }
   ```

#### Bước 2: Tạo Workflow gửi Push Message

1. Tạo workflow mới để gửi push message
2. Thêm node **Schedule Trigger** (ví dụ: chạy vào 12h mỗi ngày)
3. Thêm node **Function** để tạo message:
   ```javascript
   return {
     id: "msg_" + Date.now(),
     role: "assistant",
     content: "Đã đến 12h rồi! Đi ăn trưa thôi! 🍽️",
     timestamp: new Date().toISOString(),
     status: "success",
     type: "text"
   };
   ```
4. Gửi message đến SSE endpoint hoặc lưu vào database để SSE endpoint đọc

### Phương thức 2: Polling

#### Bước 1: Tạo API Endpoint trong n8n

1. Tạo workflow mới
2. Thêm node **Webhook** (GET method)
3. Cấu hình:
   - **Method**: GET
   - **Path**: `/api/messages/new`
   - **Query Parameters**: `since` (optional) - ID của message cuối cùng client đã nhận

4. Thêm node **Function** để lấy messages mới:
   ```javascript
   // Lấy messages mới hơn since (nếu có)
   const since = $input.item.json.query?.since || null;
   
   // Query database hoặc lấy từ storage
   // Ví dụ: lấy messages mới hơn since
   const newMessages = getMessagesSince(since);
   
   return {
     messages: newMessages
   };
   ```

5. Thêm node **Respond to Webhook**:
   - **Response Code**: 200
   - **Response Data**: 
     ```json
     {
       "messages": [
         {
           "id": "msg_123",
           "role": "assistant",
           "content": "Đã đến 12h rồi! Đi ăn trưa thôi! 🍽️",
           "timestamp": "2024-01-15T12:00:00.000Z",
           "status": "success",
           "type": "text"
         }
       ]
     }
     ```

#### Bước 2: Tạo Workflow gửi Push Message

1. Tạo workflow mới với **Schedule Trigger** (ví dụ: 12h mỗi ngày)
2. Thêm node **Function** để tạo message:
   ```javascript
   const message = {
     id: "msg_" + Date.now(),
     role: "assistant",
     content: "Đã đến 12h rồi! Đi ăn trưa thôi! 🍽️",
     timestamp: new Date().toISOString(),
     status: "success",
     type: "text"
   };
   
   // Lưu message vào database hoặc storage
   saveMessage(message);
   
   return message;
   ```

## Format Message

Message từ n8n phải có format sau:

```json
{
  "id": "unique_message_id",
  "role": "assistant",
  "content": "Nội dung tin nhắn",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "status": "success",
  "type": "text",
  "data": {}, // (optional, cho table/chart)
  "files": [] // (optional)
}
```

**Format tối thiểu:**
```json
{
  "content": "Nội dung tin nhắn"
}
```

## Ví dụ sử dụng

### Ví dụ 1: Nhắc nhở vào 12h

1. Tạo workflow với **Schedule Trigger** chạy vào 12h mỗi ngày
2. Thêm node **Function**:
   ```javascript
   return {
     id: "reminder_" + Date.now(),
     role: "assistant",
     content: "Đã đến 12h rồi! Đi ăn trưa thôi! 🍽️",
     timestamp: new Date().toISOString(),
     status: "success",
     type: "text"
   };
   ```
3. Gửi message đến SSE endpoint hoặc lưu vào database

### Ví dụ 2: Nhắc nhở định kỳ

1. Tạo workflow với **Schedule Trigger** chạy mỗi 30 phút
2. Kiểm tra điều kiện (ví dụ: có cuộc họp sắp tới)
3. Nếu có, gửi push message nhắc nhở

## Lưu ý

1. **SSE** hiệu quả hơn **Polling** vì real-time và giảm tải server
2. Đảm bảo message có `id` unique để tránh duplicate
3. Timestamp nên là ISO 8601 format
4. Client sẽ tự động scroll xuống khi nhận push message mới
5. Client sẽ phát âm thanh thông báo khi nhận push message (nếu browser hỗ trợ)

## Troubleshooting

### Không nhận được push messages

1. Kiểm tra `VITE_N8N_PUSH_MESSAGES_URL` đã được cấu hình đúng chưa
2. Kiểm tra console log để xem có lỗi kết nối không
3. Kiểm tra n8n workflow có chạy đúng không
4. Kiểm tra CORS settings nếu dùng SSE

### Messages bị duplicate

- Đảm bảo mỗi message có `id` unique
- Client tự động kiểm tra duplicate dựa trên `id`

### SSE không hoạt động

- Kiểm tra browser có hỗ trợ EventSource không
- Kiểm tra CORS headers từ n8n
- Thử chuyển sang polling method

