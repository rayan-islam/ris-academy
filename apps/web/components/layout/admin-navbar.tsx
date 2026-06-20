'use client';

import {
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ris-academy/ui';
import { useSession, signOut } from 'next-auth/react';
import { Menu, Bell, LogOut, UserCircle } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';

export function AdminNavbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = session?.user;

  return (
    <nav className="fixed inset-x-0 top-0 z-40 h-16 border-b bg-white dark:bg-gray-950">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2.5 lg:hidden">
            <img src="/ris_academy_emblem.svg" alt="RI's Academy" className="h-7 w-auto" />
            <span className="text-lg font-bold text-navy">RI&apos;s Academy</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.image ?? ''} alt={user?.name ?? ''} />
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline">
                  {user?.name ?? 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/profile">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/">Back to Site</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-b bg-white dark:bg-gray-950 lg:hidden">
          <div className="space-y-1 px-4 py-3">
              {[
                { href: '/admin/dashboard', label: 'Dashboard' },
                { href: '/admin/courses', label: 'Courses' },
                { href: '/admin/exams', label: 'Exams' },
                { href: '/admin/question-bank', label: 'Question Bank' },
                { href: '/admin/students', label: 'Users' },
                { href: '/admin/payments', label: 'Payments' },
                { href: '/admin/materials', label: 'Materials' },
                { href: '/admin/notifications', label: 'Notifications' },
                { href: '/admin/profile', label: 'Profile' },
              ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-navy dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
