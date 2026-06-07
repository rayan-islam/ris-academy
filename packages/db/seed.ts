import { PrismaClient, Role, CourseType, ExamType, Difficulty, NotifType, PaymentMethod, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.mCQAnswer.deleteMany();
  await prisma.writtenSubmission.deleteMany();
  await prisma.examAttempt.deleteMany();
  await prisma.question.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.videoProgress.deleteMany();
  await prisma.video.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.material.deleteMany();
  await prisma.questionBank.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.course.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create users
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@risacademy.com',
      password: hashedPassword,
      role: Role.ADMIN,
      hscYear: '2nd',
      institution: "RI's Academy",
      phone: '01700000000',
    },
  });

  const teacher = await prisma.user.create({
    data: {
      name: 'Rahim Sir',
      email: 'rahim@risacademy.com',
      password: hashedPassword,
      role: Role.TEACHER,
      hscYear: null,
      institution: "RI's Academy",
      bio: 'Physics teacher with 10 years of experience',
    },
  });

  const student1 = await prisma.user.create({
    data: {
      name: 'Karim Ahmed',
      email: 'karim@example.com',
      password: hashedPassword,
      role: Role.STUDENT,
      hscYear: '2nd',
      institution: 'Notre Dame College',
      phone: '01711111111',
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: 'Fatema Akhter',
      email: 'fatema@example.com',
      password: hashedPassword,
      role: Role.STUDENT,
      hscYear: '1st',
      institution: 'Viqarunnisa Noon College',
    },
  });

  // Create courses
  const physics = await prisma.course.create({
    data: {
      title: 'HSC Physics - Complete Course',
      description: 'Master HSC Physics with comprehensive video lessons covering all chapters from Newton\'s Laws to Modern Physics. Includes practice problems and exam tips.',
      subject: 'Physics',
      type: CourseType.FREE,
      instructorName: 'Rahim Sir',
      instructorBio: 'Physics teacher with 10 years of experience at Notre Dame College',
      isPublished: true,
    },
  });

  const chemistry = await prisma.course.create({
    data: {
      title: 'HSC Chemistry - Organic & Inorganic',
      description: 'Complete HSC Chemistry course covering organic and inorganic chemistry topics with detailed explanation and problem solving.',
      subject: 'Chemistry',
      type: CourseType.FREE,
      instructorName: 'Dr. Karim',
      instructorBio: 'PhD in Chemistry, BUET',
      isPublished: true,
    },
  });

  const math = await prisma.course.create({
    data: {
      title: 'HSC Higher Math - Full Syllabus',
      description: 'Covers full HSC Higher Math syllabus including calculus, vectors, matrices, and probability.',
      subject: 'Math',
      type: CourseType.PAID,
      price: 500,
      instructorName: 'Ahmed Sir',
      instructorBio: 'Mathematics lecturer with 8 years experience',
      isPublished: true,
    },
  });

  const english = await prisma.course.create({
    data: {
      title: 'HSC English - Grammar & Composition',
      description: 'Master English grammar, composition, and essay writing for HSC exam.',
      subject: 'English',
      type: CourseType.FREE,
      instructorName: 'Ms. Sarah',
      instructorBio: 'English literature professor',
      isPublished: true,
    },
  });

  // Create chapters for Physics course
  const chapter1 = await prisma.chapter.create({
    data: { title: 'Chapter 1: Physical World and Measurement', order: 1, courseId: physics.id },
  });
  const chapter2 = await prisma.chapter.create({
    data: { title: 'Chapter 2: Vectors', order: 2, courseId: physics.id },
  });
  const chapter3 = await prisma.chapter.create({
    data: { title: 'Chapter 3: Newton\'s Laws of Motion', order: 3, courseId: physics.id },
  });

  // Videos for Physics
  await prisma.video.createMany({
    data: [
      { title: 'Introduction to Physics', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 600, order: 1, chapterId: chapter1.id, isPublished: true },
      { title: 'Units and Measurement', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 900, order: 2, chapterId: chapter1.id, isPublished: true },
      { title: 'Error Analysis', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 720, order: 3, chapterId: chapter1.id, isPublished: true },
      { title: 'Introduction to Vectors', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 540, order: 1, chapterId: chapter2.id, isPublished: true },
      { title: 'Vector Addition and Subtraction', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 660, order: 2, chapterId: chapter2.id, isPublished: true },
      { title: 'Dot Product and Cross Product', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 780, order: 3, chapterId: chapter2.id, isPublished: true },
      { title: 'Newton\'s First Law', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 480, order: 1, chapterId: chapter3.id, isPublished: true },
      { title: 'Newton\'s Second Law - F=ma', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 720, order: 2, chapterId: chapter3.id, isPublished: true },
    ],
  });

  // Chapters for Chemistry
  const chemCh1 = await prisma.chapter.create({
    data: { title: 'Chapter 1: Atomic Structure', order: 1, courseId: chemistry.id },
  });

  await prisma.video.createMany({
    data: [
      { title: 'Discovery of Electron', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 600, order: 1, chapterId: chemCh1.id, isPublished: true },
      { title: 'Rutherford\'s Atomic Model', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 540, order: 2, chapterId: chemCh1.id, isPublished: true },
    ],
  });

  // Enroll students
  await prisma.enrollment.createMany({
    data: [
      { userId: student1.id, courseId: physics.id, progress: 60 },
      { userId: student1.id, courseId: chemistry.id, progress: 30 },
      { userId: student2.id, courseId: physics.id, progress: 20 },
      { userId: student2.id, courseId: english.id, progress: 0 },
    ],
  });

  // Create MCQ Exam
  const exam1 = await prisma.exam.create({
    data: {
      title: 'Physics - Newton\'s Laws MCQ Test',
      description: 'Test your understanding of Newton\'s Laws of Motion',
      subject: 'Physics',
      chapter: 'Newton\'s Laws of Motion',
      examType: ExamType.MCQ,
      totalMarks: 20,
      passPercentage: 40,
      timeLimit: 30,
      negativeMarking: 0.25,
      allowRetake: true,
      instructions: 'Read each question carefully. Each question carries 1 mark. Wrong answers will deduct 0.25 marks. You have 30 minutes.',
      courseId: physics.id,
      isPublished: true,
    },
  });

  // Questions for Exam
  const q1 = await prisma.question.create({
    data: {
      examId: exam1.id,
      stem: 'A force of 10N acts on a body of mass 2 kg. What is the acceleration?',
      optionA: '2 m/s²',
      optionB: '5 m/s²',
      optionC: '10 m/s²',
      optionD: '20 m/s²',
      correctAnswer: 'B',
      explanation: 'Using F = ma, we get a = F/m = 10/2 = 5 m/s²',
      difficulty: Difficulty.EASY,
      marks: 1,
      order: 1,
    },
  });

  await prisma.question.create({
    data: {
      examId: exam1.id,
      stem: 'Which of the following is Newton\'s First Law?',
      optionA: 'F = ma',
      optionB: 'For every action, there is an equal and opposite reaction',
      optionC: 'An object at rest stays at rest unless acted upon by a force',
      optionD: 'Momentum is always conserved',
      correctAnswer: 'C',
      explanation: 'Newton\'s First Law states that an object maintains its state of rest or uniform motion unless acted upon by an external force.',
      difficulty: Difficulty.EASY,
      marks: 1,
      order: 2,
    },
  });

  await prisma.question.create({
    data: {
      examId: exam1.id,
      stem: 'A car of mass 1000 kg accelerates from 0 to 20 m/s in 10 seconds. What is the force applied?',
      optionA: '1000 N',
      optionB: '2000 N',
      optionC: '500 N',
      optionD: '100 N',
      correctAnswer: 'B',
      explanation: 'a = 2 m/s², F = ma = 1000 × 2 = 2000 N',
      difficulty: Difficulty.MEDIUM,
      marks: 1,
      order: 3,
    },
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      { userId: student1.id, title: 'Welcome to RI\'s Academy!', message: 'Start exploring courses and exams to boost your HSC preparation.', type: NotifType.GENERAL, read: false },
      { userId: student1.id, title: 'New Course Available', message: 'HSC Higher Math course is now available. Enroll now!', type: NotifType.COURSE_NEW, read: false },
      { userId: student2.id, title: 'Welcome to RI\'s Academy!', message: 'Start exploring courses and exams to boost your HSC preparation.', type: NotifType.GENERAL, read: true },
    ],
  });

  // Phase 2: Written Exam
  const writtenExam = await prisma.exam.create({
    data: {
      title: 'Physics - Newton\'s Laws Written Test',
      description: 'Written examination covering Newton\'s Laws of Motion. Answer all questions in detail.',
      subject: 'Physics',
      chapter: 'Newton\'s Laws of Motion',
      examType: ExamType.WRITTEN,
      totalMarks: 30,
      passPercentage: 33,
      timeLimit: 60,
      allowRetake: true,
      instructions: 'Answer all questions. Draw diagrams where necessary. You can type your answers or upload a PDF of your handwritten answer script.',
      courseId: physics.id,
      isPublished: true,
    },
  });

  // Written exam questions (text type)
  await prisma.question.createMany({
    data: [
      {
        examId: writtenExam.id,
        stem: 'State Newton\'s three laws of motion. Provide one real-life example for each law.',
        questionType: 'TEXT',
        marks: 10,
        order: 1,
        difficulty: Difficulty.EASY,
      },
      {
        examId: writtenExam.id,
        stem: 'A block of mass 5 kg is placed on a frictionless inclined plane at an angle of 30°. Calculate the acceleration of the block down the plane and the normal force acting on it.',
        questionType: 'TEXT',
        marks: 10,
        order: 2,
        difficulty: Difficulty.MEDIUM,
      },
      {
        examId: writtenExam.id,
        stem: 'Explain the concept of inertia with examples from daily life. How does mass affect inertia?',
        questionType: 'TEXT',
        marks: 10,
        order: 3,
        difficulty: Difficulty.EASY,
      },
    ],
  });

  // Phase 2: Sample Payment
  await prisma.payment.create({
    data: {
      userId: student1.id,
      courseId: math.id,
      amount: 500,
      currency: 'BDT',
      method: PaymentMethod.SSLCOMMERZ,
      status: PaymentStatus.COMPLETED,
      transactionId: 'TRX-DEMO-12345',
      createdAt: new Date(),
    },
  });

  // Enroll student1 in paid math course
  await prisma.enrollment.create({
    data: {
      userId: student1.id,
      courseId: math.id,
      progress: 0,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📋 Demo Accounts:');
  console.log('  Admin:   admin@risacademy.com / password123');
  console.log('  Teacher: rahim@risacademy.com / password123');
  console.log('  Student: karim@example.com / password123');
  console.log('  Student: fatema@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
