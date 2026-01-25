import { useCallback, useState } from 'react';
import { useBaseViewModel, ViewModelState } from './BaseViewModel';
import { blogRepository } from '../repositories/BlogRepository';
import { Blog } from '../models/Blog';

export interface BlogViewModelState extends ViewModelState {
  blogs: Blog[];
  currentBlog: Blog | null;
  hasMore: boolean;
}

export const useBlogViewModel = () => {
  const { state, setLoading, setError, clearMessages } = useBaseViewModel();
  const [blogState, setBlogState] = useState<BlogViewModelState>({
    ...state,
    blogs: [],
    currentBlog: null,
    hasMore: true,
  });

  const syncState = useCallback((updates: Partial<BlogViewModelState>) => {
    setBlogState(prev => ({ ...prev, ...updates }));
  }, []);

  const getBlogs = useCallback(async (refresh = false) => {
    setLoading(true);
    clearMessages();
    try {
      // Logic for pagination can be added here
      const data = await blogRepository.getPublicBlogs({});
      
      syncState({
        blogs: data, // Replace for now, usually append if pagination
      });
      return data;
    } catch (error: any) {
      setError(error.message || 'Failed to fetch blogs');
      // Use dummy data if fail (For Demo purpose)
      /*
      syncState({
        blogs: [
           { id: '1', title: '5 mẹo quản lý chi tiêu (Demo)', summary: 'Demo content when API fails', status: 'APPROVED' } as Blog
        ]
      });
      */
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, clearMessages, syncState]);

  return {
    blogState,
    getBlogs,
  };
};
