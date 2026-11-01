# دليل النشر على Vercel + Neon (مجاني — الأفضل أداءً)

Vercel هو أفضل استضافة لـ Next.js (من نفس الشركة). Neon يوفر PostgreSQL مجاني (0.5GB).

> ✅ **مميزات:** لا ينام أبدًا، نشر تلقائي، HTTPS، CDN عالمي، نطاق فرعي مجاني
> ⚠️ **يتطلب:** تحويل قاعدة البيانات من SQLite إلى PostgreSQL (سطر واحد)

---

## الخطوة 1: أنشئ قاعدة بيانات Neon PostgreSQL مجانية

1. اذهب إلى [neon.tech](https://neon.tech)
2. اضغط **Sign Up** (سجّل بـ GitHub أو Google)
3. أنشئ مشروعًا جديدًا:
   - **Project name:** `platform-analysis`
   - **Region:** `AWS Frankfurt` (أقرب للمستخدمين العرب)
4. بعد الإنشاء، انسخ **Connection string** من لوحة Neon:
   ```
   postgresql://platform_user:xxxxxxxx@ep-xxx.eu-central-1.aws.neon.tech/platform?sslmode=require
   ```
   احفظه في مكان آمن — ستحتاجه في الخطوة 4.

---

## الخطوة 2: عدّل schema.prisma للإنتاج

في ملف `prisma/schema.prisma`، غيّر سطرًا واحدًا:

```prisma
datasource db {
  provider = "postgresql"   ← غيّر من "sqlite" إلى "postgresql"
  url      = env("DATABASE_URL")
}
```

> هذا التغيير ضروري لأن Vercel (serverless) لا يدعم ملفات SQLite.

---

## الخطوة 3: ارفع الكود إلى GitHub

```bash
# في مجلد المشروع
git init
git add .
git commit -m "Switch to PostgreSQL for Vercel deployment"

# أنشئ مستودعًا على GitHub.com
git remote add origin https://github.com/USERNAME/platform-analysis.git
git branch -M main
git push -u origin main
```

---

## الخطوة 4: ارفع لـ Vercel

### الطريقة 1: عبر الموقع (الأسهل)

1. اذهب إلى [vercel.com](https://vercel.com)
2. اضغط **Sign Up** → سجّل بـ GitHub
3. اضغط **Add New** → **Project**
4. اختر مستودع GitHub الخاص بك
5. **Vercel سيكتشف Next.js تلقائيًا** — لا تغيّر أي إعدادات بناء
6. **Environment Variables** (مهم جدًا):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | (لصق رابط Neon من الخطوة 1) |
   | `NEXTAUTH_SECRET` | (انظر الخطوة 5) |
   | `NEXTAUTH_URL` | (اتركه فارغًا الآن) |

7. اضغط **Deploy**
8. انتظر 2-3 دقائق للبناء

### الطريقة 2: عبر CLI

```bash
npm install -g vercel
vercel login
vercel
# اختر: existing project / new project
# أضف متغيرات البيئة عند الطلب
```

---

## الخطوة 5: أنشئ NEXTAUTH_SECRET

```bash
openssl rand -base64 48
```

انسخ الناتج وأضفه كمتغير بيئة `NEXTAUTH_SECRET` في Vercel.

---

## الخطوة 6: حدّث NEXTAUTH_URL

بعد أول نشر ناجح، ستحصل على رابط مثل:
`https://platform-analysis.vercel.app`

1. في Vercel Dashboard → مشروعك → **Settings** → **Environment Variables**
2. أضف: `NEXTAUTH_URL` = `https://platform-analysis.vercel.app`
3. اضغط **Redeploy**

---

## الخطوة 7: شغّل Migration و Seed لقاعدة بيانات Neon

في جهازك المحلي (مع رابط Neon):

```bash
# نزّل متغيرات البيئة من Vercel
npm install -g vercel
vercel env pull .env.local

# أو ضع DATABASE_URL يدويًا في .env.local
echo 'DATABASE_URL="postgresql://..."' > .env.local

# شغّل Migration (ينشئ الجداول في Neon)
npx prisma db push

# شغّل Seed (المدير + الأسئلة + المستويات)
npx tsx prisma/seed.ts
```

ستظهر:
```
✅ Seed completed successfully!
🔐 Admin login: admin@platform.edu / Admin@12345
```

---

## الخطوة 8: اختبر الموقع

افتح `https://platform-analysis.vercel.app`:
- سجّل دخول بـ `admin@platform.edu` / `Admin@12345`
- **غيّر كلمة المرور فورًا**

---

## استكشاف الأخطاء

### `Error: P1003: Database does not exist`
رابط Neon غير صحيح. تأكد من نسخه كاملًا من لوحة Neon.

### `Error: P1010: Prisma needs to perform validations`
أضف `?sslmode=require` في نهاية رابط Neon:
```
postgresql://user:pass@host/db?sslmode=require
```

### البناء يفشل بـ `prisma generate`
Vercel يثبّت الحزم تلقائيًا. تأكد أن `postinstall: "prisma generate"` موجود في `package.json` (وهو موجود).

### `NEXTAUTH_SECRET` غير معرّف
أضفه في Vercel → Settings → Environment Variables.

### تسجيل الدخول لا يعمل (redirect loop)
تأكد أن `NEXTAUTH_URL` = رابط Vercel الفعلي (بدون شرطة مائلة في النهاية).

### الأسئلة لا تظهر
شغّل `npx prisma db push` و `npx tsx prisma/seed.ts` محليًا مع `DATABASE_URL` الخاص بـ Neon.

---

## مقارنة: Vercel vs Render

| الميزة | Vercel + Neon | Render |
|---|---|---|
| الكلفة | مجاني | مجاني |
| النوم | ❌ لا ينام أبدًا | ✅ ينام بعد 15 دقيقة |
| قاعدة البيانات | PostgreSQL (Neon) | SQLite (قرص دائم) |
| السرعة | ⚡⚡⚡ CDN عالمي | ⚡⚡ جيد |
| HTTPS | ✅ تلقائي | ✅ تلقائي |
| النطاق المخصص | ✅ مجاني | ❌ مدفوع |
| النشر التلقائي | ✅ عند git push | ✅ عند git push |
| التغييرات المطلوبة | تحويل لـ PostgreSQL (سطر) | لا شيء |
| الحد المجاني | 100GB bandwidth، 0.5GB DB | 750 ساعة، 1GB disk |

**التوصية:** إذا كنت تريد موقعًا سريعًا لا ينام — استخدم **Vercel + Neon**.
إذا كنت تريد أسهل نشر بدون تغيير كود — استخدم **Render**.

---

## بعد النشر الناجح

- ✅ موقع سريع على `https://platform-analysis.vercel.app`
- ✅ قاعدة بيانات PostgreSQL serverless (Neon)
- ✅ HTTPS + CDN عالمي
- ✅ نطاق فرعي مجاني أو نطاق مخصص مجاني
- ✅ نشر تلقائي عند كل `git push`

**الحدود المجانية:**
- Vercel: 100GB bandwidth/شهر، 100GB-hours serverless
- Neon: 0.5GB تخزين، 100 ساعة حساب/شهر (يكفي لمنصة تعليمية متوسطة)
