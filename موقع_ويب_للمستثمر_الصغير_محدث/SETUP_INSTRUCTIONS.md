# تعليمات الإعداد - المستثمر الصغير

## المتطلبات الأساسية

هذا المشروع يحتاج إلى Supabase للعمل بشكل كامل. يوفر Supabase:
- نظام المصادقة (تسجيل الدخول/التسجيل)
- قاعدة البيانات لحفظ بيانات المستخدمين
- تسجيل الدخول عبر Google

## خطوات الإعداد

### 1. إنشاء مشروع Supabase

1. اذهب إلى [supabase.com](https://supabase.com)
2. قم بإنشاء حساب جديد أو سجل الدخول
3. أنشئ مشروع جديد (New Project)
4. احفظ معلومات المشروع:
   - **Project URL**: سيكون بصيغة `https://xxxxx.supabase.co`
   - **Anon Key**: من قسم Settings > API

### 2. تفعيل Google Authentication (اختياري)

لتفعيل تسجيل الدخول عبر Google:

1. في لوحة تحكم Supabase، اذهب إلى: **Authentication > Providers**
2. فعّل **Google** provider
3. اتبع التعليمات في [Supabase Google Auth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
4. ستحتاج إلى:
   - إنشاء مشروع في Google Cloud Console
   - تفعيل Google OAuth API
   - إضافة Client ID و Client Secret في Supabase

### 3. إعداد المتغيرات البيئية

1. انسخ ملف `.env.example` إلى `.env`:
   ```bash
   cp .env.example .env
   ```

2. افتح ملف `.env` وأضف معلومات مشروع Supabase:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. تشغيل المشروع

```bash
npm run dev
```

## الميزات المتاحة

### ✅ بدون تسجيل دخول:
- الصفحة الرئيسية
- عرض الإحصائيات العامة

### ✅ بعد تسجيل الدخول:
- **لوحة التحكم**: إدارة الميزانية الشخصية
- **محاكي الاستثمار**: التداول بأموال افتراضية
- **المنتجات المالية**: تصفح المنتجات الاستثمارية
- **المجتمع**: مشاركة التجارب والتحديات
- **الإنجازات**: نظام المكافآت والنقاط
- **الملف الشخصي**: إدارة البيانات الشخصية

## طرق تسجيل الدخول

1. **البريد الإلكتروني وكلمة المرور**
   - قم بإنشاء حساب جديد من صفحة التسجيل
   - سجل الدخول باستخدام بريدك الإلكتروني

2. **Google Sign-In** (يتطلب إعداد إضافي)
   - يجب تفعيل Google Provider في Supabase
   - اتبع التعليمات في الرابط أعلاه

## البيانات التعليمية

⚠️ **ملاحظة مهمة**: 
- جميع البيانات المالية في هذا التطبيق هي للأغراض التعليمية فقط
- الأسعار والمنتجات افتراضية ولا تمثل السوق الحقيقي
- لا تستخدم هذا التطبيق لاتخاذ قرارات استثمارية حقيقية

## المشاكل الشائعة

### لا يمكنني تسجيل الدخول
- تأكد من إضافة معلومات Supabase الصحيحة في ملف `.env`
- تأكد من أن المشروع يعمل على Supabase
- تحقق من Console في المتصفح لمعرفة الأخطاء

### تسجيل الدخول عبر Google لا يعمل
- تأكد من تفعيل Google Provider في Supabase
- تأكد من إضافة Redirect URL الصحيح في Google Cloud Console
- الرجوع إلى [دليل Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google)

## الدعم

للمساعدة والدعم:
- وثائق Supabase: [supabase.com/docs](https://supabase.com/docs)
- وثائق React Router: [reactrouter.com](https://reactrouter.com)
