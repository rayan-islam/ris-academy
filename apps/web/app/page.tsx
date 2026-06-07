import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { BookOpen, GraduationCap, Users, BarChart3, ArrowRight } from 'lucide-react';
import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@ris-academy/ui';
import { authOptions } from '@/lib/auth';
import { cn } from '@/lib/utils';

async function getFeaturedCourses() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/courses?limit=3`, { cache: 'no-store' });
    const json = await res.json();
    if (json.success) return json.data;
    return [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const courses = await getFeaturedCourses();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <GraduationCap className="h-7 w-7" />
            <span>RI&apos;s Academy</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/courses" className="text-muted-foreground hover:text-foreground transition-colors">
              Courses
            </Link>
            <Link href="/exams" className="text-muted-foreground hover:text-foreground transition-colors">
              Exams
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {!session ? (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20 md:py-32">
          <div className="container text-center max-w-4xl">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Ace Your HSC Exams with{' '}
              <span className="text-primary">RI&apos;s Academy</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Modern online learning platform for HSC students in Bangladesh. Expert-led courses,
              interactive exams, and comprehensive progress tracking to help you succeed.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={session ? '/courses' : '/signup'}>
                <Button size="lg" className="w-full sm:w-auto text-base">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/courses">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
                  Browse Courses
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-primary/5">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-primary">500+</p>
                <p className="mt-2 text-sm text-muted-foreground">Students</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary">50+</p>
                <p className="mt-2 text-sm text-muted-foreground">Courses</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary">1000+</p>
                <p className="mt-2 text-sm text-muted-foreground">Practice Questions</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary">95%</p>
                <p className="mt-2 text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything You Need to Excel
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Our platform provides all the tools and resources you need to master your HSC subjects.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Expert Instructors</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Learn from Bangladesh&apos;s top educators with years of HSC teaching experience and proven track records.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <BookOpen className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Interactive Exams</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Practice with timed MCQ and written exams that simulate real HSC test conditions and give instant feedback.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <BarChart3 className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Track Progress</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Monitor your learning journey with detailed analytics, score tracking, and personalized recommendations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Courses */}
        {courses.length > 0 && (
          <section className="py-20 md:py-28 bg-muted/40">
            <div className="container">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Featured Courses</h2>
                  <p className="mt-4 text-muted-foreground">
                    Start learning with our most popular courses
                  </p>
                </div>
                <Link href="/courses" className="hidden sm:inline-flex items-center text-sm font-medium text-primary hover:underline">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course: any) => (
                  <Link key={course.id} href={`/courses/${course.id}`}>
                    <Card className="h-full hover:shadow-md transition-shadow group">
                      {course.thumbnail && (
                        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                              course.type === 'FREE'
                                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
                                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
                            )}
                          >
                            {course.type === 'FREE' ? 'Free' : 'Paid'}
                          </span>
                          <span className="text-xs text-muted-foreground">{course.subject}</span>
                        </div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        {course.description && (
                          <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardFooter className="flex items-center justify-between">
                        {course.instructorName && (
                          <span className="text-sm text-muted-foreground">by {course.instructorName}</span>
                        )}
                        {course.type === 'PAID' && course.price > 0 && (
                          <span className="text-sm font-semibold text-primary">
                            ৳{course.price}
                          </span>
                        )}
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
              <div className="mt-8 text-center sm:hidden">
                <Link href="/courses">
                  <Button variant="outline">View All Courses</Button>
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-12 md:py-16">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 font-bold text-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span>RI&apos;s Academy</span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/courses" className="hover:text-foreground transition-colors">Courses</Link>
              <Link href="/exams" className="hover:text-foreground transition-colors">Exams</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
              <Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} RI&apos;s Academy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
