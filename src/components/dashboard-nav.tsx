'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  MapPin,
  Building2,
  FolderKanban,
  Users,
  HandCoins,
  ClipboardList,
  FileText,
  History,
  LogOut,
  Lock,
  RotateCcw,
  Menu,
  X,
  Shield,
  ChevronLeft,
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

const staffLinks = [
  { href: '/dashboard', label: 'لوحتي', icon: LayoutDashboard },
  { href: '/dashboard/attendance', label: 'الحضور والانصراف', icon: ClipboardList },
  { href: '/dashboard/donations', label: 'التبرعات', icon: HandCoins },
];

const adminLinks = [
  { href: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/admin/branches', label: 'الفروع', icon: MapPin },
  { href: '/admin/charities', label: 'الجمعيات', icon: Building2 },
  { href: '/admin/projects', label: 'المشاريع', icon: FolderKanban },
  { href: '/admin/staff', label: 'الموظفين', icon: Users },
  { href: '/admin/donations', label: 'التبرعات', icon: HandCoins },
  { href: '/admin/attendance', label: 'الحضور', icon: ClipboardList },
  { href: '/admin/reports', label: 'التقارير', icon: FileText },
  { href: '/admin/historical', label: 'التقارير التاريخية', icon: History },
];

export function DashboardNav({
  user,
  isAdmin,
}: {
  user: { name?: string | null; staffId?: string };
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const links = isAdmin ? adminLinks : staffLinks;
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  // Close mobile menu on route change
  useEffect(() => {
    closeMobile();
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const checkActive = (href: string) => {
    if (href === '/admin' || href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  const initials = (user?.name ?? 'U').slice(0, 2);

  return (
    <>
      {/* Mobile header — safe area aware */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass flex items-center justify-between px-4 py-3 safe-top" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h2 className="font-bold text-base" style={{ color: 'var(--text-primary-color)' }}>صلة التواصل</h2>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl transition"
            style={{ color: 'var(--text-primary-color)' }}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={closeMobile} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky inset-y-0 right-0 z-50
        w-[280px] md:w-[260px] lg:w-[280px]
        md:top-0 md:h-screen
        flex flex-col
        overflow-y-auto overscroll-contain
        transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        md:transform-none md:flex-shrink-0
      `} style={{ background: 'var(--sidebar-bg)', borderLeft: '1px solid var(--sidebar-border)' }}>
        {/* Brand — hidden on mobile (we have the top bar) */}
        <div className="hidden md:block p-5 lg:p-6 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm lg:text-base truncate" style={{ color: 'var(--text-primary-color)' }}>صلة التواصل</h2>
              <p className="text-[11px]" style={{ color: 'var(--sidebar-text-muted)' }}>{isAdmin ? 'لوحة الإدارة' : 'لوحة الموظف'}</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile brand in sidebar */}
        <div className="md:hidden p-5 pt-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ color: 'var(--text-primary-color)' }}>صلة التواصل</h2>
              <p className="text-xs" style={{ color: 'var(--sidebar-text-muted)' }}>{isAdmin ? 'لوحة الإدارة' : 'لوحة الموظف'}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 lg:px-3 space-y-0.5">
          <p className="text-[10px] uppercase tracking-widest font-semibold px-3 lg:px-4 pb-2 pt-2" style={{ color: 'var(--sidebar-text-muted)' }}>القائمة الرئيسية</p>
          {links.map(({ href, label, icon: Icon }) => {
            const active = checkActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={closeMobile}
                className="flex items-center gap-3 rounded-xl px-3 lg:px-4 py-2.5 transition-all duration-200 group relative"
                style={{
                  background: active ? 'var(--sidebar-active-bg)' : undefined,
                  color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                }}
              >
                {active && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-400 rounded-l-full" />
                )}
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${active ? 'text-emerald-400' : ''}`} style={{ color: active ? undefined : 'var(--sidebar-text-muted)' }} />
                <span className="text-sm truncate">{label}</span>
                {active && <ChevronLeft className="w-4 h-4 mr-auto flex-shrink-0 text-emerald-400/60" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-2 lg:p-3 mt-auto" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
          {isAdmin && (
            <div className="space-y-0.5 mb-2">
              <p className="text-[10px] uppercase tracking-widest font-semibold px-3 lg:px-4 pb-1 pt-1" style={{ color: 'var(--sidebar-text-muted)' }}>الإعدادات</p>
              <Link
                href="/admin/change-password"
                onClick={closeMobile}
                className="flex items-center gap-3 rounded-xl px-3 lg:px-4 py-2.5 transition-all duration-200 text-sm"
                style={{
                  background: checkActive('/admin/change-password') ? 'var(--sidebar-active-bg)' : undefined,
                  color: checkActive('/admin/change-password') ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                }}
              >
                <Lock className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="truncate">تغيير كلمة المرور</span>
              </Link>
              <Link
                href="/admin/reset-system"
                onClick={closeMobile}
                className="flex items-center gap-3 rounded-xl px-3 lg:px-4 py-2.5 transition-all duration-200 text-sm"
                style={{
                  background: checkActive('/admin/reset-system') ? 'rgba(239,68,68,0.1)' : undefined,
                  color: checkActive('/admin/reset-system') ? '#f87171' : 'var(--sidebar-text)',
                }}
              >
                <RotateCcw className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="truncate">إعادة تعيين النظام</span>
              </Link>
            </div>
          )}

          {/* User card */}
          <div className="flex items-center gap-3 px-3 lg:px-4 py-3 rounded-xl" style={{ background: 'var(--table-row-hover)', border: '1px solid var(--sidebar-border)' }}>
            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-gradient-to-br from-emerald-500/30 to-blue-500/30 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary-color)' }}>{user?.name ?? user?.staffId}</p>
              <p className="text-xs" style={{ color: 'var(--sidebar-text-muted)' }}>{isAdmin ? 'مدير' : 'موظف'}</p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-3 w-full rounded-xl px-3 lg:px-4 py-2.5 mt-2 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 text-sm"
            style={{ color: 'var(--sidebar-text-muted)' }}
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
