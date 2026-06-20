'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  Users,
  DollarSign,
  Bell,
  Database,
  FolderOpen,
  ChevronLeft,
  UserCircle,
} from 'lucide-react';
import { Button } from '@ris-academy/ui';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'MAIN',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      { href: '/admin/courses', label: 'Courses', icon: BookOpen },
      { href: '/admin/exams', label: 'Exams', icon: FileQuestion },
      { href: '/admin/question-bank', label: 'Question Bank', icon: Database },
    ],
  },
  {
    title: 'USERS',
    items: [
      { href: '/admin/students', label: 'Users', icon: Users },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      { href: '/admin/payments', label: 'Payments', icon: DollarSign },
    ],
  },
  {
    title: 'OTHER',
    items: [
      { href: '/admin/materials', label: 'Materials', icon: FolderOpen },
      { href: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') return pathname === '/admin/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 w-56 border-r border-stone-token bg-parchment pt-14">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-stone-token">
        <img src="/ris_academy_emblem.svg" alt="RI's Academy" className="h-7 w-auto" />
        <span className="text-lg font-bold text-navy">RI&apos;s Academy</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-ink/30">
              {section.title}
            </h3>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-saffron/10 text-saffron'
                          : 'text-ink/50 hover:bg-stone-token/50 hover:text-ink'
                      )}
                    >
                      <item.icon className={cn('h-4 w-4', active && 'text-saffron')} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-stone-token px-3 py-3">
        <Button
          variant="ghost"
          asChild
          className="w-full justify-start gap-3 text-ink/50 hover:text-ink hover:bg-stone-token/50"
        >
          <Link href="/admin/profile">
            <UserCircle className="h-4 w-4" />
            My Profile
          </Link>
        </Button>
        <Button
          variant="ghost"
          asChild
          className="w-full justify-start gap-3 text-ink/50 hover:text-ink hover:bg-stone-token/50"
        >
          <Link href="/">
            <ChevronLeft className="h-4 w-4" />
            Back to Site
          </Link>
        </Button>
      </div>
    </aside>
  );
}
