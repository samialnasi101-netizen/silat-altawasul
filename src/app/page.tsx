import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="relative z-10 text-center animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
          صلة التواصل
        </h1>
        <p className="text-white/70 text-lg md:text-xl mb-10">
          نظام إدارة الفروع، الموظفين، الحضور، التبرعات والجمعيات
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="btn-primary text-lg px-8 py-4 rounded-2xl"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
