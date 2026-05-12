import { useSettings } from "../contexts/SettingsContext";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, ArrowLeft, FileText, GraduationCap, Banknote, Users, AlertTriangle, Scale, RefreshCw, ShieldAlert } from "lucide-react";

export function Terms() {
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
      icon: <GraduationCap className="w-4.5 h-4.5 text-[#2878C8]" />,
      iconBg: dm ? "bg-[#2878C8]/10" : "bg-[#2878C8]/8",
      title: t("طبيعة التطبيق", "Nature of the App"),
      items: [
        t("حاصد هو تطبيق تعليمي يهدف لتعليم أساسيات الاستثمار والتداول", "Hasid is an educational app designed to teach the basics of investing and trading"),
        t("جميع عمليات التداول تتم بأموال افتراضية لأغراض التعلم فقط", "All trading operations are done with virtual money for learning purposes only"),
        t("التطبيق لا يقدّم نصائح مالية أو استثمارية حقيقية", "The app does not provide real financial or investment advice"),
        t("أسعار الأسهم والبيانات المعروضة قد تكون تقريبية أو متأخرة ولا تصلح لاتخاذ قرارات مالية حقيقية", "Stock prices and displayed data may be approximate or delayed and are not suitable for real financial decisions"),
      ],
    },
    {
      icon: <Banknote className="w-4.5 h-4.5 text-[#1A8A5A]" />,
      iconBg: dm ? "bg-[#1A8A5A]/10" : "bg-[#1A8A5A]/8",
      title: t("الأموال الافتراضية", "Virtual Money"),
      items: [
        t("الرصيد والأرباح في التطبيق افتراضية بالكامل وليس لها قيمة مالية حقيقية", "Balance and profits in the app are entirely virtual and have no real monetary value"),
        t("لا يمكن تحويل الأموال الافتراضية إلى أموال حقيقية بأي شكل", "Virtual money cannot be converted to real money in any way"),
        t("النقاط والمكافآت هي لأغراض التحفيز والتعلم فقط", "Points and rewards are for motivation and learning purposes only"),
        t("حاصد لا يطلب منك أي بيانات مالية حقيقية (بطاقات بنكية، حسابات مصرفية)", "Hasid does not ask for any real financial data (bank cards, bank accounts)"),
      ],
    },
    {
      icon: <Users className="w-4.5 h-4.5 text-[#5B3D8F]" />,
      iconBg: dm ? "bg-[#5B3D8F]/10" : "bg-[#5B3D8F]/8",
      title: t("سلوك المجتمع", "Community Conduct"),
      items: [
        t("يجب أن تكون المنشورات والتعليقات محترمة وخالية من الإساءة", "Posts and comments must be respectful and free from abuse"),
        t("يُمنع نشر محتوى مضلل أو نصائح مالية حقيقية قد تضر بالآخرين", "Publishing misleading content or real financial advice that may harm others is prohibited"),
        t("يُمنع مشاركة معلومات شخصية حساسة في المنشورات العامة", "Sharing sensitive personal information in public posts is prohibited"),
        t("يحق لنا حذف أي محتوى يخالف هذه القواعد دون إشعار مسبق", "We reserve the right to remove any content that violates these rules without prior notice"),
        t("التعاون والمساعدة بين الأعضاء هو جوهر مجتمع حاصد", "Collaboration and helping each other is the essence of the Hasid community"),
      ],
    },
    {
      icon: <ShieldAlert className="w-4.5 h-4.5 text-[#E8A830]" />,
      iconBg: dm ? "bg-[#E8A830]/10" : "bg-[#E8A830]/8",
      title: t("حسابك ومسؤولياتك", "Your Account & Responsibilities"),
      items: [
        t("أنت مسؤول عن الحفاظ على أمان حسابك وكلمة المرور", "You are responsible for keeping your account and password secure"),
        t("يجب أن تكون المعلومات التي تقدمها صحيحة ودقيقة", "The information you provide must be accurate and truthful"),
        t("لا يُسمح بإنشاء أكثر من حساب واحد لنفس الشخص", "Creating more than one account per person is not allowed"),
        t("يجب أن يكون عمرك 13 سنة على الأقل لاستخدام التطبيق", "You must be at least 13 years old to use the app"),
      ],
    },
    {
      icon: <AlertTriangle className="w-4.5 h-4.5 text-red-400" />,
      iconBg: dm ? "bg-red-500/10" : "bg-red-50",
      title: t("إخلاء المسؤولية", "Disclaimer"),
      items: [
        t("حاصد لا يتحمّل مسؤولية أي قرارات مالية حقيقية تُتخذ بناءً على ما تعلمته في التطبيق", "Hasid is not responsible for any real financial decisions made based on what you learned in the app"),
        t("النتائج في التداول الافتراضي لا تعكس بالضرورة ما سيحدث في الأسواق الحقيقية", "Results in virtual trading do not necessarily reflect what would happen in real markets"),
        t("التطبيق مقدّم \"كما هو\" وقد يحتوي على أخطاء تقنية أو انقطاعات مؤقتة", "The app is provided \"as is\" and may contain technical errors or temporary interruptions"),
        t("ننصحك دائماً باستشارة مختص مالي مرخّص قبل اتخاذ أي قرارات استثمارية حقيقية", "We always recommend consulting a licensed financial advisor before making any real investment decisions"),
      ],
    },
    {
      icon: <Scale className="w-4.5 h-4.5 text-[#2878C8]" />,
      iconBg: dm ? "bg-[#2878C8]/10" : "bg-[#2878C8]/8",
      title: t("الإيقاف والإنهاء", "Suspension & Termination"),
      items: [
        t("يحق لنا إيقاف أو حذف حسابك في حال مخالفة هذه الشروط", "We reserve the right to suspend or delete your account if you violate these terms"),
        t("يمكنك حذف حسابك في أي وقت من صفحة الإعدادات", "You can delete your account at any time from the settings page"),
        t("عند حذف الحساب، تُحذف جميع بياناتك بشكل نهائي", "When you delete your account, all your data is permanently deleted"),
      ],
    },
    {
      icon: <RefreshCw className="w-4.5 h-4.5 text-[#1A8A5A]" />,
      iconBg: dm ? "bg-[#1A8A5A]/10" : "bg-[#1A8A5A]/8",
      title: t("تعديل الشروط", "Modifying Terms"),
      items: [
        t("يحق لنا تعديل هذه الشروط في أي وقت", "We reserve the right to modify these terms at any time"),
        t("سنُعلمك بالتغييرات الجوهرية عبر إشعار في التطبيق", "We will notify you of significant changes via an in-app notification"),
        t("استمرارك في استخدام التطبيق بعد التعديل يعني موافقتك على الشروط الجديدة", "Continued use of the app after modification means you agree to the new terms"),
      ],
    },
  ];

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}
      className="min-h-screen py-6 md:py-10 px-4 md:px-8 transition-colors relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -right-32 w-96 h-96 bg-[#5B3D8F]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -left-32 w-80 h-80 bg-[#2878C8]/6 rounded-full blur-3xl" />
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
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${dm ? "bg-[#5B3D8F]/10" : "bg-[#5B3D8F]/8"}`}>
              <FileText className="w-5 h-5 text-[#5B3D8F]" />
            </div>
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold ${txt}`}>{t("شروط الاستخدام", "Terms of Use")}</h1>
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
              "باستخدامك لتطبيق حاصد، فإنك توافق على الشروط التالية. يرجى قراءتها بعناية. حاصد هو منصة تعليمية تفاعلية تُعلّمك الاستثمار والتداول بأموال افتراضية في بيئة آمنة وممتعة.",
              "By using the Hasid app, you agree to the following terms. Please read them carefully. Hasid is an interactive educational platform that teaches you investing and trading with virtual money in a safe and enjoyable environment."
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
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5B3D8F]/50 mt-1.5 flex-shrink-0" />
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
          transition={{ delay: 0.55 }}
          className={`rounded-2xl border p-5 mt-5 ${glass}`}
        >
          <p className={`text-sm ${sub}`}>
            {t(
              "إذا كان لديك أي استفسار حول شروط الاستخدام، يمكنك التواصل معنا عبر البريد الإلكتروني على ",
              "If you have any questions about these terms, you can contact us via email at "
            )}
            <span className="text-[#2878C8] font-medium">support@hasid.app</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
