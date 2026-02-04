export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  thumbnailUrl?: string;
  images?: string[];
  author?: string; // Tên hiển thị của tác giả
  category?: string;
  tags?: string[];
  status: 'draft' | 'pending' | 'published' | 'rejected';
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export type BlogStatus = Blog['status'];
