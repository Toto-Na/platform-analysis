# منصة تحليل ومقارنة المواقع الإلكترونية

منصة تعليمية متكاملة لتمكين الطلاب من تحليل المتاجر والمواقع الإلكترونية ومقارنتها عمليًا، مع لوحة تحكم إدارية كاملة لإدارة الطلاب والأسئلة والأقسام والتحليلات والتقارير.

---

## التقنيات المستخدمة

تم تكييف البنية التقنية المطلوبة لاستخدام مكدس حديث متكامل يعمل في بيئة موحدة:

| المطلوب أصليًا | المُستخدم (مكافئ وظيفيًا) | السبب |
|---|---|---|
| React + Vite | **Next.js 16 (App Router)** | React 19 + TypeScript + API routes في إطار واحد |
| ASP.NET Core Web API | **Next.js API Routes** | نفس الوظائف: مصادقة، صلاحيات، تحقق، معاملات |
| Entity Framework Core | **Prisma ORM** | Code-First + Migrations + Typing قوي |
| SQL Server | **SQLite (عبر Prisma)** | قاعدة بيانات علائقية حقيقية، قابلة للترحيل إلى PostgreSQL |
| ASP.NET Core Identity | **NextAuth.js v4 (Credentials + JWT)** | مصادقة + أدوار + جلسات JWT |
| SMTP | **توليد رابط استعادة (وضع تجريبي)** | آمن، يُفعّل بريد حقيقي عبر Nodemailer عند النشر |

### المكدس الكامل
- **Frontend:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Lucide Icons, Recharts, Framer Motion
- **Backend:** Next.js API Routes (App Router), Prisma ORM, NextAuth.js v4 (JWT), bcryptjs
- **قاعدة البيانات:** SQLite عبر Prisma (قابلة للترحيل إلى PostgreSQL/SQL Server)
- **التصدير:** PDFKit (PDF), ExcelJS (Excel)

---

## الميزات المنفذة

### المصادقة والصلاحيات
- تسجيل طالب جديد مع التحقق من البريد وقوة كلمة المرور
- تسجيل الدخول مع JWT و"تذكرني"
- استعادة كلمة المرور عبر رابط آمن منتهي الصلاحية
- أدوار: `STUDENT` و`ADMIN` (لا يمكن إنشاء Admin من التسجيل العام)
- التحقق من الصلاحيات على **مستوى الخادم** في كل واجهة API (وليس إخفاء أزرار فقط)
- منع الطالب من الوصول لصفحات الإدارة أو واجهاتها

### لوحة الطالب
- لوحة تحكم بإحصائيات (إجمالي، مسودة، مرسلة، تحتاج تعديل، معتمدة)
- إنشاء مقارنة جديدة (Wizard من 3 خطوات: عنوان → اختيار 2-4 مواقع → مراجعة)
- صفحة التحليل بتبويبات لكل موقع مع 8 أنواع أسئلة
- **حفظ تلقائي** مع Debouncing (1.2 ثانية) ومؤشر حالة الحفظ
- جدول المقارنة النهائية الديناميكي + رأي الطالب + إرسال للإدارة
- استعراض تحليلات الزملاء (للقراءة فقط) حسب سياسة النشر

### لوحة الإدارة (11 قسمًا)
1. **الرئيسية:** إحصائيات شاملة + أحدث المقارنات + آخر العمليات
2. **إدارة الطلاب:** بحث، تصفية، إضافة، تعديل، تعطيل، إعادة تعيين كلمة مرور
3. **المستويات الدراسية:** CRUD + ترتيب
4. **إدارة المواقع:** مواقع مقترحة CRUD
5. **إدارة المقارنات:** قائمة بكل المقارنات مع تصفية بالحالة
6. **مراجعة التحليلات:** عرض كامل + اعتماد/إعادة للتعديل + ملاحظات
7. **إدارة الأسئلة:** CRUD كامل + 8 أنواع + خيارات + معاينة + أرشفة
8. **أقسام الأسئلة:** CRUD + ترتيب + أرشفة
9. **التقارير:** رسوم بيانية (Bar, Pie, Line) + تصدير PDF/Excel
10. **إعدادات النظام:** تحكم كامل دون تعديل كود
11. **سجل العمليات:** كل العمليات الإدارية مع تصفية

