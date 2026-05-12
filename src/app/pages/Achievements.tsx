import { useState, useEffect } from "react";
import { Trophy, Star, Target, TrendingUp, Wallet, Award, Zap, Crown, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useNotifications } from "../contexts/NotificationsContext";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  points: number;
  gradient: string;
}

export function Achievements() {
  const { language, darkMode } = useSettings();
  const { user: authUser } = useAuth();
  const { addNotification } = useNotifications();
  const t = (ar: string, en: string) => language === "ar" ? ar : en;

  const dm = darkMode;

  const glass = dm
    ? "bg-white/[0.04] border-white/[0.08] backdrop-blur-xl"
    : "bg-white/70 border-white/60 backdrop-blur-xl shadow-lg";

  const glassInner = dm
    ? "bg-white/[0.04] border-white/[0.06]"
    : "bg-white/50 border-white/40";

  const txt  = dm ? "text-gray-100" : "text-gray-900";
  const sub  = dm ? "text-gray-400" : "text-gray-500";

  const [userLevel, setUserLevel]               = useState(1);
  const [userPoints, setUserPoints]             = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [portfolioExists, setPortfolioExists]   = useState(false);
  const [postCount, setPostCount]               = useState(0);
  const [loading, setLoading]                   = useState(true);
  const [leaderboard, setLeaderboard]           = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!authUser) { setLoading(false); return; }
      const uid = authUser.id;
      const [statsRes, txRes, portRes, postRes, lbStats] = await Promise.all([
        supabase.from("user_stats").select("level, points").eq("user_id", uid).single(),
        supabase.from("transactions").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("portfolios").select("user_id").eq("user_id", uid).maybeSingle(),
        supabase.from("community_posts").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("user_stats").select("user_id, level, points").order("points", { ascending: false }).limit(10),
      ]);
      const level    = statsRes.data?.level || 1;
      const points   = statsRes.data?.points || 0;
      const txCount  = txRes.count || 0;
      const portfolio = !!portRes.data;
      const postCnt  = postRes.count || 0;
      setUserLevel(level); setUserPoints(points);
      setTransactionCount(txCount); setPortfolioExists(portfolio);
      setPostCount(postCnt); setLoading(false);

      const prevUnlocked = JSON.parse(localStorage.getItem("hasad_unlocked") || "[]");
      const nowUnlocked: string[] = [];
      if (txCount >= 1)    nowUnlocked.push("أول خطوة");
      if (portfolio)       nowUnlocked.push("مستثمر مبتدئ");
      if (txCount >= 10)   nowUnlocked.push("مدخر ماهر");
      if (level >= 5)      nowUnlocked.push("محترف الاستثمار");
      if (postCnt >= 5)    nowUnlocked.push("ناشط مجتمعي");
      if (points >= 500)   nowUnlocked.push("جامع النقاط");
      if (points >= 10000) nowUnlocked.push("ملك الاستثمار");
      if (level >= 10)     nowUnlocked.push("خبير");
      nowUnlocked.forEach(badge => {
        if (!prevUnlocked.includes(badge)) {
          addNotification(`فتحت شارة جديدة: ${badge}`, `New badge unlocked: ${badge}`, "achievement");
        }
      });
      localStorage.setItem("hasad_unlocked", JSON.stringify(nowUnlocked));

      if (lbStats.data && lbStats.data.length > 0) {
        const userIds = lbStats.data.map((s: any) => s.user_id);
        const { data: profiles } = await supabase.from("profiles").select("id, name").in("id", userIds);
        const nameMap: Record<string, string> = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.name]));
        const mapped = lbStats.data.map((s: any, i: number) => ({
          rank: i + 1,
          name: s.user_id === uid ? t("أنت", "You") : (nameMap[s.user_id] || t("مستخدم", "User")),
          points: s.points,
          level: s.level,
          isCurrentUser: s.user_id === uid,
        }));
        setLeaderboard(mapped);
      }
    };
    load();
  }, [authUser?.id]);

  const nextLevelPoints = (userLevel) * 200;
  const levelProgress   = nextLevelPoints > 0 ? Math.min((userPoints / nextLevelPoints) * 100, 100) : 0;

  const achievements: Achievement[] = [
    { id:"1", title:t("أول خطوة","First Step"),            description:t("سجل أول عملية مالية","Log your first transaction"),                icon:Star,     unlocked:transactionCount>=1,  progress:Math.min(transactionCount,1), maxProgress:1, points:50,  gradient:"from-[#E8A830] to-[#F5C542]" },
    { id:"2", title:t("مستثمر مبتدئ","Beginner Investor"), description:t("قم بأول عملية استثمار","Make your first investment"),              icon:TrendingUp,unlocked:portfolioExists,  points:100, gradient:"from-[#1A8A5A] to-[#2ECC71]" },
    { id:"3", title:t("مدخر ماهر","Skilled Saver"),        description:t("سجل 10 عمليات مالية","Log 10 transactions"),       icon:Wallet,   unlocked:transactionCount>=10,  progress:Math.min(transactionCount,10), maxProgress:10, points:150, gradient:"from-[#2878C8] to-[#5DADE2]" },
    { id:"4", title:t("محترف الاستثمار","Investment Pro"),  description:t("اوصل للمستوى 5","Reach level 5"),         icon:Award,    unlocked:userLevel>=5, progress:Math.min(userLevel,5), maxProgress:5, points:200, gradient:"from-[#5B3D8F] to-[#7D5CB8]" },
    { id:"5", title:t("ناشط مجتمعي","Community Active"),          description:t("انشر 5 منشورات","Publish 5 posts"),                  icon:Target,   unlocked:postCount>=5, progress:Math.min(postCount,5), maxProgress:5,  points:250, gradient:"from-[#1B5FA0] to-[#2878C8]" },
    { id:"6", title:t("جامع النقاط","Point Collector"),       description:t("اجمع 500 نقطة","Collect 500 points"),   icon:Zap,      unlocked:userPoints>=500, progress:Math.min(userPoints,500), maxProgress:500,  points:100, gradient:"from-[#E8A830] to-[#F5C542]" },
    { id:"7", title:t("ملك الاستثمار","Investment King"),   description:t("اجمع 10000 نقطة","Collect 10,000 points"),                          icon:Crown,    unlocked:userPoints>=10000, progress:Math.min(userPoints,10000), maxProgress:10000, points:500, gradient:"from-[#5B3D8F] to-[#7D5CB8]" },
    { id:"8", title:t("خبير","Expert"),                description:t("اوصل للمستوى 10","Reach level 10"),  icon:Trophy,   unlocked:userLevel>=10, progress:Math.min(userLevel,10), maxProgress:10, points:150, gradient:"from-[#1A8A5A] to-[#2ECC71]" },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const displayLeaderboard = leaderboard.length > 0 ? leaderboard : [
    { rank:1, name:t("أنت","You"), points:userPoints, level:userLevel, isCurrentUser:true },
  ];

  const rankColor = (rank: number) =>
    rank === 1 ? "bg-[#E8A830] text-white" :
    rank === 2 ? "bg-gray-300 text-gray-700" :
    rank === 3 ? "bg-[#E8A830]/60 text-white" :
    dm ? "bg-white/[0.06] text-gray-300" : "bg-gray-200 text-gray-600";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-[#2878C8] animate-spin" />
        <p className={sub}>{t("جارٍ تحميل الإنجازات...","Loading achievements...")}</p>
      </div>
    </div>
  );

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"} className="min-h-screen py-8 px-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -right-32 w-96 h-96 bg-[#E8A830]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -left-32 w-80 h-80 bg-[#5B3D8F]/6 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-[#2878C8]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-8">
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`text-3xl font-bold mb-2 ${txt}`}>{t("الإنجازات والمكافآت","Achievements & Rewards")}</motion.h1>
          <p className={sub}>{t("تابع تقدمك وتنافس مع الآخرين","Track your progress and compete with others")}</p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label:t("المستوى الحالي","Current Level"), value:userLevel, icon:Trophy, iconColor:"#2878C8", iconBg:"bg-[#2878C8]/15" },
            { label:t("إجمالي النقاط","Total Points"),   value:userPoints, icon:Star,  iconColor:"#E8A830", iconBg:"bg-[#E8A830]/15" },
            { label:t("الإنجازات","Achievements"),       value:`${unlockedCount}/${achievements.length}`, icon:Award, iconColor:"#5B3D8F", iconBg:"bg-[#5B3D8F]/15" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <div className={`rounded-2xl border p-6 ${glass}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm mb-1 ${sub}`}>{s.label}</p>
                      <p className={`text-4xl font-bold ${txt}`}>{s.value}</p>
                    </div>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.iconBg}`}>
                      <Icon className="w-7 h-7" style={{ color: s.iconColor }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Level Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className={`rounded-2xl border p-6 mb-8 ${glass}`}>
            <h2 className={`text-base font-semibold mb-4 ${txt}`}>{t("التقدم نحو المستوى التالي","Progress to Next Level")}</h2>
            <div className="space-y-2">
              <div className={`flex justify-between text-sm ${sub}`}>
                <span>{t("المستوى","Level")} {userLevel}</span>
                <span>{t("المستوى","Level")} {userLevel + 1}</span>
              </div>
              <div className={`h-3 rounded-full overflow-hidden ${dm ? "bg-white/[0.06]" : "bg-gray-100"}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-[#2878C8] to-[#5DADE2]"
                />
              </div>
              <p className={`text-center text-sm ${sub}`}>
                {userPoints} / {nextLevelPoints} {t("نقطة","pts")} ({nextLevelPoints - userPoints} {t("نقطة متبقية","remaining")})
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Achievements Grid */}
          <div className="lg:col-span-2">
            <div className={`rounded-2xl border ${glass}`}>
              <div className="px-6 pt-5 pb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#E8A830]" />
                <h2 className={`text-base font-semibold ${txt}`}>{t("الشارات والإنجازات","Badges & Achievements")}</h2>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement, index) => {
                  const Icon = achievement.icon;
                  const pct = achievement.maxProgress ? Math.round((achievement.progress! / achievement.maxProgress) * 100) : 0;
                  return (
                    <motion.div key={achievement.id} initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.3, delay:index * 0.05 }}>
                      <div className={`relative rounded-xl border-2 p-5 transition-all ${
                        achievement.unlocked
                          ? dm ? "border-[#2878C8]/40 bg-[#2878C8]/10" : "border-[#2878C8]/30 bg-[#2878C8]/5"
                          : dm ? "border-white/[0.06] bg-white/[0.02] opacity-70" : "border-gray-200/40 bg-white/30 opacity-60"
                      }`}>
                        {achievement.unlocked && (
                          <span className={`absolute top-2.5 ${language==="ar"?"left-2.5":"right-2.5"} text-xs px-2 py-0.5 rounded-full font-semibold text-white`}
                            style={{ background: "linear-gradient(135deg, #1B5FA0, #2878C8)" }}>
                            {t("مكتمل","Done")}
                          </span>
                        )}
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${achievement.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className={`font-bold text-base mb-1 ${txt}`}>{achievement.title}</h3>
                        <p className={`text-sm mb-3 ${sub}`}>{achievement.description}</p>
                        {achievement.maxProgress && (
                          <div className="space-y-1 mb-3">
                            <div className={`h-2 rounded-full overflow-hidden ${dm ? "bg-white/[0.06]" : "bg-gray-100"}`}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: index * 0.05 }}
                                className={`h-full rounded-full bg-gradient-to-r ${achievement.gradient}`}
                              />
                            </div>
                            <p className={`text-xs ${sub}`}>{achievement.progress} / {achievement.maxProgress}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-[#E8A830]" />
                          <span className={`text-sm font-medium ${txt}`}>{achievement.points} {t("نقطة","pts")}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <div className={`rounded-2xl border sticky top-24 ${glass}`}>
              <div className="px-5 pt-5 pb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#E8A830]" />
                <h2 className={`font-semibold text-sm ${txt}`}>{t("لوحة الصدارة","Leaderboard")}</h2>
              </div>
              <div className="p-4 space-y-2">
                {displayLeaderboard.map((user) => (
                  <div key={user.rank}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      (user as any).isCurrentUser
                        ? dm ? "bg-[#2878C8]/15 border border-[#2878C8]/30" : "bg-[#2878C8]/5 border border-[#2878C8]/20"
                        : dm ? "hover:bg-white/[0.04]" : "hover:bg-white/50"
                    }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${rankColor(user.rank)}`}>
                      {user.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${(user as any).isCurrentUser ? "text-[#2878C8]" : txt}`}>{user.name}</p>
                      <p className={`text-xs ${sub}`}>{t("المستوى","Lv.")} {user.level}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star className="w-3.5 h-3.5 text-[#E8A830]" />
                      <span className={`font-bold text-sm ${txt}`}>{user.points}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
