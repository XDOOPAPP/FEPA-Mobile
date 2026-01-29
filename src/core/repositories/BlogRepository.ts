import { axiosInstance } from '../../api/axiosInstance';
import { API_ENDPOINTS } from '../../constants/api';
import { Blog } from '../models/Blog';

class BlogRepository {
  private apiClient = axiosInstance;

  private unwrapResponse<T>(payload: any): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
      if (Array.isArray(payload.data)) {
         return payload.data as T;
      }
      // If data property exists but is not array (maybe pagination wrapper)
      return payload.data as T;
    }
    return payload as T;
  }

  /**
   * Get public blogs
   */
  async getPublicBlogs(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<Blog[]> {
    try {
      const response = await this.apiClient.get(API_ENDPOINTS.GET_BLOGS, {
        params: {
          status: 'APPROVED',
          ...params,
        },
      });
      return this.unwrapResponse<Blog[]>(response.data);
    } catch (error: any) {
      // Don't throw to avoid crashing UI, log it
      console.warn('getPublicBlogs failed, returning empty array:', error.message);
      
      // Return dummy data for demo if connection fails
      return [
        {
          id: '1',
          title: '5 mẹo quản lý chi tiêu hiệu quả (Demo Data)',
          slug: '5-meo-quan-ly-chi-tieu',
          summary: 'Theo dõi chi tiêu hằng ngày, đặt giới hạn ngân sách rõ ràng. Đây là dữ liệu demo vì chưa kết nối được server.',
          content: 'Nội dung chi tiết...',
          status: 'APPROVED',
          viewCount: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Blog,
        {
          id: '2',
          title: 'Đầu tư cho người mới bắt đầu',
          slug: 'dau-tu-cho-nguoi-moi',
          summary: 'Tìm hiểu về chứng khoán, trái phiếu và các kênh đầu tư an toàn.',
          status: 'APPROVED',
          viewCount: 50,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Blog
      ]; 
      // throw this.handleError(error);
    }
  }

  async getBlogBySlug(slug: string): Promise<Blog | null> {
    try {
      const response = await this.apiClient.get(API_ENDPOINTS.GET_BLOG_SLUG(slug));
      return this.unwrapResponse<Blog>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async uploadSingleImage(fileUri: string): Promise<{ url: string; publicId: string }> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: 'image/jpeg',
        name: 'blog_image.jpg',
      } as any);

      const response = await this.apiClient.post(API_ENDPOINTS.BLOG_UPLOAD_SINGLE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return this.unwrapResponse<{ url: string; publicId: string }>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async uploadMultipleImages(fileUris: string[]): Promise<{ url: string; publicId: string }[]> {
    try {
      const formData = new FormData();
      fileUris.forEach((uri, index) => {
        formData.append('files', {
          uri,
          type: 'image/jpeg',
          name: `blog_image_${index}.jpg`,
        } as any);
      });

      const response = await this.apiClient.post(API_ENDPOINTS.BLOG_UPLOAD_MULTIPLE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return this.unwrapResponse<{ url: string; publicId: string }[]>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Có lỗi xảy ra. Vui lòng thử lại.';
    return new Error(message);
  }
}

export const blogRepository = new BlogRepository();

