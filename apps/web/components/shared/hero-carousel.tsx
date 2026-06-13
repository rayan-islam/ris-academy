'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Button } from '@ris-academy/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const slides = [
  {
    title: 'Master HSC Physics',
    subtitle: 'Expert-led courses with interactive problem solving',
    gradient: 'from-indigo-600 via-indigo-700 to-purple-800',
    cta: 'Explore Physics',
    href: '/courses?subject=Physics',
  },
  {
    title: 'Ace HSC Chemistry',
    subtitle: 'Detailed video lessons covering the full syllabus',
    gradient: 'from-emerald-600 via-emerald-700 to-teal-800',
    cta: 'Explore Chemistry',
    href: '/courses?subject=Chemistry',
  },
  {
    title: 'Excel in HSC Biology',
    subtitle: 'Comprehensive courses with animated diagrams',
    gradient: 'from-green-600 via-green-700 to-lime-800',
    cta: 'Explore Biology',
    href: '/courses?subject=Biology',
  },
  {
    title: 'Conquer HSC Math',
    subtitle: 'Step-by-step problem solving and practice exams',
    gradient: 'from-blue-600 via-blue-700 to-cyan-800',
    cta: 'Explore Math',
    href: '/courses?subject=Math',
  },
];

export function HeroCarousel() {
  return (
    <section className="relative">
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        navigation
        pagination={{ clickable: true }}
        loop
        className="h-[420px] sm:h-[480px] md:h-[520px]"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.href}>
            <div
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${slide.gradient} px-6`}
            >
              <div className="text-center text-white max-w-3xl">
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                  {slide.title}
                </h1>
                <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
                  {slide.subtitle}
                </p>
                <div className="mt-8">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-gray-900 hover:bg-white/90"
                  >
                    <Link href={slide.href}>
                      {slide.cta} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
