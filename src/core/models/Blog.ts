export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  thumbnailUrl?: string;
  authorId?: string;
  authorName?: string;
  category?: string;
  tags?: string[];
  status: 'draft' | 'pending' | 'published' | 'rejected';
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export type BlogStatus = Blog['status'];
