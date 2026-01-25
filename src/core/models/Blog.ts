export interface Blog {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  thumbnailUrl?: string;
  authorId?: string;
  authorName?: string;
  category?: string;
  tags?: string[];
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export type BlogStatus = Blog['status'];
