# HHA — نظام إدارة العداد والعمليات

تطبيق ويب حديث وسهل الاستخدام لإدارة العداد ومتابعة العمليات المختلفة (العداد، المشتريات، الجاهز، السحب، التالف، والتقارير)، مبني باستخدام **React 19 + Vite 6** وقاعدة بيانات **Supabase (PostgreSQL)**.

يتميز التطبيق بواجهة مستخدم كاملة باللغة العربية (RTL) مع الحفاظ على الأرقام باللغة الإنجليزية لتسهيل القراءة والعمليات الحسابية، كما يحتوي على نظام تسجيل دخول آمن ولوحة تحكم لإدارة المستخدمين من قِبل المدير (Admin).

---

## مميزات النظام

| الميزة | الوصف |
| :--- | :--- |
| **واجهة عربية بالكامل** | واجهة مستخدم متناسقة ومصممة للغة العربية باتجاه من اليمين إلى اليسار (RTL). |
| **تبويبات العمليات** | لوحة تحكم تحتوي على تبويبات للعداد الأساسي، المشتريات، الجاهز، السحب، التالف، والتقارير. |
| **نظام الصلاحيات والدخول** | حماية كاملة للصفحات؛ لا يمكن تصفح النظام إلا بعد تسجيل الدخول. |
| **إدارة المستخدمين** | يمكن للمدير (Admin) إضافة مستخدمين جدد وتعديل كلمات المرور الخاصة بهم عبر صفحة الإعدادات. |
| **قاعدة بيانات سحابية** | يتم حفظ قيم العداد وبيانات المستخدمين بشكل فوري وآمن في Supabase. |
| **تصميم عصري متجاوب** | واجهة جذابة بتأثيرات بصرية حديثة (Glassmorphism) متوافقة مع جميع مقاسات الشاشات وأجهزة الكمبيوتر. |

---

## المتطلبات الأساسية (تثبت لمرة واحدة)

تمت كتابة هذه الإرشادات لتناسب نظام **Linux Mint / Ubuntu**.

### 1. تثبيت Node.js (الإصدار 18 أو أحدث)
افتح الطرفية (`Ctrl+Alt+T`) ونفّذ الأوامر التالية لتثبيت Node.js و npm:
```bash
# إضافة مستودع NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# تثبيت Node.js
sudo apt install -y nodejs

# التحقق من التثبيت
node --version   # يجب أن يظهر v20.x.x أو أحدث
npm --version    # يجب أن يظهر 10.x.x أو أحدث
```

### 2. تثبيت Git
```bash
sudo apt install -y git

# التحقق من التثبيت
git --version
```

