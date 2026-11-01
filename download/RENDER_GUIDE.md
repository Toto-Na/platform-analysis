# دليل النشر على Render (مجاني — الأسهل)

Render يدعم Docker + قاعدة بيانات SQLite على قرص دائم. لا تحتاج أي تغيير في الكود.

> ⚠️ **ملاحظة:** الخطة المجانية في Render تُنيم الخدمة بعد 15 دقيقة من عدم النشاط. أول زيارة بعد النوم تستغرق ~30 ثانية. للنشاط الدائم، يمكنك الترقية للخطة المدفوعة ($7/شهر).

---

## الخطوة 1: ارفع الكود إلى GitHub

### إذا لم يكن لديك حساب Git:

```bash
# في مجلد المشروع
git init
git add .
git commit -m "Initial commit - Platform for Website Analysis"

# أنشئ مستودعًا على GitHub.com (مجاني)
# ثم اربطه:
git remote add origin https://github.com/USERNAME/platform-analysis.git
git branch -M main
git push -u origin main
```

### إذا كان لديك ملف `platform-deploy.tar.gz` فقط:

```bash
# فك الضغط
tar xzf platform-deploy.tar.gz
cd platform

# ثم اتبع خطوات Git أعلاه
```

---

## الخطوة 2: أنشئ حساب Render

1. اذهب إلى [render.com](https://render.com)
2. اضغط **Sign Up**
3. سجّل بحساب GitHub (الأسرع)

---

## الخطوة 3: أنشئ الخدمة من Blueprint

### الطريقة الأسهل (Blueprint):

1. اذهب إلى [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
2. اضغط **New Blueprint Instance**
3. اختر مستودع GitHub الذي رفعته
4. Render سيقرأ `render.yaml` تلقائيًا ويُجهّز:
   - خدمة Docker على الخطة المجانية
   - قرص دائم 1GB لقاعدة البيانات
5. اضغط **Apply**

### الطريقة اليدوية (إذا لم يعمل Blueprint):

1. اذهب إلى [dashboard.render.com](https://dashboard.render.com)
2. اضغط **New +** → **Web Service**
3. اختر مستودع GitHub
4. الإعدادات:
   - **Name:** `platform-analysis`
   - **Runtime:** `Docker`
   - **Region:** `Frankfurt` (أقرب للمستخدمين العرب) أو `Oregon`
   - **Instance Type:** `Free`
5. **Environment Variables:**
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | `file:/var/data/platform.db` |
   | `NEXTAUTH_SECRET` | (انظر الخطوة 5) |
   | `NEXTAUTH_URL` | (اتركه فارغًا الآن، حدّثه بعد النشر) |
6. **Disk** (مهم لقاعدة البيانات الدائمة):
   - **Name:** `platform-data`
   - **Mount Path:** `/var/data`
   - **Size:** `1 GB`
7. اضغط **Create Web Service**

---

## الخطوة 4: انتظر البناء

- Render سيبني صورة Docker تلقائيًا (5-10 دقائق أول مرة)
- تابع السجلات في تبويب **Logs**
- عندما ترى `✓ Ready` — الخدمة تعمل!

---

## الخطوة 5: أنشئ سر المصادقة NEXTAUTH_SECRET

في جهازك المحلي (أو عبر أي أداة):

```bash
openssl rand -base64 48
```

انسخ الناتج (مثل: `k3Jx9...24 حرفًا`).

في Render Dashboard:
1. اذهب لخدمتك → **Environment**
2. أضف/عدّل: `NEXTAUTH_SECRET` = الناتج السابق
3. احفظ

---

## الخطوة 6: حدّث NEXTAUTH_URL

بعد أول نشر ناجح، ستحصل على رابط مثل:
`https://platform-analysis.onrender.com`

1. اذهب لخدمتك → **Environment**
2. عدّل: `NEXTAUTH_URL` = `https://platform-analysis.onrender.com`
3. احفظ (سيُعاد النشر تلقائيًا)

---

## الخطوة 7: شغّل البيانات الأولية (Seed)

Render يفتح terminal للخدمة. في Dashboard:
1. اذهب لخدمتك → تبويب **Shell**
2. شغّل:

```bash
npx prisma db push --accept-data-loss
npx tsx prisma/seed.ts
```

أو إذا كان `bunx` متاحًا:

```bash
bunx tsx prisma/seed.ts
```

ستظهر:
```
✅ Seed completed successfully!
🔐 Admin login: admin@platform.edu / Admin@12345
```

---

## الخطوة 8: اختبر الموقع

افتح رابط Render الخاص بك:
- الصفحة الرئيسية: تسجيل الدخول
- سجّل بـ `admin@platform.edu` / `Admin@12345`
- **غيّر كلمة مرور المدير فورًا** من الملف الشخصي

---

## استكشاف الأخطاء

### المشكلة: البناء يفشل بـ `bun: command not found`
Render يستخدم Docker مباشرة من Dockerfile الذي يثبّت bun. إذا فشل، تأكد أن `Dockerfile` موجود في الجذر.

### المشكلة: `DATABASE_URL` غير معرّف
في Render → Environment، أضف: `DATABASE_URL` = `file:/var/data/platform.db`

### المشكلة: البيانات تختفي بعد إعادة النشر
تأكد أن **Disk** مُعد بـ Mount Path = `/var/data` وأن `DATABASE_URL` يشير إليه.

### المشكلة: `PrismaClientInitializationError`
شغّل في Render Shell:
```bash
npx prisma db push --accept-data-loss
npx tsx prisma/seed.ts
```

### المشكلة: الموقع بطيء في أول زيارة
هذا طبيعي في الخطة المجانية (sleep بعد 15 دقيقة). الحلول:
- زر الموقع كل 10 دقائق (cron job)
- أو الترقية للخطة المدفوعة ($7/شهر — لا تنام)

---

## بعد النشر الناجح

- ✅ الموقع يعمل على `https://platform-analysis.onrender.com`
- ✅ قاعدة البيانات محفوظة على قرص دائم
- ✅ HTTPS تلقائي
- ✅ النشر التلقائي عند كل `git push`

**ملاحظات:**
- الخطة المجانية: 750 ساعة/شهر، تنام بعد 15 دقيقة
- القرص: 1GB مجاني (يكفي لآلاف التحليلات)
- النطاق المخصص: مدفوع فقط على Render
