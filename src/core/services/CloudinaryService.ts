/**
 * CloudinaryService - Bản chuẩn dùng Base64 để tránh lỗi Network trên Android
 */

const CLOUDINARY_CLOUD_NAME = 'dvwnd1eiz';
const CLOUDINARY_UPLOAD_PRESET = 'fepa_avatar'; // Bạn hãy tạo preset này (Unsigned) sau cũng được, hiện tại nó sẽ gửi theo yêu cầu

export interface CloudinaryUploadResult {
  secure_url: string;
}

class CloudinaryService {
  /**
   * Upload ảnh lên Cloudinary bằng Base64 (Cực kỳ ổn định trên Android)
   */
  async uploadImageBase64(base64Data: string): Promise<CloudinaryUploadResult> {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    // Đảm bảo định dạng data:image/jpeg;base64,...
    const file = base64Data.startsWith('data:') ? base64Data : `data:image/jpeg;base64,${base64Data}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: file,
          upload_preset: CLOUDINARY_UPLOAD_PRESET,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Nếu bạn chưa tạo preset, nó sẽ báo ở đây (ví dụ: "Upload preset not found")
        // Nhưng lỗi này KHÔNG phải là lỗi "Network request failed"
        throw new Error(data.error?.message || 'Không thể upload lên Cloudinary');
      }

      return {
        secure_url: data.secure_url,
      };
    } catch (error: any) {
      console.error('[Cloudinary] Error:', error);
      throw error;
    }
  }
}

export const cloudinaryService = new CloudinaryService();