### 3. إنشاء حساب Supabase
قم بزيارة موقع **[supabase.com](https://supabase.com)** وسجل الدخول باستخدام حساب GitHub الخاص بك (الخطة المجانية كافية تماماً).

---

## خطوات الإعداد والتشغيل

### الخطوة 1 — تحميل المشروع (Clone)
```bash
cd ~
git clone https://github.com/YOUR_USERNAME/hha-sys.git
cd hha-sys
```

### الخطوة 2 — تثبيت الحزم البرمجية
```bash
npm install
```

### الخطوة 3 — إعداد قاعدة البيانات في Supabase
1. من لوحة تحكم Supabase، قم بإنشاء مشروع جديد باسم `hha-sys`.
2. بعد اكتمال إنشاء المشروع، انتقل إلى **SQL Editor** من القائمة الجانبية اليسرى.
3. انقر على **New query** والصق السكربت التالي لتهيئة الجداول والمستخدم الافتراضي:

```sql
-- 1. إنشاء جدول العداد الأساسي
CREATE TABLE IF NOT EXISTS public.counter (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  value      INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- إدراج الصف الافتراضي للعداد بقيمة صفر
INSERT INTO public.counter (id, value)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- تفعيل سياسات الحماية لجداول العداد (RLS) وتسهيل الوصول العام
ALTER TABLE public.counter ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access" ON public.counter FOR SELECT USING (true);
CREATE POLICY "Allow insert" ON public.counter FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON public.counter FOR UPDATE USING (true);

-- 2. إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username text UNIQUE NOT NULL,
  password text NOT NULL, -- تُخزن مشفرة بصيغة SHA-256
  role text NOT NULL DEFAULT 'user',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- تفعيل سياسات الحماية لجدول المستخدمين وتسهيل العمليات للتطبيق
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for public" ON public.app_users FOR ALL USING (true) WITH CHECK (true);

-- إدراج حساب المدير الافتراضي وحساب المطور الافتراضي
-- كلمة المرور مشفرة هنا بنظام SHA-256 (كلمة المرور لكلا الحسابين هي: 0878)
INSERT INTO public.app_users (username, password, role)
VALUES 
  ('admin', 'f4c0cea75a69f325f85fa6c273d3fae5d0caafa7edd774881d64ed664f3cefeb', 'admin'),
  ('developer', 'f4c0cea75a69f325f85fa6c273d3fae5d0caafa7edd774881d64ed664f3cefeb', 'developer')
ON CONFLICT (username) DO NOTHING;

-- 3. إنشاء جدول صلاحيات الأدوار
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role text PRIMARY KEY,
  allowed_tabs text[] NOT NULL DEFAULT '{}'
);

-- تفعيل سياسات الحماية لجدول الصلاحيات
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for role_permissions" ON public.role_permissions FOR ALL USING (true) WITH CHECK (true);

-- إدراج الصلاحيات الافتراضية
INSERT INTO public.role_permissions (role, allowed_tabs) VALUES
  ('admin', '{"counter", "purchases", "ready", "orders", "withdraw", "damaged", "storage", "report"}'),
  ('accountant', '{"purchases", "storage", "report"}'),
  ('user', '{"counter", "ready", "orders"}')
ON CONFLICT (role) DO UPDATE SET allowed_tabs = EXCLUDED.allowed_tabs;
```
4. اضغط على زر **Run** لتنفيذ السكربت.

### الخطوة 4 — ربط التطبيق بقاعدة البيانات
1. في لوحة تحكم Supabase، اذهب إلى **Project Settings** (أيقونة الترس أسفل اليسار) ثم **API**.
2. انسخ قيمتي **Project URL** و **anon public API Key**.
3. قم بإنشاء ملف `.env` في المجلد الرئيسي للمشروع:
   ```bash
   cp .env.example .env
   ```
4. افتح الملف `.env` باستخدام أي محرر نصوص وضع القيم الخاصة بك:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### الخطوة 5 — تشغيل النظام محلياً
نفّذ الأمر التالي لبدء تشغيل خادم التطوير:
```bash
npm run dev
```
سيظهر لك رابط التشغيل المحلي (عادةً **http://localhost:5173**). افتحه في المتصفح لتجربة النظام!

---

## بيانات الدخول الافتراضية
* **حساب المطور (Developer):**
  * **اسم المستخدم:** `developer`
  * **كلمة المرور:** `0878`
* **حساب المدير (Admin):**
  * **اسم المستخدم:** `admin`
  * **كلمة المرور:** `0878`
* *تنويه: يمكن للمطور والمدير إدارة الحسابات وتعديل كلمات المرور أو الأدوار في أي وقت من خلال صفحة الإعدادات. المطور هو الوحيد الذي يملك صلاحية تعديل صلاحيات رؤية التبويبات (Permissions).*

---

## بنية وتوزيع المجلدات
```
hha-sys/
│
├── index.html                 # ملف البداية الرئيسي (معدّ لدعم اتجاه RTL)
├── package.json               # حزم وتكوينات المشروع
├── vite.config.js             # إعدادات Vite
├── .env.example               # نموذج لملف ربط قاعدة البيانات
├── .env                       # ملف الربط الفعلي الخاص بك (يتجاهله Git لأمانك)
│
└── src/
    ├── main.jsx               # نقطة الانطلاق لتطبيق React
    ├── App.jsx                # المكون الرئيسي (يشمل التوجيه Routes وحماية الصفحات)
    ├── App.css                # التنسيقات العامة والتصميم العصري (ألوان داكنة، تأثير الزجاج)
    │
    ├── components/
    │   ├── Header.jsx         # شريط التنقل العلوي (يتضمن شعار HHA وخروج/إعدادات)
    │   ├── Login.jsx          # صفحة تسجيل الدخول باللغة العربية
    │   ├── Home.jsx           # الصفحة الرئيسية المحتوية على التبويبات الستة
    │   ├── Counter.jsx        # تبويب العداد الأساسي وتفاعله مع قاعدة البيانات
    │   ├── Settings.jsx       # صفحة إعدادات النظام للمدير
    │   └── UserManagement.jsx # واجهة إدارة وإضافة المستخدمين وتحديث كلمات المرور
    │
    ├── hooks/
    │   ├── useCounter.js      # منطق الاتصال بعداد Supabase
    │   └── useAuth.jsx        # سياق (Context) التحقق وصلاحيات المستخدمين
    │
    └── lib/
        ├── supabase.js        # تهيئة والتحقق من اتصال عميل Supabase
        ├── database.js        # استعلامات قاعدة البيانات للعداد والمستخدمين
        ├── auth.js            # شفرة تشفير كلمات المرور باستخدام SHA-256
        └── debug.js           # نظام تسجيل وتتبع الأخطاء البرمجية في المتصفح
```

---

## أوامر التطوير والتشغيل
| الأمر | الوظيفة |
| :--- | :--- |
| `npm run dev` | تشغيل خادم التطوير المحلي. |
| `npm run build` | بناء وتجهيز التطبيق للإنتاج (Production). |
| `npm run preview` | معاينة نسخة الإنتاج محلياً للتأكد من خلوها من المشاكل. |

---

## 🤖 إرشادات وتوجيهات للذكاء الاصطناعي (AI Developer Guidelines)

إذا كنت نموذج ذكاء اصطناعي (AI Agent / Developer AI) تقوم بالتعديل على هذا المشروع، يجب عليك الالتزام بالقواعد التالية:

1. **واجهة المستخدم باللغة العربية**: جميع واجهات التطبيق، والملصقات، ونماذج الإدخال، ورسائل الخطأ والنجاح، يجب أن تكون باللغة العربية الفصحى (مع استخدام الأرقام الإنجليزية القياسية للعمليات الحسابية والسهولة).
2. **عدم مطابقة قاعدة البيانات (Schema Alignment)**:
   * تم حفظ الهيكل الكامل لقاعدة البيانات وجداولها وأعمدتها وأنواع البيانات في المجلد [database/schema.md](file:///home/zet8/HHA/hha-sys/database/schema.md).
   * يمنع منعاً باتاً إرسال كائنات Payload من الواجهة الأمامية بمفاتيح (keys) غير مطابقة تماماً لأسماء الأعمدة في قاعدة البيانات. يرجى الرجوع لملف المخطط المذكور قبل كتابة أي استعلام أو عملية إدخال/تعديل.
3. **بيئة التشغيل والتقنيات (Tech Stack)**:
   * المشروع مبني باستخدام: **React 19** + **Vite 6** + **Vanilla CSS** + **Supabase (PostgreSQL)** + **Cloudflare**.
   * الكود مرفوع على مستودع GitHub.
4. **تعديلات قاعدة البيانات (Database Changes)**:
   * المستخدم النهائي لا يملك المعرفة التقنية لتعديل قاعدة البيانات مباشرة عبر سطر الأوامر أو SQL Editor يدوياً.
   * في حال دعت الحاجة لتعديل أو إضافة جدول/أعمدة في قاعدة البيانات:
     1. يجب عليك تزويد المستخدم بأكواد الـ SQL الكاملة والجاهزة للنسخ.
     2. وجّه المستخدم بوضوح للذهاب إلى **Supabase SQL Editor** ولصق الكود وتشغيله.
     3. اطلب من المستخدم تحديث ملف توثيق قاعدة البيانات [database/schema.md](file:///home/zet8/HHA/hha-sys/database/schema.md) ليعكس التغييرات الجديدة.
5. **تحديث التوثيق (Documentation Updates)**: عند الانتهاء من أي تعديل أو إضافة ميزات جديدة، تأكد من تحديث ملف `README.md` إذا لزم الأمر.
