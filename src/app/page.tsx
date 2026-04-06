import Link from 'next/link';
import { ArrowLeft, Shield, Users, HandCoins, ClipboardList } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/8 rounded-full blur-[120px] animate-glow-pulse" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: '1.5s' }} />

      {/* Floating decorative elements */}
      <div className="absolute top-20 right-10 w-24 h-24 border border-emerald-500/10 rounded-2xl rotate-12 animate-float" />
      <div className="absolute bottom-32 left-16 w-16 h-16 border border-blue-500/10 rounded-xl -rotate-6 animate-float" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 text-center animate-fade-in max-w-3xl">
        {/* Logo / Brand */}
        <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/20 flex items-center justify-center animate-scale-in">
          <Shield className="w-10 h-10 text-emerald-400" />
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
          صلة <span className="text-gradient">التواصل</span>
        </h1>
        <p className="text-white/50 text-lg md:text-xl mb-12 max-w-xl mx-auto leading-relaxed animate-slide-up stagger-1">
          نظام متكامل لإدارة الفروع، الموظفين، الحضور، التبرعات والجمعيات
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up stagger-2">
          <Link
            href="/login"
            className="btn-primary text-lg px-10 py-4 rounded-2xl group"
          >
            تسجيل الدخول
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up stagger-3">
          {[
            { icon: Users, label: 'إدارة الموظفين', color: 'text-blue-400 bg-blue-500/10' },
            { icon: ClipboardList, label: 'تتبع الحضور', color: 'text-emerald-400 bg-emerald-500/10' },
            { icon: HandCoins, label: 'إدارة التبرعات', color: 'text-amber-400 bg-amber-500/10' },
            { icon: Shield, label: 'تقارير شاملة', color: 'text-purple-400 bg-purple-500/10' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="glass rounded-xl p-4 text-center group hover:border-white/15 transition-all duration-300">
              <div className={`w-10 h-10 mx-auto mb-2 rounded-lg ${color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-white/60 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
