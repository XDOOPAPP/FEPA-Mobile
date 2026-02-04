import { useCallback, useState } from 'react';
import { useBaseViewModel, ViewModelState } from './BaseViewModel';
import { blogRepository, CreateBlogDto, UpdateBlogDto, BlogListResponse } from '../repositories/BlogRepository';
import { Blog } from '../models/Blog';

export interface BlogViewModelState extends ViewModelState {
  blogs: Blog[];
  myBlogs: Blog[];
  currentBlog: Blog | null;
  hasMore: boolean;
  totalPages: number;
  currentPage: number;
}

export const useBlogViewModel = () => {
  const { state, setLoading, setError, setSuccess, clearMessages } = useBaseViewModel();
  const [blogState, setBlogState] = useState<BlogViewModelState>({
    ...state,
    blogs: [],
    myBlogs: [],
    currentBlog: null,
    hasMore: true,
    totalPages: 1,
    currentPage: 1,
  });

  const syncState = useCallback((updates: Partial<BlogViewModelState>) => {
    setBlogState(prev => ({ ...prev, ...updates }));
  }, []);

  // Get public blogs (approved/published)
  const getBlogs = useCallback(async (refresh = false, page = 1) => {
    setLoading(true);
    clearMessages();
    try {
      const data = await blogRepository.getPublicBlogs({ page, limit: 10 });
      console.log('Raw blogs from server:', data.map(b => ({ id: b.id, status: b.status })));
      
      // Filter with case-insensitive check
      const publishedData = data.filter(b => 
        b.status?.toString().toLowerCase() === 'published'
      );
      
      console.log('Filtered published blogs:', publishedData.length);

      syncState({
        blogs: refresh ? publishedData : [...blogState.blogs, ...publishedData],
        hasMore: data.length === 10,
        currentPage: page,
      });
      return publishedData;
    } catch (error: any) {
      setError(error.message || 'Failed to fetch blogs');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, clearMessages, syncState, blogState.blogs]);

  // Get my blogs (user's own blogs)
  const getMyBlogs = useCallback(async (selectedStatus?: string) => {
    setLoading(true);
    clearMessages();
    try {
      const response: BlogListResponse = await blogRepository.getMyBlogs({});
      const allMyBlogs = response.data;
      
      console.log('My blogs raw status count:', allMyBlogs.reduce((acc: any, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {}));

      const filteredBlogs = selectedStatus 
        ? allMyBlogs.filter(b => b.status?.toString().toLowerCase() === selectedStatus.toLowerCase())
        : allMyBlogs;

      syncState({
        myBlogs: filteredBlogs,
        totalPages: response.meta.totalPages,
      });
      return filteredBlogs;
    } catch (error: any) {
      setError(error.message || 'Failed to fetch your blogs');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, clearMessages, syncState]);

  // Get blog by slug
  const getBlogBySlug = useCallback(async (slug: string) => {
    setLoading(true);
    clearMessages();
    try {
      const blog = await blogRepository.getBlogBySlug(slug);
      syncState({ currentBlog: blog });
      return blog;
    } catch (error: any) {
      setError(error.message || 'Failed to fetch blog');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, clearMessages, syncState]);

  // Get blog by ID
  const getBlogById = useCallback(async (id: string) => {
    setLoading(true);
    clearMessages();
    try {
      const blog = await blogRepository.getBlogById(id);
      syncState({ currentBlog: blog });
      return blog;
    } catch (error: any) {
      setError(error.message || 'Failed to fetch blog');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, clearMessages, syncState]);

  // Create new blog
  const createBlog = useCallback(async (data: CreateBlogDto) => {
    setLoading(true);
    clearMessages();
    try {
      const blog = await blogRepository.createBlog(data);
      
      // Add to myBlogs
      syncState({
        myBlogs: [blog, ...blogState.myBlogs],
      });
      
      setSuccess('Blog đã được tạo thành công!');
      return blog;
    } catch (error: any) {
      setError(error.message || 'Failed to create blog');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setSuccess, clearMessages, syncState, blogState.myBlogs]);

  // Update blog
  const updateBlog = useCallback(async (id: string, data: UpdateBlogDto) => {
    setLoading(true);
    clearMessages();
    try {
      const blog = await blogRepository.updateBlog(id, data);
      
      // Update in myBlogs
      syncState({
        myBlogs: blogState.myBlogs.map(b => b.id === id ? blog : b),
        currentBlog: blog,
      });
      
      setSuccess('Blog đã được cập nhật!');
      return blog;
    } catch (error: any) {
      setError(error.message || 'Failed to update blog');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setSuccess, clearMessages, syncState, blogState.myBlogs]);

  // Delete blog
  const deleteBlog = useCallback(async (id: string) => {
    setLoading(true);
    clearMessages();
    try {
      await blogRepository.deleteBlog(id);
      
      // Remove from myBlogs
      syncState({
        myBlogs: blogState.myBlogs.filter(b => b.id !== id),
      });
      
      setSuccess('Blog đã được xóa!');
    } catch (error: any) {
      setError(error.message || 'Failed to delete blog');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setSuccess, clearMessages, syncState, blogState.myBlogs]);

  // Submit blog for review
  const submitForReview = useCallback(async (id: string) => {
    setLoading(true);
    clearMessages();
    try {
      const blog = await blogRepository.submitForReview(id);
      
      // Update in myBlogs
      syncState({
        myBlogs: blogState.myBlogs.map(b => b.id === id ? blog : b),
      });
      
      setSuccess('Blog đã được gửi đi chờ duyệt!');
      return blog;
    } catch (error: any) {
      setError(error.message || 'Failed to submit blog');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setSuccess, clearMessages, syncState, blogState.myBlogs]);

  // Upload image
  const uploadImage = useCallback(async (fileUri: string, mimeType?: string) => {
    try {
      const result = await blogRepository.uploadSingleImage(fileUri, mimeType);
      return result;
    } catch (error: any) {
      setError(error.message || 'Failed to upload image');
      throw error;
    }
  }, [setError]);

  // Upload multiple images
  const uploadImages = useCallback(async (fileUris: string[]) => {
    try {
      const results = await blogRepository.uploadMultipleImages(fileUris);
      return results;
    } catch (error: any) {
      setError(error.message || 'Failed to upload images');
      throw error;
    }
  }, [setError]);

  // Generate slug from title
  const generateSlug = useCallback((title: string) => {
    return blogRepository.generateSlug(title);
  }, []);

  // Clear current blog
  const clearCurrentBlog = useCallback(() => {
    syncState({ currentBlog: null });
  }, [syncState]);

  return {
    blogState,
    getBlogs,
    getMyBlogs,
    getBlogBySlug,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog,
    submitForReview,
    uploadImage,
    uploadImages,
    generateSlug,
    clearCurrentBlog,
  };
};
