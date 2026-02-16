'use client';

import { useState } from 'react';
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
} from 'lucide-react';

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

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 flex items-center justify-between px-4 py-3">
        <h2 className="font-bold text-white text-lg">صلة التواصل</h2>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white p-2 rounded-lg hover:bg-white/10"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar: scrollable on mobile so bottom options (logout etc) are reachable */}
      <aside className={`
        fixed md:static inset-y-0 right-0 z-50
        w-64 min-h-screen max-h-screen glass border-l border-white/10 flex flex-col
        overflow-y-auto md:overflow-y-visible
        transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        md:transform-none
      `}>
      <div className="p-6 border-b border-white/10 shrink-0">
        <h2 className="font-bold text-white text-lg">صلة التواصل</h2>
        <p className="text-white/60 text-sm mt-0.5">
          {isAdmin ? 'مدير النظام' : 'موظف'}
        </p>
      </div>
      <nav className="flex-1 min-h-0 p-3 space-y-1 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={closeMobile}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
              pathname === href
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10 shrink-0">
        <p className="text-white/60 text-sm px-4 py-2 truncate" title={user?.name ?? undefined}>
          {user?.name ?? user?.staffId}
        </p>
        {isAdmin && (
          <>
            <Link
              href="/admin/change-password"
              onClick={closeMobile}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                pathname === '/admin/change-password' ? 'bg-emerald-500/20 text-emerald-300' : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Lock className="w-5 h-5" />
              <span>تغيير كلمة المرور</span>
            </Link>
            <Link
              href="/admin/reset-system"
              onClick={closeMobile}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                pathname === '/admin/reset-system' ? 'bg-red-500/20 text-red-300' : 'text-white/80 hover:bg-red-500/10 hover:text-red-300'
              }`}
            >
              <RotateCcw className="w-5 h-5" />
              <span>إعادة تعيين النظام</span>
            </Link>
          </>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-white/80 hover:bg-red-500/20 hover:text-red-300 transition"
        >
          <LogOut className="w-5 h-5" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
      </aside>
    </>
  );
}
