# دليل النشر الكامل — منصة تحليل ومقارنة المواقع الإلكترونية

هذا الدليل يشرح كيفية رفع المنصة إلى الاستضافة بطرق متعددة: Docker (الأسهل)، VPS عادي، Vercel، أو IIS/Windows Server.

---

## الطريقة الأولى: Docker (موصى بها — الأسهل)

### المتطلبات
- خادم Linux (Ubuntu 20.04+ أو Debian 11+) أو Windows مع Docker Desktop
- Docker 20+ و Docker Compose 2+

### الخطوات

#### 1. انقل ملفات المشروع إلى الخادم

```bash
# عبر Git (الأفضل)
git clone https://your-repo.com/platform.git
cd platform

# أو عبر SCP من جهازك
scp -r platform/ user@your-server:/home/user/platform/
ssh user@your-server
cd /home/user/platform
```

#### 2. أنشئ ملف `.env` من المثال

```bash
cp .env.example .env
nano .env
```

عدّل القيم التالية **إلزاميًا**:

```env
# قاعدة البيانات (SQLite في حاوية Docker، مسار ثابت)
DATABASE_URL="file:/app/data/platform.db"

# سر المصادقة — أنشئ واحدًا عشوائيًا:
# openssl rand -base64 48
NEXTAUTH_SECRET="ضع-هنا-سلسلة-عشوائية-طويلة-32-حرف-على-الأقل"

# عنوان موقعك (بدون شرطة مائلة في النهاية)
NEXTAUTH_URL="https://yourdomain.com"
```

#### 3. شغّل الحاوية

```bash
docker compose up -d --build
```

أول تشغيل يستغرق 3-5 دقائق للبناء. بعد ذلك:

```bash
# تحقق من الحالة
docker compose ps
docker compose logs -f app

# المنصة تعمل على http://localhost:3000
```

#### 4. شغّل البيانات الأولية (Seed)

في أول مرة فقط، شغّل السكريبت داخل الحاوية لإنشاء المدير الافتراضي والأقسام والأسئلة:

```bash
docker compose exec app sh -c "cd /app && bunx tsx prisma/seed.ts"
```

أو إذا لم يكن `bunx` متاحًا:

```bash
docker compose exec app sh -c "cd /app && npx tsx prisma/seed.ts"
```

#### 5. (اختياري) ثبت شهادة SSL مع Nginx

أنشئ `nginx.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

احصل على شهادة Let's Encrypt:

```bash
# ثبت certbot
sudo apt install certbot

# احصل على الشهادة
sudo certbot certonly --standalone -d yourdomain.com

# أضف مجلدات الشهادة لـ docker-compose.yml (مثال في الملف)
```

#### 6. إدارة الحاوية

```bash
# إيقاف
docker compose down

# إعادة تشغيل
docker compose restart

# تحديث الكود بعد تعديلات
git pull
docker compose up -d --build

# نسخة احتياطية لقاعدة البيانات
docker compose exec app cat /app/data/platform.db > backup-$(date +%Y%m%d).db

# استعادة نسخة احتياطية
docker compose exec app sh -c 'cat > /app/data/platform.db' < backup-20260101.db
```

---

## الطريقة الثانية: VPS عادي (بدون Docker)

### المتطلبات
- خادم Linux (Ubuntu 22.04+)
- Node.js 20+ و npm/bun
- Nginx (لـ reverse proxy و SSL)

### الخطوات

#### 1. ثبت Node.js و Bun

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# ثبت Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

#### 2. انقل المشروع وثبّت الحزم

```bash
cd /var/www
git clone https://your-repo.com/platform.git
cd platform
bun install
```

#### 3. أعد ملف البيئة

```bash
cp .env.example .env
nano .env
# عدّل NEXTAUTH_SECRET و NEXTAUTH_URL و DATABASE_URL
```

#### 4. ابنِ المشروع

```bash
bun run build
```

#### 5. شغّل قاعدة البيانات والبيانات الأولية

```bash
bun run db:push
bun run db:seed
```

#### 6. شغّل التطبيق بـ PM2 (مدير عمليات)

```bash
sudo npm install -g pm2

pm2 start "node .next/standalone/server.js" --name platform
pm2 startup
pm2 save
```

#### 7. أعد Nginx كـ Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/platform
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 8. SSL مع Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## الطريقة الثالثة: Vercel (الأسهل للنشر السحابي)

### ملاحظة: Vercel لا يدعم SQLite (ملفات). يجب التحويل إلى PostgreSQL.

#### 1. غيّر قاعدة البيانات إلى PostgreSQL

في `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"   // بدل "sqlite"
  url      = env("DATABASE_URL")
}
```

#### 2. أنشئ قاعدة بيانات PostgreSQL

استخدم [Neon](https://neon.tech) (مجاني) أو [Supabase](https://supabase.com) أو Vercel Postgres.

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
```

#### 3. ارفع لـ Vercel

```bash
npm install -g vercel
vercel
```

أضف متغيرات البيئة في لوحة Vercel:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL=https://your-app.vercel.app`

#### 4. شغّل Migration و Seed

```bash
vercel env pull .env
npx prisma db push
npx tsx prisma/seed.ts
```

---

## الطريقة الرابعة: Windows Server مع IIS

#### 1. ثبت Node.js و IIS
- حمّل Node.js 20+ من nodejs.org
- فعّل IIS من Server Manager → Add Roles → Web Server

#### 2. ثبت [iisnode](https://github.com/Azure/iisnode)
```
https://github.com/Azure/iisnode/releases
```

#### 3. انقل المشروع وابنِه

```powershell
cd C:\inetpub\wwwroot\platform
bun install
bun run build
bun run db:push
bun run db:seed
```