### نظام إصدارات الأسئلة (Question Versioning)
- كل تعديل على سؤال يبقى مرتبطًا بالتحليلات السابقة بإصداره القديم
- "نشر إصدار جديد" ينشئ نسخة Snapshot غير قابلة للتعديل
- المقارنات الجديدة تستخدم الإصدار المنشور، القديمة تبقى بإصدارها
- أرشفة الأسئلة لا تحذف الإجابات السابقة

### تجربة المستخدم
- دعم كامل لـ **RTL** وخط **Cairo** العربي
- **الوضع الداكن** مع حفظ التفضيل
- تصميم متجاوب (هاتف، تابلت، لابتوب، كمبيوتر)
- لون أساسي: Teal-700 (#0F766E) — أخضر-أزرق هادئ تعليمي
- بطاقات بظلال خفيفة وحواف ناعمة
- حالات تحميل، رسائل نجاح/خطأ (Sonner toasts)
- تنبيهات قبل الحذف والإرسال

---

## بنية المشروع

```
prisma/
  schema.prisma          # 17 نموذج بقاعدة البيانات
  seed.ts                # بيانات أولية (مدير + 5 أقسام + 18 سؤال + 7 مواقع)

src/
  app/
    layout.tsx           # RTL + Cairo + ThemeProvider + SessionProvider
    page.tsx             # الموجه الرئيسي (query-based router)
    globals.css          # ثيم Teal-700 + Dark Mode
    api/                 # 35+ واجهة API
      auth/              # NextAuth + register + forgot/reset + me
      academic-levels/
      student/           # dashboard + comparisons + public-comparisons
      comparisons/       # CRUD + answers + submit + summary
      questions/         # active + categories + versions
      admin/             # 25+ واجهة إدارية
  lib/
    auth.ts              # NextAuth config (Credentials + JWT + Roles)
    api-auth.ts          # requireAuth helper لـ App Router
    constants.ts         # أنواع الإجابات وحالات المقارنة
    audit.ts             # تسجيل العمليات
    api.ts               # عميل fetch للواجهة الأمامية
    router.ts            # useAppRouter (query-based)
    db.ts                # Prisma client
  components/
    ui/                  # مكتبة shadcn/ui الكاملة
    auth/                # 4 صفحات مصادقة
    student/             # dashboard + wizard + analysis + summary + question-renderer
    admin/               # 11 قسم إداري
    shared/              # header + status-badge
    providers.tsx        # SessionProvider + ThemeProvider + QueryClient
    theme-toggle.tsx
```

---

## قاعدة البيانات (17 نموذج)

`User`, `PasswordResetToken`, `StudentProfile`, `AcademicLevel`, `QuestionCategory`, `Question`, `QuestionOption`, `QuestionVersion` (Snapshot), `QuestionSetVersion`, `QuestionSetVersionItem`, `Comparison`, `ComparisonWebsite`, `Answer`, `ComparisonSummary`, `AdminReview`, `SuggestedWebsite`, `ComparisonAssignment`, `SystemSetting`, `AuditLog`

العلاقات: Foreign Keys + Indexes + قيود سلامة + Transactions عند الإرسال النهائي.

---

## التشغيل

```bash
# تثبيت الحزم
bun install

# تهيئة قاعدة البيانات
bun run db:push

# بيانات أولية (Seed)
bunx tsx prisma/seed.ts

# تشغيل خادم التطوير
bun run dev
```

---

## الحسابات التجريبية

| الدور | البريد | كلمة المرور |
|---|---|---|
| **مدير** | `admin@platform.edu` | `Admin@12345` |
| طالب | `ahmed@demo.edu` | `Student@123` |
| طالب | `sara@demo.edu` | `Student@123` |
| طالب | `khaled@demo.edu` | `Student@123` |

---

## واجهات API الرئيسية

### المصادقة
- `POST /api/auth/register` — تسجيل طالب
- `POST /api/auth/[...nextauth]` — login/logout (NextAuth)
- `POST /api/auth/forgot-password` — إرسال رابط الاستعادة
- `POST /api/auth/reset-password` — تعيين كلمة مرور جديدة
- `GET/PUT /api/auth/me` — الملف الشخصي

### الطالب
- `GET /api/student/dashboard` — إحصائيات + مقارناتي
- `GET /api/student/public-comparisons` — تحليلات الزملاء

### المقارنات
- `POST /api/comparisons` — إنشاء (مع Transaction + ربط إصدار أسئلة)
- `GET/PUT/DELETE /api/comparisons/[id]`
- `PUT /api/comparisons/[id]/answers` — حفظ تلقائي (upsert)
- `POST /api/comparisons/[id]/submit` — إرسال نهائي (Transaction)
- `GET /api/comparisons/[id]/summary` — جدول المقارنة النهائية

### الأسئلة
- `GET /api/questions/active` — الإصدار المنشور الحالي
- `GET /api/questions/categories`

### الإدارة (تتطلب صلاحية ADMIN)
- `GET /api/admin/dashboard`
- `GET/POST/PUT/DELETE /api/admin/students`
- `GET/POST/PUT/DELETE /api/admin/questions` + `archive` + `activate` + `reorder` + `publish`
- `GET/POST/PUT/DELETE /api/admin/question-categories`
- `GET/POST/PUT/DELETE /api/admin/academic-levels`
- `GET/POST/PUT/DELETE /api/admin/suggested-websites`
- `GET /api/admin/comparisons` + `[id]` + `approve` + `request-revision`
- `GET /api/admin/reports/overview|students|websites|questions`
- `GET /api/admin/reports/export/pdf|excel`
- `GET/PUT /api/admin/settings`
- `GET /api/admin/audit-logs`

---

## الأمان

- تجزئة كلمات المرور بـ bcrypt (cost 12)
- JWT مع انتهاء صلاحية (7 أيام)
- التحقق من الصلاحيات على الخادم في كل واجهة (`requireAuth('ADMIN')`)
- منع الطالب من تعديل تحليلات غيره (فحص `studentId`)
- منع الوصول لواجهات الإدارة (403)
- روابط استعادة كلمة المرور: رمز عشوائي 64 بايت، تنتهي صلاحيته خلال ساعة، تُستخدم مرة واحدة
- التحقق من المدخلات بـ Zod على الخادم
- حماية من SQL Injection عبر Prisma (استعلامات معاملاتية)
- تسجيل كل العمليات الإدارية في AuditLog
- Soft Delete للأسئلة (أرشفة) للحفاظ على الإجابات السابقة

---

## قرارات تقنية

1. **Next.js بدل React+Vite منفصل + ASP.NET Core:** توحيد الـ Frontend وBackend في إطار واحد مع الحفاظ على الفصل بينهما (API Routes منفصلة عن مكونات React).
2. **SQLite بدل SQL Server:** يعمل في أي بيئة بدون إعداد، وقابل للترحيل إلى PostgreSQL أو SQL Server بتغيير سطر واحد في `schema.prisma`.
3. **Query-based routing:** البيئة تقيد الواجهة على `/` فقط، لذا استخدمنا موجّهًا داخليًا عبر `?view=...&section=...` مع `useSearchParams`.
4. **استعادة كلمة المرور في وضع التجريبي:** بدل إرسال بريد فعلي (يتطلب SMTP)، يُرجع الرابط في الاستجابة للاختبار. عند النشر، فعّل Nodemailer مع `smtp_from` من الإعدادات.
5. **إصدارات الأسئلة:** كل مقارنة تُربط بإصدار محدد من مجموعة الأسئلة (`questionSetVersionId`)، والإجابات مرتبطة بـ `questionVersionId` (Snapshot غير قابل للتعديل).

---

## ما يمكن تطويره لاحقًا

- تفعيل Nodemailer لإرسال روابط استعادة كلمة المرور فعليًا
- الترحيل إلى PostgreSQL لقابلية توسع أفضل
- إضافة Rate Limiting للواجهات الحساسة
- إضافة اختبارات E2E (Playwright)
- دعم رفع الشعار من لوحة الإعدادات
- إشعارات داخل المنصة للطالب عند اعتماد/إعادة تحليله
