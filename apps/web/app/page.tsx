import Link from 'next/link';
import { Users, BookOpen, BarChart3, ArrowRight, GraduationCap, Clock, FileQuestion } from 'lucide-react';
import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@ris-academy/ui';
import { cn } from '@/lib/utils';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

const SUBJECT_COLORS: Record<string, string> = {
  Physics: 'border-l-indigo-500',
  Chemistry: 'border-l-emerald-500',
  Biology: 'border-l-green-500',
  Math: 'border-l-blue-500',
  English: 'border-l-rose-500',
  ICT: 'border-l-orange-500',
  Bangla: 'border-l-red-500',
};

async function getFeaturedCourses() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/courses?limit=6`, { cache: 'no-store' });
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
        <section className="relative overflow-hidden bg-navy px-4 py-24 md:py-36">
          <div className="absolute inset-0 opacity-[0.05] flex items-center justify-center">
            <div className="h-[600px] w-[600px]" style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              background: 'hsl(40 40% 96%)',
            }} />
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            <h1 className="font-display text-display-xl text-parchment sm:text-6xl">
              Your HSC journey<br />starts here
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-parchment/60 leading-relaxed">
              Expert-led courses, interactive exams, and progress tracking — built
              for Bangladeshi students preparing for their Higher Secondary Certificate.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="bg-saffron text-white hover:bg-saffron/90 px-8">
                <Link href="/courses">
                  Browse Courses <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-parchment/20 text-parchment hover:bg-parchment/10">
                <Link href="/signup">
                  Create Free Account
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto mt-20 max-w-4xl">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-parchment/10" />
              <div className="h-3 w-3" style={{
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                background: 'hsl(31 79% 47% / 0.4)',
              }} />
              <div className="h-px flex-1 bg-parchment/10" />
            </div>
          </div>

          <div className="relative mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: '500+', label: 'Students' },
              { value: '50+', label: 'Courses' },
              { value: '1000+', label: 'Questions' },
              { value: '95%', label: 'Pass Rate' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-mono text-3xl font-bold tabular-nums text-parchment">{stat.value}</p>
                <p className="mt-1 text-sm text-parchment/40">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-parchment px-4 py-20 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="font-display text-display-md text-navy">
                Everything you need to excel
              </h2>
              <p className="mt-4 text-ink/60 leading-relaxed">
                All the tools and resources to master your HSC subjects, in one platform.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: Users,
                  title: 'Expert Instructors',
                  desc: "Learn from Bangladesh's top educators with years of HSC teaching experience.",
                },
                {
                  icon: FileQuestion,
                  title: 'Interactive Exams',
                  desc: 'Timed MCQ and written exams that simulate real HSC test conditions with instant feedback.',
                },
                {
                  icon: BarChart3,
                  title: 'Track Progress',
                  desc: 'Detailed analytics, score tracking, and personalized learning recommendations.',
                },
              ].map((feature) => (
                <div key={feature.title} className="group rounded-lg border border-stone-token bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-saffron/10">
                    <feature.icon className="h-6 w-6 text-saffron" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-navy">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink/60">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {courses.length > 0 && (
          <section className="bg-white px-4 py-20 md:py-28">
            <div className="mx-auto max-w-7xl">
              <div className="mb-12 flex items-end justify-between">
                <div>
                  <h2 className="font-display text-display-md text-navy">
                    Featured Courses
                  </h2>
                  <p className="mt-3 text-ink/60">
                    Start learning with our most popular courses
                  </p>
                </div>
                <Link href="/courses" className="hidden sm:inline-flex items-center text-sm font-medium text-saffron hover:text-saffron/80">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course: any) => {
                  const borderColor = SUBJECT_COLORS[course.subject] || 'border-l-navy';
                  return (
                    <Link key={course.id} href={`/courses/${course.id}`} className="group">
                      <Card className={cn('h-full overflow-hidden rounded-lg border-stone-token bg-parchment shadow-sm transition-shadow hover:shadow-md border-l-4', borderColor)}>
                        {course.thumbnail ? (
                          <div className="aspect-video w-full overflow-hidden bg-stone-token/50">
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video w-full flex items-center justify-center bg-navy/5">
                            <GraduationCap className="h-10 w-10 text-navy/20" />
                          </div>
                        )}
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                                course.type === 'FREE'
                                  ? 'border-verdant/20 bg-verdant/5 text-verdant'
                                  : 'border-saffron/20 bg-saffron/5 text-saffron',
                              )}
                            >
                              {course.type === 'FREE' ? 'Free' : 'Paid'}
                            </span>
                            <span className="text-xs text-ink/40">{course.subject}</span>
                          </div>
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          {course.description && (
                            <CardDescription className="line-clamp-2 text-ink/50">{course.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardFooter className="flex items-center justify-between">
                          {course.instructorName && (
                            <span className="flex items-center gap-1 text-sm text-ink/40">
                              <Users className="h-3.5 w-3.5" />
                              {course.instructorName}
                            </span>
                          )}
                          {course.type === 'PAID' && course.price > 0 && (
                            <span className="font-mono text-sm font-semibold text-saffron">
                              ৳{course.price}
                            </span>
                          )}
                        </CardFooter>
                      </Card>
                    </Link>
                  );
                })}
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