#### 4. أنشئ `web.config`

```xml
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="StaticContent" stopProcessing="true">
          <match url="^public/(.*)" />
          <action type="None" />
        </rule>
        <rule name="DynamicContent">
          <match url="/*" />
          <action type="Rewrite" url="server.js" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

---

## بعد النشر: قائمة التحقق

- [ ] الموقع يفتح على `https://yourdomain.com`
- [ ] تسجيل دخول المدير يعمل: `admin@platform.edu` / `Admin@12345`
- [ ] **غيّر كلمة مرور المدير فورًا** من الملف الشخصي
- [ ] تسجيل دخول الطالب يعمل
- [ ] إنشاء مقارنة جديدة يعمل
- [ ] الحفظ التلقائي للإجابات يعمل
- [ ] إرسال التحليل للإدارة يعمل
- [ ] لوحة الإدارة تظهر كل الأقسام
- [ ] التقارير والرسوم البيانية تعرض
- [ ] تصدير PDF و Excel يعمل
- [ ] الوضع الداكن يعمل
- [ ] الموقع متجاوب على الهاتف

---

## الأمان في الإنتاج

### 1. غيّر كلمة مرور المدير الافتراضية
```bash
# سجّل دخول كمدير ثم:
الملف الشخصي → تعديل → كلمة مرور جديدة
```

أو عبر API:
```bash
curl -X PUT http://localhost:3000/api/admin/students/ADMIN_ID \
  -H "Content-Type: application/json" \
  -d '{"resetPassword":"YourStrongPassword123"}'
```

### 2. أنشئ NEXTAUTH_SECRET قوي
```bash
openssl rand -base64 48
```

### 3. فعّل HTTPS
استخدم دائمًا SSL (Let's Encrypt مجاني). بدون HTTPS:
- كلمات المرور تُرسل بنص واضح
- JWT tokens يمكن اعتراضها
- المتصفحات تُظهر تحذيرات أمنية

### 4. قيّد الوصول لقاعدة البيانات
- لا تُعرّض منفذ PostgreSQL للإنترنت
- استخدم جدار حماية (ufw/firewalld)

### 5. النسخ الاحتياطي الدوري
```bash
# أضف لـ crontab للنسخ اليومي
0 3 * * * docker compose exec app cat /app/data/platform.db > /backups/db-$(date +\%Y\%m\%d).db
```

---

## استكشاف الأخطاء

### المشكلة: `EADDRINUSE: address already in use 0.0.0.0:3000`
منفذ 3000 مشغول. أوقف العملية أو غيّر المنفذ:
```bash
# ابحث عن العملية
lsof -i :3000
# أو غيّر المنفذ
PORT=3001 docker compose up -d
```

### المشكلة: `PrismaClientInitializationError`
قاعدة البيانات غير موجودة. شغّل:
```bash
bun run db:push
bun run db:seed
```

### المشكلة: صفحة بيضاء / 404
تأكد أن `.next/standalone` يحتوي على `.next/static` و `public`:
```bash
ls .next/standalone/.next/static  # يجب أن يكون موجودًا
ls .next/standalone/public        # يجب أن يكون موجودًا
```

### المشكلة: `NEXTAUTH_SECRET` غير معرّف
أضفه لملف `.env` وأعد تشغيل الحاوية:
```bash
echo 'NEXTAUTH_SECRET="'$(openssl rand -base64 48)'"' >> .env
docker compose restart
```

### المشكلة: لا تظهر الأسئلة للطلاب
شغّل السكريبت لضمان وجود البيانات الأولية:
```bash
docker compose exec app bunx tsx prisma/seed.ts
```

### المشكلة: الخطوط العربية لا تظهر
تأكد أن اتصال الإنترنت يعمل (خط Cairo يُحمّل من Google Fonts). للعمل دون إنترنت:
```bash
# حمّل الخط محليًا
mkdir -p public/fonts
# ضع ملف Cairo-Regular.woff2 في المجلد
# ثم حدّث layout.tsx لاستخدام مسار محلي
```

---

## بيانات الاتصال الافتراضية

| الدور | البريد | كلمة المرور |
|---|---|---|
| **مدير** | `admin@platform.edu` | `Admin@12345` |
| طالب | `ahmed@demo.edu` | `Student@123` |
| طالب | `sara@demo.edu` | `Student@123` |
| طالب | `khaled@demo.edu` | `Student@123` |

> ⚠️ **مهم:** غيّر كلمة مرور المدير فور أول تسجيل دخول، واحذف حسابات الطلاب التجريبية من لوحة الإدارة.

---

## بنية الملفات للنشر

```
platform/
├── .env.example          # مثال لمتغيرات البيئة (انسخه إلى .env)
├── .env                  # متغيراتك الفعلية (لا ترفعه لـ Git)
├── .gitignore
├── .dockerignore
├── Dockerfile            # بناء Docker متعدد المراحل
├── docker-compose.yml    # تشغيل بـ Docker Compose
├── next.config.ts        # إعداد Next.js (standalone + أمان)
├── package.json
├── prisma/
│   ├── schema.prisma     # مخطط قاعدة البيانات (17 جدول)
│   └── seed.ts           # البيانات الأولية
├── public/
│   └── logo.svg
├── src/
│   ├── app/              # صفحات + API routes
│   ├── components/        # مكونات React
│   └── lib/              # أدوات مساعدة
└── DEPLOYMENT.md         # هذا الملف
```

---

## الدعم

- **ملف README.md:** توثيق كامل للميزات والبنية
- **ملف DEPLOYMENT.md:** هذا الملف — دليل النشر
- الكود مُعلّق بالعربية في الأماكن الحرجة
