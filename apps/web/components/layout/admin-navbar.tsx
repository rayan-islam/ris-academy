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

const MOBILE_LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/courses', label: 'Courses' },
  { href: '/admin/exams', label: 'Exams' },
  { href: '/admin/question-bank', label: 'Question Bank' },
  { href: '/admin/students', label: 'Users' },
  { href: '/admin/payments', label: 'Payments' },
  { href: '/admin/materials', label: 'Materials' },
  { href: '/admin/notifications', label: 'Notifications' },
  { href: '/admin/profile', label: 'Profile' },
];

export function AdminNavbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = session?.user;

  return (
    <nav className="fixed inset-x-0 top-0 z-40 h-14 border-b border-stone-token bg-parchment">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-ink/60 hover:text-ink"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2.5 lg:hidden">
            <img src="/ris_academy_emblem.svg" alt="RI's Academy" className="h-7 w-auto" />
            <span className="text-lg font-bold text-navy">RI&apos;s Academy</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-ink/60 hover:text-ink">
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3 text-ink/80 hover:text-ink">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.image ?? ''} alt={user?.name ?? ''} />
                  <AvatarFallback className="bg-navy/10 text-navy text-xs">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline">
                  {user?.name ?? 'Admin'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
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
        <div className="border-b border-stone-token bg-parchment lg:hidden">
          <div className="space-y-1 px-4 py-3">
            {MOBILE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-ink/60 transition-colors hover:bg-stone-token/50 hover:text-ink"
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
