import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

function Toggle({ checked, onChange, darkMode }: { checked: boolean; onChange: () => void; darkMode: boolean }) {
  return (
    <button onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${checked ? "bg-emerald-500" : darkMode ? "bg-gray-600" : "bg-slate-200"}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${checked ? "translate-x-6" : "translate-x-0.5"}`} />
    </button>
  );
}

type FontSize = "14px" | "16px" | "18px";

export function Settings() {
  const { darkMode, toggleDarkMode, language, setLanguage, fontSize, setFontSize } = useSettings();
  const { user: authUser } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts]     = useState(false);
  const [saving, setSaving]               = useState(false);
  const [loaded, setLoaded]               = useState(false);

  const t  = (ar: string, en: string) => language === "ar" ? ar : en;
  const dm = darkMode;

  const card     = dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-100";
  const txt      = dm ? "text-gray-100" : "text-gray-900";
  const sub      = dm ? "text-gray-400" : "text-gray-500";
  const rowDiv   = dm ? "border-gray-700" : "border-slate-50";
  const rowHov   = dm ? "hover:bg-gray-700/50" : "hover:bg-slate-50";
  const btnSel   = "bg-emerald-600 text-white border-emerald-600 shadow-sm";
  const btnIdle  = dm ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600" : "bg-slate-50 text-gray-600 border-slate-200 hover:bg-slate-100";
  const saveBtnCls = "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-200/40 disabled:opacity-60 transition-all";

  const fontLabels: Record<FontSize, string> = { "14px": t("صغير","Small"), "16px": t("متوسط","Medium"), "18px": t("كبير","Large") };

  useEffect(() => {
    const loadSettings = async () => {
      if (!authUser) { setLoaded(true); return; }
      const { data: row } = await supabase.from("user_settings").select("*").eq("user_id", authUser.id).single();
      if (row) { setNotifications(row.notifications ?? true); setEmailAlerts(row.email_alerts ?? false); }
      setLoaded(true);
    };
    loadSettings();
  }, [authUser?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (authUser) {
        const { error } = await supabase.from("user_settings").upsert({
          user_id: authUser.id, language, dark_mode: darkMode, font_size: fontSize,
          notifications, email_alerts: emailAlerts, updated_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
      toast.success(t("تم حفظ الإعدادات ✓","Settings saved ✓"));
    } catch { toast.error(t("فشل الحفظ","Save failed")); }
    finally { setSaving(false); }
  };

  if (!loaded) return (
    <div className={`min-h-screen flex items-center justify-center ${dm?"bg-gray-950":""}`}>
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const toggleRows = [
    {
      icon: darkMode ? "🌙" : "☀️",
      iconBg: dm ? "bg-gray-700" : "bg-slate-100",
      label: t("الوضع الليلي","Dark Mode"),
      sublabel: darkMode ? t("مفعّل","On") : t("غير مفعّل","Off"),
      checked: darkMode, onChange: toggleDarkMode,
    },
   
    {
      icon: "📧", iconBg: dm ? "bg-blue-900/30" : "bg-blue-50",
      label: t("تنبيهات البريد","Email Alerts"),
      sublabel: emailAlerts ? t("مفعّلة","On") : t("معطّلة","Off"),
      checked: emailAlerts, onChange: () => setEmailAlerts(v => !v),
    },
  ];

  const accountRows = [
    { icon:"🔑", label:t("تغيير كلمة المرور","Change Password"), sublabel:t("إعادة تعيين عبر البريد","Reset via email"), iconBg:dm?"bg-gray-700":"bg-slate-100", danger:false },
    { icon:"🔒", label:t("الخصوصية والأمان","Privacy & Security"), sublabel:t("إعدادات الحماية","Protection settings"), iconBg:dm?"bg-blue-900/30":"bg-blue-50", danger:false },
    { icon:"🗑️", label:t("حذف الحساب","Delete Account"), sublabel:t("إجراء لا يمكن التراجع عنه","This cannot be undone"), iconBg:dm?"bg-red-900/30":"bg-red-50", danger:true },
  ];

  const aboutRows = [
    { label:t("الإصدار","Version"),         value:"1.0.0",                           link:false },
    { label:t("آخر تحديث","Last Update"),   value:t("أبريل 2026","April 2026"),      link:false },
    { label:t("سياسة الخصوصية","Privacy"),  value:"→",                               link:true  },
    { label:t("شروط الاستخدام","Terms"),    value:"→",                               link:true  },
  ];

  return (
    <div dir={language==="ar"?"rtl":"ltr"}
      className={`min-h-screen py-6 md:py-10 px-4 md:px-8 transition-colors ${dm?"bg-gray-950":"bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20"}`}>
      <div className="max-w-4xl mx-auto">

        <div className="mb-6 md:mb-8">
          <h1 className={`text-2xl md:text-3xl font-bold ${txt}`}>{t("الإعدادات","Settings")}</h1>
          <p className={`text-sm mt-1 ${sub}`}>
            {authUser ? t("الإعدادات تُحفظ على حسابك","Settings sync to your account") : t("تحكم في تجربتك داخل التطبيق","Customize your experience")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* العمود الأول */}
          <div className="space-y-4">

            {/* التبديلات */}
            <div className={`rounded-3xl border shadow-sm overflow-hidden ${card}`}>
              <div className="px-5 pt-4 pb-2">
                <span className={`text-sm font-semibold ${txt}`}>{t("عام","General")}</span>
              </div>
              {toggleRows.map((row, i) => (
                <div key={row.label} className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${i < toggleRows.length-1 ? `border-b ${rowDiv}` : ""} ${rowHov}`}>
                  <div className={`w-9 h-9 rounded-xl ${row.iconBg} flex items-center justify-center text-base flex-shrink-0`}>{row.icon}</div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${txt}`}>{row.label}</p>
                    <p className={`text-xs ${sub}`}>{row.sublabel}</p>
                  </div>
                  <Toggle checked={row.checked} onChange={row.onChange} darkMode={dm} />
                </div>
              ))}
            </div>

            {/* اللغة */}
            <div className={`rounded-3xl border shadow-sm p-5 ${card}`}>
              <p className={`text-sm font-semibold mb-4 ${txt}`}>{t("اللغة","Language")}</p>
              <div className="grid grid-cols-2 gap-2">
                {(["ar","en"] as const).map(lang => (
                  <button key={lang} onClick={() => setLanguage(lang)}
                    className={`py-3 rounded-xl text-sm font-medium border transition-all ${language===lang ? btnSel : btnIdle}`}>
                    {lang==="ar" ? "🇸🇦 العربية" : "🇺🇸 English"}
                  </button>
                ))}
              </div>
            </div>

            {/* حجم الخط */}
            <div className={`rounded-3xl border shadow-sm p-5 ${card}`}>
              <p className={`text-sm font-semibold mb-4 ${txt}`}>{t("حجم الخط","Font Size")}</p>
              <div className="grid grid-cols-3 gap-2">
                {(["14px","16px","18px"] as FontSize[]).map(size => (
                  <button key={size} onClick={() => setFontSize(size)}
                    className={`py-2.5 rounded-xl border transition-all ${fontSize===size ? btnSel : btnIdle}`}
                    style={{ fontSize: size }}>
                    {fontLabels[size]}
                  </button>
                ))}
              </div>
              <div className={`mt-3 p-4 rounded-2xl border ${dm?"bg-gray-700 border-gray-600":"bg-slate-50 border-slate-100"}`}>
                <p className={`leading-relaxed ${sub}`} style={{ fontSize }}>
                  {t("مثال: مرحباً بك في التطبيق","Example: Welcome to the app")}
                </p>
              </div>
            </div>
          </div>

          {/* العمود الثاني */}
          <div className="space-y-4">

            {/* الحساب */}
            <div className={`rounded-3xl border shadow-sm overflow-hidden ${card}`}>
              <div className="px-5 pt-4 pb-2">
                <span className={`text-sm font-semibold ${txt}`}>{t("الحساب","Account")}</span>
              </div>
              {accountRows.map((item, i) => (
                <div key={item.label}
                  className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors ${i < accountRows.length-1 ? `border-b ${rowDiv}` : ""} ${item.danger ? "hover:bg-red-50 dark:hover:bg-red-900/20" : rowHov}`}>
                  <div className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center text-base flex-shrink-0`}>{item.icon}</div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${item.danger ? "text-red-500" : txt}`}>{item.label}</p>
                    <p className={`text-xs ${sub}`}>{item.sublabel}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* عن التطبيق */}
            <div className={`rounded-3xl border shadow-sm overflow-hidden ${card}`}>
              <div className="px-5 pt-4 pb-2">
                <span className={`text-sm font-semibold ${txt}`}>{t("عن التطبيق","About")}</span>
              </div>
              {aboutRows.map((row, i) => (
                <div key={row.label}
                  className={`flex justify-between items-center px-5 py-3 transition-colors ${i < aboutRows.length-1 ? `border-b ${rowDiv}` : ""} ${row.link ? `cursor-pointer ${rowHov}` : ""}`}>
                  <span className={`text-sm ${sub}`}>{row.label}</span>
                  <span className={`text-sm font-medium ${row.link ? "text-emerald-500" : txt}`}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* زر الحفظ */}
            <button onClick={handleSave} disabled={saving} className={saveBtnCls}>
              {saving
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t("جارٍ الحفظ...","Saving...")}</>
                : t("💾 حفظ الإعدادات","💾 Save Settings")}
            </button>

            {!authUser && (
              <p className={`text-xs text-center ${sub}`}>
                {t("سجّل دخولك لمزامنة الإعدادات على جميع أجهزتك","Sign in to sync settings across devices")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
