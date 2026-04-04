# 🟢 OPPO Workshop — Real-time Interactive App

Ứng dụng tương tác real-time cho Workshop OPPO với Firebase Realtime Database.

---

## 📁 Cấu trúc file

```
oppo-workshop/
├── firebase.js          ← Kết nối Firebase (thư mục gốc)
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── pages/
│   ├── _app.js
│   ├── index.js         ← Màn hình Nhân viên (điện thoại)
│   ├── host.js          ← Màn hình Máy chiếu (biểu đồ + tim bay)
│   └── admin.js         ← Màn hình Điều khiển (reset)
└── styles/
    └── globals.css
```

---

## 🚀 Cài đặt & Chạy

### Bước 1 — Tạo Firebase Project

1. Vào [https://console.firebase.google.com](https://console.firebase.google.com)
2. Tạo project mới
3. Vào **Realtime Database** → **Create database** → chọn chế độ **test mode**
4. Vào **Project Settings** → **Your apps** → Web → copy `firebaseConfig`

### Bước 2 — Điền Firebase Config

Mở file `firebase.js` và thay toàn bộ object `firebaseConfig` bằng config của bạn:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  ...
};
```

### Bước 3 — Cài dependencies & chạy local

```bash
npm install
npm run dev
```

### Bước 4 — Deploy lên Vercel

```bash
npm install -g vercel
vercel
```

---

## 🖥️ Các màn hình

| URL | Dùng cho | Thiết bị |
|-----|----------|----------|
| `/` | Nhân viên bấm tim & chọn đáp án | Điện thoại |
| `/host` | Hiển thị biểu đồ + mưa tim | Máy chiếu |
| `/admin` | Reset câu hỏi mới | Laptop Admin |

---

## ✨ Tính năng

- ❤️ **Thả tim real-time** — Nhân viên bấm → tim bay lên màn hình Host ngay lập tức
- 📊 **Biểu đồ cột live** — Cập nhật khi có phiếu bầu mới
- 🔄 **Reset sạch** — Admin reset → tất cả màn hình nhân viên tự xóa lựa chọn
- 📱 **localStorage ID** — Mỗi thiết bị chỉ bầu 1 lần, không cần đăng nhập

---

## 🔒 Firebase Rules (khuyến nghị cho production)

```json
{
  "rules": {
    "hearts": { ".read": true, ".write": true },
    "answers": { ".read": true, ".write": true },
    "session": { ".read": true, ".write": true }
  }
}
```
