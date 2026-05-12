// pages/Home.tsx
import { Link } from "react-router-dom";
import { TrendingUp, Wallet, Target, Users, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useSettings } from "../contexts/SettingsContext";

export function Home() {
  const { language, darkMode } = useSettings();
  const t = (ar: string, en: string) => language === "ar" ? ar : en;

  const dm   = darkMode;
  const txt  = dm ? "text-gray-100" : "text-gray-900";
  const sub  = dm ? "text-gray-400" : "text-gray-600";
  const card = dm ? "bg-gray-800 border-gray-700" : "bg-white/80 border-gray-200";

  const stats = [
    { value: "500+",  label: t("مستخدم نشط","Active Users") },
    { value: "1000+", label: t("هدف مالي محقق","Financial Goals Achieved") },
    { value: "95%",   label: t("نسبة رضا المستخدمين","User Satisfaction") },
  ];

  const features = [
    {
      icon: Wallet,
      title: t("إدارة الميزانية","Budget Management"),
      description: t(
        "تتبع دخلك ومصروفاتك بسهولة مع تقارير ورسوم بيانية واضحة",
        "Track your income and expenses easily with detailed reports and charts"
      ),
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: TrendingUp,
      title: t("محاكاة الاستثمار","Investment Simulator"),
      description: t(
        "تعلم أساسيات الاستثمار بدون مخاطر مالية حقيقية",
        "Learn the basics of investing in a risk-free environment"
      ),
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      icon: Trophy,
      title: t("نظام المكافآت","Rewards System"),
      description: t(
        "اكسب نقاط وشارات من خلال عادات مالية صحية",
        "Earn points and badges through healthy financial habits"
      ),
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Users,
      title: t("مجتمع تفاعلي","Interactive Community"),
      description: t(
        "شارك تجاربك وتعلم من الآخرين",
        "Share experiences and learn from others"
      ),
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: Target,
      title: t("أهداف ادخارية","Savings Goals"),
      description: t(
        "حدد أهدافك المالية وتابع تقدمك خطوة بخطوة",
        "Set financial goals and track your progress step by step"
      ),
      gradient: "from-indigo-500 to-purple-500",
    },
  ];

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"} className="min-h-screen">

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${dm ? "bg-emerald-900/50 text-emerald-400" : "bg-emerald-100 text-emerald-700"}`}>
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">{t("منصة تعليمية آمنة للاستثمار","Safe Educational Investment Platform")}</span>
            </div>

            <h1 className={`text-5xl md:text-6xl font-bold mb-6 ${txt}`}>
              {t("ابدأ رحلتك المالية مع ","Start Your Financial Journey with ")}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {t("المستثمر الصغير","The Young Investor")}
              </span>
            </h1>

            <p className={`text-xl mb-8 max-w-3xl mx-auto ${sub}`}>
              {t(
                "منصة ذكية لمساعدة الشباب على إدارة ميزانيتهم الشخصية وتعلم أساسيات الادخار والاستثمار بطريقة سهلة وآمنة",
                "A smart platform to help young people manage their budget and learn the basics of saving and investing safely."
              )}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard"
                className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md shadow-emerald-200/40">
                {t("ابدأ الآن مجاناً","Start Now for Free")}
              </Link>
              <Link to="/investment"
                className={`inline-flex items-center justify-center px-8 py-3 text-lg font-semibold rounded-xl border transition-all ${dm ? "border-gray-600 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                {t("تعرف على المحاكي","Check the Simulator")}
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            {stats.map((stat, i) => (
              <div key={i} className={`rounded-2xl border backdrop-blur p-6 text-center ${dm ? "bg-gray-800/60 border-gray-700" : "bg-white/60 border-gray-200"}`}>
                <div className="text-4xl font-bold text-emerald-500 mb-2">{stat.value}</div>
                <div className={sub}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-20 px-4 ${dm ? "bg-gray-800/40" : "bg-white/40"}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${txt}`}>{t("مميزات المنصة","Platform Features")}</h2>
            <p className={`text-xl ${sub}`}>{t("كل ما تحتاجه لبناء مستقبل مالي آمن","Everything you need to build a secure financial future")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }}>
                  <div className={`h-full rounded-2xl border p-6 backdrop-blur hover:shadow-lg transition-shadow ${card}`}>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${txt}`}>{feature.title}</h3>
                    <p className={sub}>{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 p-12 shadow-xl shadow-emerald-200/30">
            <h2 className="text-4xl font-bold text-white mb-4">
              {t("هل أنت مستعد لبدء رحلتك المالية؟","Ready to start your financial journey?")}
            </h2>
            <p className="text-xl text-emerald-50 mb-8">
              {t(
                "انضم إلى مئات الشباب السعوديين الذين يبنون مستقبلهم المالي اليوم",
                "Join hundreds of young people building their financial future today"
              )}
            </p>
            <Link to="/dashboard"
              className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold bg-white text-emerald-600 hover:bg-gray-100 rounded-xl transition-all shadow-md">
              {t("ابدأ التعلم الآن","Start Learning Now")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
