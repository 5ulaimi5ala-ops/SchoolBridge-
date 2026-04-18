
export type Role = 'student' | 'teacher' | 'parent';

export type Language = 'en' | 'ar';

export type RiskLevel = 'low' | 'medium' | 'high';

export type Mood = 'happy' | 'neutral' | 'sad' | 'stressed';

export interface User {
  id: string;
  email: string;
  password?: string;
  role: Role;
  name: string;
  classId?: string; // For students and teachers
  studentEmail?: string; // For parents, to link to their child
  onboarded?: boolean; // For teachers
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  subjects: string[]; // List of subject IDs from OMANI_SUBJECTS
  students: { email: string, userId?: string }[];
  parents: { email: string, studentEmail: string, userId?: string }[];
}

export interface Subject {
  id: string;
  name: string;
  progress: number;
  score: number;
  risk: RiskLevel;
  lastImprovement?: number; 
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: string;
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  riskLevel: RiskLevel;
  issueSummary: string;
  attendance: number;
  missingTasks: string[];
  recentScores: number[];
  subjects: Subject[];
  // Gamification
  points: number;
  level: number;
  badges: Badge[];
  // Emotional Check-in
  currentMood?: Mood;
  moodHistory: { date: string, mood: Mood }[];
  // Peer Support
  strengths: string[];
  weaknesses: string[];
  isPeerMentor: boolean;
  // Study Plan
  studyPlan?: StudyPlan;
}

export interface StudyPlan {
  id: string;
  title: string;
  tasks: {
    id: string;
    title: string;
    type: 'video' | 'practice' | 'reading';
    completed: boolean;
    duration: string;
  }[];
}

export interface TeacherNote {
  id: string;
  date: string;
  text: string;
  category: 'academic' | 'behavioral' | 'emotional';
}

export interface HelpRequest {
  id: string;
  studentId: string;
  subject: string;
  message: string;
  timestamp: string;
  isAnonymous: boolean;
  status: 'pending' | 'resolved';
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface DiscussionQuestion {
  id: string;
  text: string;
  authorId?: string; // Optional for anonymous
  isAnonymous: boolean;
  timestamp: string;
  replies: { id: string, text: string, authorName: string, timestamp: string }[];
}
