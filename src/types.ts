export type Role = 'ADMIN' | 'TRAINER' | 'MANAGER' | 'TRAINEE';

export interface User {
  id: number;
  name: string;
  role: Role;
  manager_id: number | null;
}

export interface Training {
  id: number;
  title: string;
  topic: string;
  date: string;
  time: string;
  venue: string;
  trainer_id: number;
  trainer_name?: string;
  status: 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  max_seats: number;
}

export interface Nomination {
  id: number;
  training_id: number;
  trainee_id: number;
  manager_id: number;
  status: 'NOMINATED' | 'APPROVED' | 'REJECTED' | 'ATTENDED';
  trainee_name?: string;
  manager_name?: string;
  title?: string;
  date?: string;
  time?: string;
  venue?: string;
  training_status?: string;
}

export interface Material {
  id: number;
  training_id: number;
  filename: string;
  original_name: string;
  mimetype: string;
  size: number;
  uploaded_by: number;
  upload_date: string;
}

export interface Feedback {
  id: number;
  training_id: number;
  trainee_id: number;
  topic_score: number;
  trainer_score: number;
  usefulness_score: number;
  comments: string;
  submitted_at: string;
  trainee_name?: string;
}

export interface Analytics {
  statusCounts: { status: string; count: number }[];
  topicScores: { topic: string; avg_topic_score: number; avg_usefulness_score: number }[];
  trainerScores: { trainer_name: string; avg_trainer_score: number }[];
  popularTopics: { topic: string; nomination_count: number }[];
}
