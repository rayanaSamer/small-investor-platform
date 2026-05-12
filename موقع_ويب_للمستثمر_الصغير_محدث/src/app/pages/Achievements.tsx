import { useState, useEffect } from "react";
import { Trophy, Star, Target, TrendingUp, Wallet, Award, Zap, Crown, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

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
  const t = (ar: string, en: string) => language === "ar" ? ar : en;

  const dm   = darkMode;
  const txt  = dm ? "text-gray-100" : "text-gray-900";
  const sub  = dm ? "text-gray-400" : "text-gray-600";
  const card = dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-100";
  const rowHov = dm ? "hover:bg-gray-700/50" : "hover:bg-slate-50";

  const [userLevel, setUserLevel]           = useState(1);
  const [userPoints, setUserPoints]         = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [portfolioExists, setPortfolioExists]   = useState(false);
  const [postCount, setPostCount]           = useState(0);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!authUser) { setLoading(false); return; }
      const uid = authUser.id;
      const [statsRes, txRes, portRes, postRes] = await Promise.all([
        supabase.from("user_stats").select("level, points").eq("user_id", uid).single(),
        supabase.from("transactions").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("portfolios").select("user_id").eq("user_id", uid).maybeSingle(),
        supabase.from("community_posts").select("id", { count: "exact", head: true }).eq("user_id", uid),
      ]);
      const level = statsRes.data?.level || 1;
      const points = statsRes.data?.points || 0;
      const txCount = txRes.count || 0;
      const portfolio = !!portRes.data;
      const postCount = postRes.count || 0;
      setUserLevel(level); setUserPoints(points);
      setTransactionCount(txCount); setPortfolioExists(portfolio);
      setPostCount(postCount); setLoading(false);
    };
    load();
  }, [authUser?.id]);

  const nextLevelPoints = (userLevel) * 200;
  const levelProgress   = nextLevelPoints > 0 ? Math.min((userPoints / nextLevelPoints) * 100, 100) : 0;

  const achievements: Achievement[] = [
    { id:"1", title:t("أول خطوة","First Step"),            description:t("سجل أول عملية مالية","Log your first transaction"),                icon:Star,     unlocked:transactionCount>=1,  progress:Math.min(transactionCount,1), maxProgress:1, points:50,  gradient:"from-yellow-400 to-orange-500" },
    { id:"2", title:t("مستثمر مبتدئ","Beginner Investor"), description:t("قم بأول عملية استثمار","Make your first investment"),              icon:TrendingUp,unlocked:portfolioExists,  points:100, gradient:"from-emerald-400 to-teal-500" },
    { id:"3", title:t("مدخر ماهر","Skilled Saver"),        description:t("سجل 10 عمليات مالية","Log 10 transactions"),       icon:Wallet,   unlocked:transactionCount>=10,  progress:Math.min(transactionCount,10), maxProgress:10, points:150, gradient:"from-blue-400 to-cyan-500" },
    { id:"4", title:t("محترف الاستثمار","Investment Pro"),  description:t("اوصل للمستوى 5","Reach level 5"),         icon:Award,    unlocked:userLevel>=5, progress:Math.min(userLevel,5), maxProgress:5, points:200, gradient:"from-purple-400 to-pink-500" },
    { id:"5", title:t("ناشط مجتمعي","Community Active"),          description:t("انشر 5 منشورات","Publish 5 posts"),                  icon:Target,   unlocked:postCount>=5, progress:Math.min(postCount,5), maxProgress:5,  points:250, gradient:"from-red-400 to-orange-500" },
    { id:"6", title:t("جامع النقاط","Point Collector"),       description:t("اجمع 500 نقطة","Collect 500 points"),   icon:Zap,      unlocked:userPoints>=500, progress:Math.min(userPoints,500), maxProgress:500,  points:100, gradient:"from-yellow-400 to-amber-500" },
    { id:"7", title:t("ملك الاستثمار","Investment King"),   description:t("اجمع 10000 نقطة","Collect 10,000 points"),                          icon:Crown,    unlocked:userPoints>=10000, progress:Math.min(userPoints,10000), maxProgress:10000, points:500, gradient:"from-purple-500 to-indigo-600" },
    { id:"8", title:t("خبير","Expert"),                description:t("اوصل للمستوى 10","Reach level 10"),  icon:Trophy,   unlocked:userLevel>=10, progress:Math.min(userLevel,10), maxProgress:10, points:150, gradient:"from-teal-400 to-emerald-500" },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const leaderboard = [
    { rank:1,  name:t("أحمد محمد","Ahmed Mohammed"),     points:3500, level:15 },
    { rank:2,  name:t("سارة عبدالله","Sara Abdullah"),   points:3200, level:14 },
    { rank:3,  name:t("خالد علي","Khaled Ali"),           points:2800, level:12 },
    { rank:4,  name:t("نورة سعيد","Noura Said"),          points:2500, level:11 },
    { rank:5,  name:t("محمد أحمد","Mohammed Ahmed"),      points:2200, level:10 },
    { rank:6,  name:t("فاطمة حسن","Fatima Hassan"),       points:1800, level:9  },
    { rank:7,  name:t("أنت","You"),                       points:userPoints, level:userLevel,  isCurrentUser:true },
    { rank:8,  name:t("عمر يوسف","Omar Yousef"),          points:Math.max(userPoints - 150, 0), level:Math.max(userLevel - 1, 1)  },
    { rank:9,  name:t("ليلى عمر","Layla Omar"),           points:Math.max(userPoints - 300, 0),  level:Math.max(userLevel - 2, 1)  },
    { rank:10, name:t("عبدالرحمن زيد","Abdulrahman Zaid"),points:Math.max(userPoints - 450, 0),  level:Math.max(userLevel - 3, 1)  },
  ] as const;

  const rankColor = (rank: number) =>
    rank === 1 ? "bg-yellow-400 text-yellow-900" :
    rank === 2 ? "bg-gray-300 text-gray-700" :
    rank === 3 ? "bg-orange-400 text-orange-900" :
    dm ? "bg-gray-600 text-gray-200" : "bg-gray-200 text-gray-600";

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${dm ? "bg-gray-950" : ""}`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className={sub}>{t("جارٍ تحميل الإنجازات...","Loading achievements...")}</p>
      </div>
    </div>
  );

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"} className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${txt}`}>{t("الإنجازات والمكافآت","Achievements & Rewards")}</h1>
          <p className={sub}>{t("تابع تقدمك وتنافس مع الآخرين","Track your progress and compete with others")}</p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { gradient:"from-emerald-500 to-teal-600", label:t("المستوى الحالي","Current Level"), value:userLevel, icon:<Trophy className="w-8 h-8 text-white" />, light:"text-emerald-50" },
            { gradient:"from-purple-500 to-pink-600",  label:t("إجمالي النقاط","Total Points"),   value:userPoints, icon:<Star className="w-8 h-8 text-white" />,   light:"text-purple-50" },
            { gradient:"from-blue-500 to-cyan-600",    label:t("الإنجازات","Achievements"),       value:`${unlockedCount}/${achievements.length}`, icon:<Award className="w-8 h-8 text-white" />, light:"text-blue-50" },
          ].map((s, i) => (
            <div key={i} className={`rounded-2xl bg-gradient-to-br ${s.gradient} p-6 shadow-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm mb-1 ${s.light}`}>{s.label}</p>
                  <p className="text-4xl font-bold text-white">{s.value}</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Level Progress */}
        <div className={`rounded-2xl border shadow-sm p-6 mb-8 ${card}`}>
          <h2 className={`text-base font-semibold mb-4 ${txt}`}>{t("التقدم نحو المستوى التالي","Progress to Next Level")}</h2>
          <div className="space-y-2">
            <div className={`flex justify-between text-sm ${sub}`}>
              <span>{t("المستوى","Level")} {userLevel}</span>
              <span>{t("المستوى","Level")} {userLevel + 1}</span>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${dm ? "bg-gray-700" : "bg-slate-100"}`}>
              <div className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-teal-400 transition-all duration-700" style={{ width:`${levelProgress}%` }} />
            </div>
            <p className={`text-center text-sm ${sub}`}>
              {userPoints} / {nextLevelPoints} {t("نقطة","pts")} ({nextLevelPoints - userPoints} {t("نقطة متبقية","remaining")})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Achievements Grid */}
          <div className="lg:col-span-2">
            <div className={`rounded-2xl border shadow-sm ${card}`}>
              <div className="px-6 pt-5 pb-3">
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
                          ? dm ? "border-emerald-600 bg-emerald-900/20" : "border-emerald-400 bg-emerald-50/50"
                          : dm ? "border-gray-700 bg-gray-700/30 opacity-70" : "border-slate-200 opacity-60"
                      }`}>
                        {achievement.unlocked && (
                          <span className={`absolute top-2.5 ${language==="ar"?"left-2.5":"right-2.5"} text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-500 text-white`}>
                            {t("مكتمل","Done")}
                          </span>
                        )}
                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${achievement.gradient} flex items-center justify-center mb-3`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className={`font-bold text-base mb-1 ${txt}`}>{achievement.title}</h3>
                        <p className={`text-sm mb-3 ${sub}`}>{achievement.description}</p>
                        {achievement.maxProgress && (
                          <div className="space-y-1 mb-3">
                            <div className={`h-2 rounded-full overflow-hidden ${dm?"bg-gray-700":"bg-slate-100"}`}>
                              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width:`${pct}%` }} />
                            </div>
                            <p className={`text-xs ${sub}`}>{achievement.progress} / {achievement.maxProgress}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-yellow-500" />
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
            <div className={`rounded-2xl border shadow-sm sticky top-24 ${card}`}>
              <div className="px-5 pt-5 pb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-emerald-500" />
                <h2 className={`font-semibold text-sm ${txt}`}>{t("لوحة الصدارة","Leaderboard")}</h2>
              </div>
              <div className="p-4 space-y-2">
                {leaderboard.map((user) => (
                  <div key={user.rank}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      (user as any).isCurrentUser
                        ? dm ? "bg-emerald-900/30 border border-emerald-700" : "bg-emerald-50 border-2 border-emerald-400"
                        : rowHov
                    }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${rankColor(user.rank)}`}>
                      {user.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${(user as any).isCurrentUser ? "text-emerald-500" : txt}`}>{user.name}</p>
                      <p className={`text-xs ${sub}`}>{t("المستوى","Lv.")} {user.level}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star className="w-3.5 h-3.5 text-yellow-500" />
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
