import { useSettings } from "../contexts/SettingsContext";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, ArrowLeft, Shield, Database, Eye, UserCheck, Share2, Lock, Trash2, Bell } from "lucide-react";

export function Privacy() {
  const { darkMode, language } = useSettings();
  const navigate = useNavigate();
  const t = (ar: string, en: string) => language === "ar" ? ar : en;
  const dm = darkMode;
  const txt = dm ? "text-gray-100" : "text-gray-900";
  const sub = dm ? "text-gray-400" : "text-gray-500";
  const glass = dm
    ? "bg-white/[0.04] border-white/[0.08] backdrop-blur-xl"
    : "bg-white/70 border-white/60 backdrop-blur-xl shadow-lg";
  const BackArrow = language === "ar" ? ArrowRight : ArrowLeft;

  const sections = [
    {
      icon: <Database className="w-4.5 h-4.5 text-[#2878C8]" />,
      iconBg: dm ? "bg-[#2878C8]/10" : "bg-[#2878C8]/8",
      title: t("البيانات التي نجمعها", "Data We Collect"),
      items: [
        t("الاسم والبريد الإلكتروني عند إنشاء الحساب", "Name and email when creating an account"),
        t("العمر ورقم الجوال (اختياري) لتخصيص التجربة", "Age and phone number (optional) to personalize your experience"),
        t("بيانات التداول الافتراضي والمحفظة التعليمية", "Virtual trading data and educational portfolio"),
        t("النقاط والمستوى والإنجازات داخل التطبيق", "Points, level, and achievements within the app"),
        t("المنشورات والتعليقات في مجتمع حاصد", "Posts and comments in the Hasid community"),
      ],
    },
    {
      icon: <Eye className="w-4.5 h-4.5 text-[#1A8A5A]" />,
      iconBg: dm ? "bg-[#1A8A5A]/10" : "bg-[#1A8A5A]/8",
      title: t("كيف نستخدم بياناتك", "How We Use Your Data"),
      items: [
        t("تقديم تجربة تعليمية مخصصة حسب مستواك", "Delivering a personalized learning experience based on your level"),
        t("تتبع تقدمك في التعلم والإنجازات", "Tracking your learning progress and achievements"),
        t("تحسين المحتوى التعليمي والميزات", "Improving educational content and features"),
        t("إرسال إشعارات مهمة متعلقة بحسابك (إن فعّلتها)", "Sending important account notifications (if enabled)"),
        t("لا نستخدم بياناتك لأغراض إعلانية أو تسويقية", "We do not use your data for advertising or marketing purposes"),
      ],
    },
    {
      icon: <Lock className="w-4.5 h-4.5 text-[#5B3D8F]" />,
      iconBg: dm ? "bg-[#5B3D8F]/10" : "bg-[#5B3D8F]/8",
      title: t("حماية البيانات", "Data Protection"),
      items: [
        t("نستخدم تشفير SSL/TLS لجميع الاتصالات", "We use SSL/TLS encryption for all connections"),
        t("بياناتك مخزّنة بشكل آمن عبر خوادم Supabase المحمية", "Your data is securely stored on protected Supabase servers"),
        t("كلمات المرور مشفّرة ولا يمكن لأحد الاطلاع عليها", "Passwords are encrypted and inaccessible to anyone"),
        t("نطبّق أفضل الممارسات الأمنية لحماية معلوماتك", "We apply security best practices to protect your information"),
      ],
    },
    {
      icon: <Share2 className="w-4.5 h-4.5 text-[#E8A830]" />,
      iconBg: dm ? "bg-[#E8A830]/10" : "bg-[#E8A830]/8",
      title: t("مشاركة البيانات", "Data Sharing"),
      items: [
        t("لا نبيع أو نشارك بياناتك الشخصية مع أي طرف ثالث", "We do not sell or share your personal data with any third party"),
        t("خدمة Google تُستخدم فقط لتسجيل الدخول إن اخترت ذلك", "Google is only used for login if you choose that option"),
        t("قد نشارك إحصائيات مجمّعة (غير شخصية) لتحسين الخدمة", "We may share aggregated (non-personal) statistics to improve the service"),
        t("منشوراتك في المجتمع تكون مرئية لبقية المستخدمين", "Your community posts are visible to other users"),
      ],
    },
    {
      icon: <UserCheck className="w-4.5 h-4.5 text-[#2878C8]" />,
      iconBg: dm ? "bg-[#2878C8]/10" : "bg-[#2878C8]/8",
      title: t("حقوقك", "Your Rights"),
      items: [
        t("يمكنك تعديل بياناتك الشخصية في أي وقت من صفحة الملف الشخصي", "You can edit your personal data anytime from your profile page"),
        t("يمكنك حذف حسابك نهائياً من صفحة الإعدادات", "You can permanently delete your account from the settings page"),
        t("يمكنك التحكم بإشعارات البريد الإلكتروني من الإعدادات", "You can control email notifications from settings"),
        t("يحق لك طلب نسخة من بياناتك المخزّنة لدينا", "You have the right to request a copy of your stored data"),
      ],
    },
    {
      icon: <Bell className="w-4.5 h-4.5 text-[#1A8A5A]" />,
      iconBg: dm ? "bg-[#1A8A5A]/10" : "bg-[#1A8A5A]/8",
      title: t("التحديثات", "Updates"),
      items: [
        t("قد نحدّث هذه السياسة من وقت لآخر لتعكس تغييرات في خدماتنا", "We may update this policy periodically to reflect changes in our services"),
        t("سنُعلمك بأي تغييرات جوهرية عبر التطبيق أو البريد الإلكتروني", "We will notify you of any significant changes via the app or email"),
        t("استمرارك في استخدام التطبيق يعني موافقتك على السياسة المحدّثة", "Continued use of the app means you agree to the updated policy"),
      ],
    },
  ];

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}
      className="min-h-screen py-6 md:py-10 px-4 md:px-8 transition-colors relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -right-32 w-96 h-96 bg-[#2878C8]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -left-32 w-80 h-80 bg-[#5B3D8F]/6 rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => navigate(-1)}
            className={`flex items-center gap-1.5 text-sm mb-4 transition-colors ${sub} hover:text-[#2878C8]`}>
            <BackArrow className="w-4 h-4" />
            {t("رجوع", "Back")}
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${dm ? "bg-[#2878C8]/10" : "bg-[#2878C8]/8"}`}>
              <Shield className="w-5 h-5 text-[#2878C8]" />
            </div>
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold ${txt}`}>{t("سياسة الخصوصية", "Privacy Policy")}</h1>
              <p className={`text-sm mt-0.5 ${sub}`}>{t("آخر تحديث: مايو 2026", "Last updated: May 2026")}</p>
            </div>
          </div>
        </motion.div>

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl border p-5 mb-5 ${glass}`}
        >
          <p className={`text-sm leading-relaxed ${txt}`}>
            {t(
              "نحن في حاصد نهتم بخصوصيتك ونلتزم بحماية بياناتك الشخصية. هذه السياسة توضّح كيف نجمع ونستخدم ونحمي معلوماتك عند استخدامك لتطبيقنا التعليمي للاستثمار. حاصد هو منصة تعليمية بأموال افتراضية فقط ولا يتعامل مع أموال أو بيانات مالية حقيقية.",
              "At Hasid, we care about your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and protect your information when you use our educational investment app. Hasid is a learning platform using virtual money only and does not handle real financial data or funds."
            )}
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className={`rounded-2xl border p-5 ${glass}`}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${section.iconBg}`}>
                  {section.icon}
                </div>
                <h2 className={`text-base font-semibold ${txt}`}>{section.title}</h2>
              </div>
              <ul className="space-y-2">
                {section.items.map((item, j) => (
                  <li key={j} className={`flex items-start gap-2 text-sm ${sub}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2878C8]/50 mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`rounded-2xl border p-5 mt-5 ${glass}`}
        >
          <p className={`text-sm ${sub}`}>
            {t(
              "إذا كان لديك أي استفسار حول سياسة الخصوصية، يمكنك التواصل معنا عبر البريد الإلكتروني على ",
              "If you have any questions about this privacy policy, you can contact us via email at "
            )}
            <span className="text-[#2878C8] font-medium">support@hasid.app</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
