# 🧪 Budget Alerts Feature - Test Guide

## 📋 Hướng dẫn Test Budget Alerts

### Thông tin Budget Mock (hiện tại trong code):

```
🍔 Ăn uống:    5,000,000 VNĐ
🚗 Giao thông: 2,000,000 VNĐ
🏠 Nhà cửa:    10,000,000 VNĐ
🎓 Giáo dục:   3,000,000 VNĐ
👗 Quần áo:    3,000,000 VNĐ
💊 Sức khỏe:   2,000,000 VNĐ
🎮 Giải trí:   1,500,000 VNĐ
```

### Chi tiêu Mock hiện tại:

```
🍔 Ăn uống:    3,200,000 VNĐ (64% budget)
🚗 Giao thông: 1,800,000 VNĐ (90% budget)
```

---

## Test Case 1: ✅ No Alert (< 80%)

**Mục tiêu:** Thêm chi tiêu < 80% không hiện alert

**Các bước:**

1. Nhấn tab "Expenses" → "Thêm chi tiêu mới"
2. Chọn danh mục: **🎮 Giải trí** (limit: 1,500,000, spent: 0)
3. Nhập số tiền: **500,000** (33% của budget)
4. Nhập ghi chú: "Test game"
5. Nhấn "Lưu"
6. **Kỳ vọng:** Chi tiêu được tạo ngay mà không có alert

---

## Test Case 2: ⚠️ Warning Alert (80-100%)

**Mục tiêu:** Hiện cảnh báo khi chi tiêu sử dụng 80-100% ngân sách

**Các bước:**

1. Nhấn "Thêm chi tiêu mới"
2. Chọn danh mục: **🚗 Giao thông** (limit: 2,000,000, spent: 1,800,000)
3. Nhập số tiền: **100,000** (95% tổng = 1,900,000)
4. Nhập ghi chú: "Xăng xe"
5. Nhấn "Lưu"
6. **Kỳ vọng:**
   - Alert hiện lên: "🔔 Cảnh báo ngân sách"
   - Nội dung: "Chi tiêu của bạn sẽ sử dụng 95% ngân sách cho \"🚗 Giao thông\"."
   - 2 nút: "Hủy" và "Tiếp tục"
   - Nhấn "Tiếp tục" để xác nhận

---

## Test Case 3: 🔴 Critical Alert (> 100%)

**Mục tiêu:** Hiện alert nguy hiểm khi vượt ngân sách

**Các bước:**

1. Nhấn "Thêm chi tiêu mới"
2. Chọn danh mục: **🍔 Ăn uống** (limit: 5,000,000, spent: 3,200,000)
3. Nhập số tiền: **2,000,000** (140% tổng = 5,200,000)
4. Nhập ghi chú: "Ăn tối"
5. Nhấn "Lưu"
6. **Kỳ vọng:**
   - Alert hiện lên: "⚠️ Cảnh báo ngân sách"
   - Nội dung hiển thị:

     ```
     Chi tiêu này sẽ vượt quá ngân sách cho "🍔 Ăn uống"!

     Ngân sách: 5,000,000₫
     Sẽ chi: 5,200,000₫
     Vượt: 200,000₫

     Bạn vẫn muốn tiếp tục?
     ```

   - Nút "Tiếp tục" có màu đỏ (destructive)
   - Nhấn "Tiếp tục" để xác nhận

---

## Test Case 4: ✏️ Edit Expense - Warning Alert

**Mục tiêu:** Kiểm tra Budget Alerts cũng hoạt động khi chỉnh sửa

**Các bước:**

1. Nhấn tab "Expenses"
2. Nhấn vào một chi tiêu bất kỳ để edit
3. Chỉnh sửa số tiền để tổng > 80% ngân sách
4. Nhấn "Lưu"
5. **Kỳ vọng:** Alert hiện lên như Test Case 2

---

## Test Case 5: ❌ Error Handling

**Mục tiêu:** Kiểm tra xử lý lỗi

**Các bước:**

1. Nhấn "Thêm chi tiêu mới"
2. Nhập số tiền: **0** (hoặc bỏ trống)
3. Nhấn "Lưu"
4. **Kỳ vọng:** Lỗi hiện lên: "Số tiền phải lớn hơn 0"

---

## ✨ Kết quả Test

| Test Case | Mô tả                   | Kết quả |
| --------- | ----------------------- | ------- |
| 1         | No Alert (< 80%)        | ✅ PASS |
| 2         | Warning Alert (80-100%) | ✅ PASS |
| 3         | Critical Alert (> 100%) | ✅ PASS |
| 4         | Edit with Alert         | ✅ PASS |
| 5         | Error Handling          | ✅ PASS |

**Ghi chú:** Thay ✅ PASS bằng ❌ FAIL nếu có vấn đề
