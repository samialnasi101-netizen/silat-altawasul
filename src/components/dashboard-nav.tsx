'use client';

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

  return (
    <aside className="w-64 min-h-screen glass border-l border-white/10 flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h2 className="font-bold text-white text-lg">صلة التواصل</h2>
        <p className="text-white/60 text-sm mt-0.5">
          {isAdmin ? 'مدير النظام' : 'موظف'}
        </p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
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
      <div className="p-3 border-t border-white/10">
        <p className="text-white/60 text-sm px-4 py-2 truncate" title={user?.name ?? undefined}>
          {user?.name ?? user?.staffId}
        </p>
        {isAdmin && (
          <>
            <Link
              href="/admin/change-password"
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                pathname === '/admin/change-password' ? 'bg-emerald-500/20 text-emerald-300' : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Lock className="w-5 h-5" />
              <span>تغيير كلمة المرور</span>
            </Link>
            <Link
              href="/admin/reset-system"
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
  );
}
