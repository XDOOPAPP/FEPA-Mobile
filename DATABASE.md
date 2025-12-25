# FEPA Microservices – Prisma Schema Cheatsheet (PostgreSQL)

> Copy/paste nhanh cho từng service. Mỗi service có schema riêng; giữ migrations độc lập.

## Prisma boilerplate (mọi service)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 1) auth-service

```prisma
model User {
  id            String          @id @default(uuid()) @db.Uuid
  email         String          @unique
  passwordHash  String
  fullName      String?         @db.Text
  role          String          @default("user")
  createdAt     DateTime        @default(now()) @db.Timestamptz(6)
  updatedAt     DateTime        @updatedAt @db.Timestamptz(6)

  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  tokenHash String
  expiresAt DateTime @db.Timestamptz(6)
  createdAt DateTime @default(now()) @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

**Chức năng**

- `User`: lưu thông tin tài khoản đăng nhập (email, mật khẩu băm, tên, vai trò) và thời gian tạo/cập nhật.
- `RefreshToken`: quản lý các refresh token của từng user để cấp lại access token; xoá theo user khi cần nhờ quan hệ `onDelete: Cascade`.

---

## 2) expense-service

```prisma
model Expense {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @db.Uuid
  description String
  amount      Decimal  @db.Decimal(14, 2)
  category    String?  @db.Text
  spentAt     DateTime @db.Date
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @db.Timestamptz(6)

  @@index([userId, spentAt])
}

model Category {
  slug String @id
  name String
}
```

**Chức năng**

- `Expense`: ghi nhận từng khoản chi của người dùng (mô tả, số tiền, loại, ngày chi); chỉ mục hỗ trợ truy vấn theo `userId` và `spentAt`.
- `Category`: danh mục tĩnh/tuỳ chỉnh cho các khoản chi, khoá chính là `slug`.

---

## 3) budget-service

```prisma
model Budget {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @db.Uuid
  name        String
  category    String?   @db.Text
  limitAmount Decimal   @db.Decimal(14, 2)
  startDate   DateTime? @db.Date
  endDate     DateTime? @db.Date
  createdAt   DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime  @updatedAt @db.Timestamptz(6)

  @@index([userId, category])
}
```

**Chức năng**

- `Budget`: đặt hạn mức chi cho người dùng theo danh mục và thời gian (start/end); theo dõi số tiền giới hạn và metadata thời gian tạo/cập nhật.

---

## 4) blog-service

```prisma
model Blog {
  id          String   @id @default(uuid()) @db.Uuid
  title       String
  slug        String   @unique
  content     String   @db.Text
  status      String   @default("published")
  author      String?  @db.Text
  publishedAt DateTime?
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @db.Timestamptz(6)
}
```

**Chức năng**

- `Blog`: lưu bài viết blog (tiêu đề, slug, nội dung, trạng thái, tác giả, thời gian xuất bản) phục vụ CMS/marketing.

---

## 5) subscription-service

```prisma
model Plan {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  price     Decimal  @db.Decimal(14, 2)
  interval  String
  createdAt DateTime @default(now()) @db.Timestamptz(6)

  subscriptions Subscription[]
}

model Subscription {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  planId    String   @db.Uuid
  status    String   @default("active")
  startDate DateTime @db.Date
  endDate   DateTime? @db.Date
  createdAt DateTime @default(now()) @db.Timestamptz(6)

  plan Plan @relation(fields: [planId], references: [id], onDelete: Cascade)

  @@index([userId, status])
}
```

**Chức năng**

- `Plan`: định nghĩa các gói subscription (tên, giá, chu kỳ) và danh sách đăng ký liên quan.
- `Subscription`: bản ghi đăng ký của người dùng cho từng gói; có trạng thái, ngày bắt đầu/kết thúc; chỉ mục cho truy vấn theo `userId` và `status`.

---

## 6) notification-service

```prisma
model Notification {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  title     String
  body      String   @db.Text
  type      String?  @db.Text
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now()) @db.Timestamptz(6)

  @@index([userId, isRead])
}
```

**Chức năng**

- `Notification`: lưu thông báo gửi cho người dùng (tiêu đề, nội dung, loại, trạng thái đã đọc) với chỉ mục hỗ trợ lọc theo `userId` và `isRead`.

---

## 7) ocr-service

```prisma
model OcrJob {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @db.Uuid
  status      String   @default("queued")
  fileUrl     String
  resultJson  Json?
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  completedAt DateTime @db.Timestamptz(6)?

  @@index([userId, status])
}
```

**Chức năng**

- `OcrJob`: theo dõi job OCR cho tệp người dùng (trạng thái, file URL, kết quả JSON, thời gian hoàn thành) và tra cứu theo `userId`/`status`.

---

## 8) ai-service

```prisma
model AiInsight {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String   @db.Uuid
  inputType       String
  requestPayload  Json
  responsePayload Json
  createdAt       DateTime @default(now()) @db.Timestamptz(6)

  @@index([userId, inputType])
}
```

**Chức năng**

- `AiInsight`: lưu lịch sử yêu cầu/đáp ứng AI của người dùng (loại input, payload yêu cầu/đáp ứng) để truy vết và phân tích; chỉ mục theo `userId` và `inputType`.

---

## Tips

- Dùng `@db.Timestamptz(6)` cho timestamps, `Decimal` cho tiền.
- `uuid()` trong Prisma đủ; nếu muốn DB side, dùng `@default(dbgenerated("gen_random_uuid()"))`.
- Mỗi service giữ `.env` với `DATABASE_URL` riêng; chạy `npx prisma migrate dev` trong thư mục service.
- Seed: tạo script Prisma Client theo nhu cầu (categories, plans...).
