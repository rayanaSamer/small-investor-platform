import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

const DEBOUNCE_MS = 900;

const rankConfig: Record<number, { label: string; labelEn: string; color: string; bg: string; bgDark: string; border: string }> = {
  1:  { label:"مبتدئ",  labelEn:"Beginner", color:"text-slate-600",   bg:"bg-slate-100",  bgDark:"bg-slate-700/50",  border:"border-slate-300" },
  3:  { label:"متعلم",  labelEn:"Learner",  color:"text-blue-700",    bg:"bg-blue-50",    bgDark:"bg-blue-900/30",   border:"border-blue-300" },
  5:  { label:"متقدم",  labelEn:"Advanced", color:"text-emerald-700", bg:"bg-emerald-50", bgDark:"bg-emerald-900/30",border:"border-emerald-300" },
  7:  { label:"محترف",  labelEn:"Pro",      color:"text-amber-700",   bg:"bg-amber-50",   bgDark:"bg-amber-900/30",  border:"border-amber-400" },
  10: { label:"خبير",   labelEn:"Expert",   color:"text-purple-700",  bg:"bg-purple-50",  bgDark:"bg-purple-900/30", border:"border-purple-400" },
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

  const dm   = darkMode;
  const card = dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-100";
  const txt  = dm ? "text-gray-100" : "text-gray-900";
  const sub  = dm ? "text-gray-400" : "text-gray-500";
  const inputCls = dm ? "bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:ring-emerald-400 focus:border-emerald-400" : "bg-slate-50 border-slate-200 focus:ring-emerald-400 focus:border-emerald-400";
  const divider  = dm ? "divide-gray-700" : "divide-slate-50";
  const rowHov   = dm ? "hover:bg-gray-700/50" : "hover:bg-slate-50";

  const [loading, setLoading]           = useState(true);
  const [saveStatus, setSaveStatus]     = useState<"idle"|"saving"|"saved">("idle");
  const [profileData, setProfileData]   = useState({ name:"", bio:"", phone:"", age:"" });
  const [userStats, setUserStats]       = useState({ level:1, points:0, achievements:0, totalAchievements:8 });
  const [achievementsList, setAchievementsList] = useState<{ icon:string; label:string; done:boolean }[]>([]);

  const saveTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const applyStats = (data: any) => {
    const stats = { level:data.level||1, points:data.points||0, achievements:data.achievements||0, totalAchievements:data.total_achievements||8 };
    setUserStats(stats);
    setAchievementsList([
      { icon:"🎯", label:t("أول صفقة","First Trade"),      done:stats.points>=100  },
      { icon:"💰", label:t("ربح 1000 نقطة","1000 Points"), done:stats.points>=1000 },
      { icon:"🔥", label:t("7 أيام نشط","7 Days Active"),  done:stats.level>=2     },
      { icon:"🏆", label:t("محترف","Pro"),                  done:stats.level>=7     },
    ]);
  };

  useEffect(() => {
    if (!authUser) { navigate("/auth"); return; }

    const loadProfile = async () => {
      // تشغيل الطلبين بالتوازي
      const [profileRes, statsRes] = await Promise.all([
        supabase.from("profiles").select("name, bio, phone, age").eq("id", authUser.id).single(),
        supabase.from("user_stats").select("*").eq("user_id", authUser.id).single(),
      ]);

      const profile = profileRes.data;
      setProfileData({
        name:  profile?.name  || authUser.name  || "",
        bio:   profile?.bio   || "",
        phone: profile?.phone || "",
        age:   profile?.age   ? String(profile.age) : "",
      });

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
          id:    authUser.id,
          name:  data.name,
          bio:   data.bio   || "",
          phone: data.phone || "",
          age:   data.age ? Number(data.age) : null,
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
    <div className={`min-h-screen flex items-center justify-center ${dm?"bg-gray-950":"bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20"}`}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className={`text-sm ${sub}`}>{t("جارٍ التحميل...","Loading...")}</p>
      </div>
    </div>
  );

  const rank       = getRank(userStats.level);
  const progressPct= userStats.totalAchievements ? Math.round((userStats.achievements/userStats.totalAchievements)*100) : 0;
  const initials   = profileData.name.split(" ").map(w=>w[0]).join("").slice(0,2) || authUser?.email?.charAt(0).toUpperCase() || "U";

  const statCards = [
    { value:`${userStats.level}`,                 label:t("المستوى","Level"),       icon:"🏅", gradient:"from-amber-400 to-orange-500" },
    { value:userStats.points.toLocaleString(),    label:t("النقاط","Points"),       icon:"⚡", gradient:"from-emerald-500 to-teal-600" },
    { value:`${userStats.achievements}/${userStats.totalAchievements}`, label:t("الإنجازات","Goals"), icon:"🎯", gradient:"from-violet-500 to-purple-600" },
  ];

  const formFields = [
    { label:t("الاسم الكامل","Full Name"), key:"name",  placeholder:t("أحمد محمد","Ahmed Mohammed") },
    { label:t("نبذة عني","Bio"),           key:"bio",   placeholder:t("مستثمر شاب...","Young investor...") },
    { label:t("رقم الجوال","Phone"),       key:"phone", placeholder:"05XXXXXXXX", ltr:true },
    { label:t("العمر","Age"),              key:"age",   placeholder:"24", type:"number" },
  ];

  return (
    <div dir={language==="ar"?"rtl":"ltr"}
      className={`min-h-screen py-6 md:py-10 px-4 md:px-8 transition-colors ${dm?"bg-gray-950":"bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20"}`}>
      <div className="max-w-5xl mx-auto">

        {/* هيدر */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${txt}`}>{t("الملف الشخصي","Profile")}</h1>
            <p className={`text-sm mt-1 ${sub}`}>
              {saveStatus==="saving" && <span className="text-amber-500">⏳ {t("جارٍ الحفظ...","Saving...")}</span>}
              {saveStatus==="saved"  && <span className="text-emerald-500">✓ {t("تم الحفظ تلقائياً","Auto-saved")}</span>}
              {saveStatus==="idle"   && t("يحفظ تلقائياً عند أي تغيير","Auto-saves on every change")}
            </p>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 text-sm font-medium border border-red-100 dark:border-red-800 transition-all">
            {t("تسجيل الخروج","Logout")}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* العمود الأيمن */}
          <div className="md:col-span-1 space-y-4">

            {/* بطاقة البروفايل */}
            <div className={`relative rounded-3xl overflow-hidden shadow-lg border ${card}`}>
              <div className="h-24 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 relative">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage:`url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M20 20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/svg%3E")` }} />
                <div className="md:hidden absolute top-3 left-3">
                  <button onClick={handleLogout} className="px-2.5 py-1.5 rounded-xl bg-red-500/20 backdrop-blur-sm text-white text-xs font-medium border border-red-300/30">
                    {t("خروج","Logout")}
                  </button>
                </div>
              </div>
              <div className="px-5 pb-5">
                <div className="flex items-end gap-4 -mt-10">
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-white text-xl font-bold">{initials}</span>
                    <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg bg-amber-400 border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-sm">
                      <span className="text-white text-xs font-bold">{userStats.level}</span>
                    </div>
                  </div>
                  <div className="pb-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <h2 className={`text-base font-bold truncate ${txt}`}>{profileData.name || t("مستخدم","User")}</h2>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${dm ? rank.bgDark : rank.bg} ${rank.color} ${rank.border}`}>
                        {language==="ar" ? rank.label : rank.labelEn}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${sub}`}>{authUser?.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {profileData.age && <span className={`text-xs px-2.5 py-1 rounded-full border ${dm?"bg-gray-700 text-gray-300 border-gray-600":"bg-slate-100 text-slate-600 border-slate-200"}`}>{t("العمر","Age")}: {profileData.age}</span>}
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 border border-emerald-200 dark:border-emerald-800">✓ {t("عضو نشط","Active")}</span>
                </div>
                {profileData.bio && <p className={`mt-3 text-xs italic ${sub}`}>"{profileData.bio}"</p>}
              </div>
            </div>

            {/* معلومات الحساب */}
            <div className={`rounded-3xl border shadow-sm overflow-hidden ${card}`}>
              <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${dm?"bg-violet-900/50":"bg-violet-100"}`}>🔐</span>
                <span className={`text-sm font-semibold ${txt}`}>{t("معلومات الحساب","Account Info")}</span>
              </div>
              <div className={`divide-y ${divider}`}>
                {[
                  { label:t("البريد الإلكتروني","Email"),   value:authUser?.email },
                  { label:t("تاريخ الانضمام","Joined"),     value: authUser?.created_at ? new Date(authUser.created_at).toLocaleDateString(language==="ar"?"ar-SA":"en-US",{year:"numeric",month:"long",day:"numeric"}) : "—" },
                  { label:t("آخر دخول","Last Login"),       value: authUser?.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleDateString(language==="ar"?"ar-SA":"en-US") : "—" },
                ].map(row => (
                  <div key={row.label} className={`flex justify-between items-center px-5 py-3 gap-3 transition-colors ${rowHov}`}>
                    <span className={`text-sm flex-shrink-0 ${sub}`}>{row.label}</span>
                    <span className={`text-xs font-medium truncate ${txt}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* العمود الأيسر */}
          <div className="md:col-span-2 space-y-4">

            {/* الإحصائيات */}
            <div className="grid grid-cols-3 gap-3">
              {statCards.map(stat => (
                <div key={stat.label} className={`rounded-2xl border shadow-sm p-3 md:p-5 ${card}`}>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-base mb-2`}>{stat.icon}</div>
                  <p className={`text-xl font-bold leading-none mb-1 ${txt}`}>{stat.value}</p>
                  <p className={`text-xs ${sub}`}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* الإنجازات */}
            <div className={`rounded-3xl border shadow-sm p-4 md:p-6 ${card}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-semibold flex items-center gap-2 ${txt}`}>
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${dm?"bg-amber-900/40":"bg-amber-100"}`}>🏅</span>
                  {t("الإنجازات","Achievements")}
                </span>
                <span className={`text-sm ${sub}`}>{userStats.achievements}/{userStats.totalAchievements}</span>
              </div>
              <div className={`h-2.5 rounded-full overflow-hidden mb-1.5 ${dm?"bg-gray-700":"bg-slate-100"}`}>
                <div className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-teal-400 transition-all duration-700" style={{width:`${progressPct}%`}} />
              </div>
              <p className="text-xs text-emerald-500 font-medium mb-4">{progressPct}% {t("مكتمل","complete")}</p>
              <div className="flex flex-wrap gap-2">
                {achievementsList.map(item => (
                  <div key={item.label}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${item.done ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 border-emerald-200 dark:border-emerald-800" : `${dm?"bg-gray-700 text-gray-500 border-gray-600":"bg-slate-50 text-slate-400 border-slate-200"}`}`}>
                    <span className={item.done?"":"grayscale opacity-50"}>{item.icon}</span>
                    {item.label}
                    {item.done && <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                  </div>
                ))}
              </div>
            </div>

            {/* نموذج تعديل المعلومات */}
            <div className={`rounded-3xl border shadow-sm p-5 md:p-6 ${card}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-semibold flex items-center gap-2 ${txt}`}>
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${dm?"bg-gray-700":"bg-slate-100"}`}>✏️</span>
                  {t("تعديل المعلومات","Edit Info")}
                </h3>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                  saveStatus==="saving" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700" :
                  saveStatus==="saved"  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700" :
                  dm ? "bg-gray-700 text-gray-400" : "bg-slate-100 text-slate-500"
                }`}>
                  {saveStatus==="saving" ? `⏳ ${t("يحفظ...","Saving...")}` :
                   saveStatus==="saved"  ? `✓ ${t("محفوظ","Saved")}` :
                   t("يحفظ تلقائياً","Auto-save")}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formFields.map(field => (
                  <div key={field.key} className={field.key==="bio"?"sm:col-span-2":""}>
                    <label className={`block text-xs font-medium mb-1.5 ${sub}`}>{field.label}</label>
                    <Input
                      type={field.type||"text"}
                      dir={field.ltr?"ltr":undefined}
                      placeholder={field.placeholder}
                      value={(profileData as any)[field.key]}
                      onChange={e => {
                        let value = e.target.value;
                        if (field.key==="age") { value=value.replace(/\D/g,""); if(Number(value)>80) value="80"; }
                        setProfileData(prev => ({ ...prev, [field.key]: value }));
                      }}
                      className={`rounded-xl ${inputCls}`}
                    />
                  </div>
                ))}
              </div>
              <p className={`text-xs mt-3 ${sub}`}>{t("يحفظ تلقائياً بعد التوقف عن الكتابة","Auto-saves after you stop typing")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
