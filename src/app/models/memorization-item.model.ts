export interface MemorizationItem {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  lastPracticed?: Date;
  accuracy?: number;
} 