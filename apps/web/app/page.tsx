import Link from 'next/link';
import { Users, BookOpen, BarChart3, ArrowRight, GraduationCap } from 'lucide-react';
import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@ris-academy/ui';
import { cn } from '@/lib/utils';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { HeroCarousel } from '@/components/shared/hero-carousel';

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
  const courses = await getFeaturedCourses();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <HeroCarousel />

        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 max-w-7xl">
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

        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 max-w-7xl">
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

        {courses.length > 0 && (
          <section className="py-20 md:py-28 bg-muted/40">
            <div className="container mx-auto px-4 max-w-7xl">
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
                      {course.thumbnail ? (
                        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-navy to-blue-700 flex items-center justify-center">
                          <GraduationCap className="h-12 w-12 text-white/60" />
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

      <Footer />
    </div>
  );
}
