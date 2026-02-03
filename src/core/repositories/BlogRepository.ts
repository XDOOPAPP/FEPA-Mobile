import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios'; // Direct axios for upload
import { axiosInstance } from '../../api/axiosInstance';
import { API_ENDPOINTS, API_BASE_URL } from '../../constants/api';
import { Blog } from '../models/Blog';

export interface CreateBlogDto {
  title: string;
  slug: string;
  content: string;
  thumbnailUrl?: string;
  images?: string[];
  author?: string;
  status?: 'draft' | 'pending';
}

export interface UpdateBlogDto {
  title?: string;
  content?: string;
  thumbnailUrl?: string;
  images?: string[];
  author?: string;
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
    if (payload && typeof payload === 'object' && 'data' in payload) {
      // @ts-ignore
      return payload.data as T;
    }
    return payload as T;
  }

  private handleError(error: any): never {
    if (error.response) {
      throw new Error(error.response.data?.message || `Server Error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('Network Error. Please check your connection.');
    }
    throw error;
  }

  /**
   * Get public blogs (approved/published)
   */
  async getPublicBlogs(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<Blog[]> {
    try {
      const queryParams: any = { ...params };
      if (queryParams.page === 1) delete queryParams.page;
      if (queryParams.limit === 10) delete queryParams.limit;

      const response = await this.apiClient.get(API_ENDPOINTS.GET_BLOGS, {
        params: queryParams,
      });
      return this.unwrapResponse<Blog[]>(response.data);
    } catch (error: any) {
      console.error('getPublicBlogs error:', error.response?.data || error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Get my blogs (requires auth)
   */
  async getMyBlogs(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<BlogListResponse> {
    try {
      const queryParams: any = { ...params };
      queryParams.page = params?.page ? Number(params.page) : 1;
      queryParams.limit = params?.limit ? Number(params.limit) : 10;
      
      if (queryParams.page === 1) delete queryParams.page;
      if (queryParams.limit === 10) delete queryParams.limit;
      
      const response = await this.apiClient.get(API_ENDPOINTS.GET_MY_BLOGS, {
        params: queryParams,
      });
      return response.data;
    } catch (error: any) {
      console.error('getMyBlogs error:', error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Get blog by slug
   */
  async getBlogBySlug(slug: string): Promise<Blog | null> {
    try {
      const response = await this.apiClient.get(API_ENDPOINTS.GET_BLOG_SLUG(slug));
      return this.unwrapResponse<Blog>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get blog by ID
   */
  async getBlogById(id: string): Promise<Blog | null> {
    try {
      const response = await this.apiClient.get(API_ENDPOINTS.GET_BLOG_BY_ID(id));
      return this.unwrapResponse<Blog>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Create new blog
   */
  async createBlog(data: CreateBlogDto): Promise<Blog> {
    try {
      const response = await this.apiClient.post(API_ENDPOINTS.CREATE_BLOG, data);
      return this.unwrapResponse<Blog>(response.data);
    } catch (error: any) {
      console.error('createBlog error:', error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Update blog (draft only)
   */
  async updateBlog(id: string, data: UpdateBlogDto): Promise<Blog> {
    try {
      const response = await this.apiClient.patch(API_ENDPOINTS.UPDATE_BLOG(id), data);
      return this.unwrapResponse<Blog>(response.data);
    } catch (error: any) {
      console.error('updateBlog error:', error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Delete blog
   */
  async deleteBlog(id: string): Promise<void> {
    try {
      await this.apiClient.delete(API_ENDPOINTS.DELETE_BLOG(id));
    } catch (error: any) {
      console.error('deleteBlog error:', error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Submit blog for review (draft -> pending)
   */
  async submitForReview(id: string): Promise<Blog> {
    try {
      const response = await this.apiClient.post(API_ENDPOINTS.SUBMIT_BLOG(id));
      return this.unwrapResponse<Blog>(response.data);
    } catch (error: any) {
      console.error('submitForReview error:', error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Upload single image for blog (Using reliable XMLHttpRequest like OCR)
   */
  async uploadSingleImage(fileUri: string): Promise<{ url: string; publicId: string }> {
    try {
      console.log('[BlogRepo] Uploading single image via XHR:', fileUri);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) console.warn('[BlogRepo] No token found for upload!');

      let finalUri = fileUri;
      if (Platform.OS === 'android') {
        if (!finalUri.startsWith('content://') && !finalUri.startsWith('file://')) {
          finalUri = `file://${finalUri}`;
        }
      } else if (Platform.OS === 'ios') {
        if (finalUri.startsWith('file://')) {
          finalUri = finalUri.replace('file://', '');
        }
      }

      // Infer mime type
      const isPng = finalUri.toLowerCase().endsWith('.png');
      const type = isPng ? 'image/png' : 'image/jpeg';
      let name = finalUri.split('/').pop();
      if (!name || !name.includes('.')) {
         name = `upload_${Date.now()}.${isPng ? 'png' : 'jpg'}`;
      }

      console.log(`[BlogRepo] Uploading via Direct AXIOS... Name: ${name}, Type: ${type}`);

      const formData = new FormData();
      formData.append('file', {
        uri: finalUri,
        type,
        name,
      } as any);

      // Bypass axiosInstance interceptors using clean axios
      // This avoids interference with token refresh or other interceptors on upload stream
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.BLOG_UPLOAD_SINGLE}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          // 'Content-Type': 'multipart/form-data', // DO NOT SET THIS
        },
        // transformRequest: (data) => data, // REMOVE THIS too, let axios decide
        timeout: 120000, 
      });

      console.log('[BlogRepo] Axios Success. Status:', response.status);
      return this.unwrapResponse<{ url: string; publicId: string }>(response.data);

    } catch (error: any) {
      console.error('[BlogRepo] Upload Error:', error.message);
      if (error.response) {
         console.error('[BlogRepo] Server Body:', error.response.data);
         throw new Error(`Server Error: ${error.response.status}`);
      } else if (error.request) {
         console.error('[BlogRepo] No response. Network/Timeout.');
         throw new Error('Network error. Upload sent but no response.');
      }
      throw error;
    }
  }

  async uploadMultipleImages(fileUris: string[]): Promise<{ url: string; publicId: string }[]> {
     // TODO: Implement multiple upload loop or batch endpoint
     const results = [];
     for (const uri of fileUris) {
         results.push(await this.uploadSingleImage(uri));
     }
     return results;
  }

  generateSlug(title: string): string {
    return title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }
}

export const blogRepository = new BlogRepository();
