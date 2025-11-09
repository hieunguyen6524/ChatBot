import type { Message } from "@/types/chat.type";

/**
 * Mock data cho UI development
 * File này chỉ dùng khi VITE_USE_MOCK_DATA=true
 * Sau khi chỉnh UI xong, xóa file này và set VITE_USE_MOCK_DATA=false
 */

// Mock responses cho các loại message khác nhau (không có id và timestamp, sẽ được tạo động)
type MockResponseTemplate = Omit<Message, "id" | "timestamp">;

const mockResponses: Record<string, MockResponseTemplate> = {
  // Text message mẫu
  text: {
    role: "assistant",
    content: "Đây là phản hồi text mẫu từ chatbot. Bạn có thể chỉnh sửa nội dung này để test UI.",
    status: "success",
    type: "text",
  },

  // Table message mẫu
  table: {
    role: "assistant",
    content: "Bảng dữ liệu doanh thu tháng này:",
    status: "success",
    type: "table",
    data: {
      title: "Báo cáo doanh thu",
      headers: ["Tháng", "Doanh thu", "Lợi nhuận", "Chi phí"],
      rows: [
        ["Tháng 1", "10,000,000", "2,000,000", "8,000,000"],
        ["Tháng 2", "12,500,000", "2,500,000", "10,000,000"],
        ["Tháng 3", "15,000,000", "3,000,000", "12,000,000"],
        ["Tháng 4", "18,000,000", "3,600,000", "14,400,000"],
        ["Tháng 5", "20,000,000", "4,000,000", "16,000,000"],
      ],
    },
  },

  // Chart message mẫu - Line chart
  chart_line: {
    role: "assistant",
    content: "Biểu đồ xu hướng doanh thu theo tháng:",
    status: "success",
    type: "chart",
    data: {
      type: "line",
      title: "Xu hướng doanh thu",
      data: [
        { name: "Tháng 1", value: 10000000 },
        { name: "Tháng 2", value: 12500000 },
        { name: "Tháng 3", value: 15000000 },
        { name: "Tháng 4", value: 18000000 },
        { name: "Tháng 5", value: 20000000 },
      ],
      xKey: "name",
      yKeys: ["value"],
    },
  },

  // Chart message mẫu - Bar chart
  chart_bar: {
    role: "assistant",
    content: "Biểu đồ cột so sánh doanh thu:",
    status: "success",
    type: "chart",
    data: {
      type: "bar",
      title: "So sánh doanh thu",
      data: [
        { name: "Q1", value: 37500000 },
        { name: "Q2", value: 45000000 },
        { name: "Q3", value: 52000000 },
        { name: "Q4", value: 60000000 },
      ],
      xKey: "name",
      yKeys: ["value"],
    },
  },

  // Chart message mẫu - Pie chart
  chart_pie: {
    role: "assistant",
    content: "Phân bố doanh thu theo khu vực:",
    status: "success",
    type: "chart",
    data: {
      type: "pie",
      title: "Phân bố doanh thu",
      data: [
        { name: "Miền Bắc", value: 40000000 },
        { name: "Miền Trung", value: 30000000 },
        { name: "Miền Nam", value: 50000000 },
      ],
    },
  },

  // File message mẫu
  file: {
    role: "assistant",
    content: "Đây là file được gửi từ chatbot:",
    status: "success",
    type: "text_with_files",
    files: [
      {
        name: "bao-cao-doanh-thu.pdf",
        size: 1024 * 500, // 500 KB
        type: "application/pdf",
        url: "#",
      },
      {
        name: "bieu-do-doanh-thu.png",
        size: 1024 * 200, // 200 KB
        type: "image/png",
        dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      },
    ],
  },

  // Long text message để test scroll
  long_text: {
    role: "assistant",
    content: `Đây là một đoạn text dài để test UI khi message có nhiều dòng. 

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.`,
    status: "success",
    type: "text",
  },
};

/**
 * Lấy mock response dựa trên keyword trong message content
 */
export const getMockResponse = (userMessage: string): Message => {
  const lowerContent = userMessage.toLowerCase();
  const now = Date.now();
  const timestamp = new Date();

  // Kiểm tra keyword để trả về response phù hợp
  let template: MockResponseTemplate;
  
  if (lowerContent.includes("bảng") || lowerContent.includes("table")) {
    template = mockResponses.table;
  } else if (lowerContent.includes("biểu đồ") || lowerContent.includes("chart")) {
    if (lowerContent.includes("pie") || lowerContent.includes("tròn")) {
      template = mockResponses.chart_pie;
    } else if (lowerContent.includes("bar") || lowerContent.includes("cột")) {
      template = mockResponses.chart_bar;
    } else {
      template = mockResponses.chart_line;
    }
  } else if (lowerContent.includes("file") || lowerContent.includes("tệp")) {
    template = mockResponses.file;
  } else if (lowerContent.includes("dài") || lowerContent.includes("long")) {
    template = mockResponses.long_text;
  } else {
    template = mockResponses.text;
  }

  // Tạo message với id và timestamp mới
  return {
    ...template,
    id: (now + 1).toString(),
    timestamp,
  };
};

/**
 * Simulate API delay (giống như gọi API thật)
 */
export const simulateDelay = (ms: number = 1000): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

