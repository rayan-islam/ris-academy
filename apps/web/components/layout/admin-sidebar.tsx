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
  FileText,
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
    title: 'ACCOUNT',
    items: [
      { href: '/admin/profile', label: 'Profile', icon: UserCircle },
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
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 w-64 border-r bg-white dark:bg-gray-950 pt-16">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b">
        <img src="/ris_academy_emblem.svg" alt="RI's Academy" className="h-7 w-auto" />
        <span className="text-lg font-bold text-navy">RI&apos;s Academy</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-navy/10 text-navy'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-navy dark:text-gray-300 dark:hover:bg-gray-800'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t px-3 py-4">
        <Button
          variant="ghost"
          asChild
          className="w-full justify-start gap-3 text-gray-600 hover:text-navy dark:text-gray-300"
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
