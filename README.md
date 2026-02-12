# صلة التواصل — SILAT ALTAWASUL

نظام ويب لإدارة الفروع، الموظفين، الحضور، التبرعات، الجمعيات والمشاريع مع لوحة تحكم لحظية وتقارير حالية وتاريخية.

## النشر عبر GitHub (بدون تعديل الكود)

1. **ادفع المشروع إلى GitHub**
   - انسخ مجلد `silat-altawasul` كمجلد الجذر للمستودع، أو انسخ محتوياته إلى مستودع جديد.

2. **ربط بـ Vercel (مجاني)**
   - ادخل إلى [vercel.com](https://vercel.com) وسجّل الدخول بـ GitHub.
   - New Project → استورد مستودع المشروع.
   - **Environment Variables** (مهم):
     - `DATABASE_URL`: رابط PostgreSQL (مثلاً من [Supabase](https://supabase.com) أو [Neon](https://neon.tech) — إنشاء مشروع ونسخ Connection string).
     - `NEXTAUTH_SECRET`: أي نص عشوائي طويل (مثلاً من [generate-secret.vercel.app](https://generate-secret.vercel.app/32)).
     - `NEXTAUTH_URL`: عنوان الموقع بعد النشر (مثل `https://your-app.vercel.app`).
   - Deploy. بعد الانتهاء، في تبويب Settings → Environment Variables غيّر `NEXTAUTH_URL` إلى الرابط الفعلي للموقع ثم أعد النشر مرة واحدة.

3. **تهيئة قاعدة البيانات**
   - على جهازك (أو في سكريبت تشغيل مرة واحدة):
     - ضع نفس `DATABASE_URL` في ملف `.env` محلي.
     - نفّذ: `npx prisma db push`
     - ثم: `npm run db:seed` لإنشاء مستخدم المدير الافتراضي.
   - بيانات الدخول الافتراضية للمدير بعد البذر:
     - **المعرف:** `admin`
     - **كلمة المرور:** `admin123`
   - غيّر كلمة المرور فورًا من لوحة المدير (إدارة الموظفين أو من قاعدة البيانات).

## استخدام Neon (قاعدة بيانات مجانية)

1. ادخل إلى [neon.tech](https://neon.tech) وسجّل دخول (مجاني).
2. **Create a project** → اختر اسمًا ومنطقة قريبة.
3. من لوحة المشروع انسخ **Connection string** (يبدأ بـ `postgresql://`).
4. ضعه في ملف `.env` في السطر `DATABASE_URL=...` (يُفضّل أن ينتهي بـ `?sslmode=require`).
5. نفّذ: `npx prisma db push` ثم `npm run db:seed` أو افتح `/api/setup` في المتصفح.

## التشغيل محلياً

```bash
cd silat-altawasul
cp .env.example .env
# عدّل .env: DATABASE_URL، NEXTAUTH_SECRET، NEXTAUTH_URL=http://localhost:3000
npm install
npx prisma db push
npm run db:seed
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000).

## الأدوار

- **مدير (Admin):** مدير واحد، صلاحية كاملة، إدارة الفروع والجمعيات والمشاريع والموظفين، رفع التقارير التاريخية، وعرض كل التقارير.
- **موظف (Staff):** مرتبط بفرع واحد، يسجل الحضور والتبرعات، يرى فقط بياناته ومشاريع فرعه.

## التقنيات

- Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma, NextAuth.js, PostgreSQL.

## ملاحظات النشر

- لا حاجة لتعديل الكود عند النشر: كل الإعدادات تتم عبر متغيرات البيئة.
- يُفضّل استخدام قاعدة بيانات PostgreSQL مُدارة (Supabase / Neon / Railway) وربطها عبر `DATABASE_URL` فقط.
