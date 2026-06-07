import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  hscYear: z.enum(['1st', '2nd'], { required_error: 'HSC year is required' }),
  institution: z.string().min(2, 'Institution name is required').max(200),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyOTPSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const courseCreateSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  description: z.string().optional(),
  thumbnail: z.string().url().optional().or(z.literal('')),
  subject: z.string().min(1, 'Subject is required'),
  type: z.enum(['FREE', 'PAID']),
  price: z.number().min(0).optional(),
  instructorName: z.string().optional(),
  instructorBio: z.string().optional(),
});

export const examCreateSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  chapter: z.string().optional(),
  examType: z.enum(['MCQ', 'WRITTEN']),
  totalMarks: z.number().min(1),
  passPercentage: z.number().min(0).max(100).optional(),
  timeLimit: z.number().min(1, 'Time limit is required'),
  negativeMarking: z.number().min(0).optional(),
  allowRetake: z.boolean().optional(),
  instructions: z.string().optional(),
  courseId: z.string().optional(),
});

export const questionCreateSchema = z.object({
  stem: z.string().min(1, 'Question stem is required'),
  optionA: z.string().optional(),
  optionB: z.string().optional(),
  optionC: z.string().optional(),
  optionD: z.string().optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  questionType: z.enum(['MCQ_OPTION', 'TEXT', 'FILE_UPLOAD']).default('MCQ_OPTION'),
  marks: z.number().min(0.5).default(1),
  order: z.number().min(0),
});

export const examSubmissionSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedAnswer: z.string().nullable(),
    }),
  ),
});

export const writtenSubmissionSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      content: z.string().optional(),
    }),
  ),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  institution: z.string().optional(),
  hscYear: z.enum(['1st', '2nd']).optional(),
  bio: z.string().optional(),
  image: z.string().url().optional(),
});
