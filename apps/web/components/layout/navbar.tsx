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

  const linkClass = (isActive: boolean) =>
    cn(
      'relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'text-saffron'
        : 'text-parchment/70 hover:text-parchment'
    );

  const activeBar = (isActive: boolean) =>
    isActive
      ? 'absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-saffron'
      : null;

  return (
    <nav className="fixed inset-x-0 top-0 z-50 h-16 border-b border-navy-light bg-navy">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/ris_academy_emblem.svg" alt="RI's Academy" className="h-8 w-auto" />
          <span className="text-xl font-bold text-parchment">RI&apos;s Academy</span>
        </Link>

        <div className="hidden items-center md:flex">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link key={link.href} href={link.href} className={linkClass(isActive)}>
                <link.icon className="h-4 w-4" />
                {link.label}
                {activeBar(isActive)}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative text-parchment/70 hover:text-parchment"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {isLoggedIn ? (
            <>
              <Button variant="ghost" size="icon" asChild className="relative text-parchment/70 hover:text-parchment">
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
                  <Button variant="ghost" className="h-9 w-9 rounded-full p-0 ring-2 ring-saffron/30">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={user?.image ?? ''}
                        alt={user?.name ?? ''}
                      />
                      <AvatarFallback className="bg-saffron/20 text-saffron">
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
              <Button variant="ghost" asChild className="text-parchment/70 hover:text-parchment hover:bg-navy-light">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-saffron text-white hover:bg-saffron/90">
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative text-parchment/70 hover:text-parchment"
          >
            <Sun className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="text-parchment"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-b border-navy-light bg-navy-dark md:hidden">
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
                      ? 'bg-saffron/10 text-saffron'
                      : 'text-parchment/70 hover:bg-navy-light hover:text-parchment'
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-navy-light px-4 py-3">
            <div className="space-y-1">
              {isLoggedIn ? (
                <>
                  {[
                    { href: '/notifications', label: 'Notifications', icon: Bell },
                    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                    { href: '/my-courses', label: 'My Courses', icon: BookOpen },
                    { href: '/profile', label: 'Profile', icon: null },
                    ...(isAdmin ? [{ href: '/admin', label: 'Admin Panel', icon: null }] : []),
                    { href: '/settings', label: 'Settings', icon: null },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                        pathname === item.href
                          ? 'bg-saffron/10 text-saffron'
                          : 'text-parchment/70 hover:bg-navy-light hover:text-parchment'
                      )}
                    >
                      {item.icon && <item.icon className="h-4 w-4" />}
                      {item.label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      signOut({ callbackUrl: '/' });
                      setMobileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-parchment/70 transition-colors hover:bg-navy-light hover:text-parchment"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white transition-colors bg-saffron hover:bg-saffron/90"
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
