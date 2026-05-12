import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { motion } from "motion/react";
import { LogOut, Pencil, ShieldCheck, Palette, Trophy, Zap, Target, CreditCard } from "lucide-react";

const DEBOUNCE_MS = 900;

const AVATAR_COLORS: Record<string, { from: string; to: string; label: string }> = {
  blue:   { from:"#2878C8", to:"#5DADE2", label:"أزرق"  },
  green:  { from:"#1A8A5A", to:"#2ECC71", label:"أخضر"  },
  purple: { from:"#5B3D8F", to:"#7D5CB8", label:"بنفسجي"},
};

const LEVEL_POINTS: Record<number, number> = { 1:0, 3:100, 5:500, 7:1000, 10:2000 };
function getNextLevel(level: number) {
  const levels = [1,3,5,7,10];
  const idx = levels.findIndex(l => l > level);
  return idx === -1 ? null : levels[idx];
}
function getLevelProgress(points: number, level: number) {
  const next = getNextLevel(level);
  if (!next) return { pct:100, needed:0, next:null };
  const cur = LEVEL_POINTS[level] ?? 0;
  const req = LEVEL_POINTS[next] ?? 0;
  const pct = Math.min(100, Math.round(((points - cur) / (req - cur)) * 100));
  return { pct, needed: Math.max(0, req - points), next };
}

const rankConfig: Record<number, { label: string; labelEn: string; color: string; bg: string }> = {
  1:  { label:"مبتدئ",  labelEn:"Beginner", color:"#5DADE2", bg:"bg-[#5DADE2]/10" },
  3:  { label:"متعلم",  labelEn:"Learner",  color:"#2878C8", bg:"bg-[#2878C8]/10" },
  5:  { label:"متقدم",  labelEn:"Advanced", color:"#1A8A5A", bg:"bg-[#1A8A5A]/10" },
  7:  { label:"محترف",  labelEn:"Pro",      color:"#E8A830", bg:"bg-[#E8A830]/10" },
  10: { label:"خبير",   labelEn:"Expert",   color:"#5B3D8F", bg:"bg-[#5B3D8F]/10" },
};

function getRank(level: number) {
  const keys = Object.keys(rankConfig).map(Number).sort((a, b) => b - a);
  for (const k of keys) if (level >= k) return rankConfig[k];
  return rankConfig[1];
}

