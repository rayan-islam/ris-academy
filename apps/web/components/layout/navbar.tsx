'use client';

import {
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
} from '@ris-academy/ui';
import { cn, getInitials } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  GraduationCap,
  BookOpen,
  FileQuestion,
  LayoutDashboard,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/exams', label: 'Exams', icon: FileQuestion },
];

export function Navbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = session?.user;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isLoggedIn = !!user;
  const unreadCount = 0;

  return (
    <nav className="fixed inset-x-0 top-0 z-50 h-16 border-b bg-white dark:bg-gray-950">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-[#185FA5]">
          <GraduationCap className="h-8 w-8" />
          <span className="text-xl font-bold">RI&apos;s Academy</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#185FA5]/10 text-[#185FA5]'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-[#185FA5] dark:text-gray-300 dark:hover:bg-gray-800'
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {isLoggedIn ? (
            <>
              <Button variant="ghost" size="icon" asChild className="relative">
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[10px]">
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={user?.image ?? ''}
                        alt={user?.name ?? ''}
                      />
                      <AvatarFallback>
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium leading-none">
                        {user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-courses">
                      <BookOpen className="mr-2 h-4 w-4" />
                      My Courses
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-red-600 focus:text-red-600"
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button
                asChild
                style={{ backgroundColor: '#185FA5' }}
                className="text-white hover:bg-[#185FA5]/90"
              >
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-b bg-white dark:bg-gray-950 md:hidden">
          <div className="space-y-1 px-4 py-3">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#185FA5]/10 text-[#185FA5]'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#185FA5] dark:text-gray-300 dark:hover:bg-gray-800'
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t px-4 py-3">
            <div className="space-y-1">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/notifications"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      pathname === '/notifications'
                        ? 'bg-[#185FA5]/10 text-[#185FA5]'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-[#185FA5] dark:text-gray-300 dark:hover:bg-gray-800'
                    )}
                  >
                    <Bell className="h-4 w-4" />
                    Notifications
                    {unreadCount > 0 && (
                      <Badge className="ml-auto h-5 min-w-[20px] rounded-full px-1.5 text-[10px]">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      pathname === '/dashboard'
                        ? 'bg-[#185FA5]/10 text-[#185FA5]'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-[#185FA5] dark:text-gray-300 dark:hover:bg-gray-800'
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/my-courses"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      pathname === '/my-courses'
                        ? 'bg-[#185FA5]/10 text-[#185FA5]'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-[#185FA5] dark:text-gray-300 dark:hover:bg-gray-800'
                    )}
                  >
                    <BookOpen className="h-4 w-4" />
                    My Courses
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      pathname === '/profile'
                        ? 'bg-[#185FA5]/10 text-[#185FA5]'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-[#185FA5] dark:text-gray-300 dark:hover:bg-gray-800'
                    )}
                  >
                    Profile
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                        pathname === '/admin'
                          ? 'bg-[#185FA5]/10 text-[#185FA5]'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-[#185FA5] dark:text-gray-300 dark:hover:bg-gray-800'
                      )}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    href="/settings"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      pathname === '/settings'
                        ? 'bg-[#185FA5]/10 text-[#185FA5]'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-[#185FA5] dark:text-gray-300 dark:hover:bg-gray-800'
                    )}
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      signOut({ callbackUrl: '/' });
                      setMobileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#185FA5] dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white transition-colors"
                    style={{ backgroundColor: '#185FA5' }}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
