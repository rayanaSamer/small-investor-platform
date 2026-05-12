// pages/Home.tsx
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Wallet,
  Target,
  Users,
  Trophy,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Zap,
  BarChart3,
  PiggyBank,
} from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { supabase } from "../lib/supabase";

export function Home() {
  const { language, darkMode } = useSettings();
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const isRTL = language === "ar";

  const dm = darkMode;

  /* ── colour tokens ── */
  const txt = dm ? "text-white" : "text-gray-900";
  const sub = dm ? "text-gray-400" : "text-gray-500";

  const glassCard = dm
    ? "bg-white/[0.04] border-white/[0.08] backdrop-blur-xl"
    : "bg-white/70 border-white/60 backdrop-blur-xl shadow-lg shadow-black/[0.03]";

  const glassCardHover = dm
    ? "hover:bg-white/[0.07] hover:border-white/[0.14]"
    : "hover:bg-white/90 hover:shadow-xl";

  /* ── live stats from database ── */
  const [userCount, setUserCount] = useState(0);
  const [txCount, setTxCount] = useState(0);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const [usersRes, txRes, postsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("transactions").select("id", { count: "exact", head: true }),
        supabase.from("community_posts").select("id", { count: "exact", head: true }),
      ]);
      setUserCount(usersRes.count ?? 0);
      setTxCount(txRes.count ?? 0);
      setPostCount(postsRes.count ?? 0);
    };
    fetchStats();
  }, []);

  const stats = [
    {
      value: `${userCount}+`,
      label: t("مستخدم مسجّل", "Registered Users"),
      icon: Users,
      gradient: "from-[#2878C8] to-[#5DADE2]",
      glow: "shadow-[#2878C8]/25",
    },
    {
      value: `${txCount}+`,
      label: t("معاملة مالية", "Financial Transactions"),
      icon: TrendingUp,
      gradient: "from-[#1A8A5A] to-[#2ECC71]",
      glow: "shadow-[#1A8A5A]/25",
    },
    {
      value: `${postCount}+`,
      label: t("منشور في المجتمع", "Community Posts"),
      icon: BarChart3,
      gradient: "from-[#E8A830] to-[#F5C542]",
      glow: "shadow-[#E8A830]/25",
    },
  ];

  /* ── features ── */
  const features = [
    {
      icon: Wallet,
      title: t("إدارة الميزانية", "Budget Management"),
      description: t(
        "تتبع دخلك ومصروفاتك بسهولة مع تقارير ورسوم بيانية واضحة",
        "Track your income and expenses easily with detailed reports and charts"
      ),
      gradient: "from-[#2878C8] to-[#5DADE2]",
    },
    {
      icon: TrendingUp,
      title: t("محاكاة الاستثمار", "Investment Simulator"),
      description: t(
        "تعلم أساسيات الاستثمار بدون مخاطر مالية حقيقية",
        "Learn the basics of investing in a risk-free environment"
      ),
      gradient: "from-[#1A8A5A] to-[#2ECC71]",
    },
    {
      icon: Trophy,
      title: t("نظام المكافآت", "Rewards System"),
      description: t(
        "اكسب نقاط وشارات من خلال عادات مالية صحية",
        "Earn points and badges through healthy financial habits"
      ),
      gradient: "from-[#E8A830] to-[#F5C542]",
    },
    {
      icon: Users,
      title: t("مجتمع تفاعلي", "Interactive Community"),
      description: t(
        "شارك تجاربك وتعلم من الآخرين",
        "Share experiences and learn from others"
      ),
      gradient: "from-[#5B3D8F] to-[#7D5CB8]",
    },
    {
      icon: Target,
      title: t("أهداف ادخارية", "Savings Goals"),
      description: t(
        "حدد أهدافك المالية وتابع تقدمك خطوة بخطوة",
        "Set financial goals and track your progress step by step"
      ),
      gradient: "from-[#1B5FA0] to-[#2878C8]",
    },
  ];

  /* ── trust points ── */
  const trustPoints = [
    {
      icon: Shield,
      title: t("بيئة آمنة", "Safe Environment"),
      desc: t("بدون أموال حقيقية — تعلم بثقة", "No real money — learn with confidence"),
    },
    {
      icon: Zap,
      title: t("سهل الاستخدام", "Easy to Use"),
      desc: t("واجهة بسيطة مصممة للشباب", "Simple interface designed for youth"),
    },
    {
      icon: PiggyBank,
      title: t("عادات مالية", "Financial Habits"),
      desc: t("ابنِ عادات ادخار واستثمار صحية", "Build healthy saving & investing habits"),
    },
  ];

  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen overflow-hidden">

      {/* ═══════ HERO ═══════ */}
      <section className="relative py-24 md:py-32 px-4">
        {/* Background decorative blobs */}
        {dm && (
          <>
            <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-[#2878C8]/[0.08] blur-[120px] pointer-events-none" />
            <div className="absolute top-40 right-1/4 w-[400px] h-[400px] rounded-full bg-[#1A8A5A]/[0.06] blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 w-[350px] h-[350px] rounded-full bg-[#E8A830]/[0.04] blur-[100px] pointer-events-none" />
          </>
        )}

        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 text-sm font-medium border ${
                dm
                  ? "bg-[#2878C8]/10 border-[#2878C8]/20 text-[#5DADE2]"
                  : "bg-[#2878C8]/5 border-[#2878C8]/20 text-[#2878C8]"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {t(
                  "منصة تعليمية آمنة للاستثمار",
                  "Safe Educational Investment Platform"
                )}
              </span>
            </div>

            {/* Heading */}
            <h1
              className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 ${txt}`}
            >
              {t("ابدأ رحلتك المالية", "Start Your Financial")}
              <br />
              {t("مع ", "Journey with ")}
              <span className="bg-gradient-to-r from-[#2878C8] via-[#5DADE2] to-[#1A8A5A] bg-clip-text text-transparent">
                {t("حاصد", "Hasid")}
              </span>
            </h1>

            {/* Sub-heading */}
            <p
              className={`text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed ${sub}`}
            >
              {t(
                "منصة ذكية لمساعدة الشباب على إدارة ميزانيتهم الشخصية وتعلم أساسيات الادخار والاستثمار بطريقة سهلة وآمنة",
                "A smart platform to help young people manage their budget and learn the basics of saving and investing safely"
              )}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-white rounded-2xl transition-all bg-gradient-to-r from-[#2878C8] to-[#1B5FA0] shadow-lg shadow-[#2878C8]/25 hover:shadow-xl hover:shadow-[#2878C8]/35"
                >
                  {t("ابدأ الآن مجاناً", "Start Now for Free")}
                  <Arrow className="w-4 h-4" />
                </motion.button>
              </Link>
              <Link to="/investment">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold rounded-2xl border transition-all ${
                    dm
                      ? "border-white/10 text-gray-200 hover:bg-white/[0.06] hover:border-white/20"
                      : "border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300"
                  }`}
                >
                  {t("تعرف على المحاكي", "Check the Simulator")}
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* ── Stats Row ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-20 max-w-3xl mx-auto"
          >
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className={`relative rounded-2xl border p-6 text-center transition-all duration-300 ${glassCard} ${glassCardHover} ${dm ? `shadow-lg ${stat.glow}` : ""}`}
                >
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} mb-3`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div
                    className={`text-3xl font-bold mb-1 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                  >
                    {stat.value}
                  </div>
                  <div className={`text-sm ${sub}`}>{stat.label}</div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section className="relative py-24 px-4">
        {dm && (
          <div className="absolute inset-0 bg-white/[0.01]" />
        )}

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className={`text-3xl md:text-4xl font-bold mb-4 ${txt}`}
            >
              {t("مميزات المنصة", "Platform Features")}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className={`text-lg ${sub}`}
            >
              {t(
                "كل ما تحتاجه لبناء مستقبل مالي آمن",
                "Everything you need to build a secure financial future"
              )}
            </motion.p>
          </div>

          {/* الصف الأول: كرتين كبار بشكل أفقي */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {features.slice(0, 2).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  viewport={{ once: true }}
                >
                  <div
                    className={`group h-full rounded-2xl border p-8 transition-all duration-300 flex items-start gap-5 ${glassCard} ${glassCardHover}`}
                  >
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold mb-2 ${txt}`}>
                        {feature.title}
                      </h3>
                      <p className={`text-sm leading-relaxed ${sub}`}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* الصف الثاني: 3 كروت متساوية */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {features.slice(2).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index + 2}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: (index + 2) * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  viewport={{ once: true }}
                >
                  <div
                    className={`group h-full rounded-2xl border p-6 text-center transition-all duration-300 ${glassCard} ${glassCardHover}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 mx-auto transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className={`text-lg font-bold mb-2 ${txt}`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${sub}`}>
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ TRUST SECTION ═══════ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {trustPoints.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`rounded-2xl border p-6 text-center transition-all duration-300 ${glassCard} ${glassCardHover}`}
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                      dm ? "bg-white/[0.06]" : "bg-[#2878C8]/5"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        dm ? "text-[#5DADE2]" : "text-[#2878C8]"
                      }`}
                    />
                  </div>
                  <h3 className={`font-bold mb-1 ${txt}`}>{item.title}</h3>
                  <p className={`text-sm ${sub}`}>{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden p-10 md:p-14 text-center"
            style={{
              background:
                "linear-gradient(135deg, #1B5FA0 0%, #2878C8 40%, #5DADE2 100%)",
            }}
          >
            <div className="absolute inset-0 bg-white/[0.06] backdrop-blur-sm" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {t(
                  "هل أنت مستعد لبدء رحلتك المالية؟",
                  "Ready to start your financial journey?"
                )}
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                {t(
                  "انضم إلى مئات الشباب السعوديين الذين يبنون مستقبلهم المالي اليوم",
                  "Join hundreds of young people building their financial future today"
                )}
              </p>
              <Link to="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold bg-white text-gray-900 rounded-2xl transition-all shadow-lg hover:shadow-xl"
                >
                  {t("ابدأ التعلم الآن", "Start Learning Now")}
                  <Arrow className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