export function Profile() {
  const navigate = useNavigate();
  const { language, darkMode } = useSettings();
  const { user: authUser } = useAuth();
  const t = (ar: string, en: string) => language === "ar" ? ar : en;

  const dm = darkMode;
  const txt = dm ? "text-gray-100" : "text-gray-900";
  const sub = dm ? "text-gray-400" : "text-gray-500";

  const glass = dm
    ? "bg-white/[0.04] border-white/[0.08] backdrop-blur-xl"
    : "bg-white/70 border-white/60 backdrop-blur-xl shadow-lg";

  const inputCls = dm
    ? "bg-white/[0.06] border-white/[0.1] text-gray-100 placeholder:text-gray-500 focus:ring-[#2878C8] focus:border-[#2878C8]"
    : "bg-white/60 border-white/40 text-gray-900 placeholder:text-gray-400 focus:ring-[#2878C8] focus:border-[#2878C8]";

  const rowDiv = dm ? "border-white/[0.06]" : "border-gray-100/60";
  const rowHov = dm ? "hover:bg-white/[0.04]" : "hover:bg-white/50";

  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle"|"saving"|"saved">("idle");
  const [profileData, setProfileData] = useState({ name:"", bio:"", phone:"", age:"" });
  const [userStats, setUserStats] = useState({ level:1, points:0, achievements:0, totalAchievements:8 });
  const [txCount, setTxCount] = useState(0);
  const [avatarColorId, setAvatarColorId] = useState(() => localStorage.getItem("hasad_avatar_color") || "blue");

  const changeAvatarColor = (id: string) => {
    setAvatarColorId(id);
    localStorage.setItem("hasad_avatar_color", id);
    window.dispatchEvent(new Event("hasad-avatar-changed"));
  };

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const applyStats = (data: any) => {
    setUserStats({
      level: data.level || 1,
      points: data.points || 0,
      achievements: data.achievements || 0,
      totalAchievements: data.total_achievements || 8,
    });
  };

  useEffect(() => {
    if (!authUser) { navigate("/auth"); return; }

    const loadProfile = async () => {
      const [profileRes, statsRes] = await Promise.all([
        supabase.from("profiles").select("name, bio, phone, age").eq("id", authUser.id).single(),
        supabase.from("user_stats").select("*").eq("user_id", authUser.id).single(),
      ]);

      const profile = profileRes.data;
      setProfileData({
        name: profile?.name || authUser.name || "",
        bio: profile?.bio || "",
        phone: profile?.phone || "",
        age: profile?.age ? String(profile.age) : "",
      });

      supabase.from("transactions").select("id", { count:"exact", head:true }).eq("user_id", authUser.id).then(({ count }) => setTxCount(count ?? 0));

      if (statsRes.error || !statsRes.data) {
        const { data: nd } = await supabase
          .from("user_stats")
          .insert({ user_id: authUser.id, level:1, points:0, achievements:0, total_achievements:8 })
          .select().single();
        if (nd) applyStats(nd);
      } else {
        applyStats(statsRes.data);
      }

      setLoading(false);
    };

    loadProfile();
  }, [authUser?.id]);

  const saveProfile = useCallback(async (data: typeof profileData) => {
    if (!data.name || !authUser?.id) return;
    setSaveStatus("saving");
    try {
      const { error: dbError } = await supabase
        .from("profiles")
        .upsert({
          id: authUser.id,
          name: data.name,
          bio: data.bio || "",
          phone: data.phone || "",
          age: data.age ? Number(data.age) : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

      const { error: authError } = await supabase.auth.updateUser({
        data: { name: data.name, bio: data.bio, phone: data.phone, age: data.age },
      });

      if (!dbError && !authError) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        console.error("Profile save error:", dbError || authError);
        setSaveStatus("idle");
      }
    } catch (e) {
      console.error("Profile save exception:", e);
      setSaveStatus("idle");
    }
  }, [authUser?.id]);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveProfile(profileData), DEBOUNCE_MS);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [profileData, saveProfile]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/auth"); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-[#2878C8] border-t-transparent rounded-full animate-spin" />
        <p className={`text-sm ${sub}`}>{t("جارٍ التحميل...", "Loading...")}</p>
      </div>
    </div>
  );

  const rank = getRank(userStats.level);
  const initials = profileData.name.split(" ").map(w => w[0]).join("").slice(0, 2) || authUser?.email?.charAt(0).toUpperCase() || "U";
  const avatarColor = AVATAR_COLORS[avatarColorId] ?? AVATAR_COLORS.blue;
  const levelProgress = getLevelProgress(userStats.points, userStats.level);

  const statCards = [
    { value: `${userStats.level}`, label: t("المستوى","Level"), icon: <Trophy className="w-4.5 h-4.5" />, color: "#E8A830" },
    { value: userStats.points.toLocaleString(), label: t("النقاط","Points"), icon: <Zap className="w-4.5 h-4.5" />, color: "#1A8A5A" },
    { value: `${userStats.achievements}/${userStats.totalAchievements}`, label: t("الإنجازات","Goals"), icon: <Target className="w-4.5 h-4.5" />, color: "#5B3D8F" },
    { value: `${txCount}`, label: t("المعاملات","Transactions"), icon: <CreditCard className="w-4.5 h-4.5" />, color: "#2878C8" },
  ];

  const formFields = [
    { label: t("الاسم الكامل","Full Name"), key: "name", placeholder: t("أحمد محمد","Ahmed Mohammed") },
    { label: t("نبذة عني","Bio"), key: "bio", placeholder: t("انا شاب مبتدئ في الأستثمار..","Young investor...") },
    { label: t("رقم الجوال","Phone"), key: "phone", placeholder: "05XXXXXXXX", ltr: true },
    { label: t("العمر","Age"), key: "age", placeholder: "24", type: "number" },
  ];

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}
      className="min-h-screen py-6 md:py-10 px-4 md:px-8 transition-colors relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -right-32 w-96 h-96 bg-[#2878C8]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -left-32 w-80 h-80 bg-[#5B3D8F]/6 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-[#E8A830]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">

        {/* Header */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className={`text-2xl md:text-3xl font-bold ${txt}`}>{t("الملف الشخصي","Profile")}</h1>
            <p className={`text-sm mt-1 ${sub}`}>
              {saveStatus === "saving" && <span className="text-[#E8A830]">{t("جارٍ الحفظ...","Saving...")}</span>}
              {saveStatus === "saved" && <span className="text-[#1A8A5A]">{t("تم الحفظ تلقائياً","Auto-saved")}</span>}
              {saveStatus === "idle" && t("يحفظ تلقائياً عند أي تغيير","Auto-saves on every change")}
            </p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleLogout}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 text-sm font-medium border transition-all ${dm ? "bg-red-500/10 border-red-500/20 hover:bg-red-500/15" : "bg-red-50 border-red-100 hover:bg-red-100"}`}>
            <LogOut className="w-4 h-4" />
            {t("تسجيل الخروج","Logout")}
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Right column */}
          <div className="md:col-span-1 space-y-4">

            {/* Profile card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`relative rounded-2xl overflow-hidden border ${glass}`}
            >
              {/* Banner */}
              <div className="h-24 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${avatarColor.from}, ${avatarColor.to})` }}>
                <div className="absolute inset-0 bg-white/10" />
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M20 20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/svg%3E")` }} />
                <div className="md:hidden absolute top-3 left-3">
                  <button onClick={handleLogout} className="px-2.5 py-1.5 rounded-xl bg-black/20 backdrop-blur-sm text-white text-xs font-medium border border-white/20">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="px-5 pb-5">
                <div className="flex items-end gap-4 -mt-10">
                  <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 border-4"
                    style={{
                      background: `linear-gradient(135deg, ${avatarColor.from}, ${avatarColor.to})`,
                      borderColor: dm ? "#0c1a3d" : "#ffffff"
                    }}>
                    <span className="text-white text-xl font-bold">{initials}</span>
                    <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg flex items-center justify-center shadow-sm border-2"
                      style={{
                        background: `linear-gradient(135deg, #E8A830, #F5C563)`,
                        borderColor: dm ? "#0c1a3d" : "#ffffff"
                      }}>
                      <span className="text-white text-xs font-bold">{userStats.level}</span>
                    </div>
                  </div>
                  <div className="pb-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <h2 className={`text-base font-bold truncate ${txt}`}>{profileData.name || t("مستخدم","User")}</h2>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rank.bg}`}
                        style={{ color: rank.color }}>
                        {language === "ar" ? rank.label : rank.labelEn}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${sub}`}>{authUser?.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {profileData.age && (
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${dm ? "bg-white/[0.06] text-gray-300 border-white/[0.1]" : "bg-white/60 text-gray-600 border-white/40"}`}>
                      {t("العمر","Age")}: {profileData.age}
                    </span>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${dm ? "bg-[#1A8A5A]/10 text-[#1A8A5A] border-[#1A8A5A]/20" : "bg-[#1A8A5A]/8 text-[#1A8A5A] border-[#1A8A5A]/15"}`}>
                    {t("عضو نشط","Active")}
                  </span>
                </div>
                {profileData.bio && <p className={`mt-3 text-xs italic ${sub}`}>"{profileData.bio}"</p>}
              </div>
            </motion.div>

            {/* Avatar color */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl border p-4 ${glass}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${dm ? "bg-[#5B3D8F]/15" : "bg-[#5B3D8F]/8"}`}>
                  <Palette className="w-3.5 h-3.5 text-[#5B3D8F]" />
                </div>
                <p className={`text-xs font-semibold ${txt}`}>{t("لون الأفاتار","Avatar Color")}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(AVATAR_COLORS).map(([id, c]) => (
                  <button key={id} onClick={() => changeAvatarColor(id)}
                    className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${avatarColorId === id ? "ring-2 ring-offset-2 scale-110" : ""}`}
                    style={{
                      background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                      ...(avatarColorId === id ? { ringColor: c.from } : {})
                    }}
                    title={c.label} />
                ))}
              </div>
            </motion.div>

            {/* Account info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-2xl border overflow-hidden ${glass}`}
            >
              <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${dm ? "bg-[#2878C8]/15" : "bg-[#2878C8]/8"}`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2878C8]" />
                </div>
                <span className={`text-sm font-semibold ${txt}`}>{t("معلومات الحساب","Account Info")}</span>
              </div>
              <div>
                {[
                  { label: t("البريد الإلكتروني","Email"), value: authUser?.email },
                  { label: t("تاريخ الانضمام","Joined"), value: authUser?.created_at ? new Date(authUser.created_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { year:"numeric", month:"long", day:"numeric" }) : "—" },
                  { label: t("آخر دخول","Last Login"), value: authUser?.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US") : "—" },
                ].map((row, i, arr) => (
                  <div key={row.label} className={`flex justify-between items-center px-5 py-3 gap-3 transition-colors ${i < arr.length - 1 ? `border-b ${rowDiv}` : ""} ${rowHov}`}>
                    <span className={`text-sm flex-shrink-0 ${sub}`}>{row.label}</span>
                    <span className={`text-xs font-medium truncate ${txt}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Left column */}
          <div className="md:col-span-2 space-y-4">

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statCards.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className={`rounded-2xl border p-3 md:p-4 ${glass}`}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                    {stat.icon}
                  </div>
                  <p className={`text-xl font-bold leading-none mb-1 ${txt}`}>{stat.value}</p>
                  <p className={`text-xs ${sub}`}>{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Level progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-2xl border p-4 ${glass}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-semibold ${txt}`}>{t("التقدم نحو المستوى التالي","Progress to Next Level")}</p>
                {levelProgress.next
                  ? <span className={`text-xs font-medium ${sub}`}>{t(`المستوى ${levelProgress.next}`,`Level ${levelProgress.next}`)}</span>
                  : <span className="text-xs font-medium text-[#5B3D8F]">{t("أقصى مستوى","Max Level")}</span>
                }
              </div>
              <div className={`w-full h-3 rounded-full overflow-hidden ${dm ? "bg-white/[0.06]" : "bg-gray-100/80"}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress.pct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #2878C8, #5DADE2)" }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className={`text-xs ${sub}`}>{userStats.points.toLocaleString()} {t("نقطة","pts")}</span>
                {levelProgress.needed > 0
                  ? <span className={`text-xs ${sub}`}>{t(`${levelProgress.needed} نقطة للمستوى التالي`,`${levelProgress.needed} pts to next level`)}</span>
                  : <span className="text-xs text-[#5B3D8F]">{t("وصلت للقمة!","You reached the top!")}</span>
                }
              </div>
            </motion.div>

            {/* Edit form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`rounded-2xl border p-5 md:p-6 ${glass}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-semibold flex items-center gap-2 ${txt}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${dm ? "bg-[#E8A830]/15" : "bg-[#E8A830]/8"}`}>
                    <Pencil className="w-3.5 h-3.5 text-[#E8A830]" />
                  </div>
                  {t("تعديل المعلومات","Edit Info")}
                </h3>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                  saveStatus === "saving" ? "bg-[#E8A830]/10 text-[#E8A830]" :
                  saveStatus === "saved" ? "bg-[#1A8A5A]/10 text-[#1A8A5A]" :
                  dm ? "bg-white/[0.06] text-gray-400" : "bg-gray-100/80 text-gray-500"
                }`}>
                  {saveStatus === "saving" ? t("يحفظ...","Saving...") :
                   saveStatus === "saved" ? t("محفوظ","Saved") :
                   t("يحفظ تلقائياً","Auto-save")}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formFields.map(field => (
                  <div key={field.key} className={field.key === "bio" ? "sm:col-span-2" : ""}>
                    <label className={`block text-xs font-medium mb-1.5 ${sub}`}>{field.label}</label>
                    <Input
                      type={field.type || "text"}
                      dir={field.ltr ? "ltr" : undefined}
                      placeholder={field.placeholder}
                      value={(profileData as any)[field.key]}
                      onChange={e => {
                        let value = e.target.value;
                        if (field.key === "age") { value = value.replace(/\D/g, ""); if (Number(value) > 80) value = "80"; }
                        setProfileData(prev => ({ ...prev, [field.key]: value }));
                      }}
                      className={`rounded-xl ${inputCls}`}
                    />
                  </div>
                ))}
              </div>
              <p className={`text-xs mt-3 ${sub}`}>{t("يحفظ تلقائياً بعد التوقف عن الكتابة","Auto-saves after you stop typing")}</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
