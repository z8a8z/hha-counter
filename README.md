# HHA — نظام إدارة العداد والعمليات

تطبيق ويب حديث وسهل الاستخدام لمتابعة العمليات المختلفة (المشتريات، الجاهز، الطلبيات، السحب، التالف، والمخزن، والتقارير)، مبني باستخدام **React 19 + Vite 6** وقاعدة بيانات **Supabase (PostgreSQL)**.

يتميز التطبيق بواجهة مستخدم كاملة باللغة العربية (RTL) مع الحفاظ على الأرقام باللغة الإنجليزية لتسهيل القراءة والعمليات الحسابية، كما يحتوي على نظام تسجيل دخول آمن ولوحة تحكم لإدارة المستخدمين من قِبل المدير (Admin) والمطور (Developer).

---

## مميزات النظام

| الميزة | الوصف |
| :--- | :--- |
| **واجهة عربية بالكامل** | واجهة مستخدم متناسقة ومصممة للغة العربية باتجاه من اليمين إلى اليسار (RTL). |
| **تبويبات العمليات** | لوحة تحكم تحتوي على تبويبات للمشتريات، الجاهز، الطلبيات، السحب، التالف، المخزن، والتقارير. |
| **نظام الصلاحيات والدخول** | حماية كاملة للصفحات؛ لا يمكن تصفح النظام إلا بعد تسجيل الدخول. |
| **إدارة المستخدمين** | يمكن للمدير (Admin) إضافة مستخدمين جدد وتعديل كلمات المرور الخاصة بهم عبر صفحة الإعدادات. |
| **صلاحيات مخصصة لكل مستخدم** | يمكن للمطور (Developer) تحديد التبويبات المسموحة لكل مستخدم على حدة وبشكل مرن. |
| **قاعدة بيانات سحابية** | يتم حفظ بيانات المستخدمين والعمليات بشكل فوري وآمن في Supabase. |
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
-- 1. إنشاء جدول المستخدمين
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

-- 2. إنشاء جدول صلاحيات المستخدمين المخصصة
CREATE TABLE IF NOT EXISTS public.user_permissions (
  user_id uuid PRIMARY KEY REFERENCES public.app_users(id) ON DELETE CASCADE,
  allowed_tabs text[] NOT NULL DEFAULT '{}'
);

-- تفعيل سياسات الحماية لجدول الصلاحيات
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for user_permissions" ON public.user_permissions FOR ALL USING (true) WITH CHECK (true);

-- 3. إنشاء دالة ومشعّل لإنشاء صلاحيات المستخدم الافتراضية تلقائياً عند الإضافة
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_permissions (user_id, allowed_tabs)
  VALUES (
    NEW.id,
    CASE 
      WHEN NEW.role = 'developer' THEN ARRAY['purchases', 'ready', 'orders', 'withdraw', 'damaged', 'storage', 'report']::text[]
      WHEN NEW.role = 'admin' THEN ARRAY['purchases', 'ready', 'orders', 'withdraw', 'damaged', 'storage', 'report']::text[]
      WHEN NEW.role = 'accountant' THEN ARRAY['purchases', 'storage', 'report']::text[]
      ELSE ARRAY['ready', 'orders']::text[]
    END
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON public.app_users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
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

## ⚖️ تكامل الميزان الإلكتروني (HHA Scale Bridge)

يحتوي المشروع على نظام جسر (Bridge) متكامل لربط الميزان الإلكتروني (TEM Scale) مع المتصفح محلياً عبر محاكاة ضغطات لوحة المفاتيح (Keyboard Emulation).

### المميزات:
1. **إدخال تلقائي وسريع**: عند ضغط زر "طباعة/تحدث" في الميزان، يتم تلقائياً قراءة الوزن وتحويل الكيلوغرامات إلى غرامات (Grams) وكتابتها مباشرة في حقل إدخال الوزن النشط في المتصفح.
2. **محاذاة التركيز والتنقل**: يدعم مفتاح `Enter` التلقائي لإنشاء حقل وزن رول جديد تلقائياً في واجهة قسم "جاهز" ونقل التركيز (Focus) إليه فورياً لبدء الوزن التالي.
3. **لوحة تحكم رسومية (GUI)**: تطبيق واجهة رسومية بسيطة للتحكم بالخدمة، ومراقبة منفذ الاتصال، واستعراض قراءات الميزان السابقة وسجل العمليات (Logs) دون الحاجة للتعامل مع الطرفية.

### متطلبات التشغيل (على جهاز Linux Mint المتصل بالميزان):
* حزمة `xdotool` لمحاكاة الضغطات.
* حزمة `pyserial` للاتصال بالميزان عبر USB.
* ميزان إلكتروني متصل عبر منفذ USB-B.

### خطوات التثبيت والتشغيل:
مجلد السكربت موجود محلياً في: `/home/zet8/Documents/barcode mirage delta/`

1. افتح الطرفية واذهب إلى مجلد السكربت:
   ```bash
   cd "/home/zet8/Documents/barcode mirage delta"
   ```
2. قم بتشغيل سكربت التثبيت التلقائي:
   ```bash
   sudo ./install_bridge.sh
   ```
   *يقوم السكربت تلقائياً بتثبيت المتطلبات، وتهيئة منفذ الميزان الإلكتروني وثباته (`/dev/scale_tem`)، وتسجيل الخدمة كخدمة خلفية (Systemd Service) وتثبيت أيقونة التطبيق في قائمة النظام.*

3. **التحكم بالخدمة**:
   * يمكنك فتح تطبيق **HHA Scale Bridge** مباشرة من قائمة التطبيقات (Applications Menu) في Linux Mint لتشغيل أو إيقاف الخدمة ومتابعة قراءات الميزان فورياً.

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
    │   ├── Home.jsx           # الصفحة الرئيسية المحتوية على تبويبات النظام
    │   ├── Settings.jsx       # صفحة إعدادات النظام للمدير والمطور
    │   └── UserManagement.jsx # واجهة إدارة وإضافة المستخدمين وتحديث كلمات المرور
    │
    ├── hooks/
    │   └── useAuth.jsx        # سياق (Context) التحقق وصلاحيات المستخدمين
    │
    └── lib/
        ├── supabase.js        # تهيئة والتحقق من اتصال عميل Supabase
        ├── database.js        # استعلامات قاعدة البيانات للمستخدمين والصلاحيات والبيانات
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
