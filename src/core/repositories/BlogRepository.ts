import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { axiosInstance } from '../../api/axiosInstance';
import { API_ENDPOINTS, API_BASE_URL } from '../../constants/api';
import { Blog } from '../models/Blog';
import RNFS from 'react-native-fs';
import { uploadToCloudinary } from '../../config/cloudinary';

export interface CreateBlogDto {
  title: string;
  slug: string;
  content: string;
  thumbnailUrl?: string;
  images?: string[];
  author?: string;
  category?: string;
  status: 'draft' | 'pending';
}

export interface UpdateBlogDto {
  title?: string;
  content?: string;
  thumbnailUrl?: string;
  images?: string[];
  author?: string;
  category?: string;
  status?: 'draft' | 'pending';
}

export interface BlogListResponse {
  data: Blog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class BlogRepository {
  private apiClient = axiosInstance;

  private unwrapResponse<T>(payload: any): T {
    if (!payload) return payload;
    if (payload.data && typeof payload.data === 'object' && 'data' in payload.data) {
        return payload.data.data as T;
    }
    if (payload.data && Array.isArray(payload.data)) {
        return payload.data as T;
    }
    if (payload.data !== undefined) {
        return payload.data as T;
    }
    return payload as T;
  }

  private handleError(error: any): never {
    if (error.response) {
      throw new Error(error.response.data?.message || `Lỗi từ Server: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('Lỗi kết nối. Vui lòng kiểm tra mạng của bạn.');
    }
    throw error;
  }

  async getPublicBlogs(params?: any): Promise<Blog[]> {
    try {
      const queryParams = { ...params };
      if (queryParams.page === 1) delete queryParams.page;
      if (queryParams.limit === 10) delete queryParams.limit;
      const response = await this.apiClient.get(API_ENDPOINTS.GET_BLOGS, { params: queryParams });
      return this.unwrapResponse<Blog[]>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getMyBlogs(params?: any): Promise<BlogListResponse> {
    try {
      const queryParams = { ...params };
      if (queryParams.page === 1) delete queryParams.page;
      if (queryParams.limit === 10) delete queryParams.limit;
      const response = await this.apiClient.get(API_ENDPOINTS.GET_MY_BLOGS, { params: queryParams });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getBlogBySlug(slug: string): Promise<Blog> {
    try {
      const response = await this.apiClient.get(API_ENDPOINTS.GET_BLOG_SLUG(slug));
      return this.unwrapResponse<Blog>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getBlogById(id: string): Promise<Blog> {
    try {
      const response = await this.apiClient.get(API_ENDPOINTS.GET_BLOG_BY_ID(id));
      return this.unwrapResponse<Blog>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async createBlog(data: CreateBlogDto): Promise<Blog> {
    try {
      const response = await this.apiClient.post(API_ENDPOINTS.CREATE_BLOG, data);
      return this.unwrapResponse<Blog>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateBlog(id: string, data: UpdateBlogDto): Promise<Blog> {
    try {
      const response = await this.apiClient.patch(API_ENDPOINTS.UPDATE_BLOG(id), data);
      return this.unwrapResponse<Blog>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async deleteBlog(id: string): Promise<void> {
    try {
      await this.apiClient.delete(API_ENDPOINTS.DELETE_BLOG(id));
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async submitForReview(id: string): Promise<Blog> {
    try {
      const response = await this.apiClient.post(API_ENDPOINTS.SUBMIT_BLOG(id));
      return this.unwrapResponse<Blog>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload image - DIRECT TO CLOUDINARY (Bypass Server Network Issues)
   */
  async uploadSingleImage(fileUri: string, mimeType: string = 'image/jpeg'): Promise<{ url: string; publicId: string }> {
    console.log('[BlogRepo] === DIRECT CLOUDINARY UPLOAD ===', fileUri);
    try {
      const secureUrl = await uploadToCloudinary(fileUri, mimeType);
      // Với direct upload, ta có thể không lấy được publicId ngay, trả về null hoặc tách từ URL
      return { 
        url: secureUrl, 
        publicId: secureUrl.split('/').pop()?.split('.')[0] || 'unknown' 
      };
    } catch (error) {
      console.error('[BlogRepo] Cloudinary Direct Error:', error);
      throw error;
    }
  }

  async uploadMultipleImages(uris: string[]): Promise<{ url: string; publicId: string }[]> {
    const promises = uris.map(u => this.uploadSingleImage(u));
    return Promise.all(promises);
  }

  generateSlug(title: string): string {
    const base = title.toLowerCase()
      .trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${base}-${suffix}`;
  }
}

export const blogRepository = new BlogRepository();

