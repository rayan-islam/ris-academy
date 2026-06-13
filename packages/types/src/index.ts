// ─── Auth ────────────────────────────────────────────────

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  hscYear: '1st' | '2nd';
  institution: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyOTPInput {
  email: string;
  otp: string;
}

// ─── Course ──────────────────────────────────────────────

export interface CourseFilters {
  subject?: string;
  type?: 'FREE' | 'PAID';
  hscYear?: '1st' | '2nd';
  search?: string;
  page?: number;
  limit?: number;
}

export interface CourseCreateInput {
  title: string;
  description?: string;
  thumbnail?: string;
  subject: string;
  type: 'FREE' | 'PAID';
  price?: number;
  instructorName?: string;
  instructorBio?: string;
}

export interface ChapterCreateInput {
  title: string;
  order: number;
}

export interface VideoCreateInput {
  title: string;
  description?: string;
  videoUrl: string;
  duration?: number;
  order: number;
}

// ─── Exam ────────────────────────────────────────────────

export interface ExamCreateInput {
  title: string;
  description?: string;
  subject: string;
  chapter?: string;
  examType: 'MCQ' | 'WRITTEN';
  totalMarks: number;
  passPercentage?: number;
  timeLimit: number;
  negativeMarking?: number;
  allowRetake?: boolean;
  instructions?: string;
  courseId?: string;
}

export interface QuestionCreateInput {
  stem: string;
  imageUrl?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  marks?: number;
  order: number;
}

export interface MCQAnswerSubmit {
  questionId: string;
  selectedAnswer: string | null;
}

export interface ExamSubmissionInput {
  answers: MCQAnswerSubmit[];
  endTime: string;
}

// ─── Exam Result ─────────────────────────────────────────

export interface ExamResult {
  attemptId: string;
  score: number;
  totalMarks: number;
  correctCount: number;
  wrongCount: number;
  unattempted: number;
  percentage: number;
  passed: boolean;
  timeTaken: number; // seconds
  status: 'COMPLETED' | 'TIMEOUT';
  rank?: number;
  totalStudents?: number;
  answers: AnswerReview[];
}

export interface AnswerReview {
  questionId: string;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  selectedAnswer: string | null;
  isCorrect: boolean;
  explanation: string | null;
}

// ─── Dashboard ───────────────────────────────────────────

export interface DashboardData {
  enrolledCourses: number;
  completedCourses: number;
  upcomingExams: number;
  averageScore: number;
  recentActivities: Activity[];
  enrolledCoursesList: EnrolledCourseSummary[];
}

export interface Activity {
  id: string;
  type: 'COURSE_PROGRESS' | 'EXAM_TAKEN' | 'COURSE_ENROLLED';
  title: string;
  description: string;
  timestamp: string;
}

export interface EnrolledCourseSummary {
  id: string;
  title: string;
  subject: string;
  progress: number;
  thumbnail: string | null;
  totalVideos: number;
  completedVideos: number;
}

// ─── API Response ────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Admin ───────────────────────────────────────────────

export interface AdminStats {
  totalStudents: number;
  totalCourses: number;
  totalExams: number;
  totalRevenue: number;
  activeStudents: number;
  recentEnrollments: number;
}
