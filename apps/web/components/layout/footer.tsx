import Link from 'next/link';

const SOCIAL_LINKS = [
  {
    href: 'https://facebook.com/',
    label: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    href: 'https://youtube.com/',
    label: 'YouTube',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="bg-navy-dark">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <img src="/ris_academy_emblem.svg" alt="RI's Academy" className="h-10 w-auto" />
              <span className="font-display text-xl font-bold text-parchment">RI&apos;s Academy</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-parchment/60">
              A modern online learning platform for HSC students in Bangladesh.
              Expert-led courses, interactive exams, and comprehensive progress
              tracking to help you succeed in your academic journey.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-parchment/20 text-parchment/60 transition-colors hover:border-saffron hover:text-saffron"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-parchment">Navigate</h5>
            <ul className="mt-4 space-y-3">
              {[
                { href: '/courses', label: 'Browse Courses' },
                { href: '/exams', label: 'Practice Exams' },
                { href: '/dashboard', label: 'Dashboard' },
                { href: '/login', label: 'Sign In' },
                { href: '/signup', label: 'Get Started' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-parchment/60 transition-colors hover:text-saffron"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-parchment">Contact</h5>
            <ul className="mt-4 space-y-3 text-sm text-parchment/60">
              <li>
                <a href="mailto:rayan.islam.2586@gmail.com" className="transition-colors hover:text-saffron">
                  rayan.islam.2586@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:01923381801" className="transition-colors hover:text-saffron">
                  01923381801
                </a>
              </li>
              <li className="pt-4">
                <p className="text-xs leading-relaxed text-parchment/40">
                  All course materials and content on this platform are the
                  intellectual property of RI&apos;s Academy.
                </p>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-parchment/10 pt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-xs text-parchment/40">
            &copy; {new Date().getFullYear()} RI&apos;s Academy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
