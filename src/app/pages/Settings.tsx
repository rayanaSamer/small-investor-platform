import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Moon, Sun, Mail, KeyRound, Trash2, AlertTriangle } from "lucide-react";

function Toggle({ checked, onChange, darkMode }: { checked: boolean; onChange: () => void; darkMode: boolean }) {
  return (
    <button onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${checked ? "bg-gradient-to-r from-[#2878C8] to-[#5DADE2]" : darkMode ? "bg-white/[0.08]" : "bg-gray-200"}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${checked ? "translate-x-6" : "translate-x-0.5"}`} />
    </button>
  );
}

export function Settings() {
  const { darkMode, toggleDarkMode, language, setLanguage } = useSettings();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts]     = useState(false);
  const [saving, setSaving]               = useState(false);
  const [loaded, setLoaded]               = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  const t  = (ar: string, en: string) => language === "ar" ? ar : en;
  const dm = darkMode;

  const glass = dm
    ? "bg-white/[0.04] border-white/[0.08] backdrop-blur-xl"
    : "bg-white/70 border-white/60 backdrop-blur-xl shadow-lg";

  const txt      = dm ? "text-gray-100" : "text-gray-900";
  const sub      = dm ? "text-gray-400" : "text-gray-500";
  const rowDiv   = dm ? "border-white/[0.06]" : "border-gray-100/60";
  const rowHov   = dm ? "hover:bg-white/[0.04]" : "hover:bg-white/50";
  const btnSel   = "text-white border-[#2878C8] shadow-sm";
  const btnIdle  = dm ? "bg-white/[0.04] text-gray-300 border-white/[0.08] hover:bg-white/[0.08]" : "bg-white/60 text-gray-600 border-gray-200/60 hover:bg-white/80";

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
          user_id: authUser.id, language, dark_mode: darkMode,
          notifications, email_alerts: emailAlerts, updated_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
      toast.success(t("تم حفظ الإعدادات","Settings saved"));
    } catch { toast.error(t("فشل الحفظ","Save failed")); }
    finally { setSaving(false); }
  };

  const handleDeleteAccount = async () => {
    if (!authUser) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success(t("تم حذف الحساب نهائيا","Account permanently deleted"));
      navigate("/");
    } catch {
      toast.error(t("فشل حذف الحساب، حاول مجددا","Failed to delete account, try again"));
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (!loaded) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-[#2878C8] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const toggleRows = [
    {
      icon: darkMode ? <Moon className="w-4.5 h-4.5 text-[#5DADE2]" /> : <Sun className="w-4.5 h-4.5 text-[#E8A830]" />,
      iconBg: dm ? "bg-[#5DADE2]/10" : "bg-[#E8A830]/10",
      label: t("الوضع الليلي","Dark Mode"),
      sublabel: darkMode ? t("مفعّل","On") : t("غير مفعّل","Off"),
      checked: darkMode, onChange: toggleDarkMode,
    },
    {
      icon: <Mail className="w-4.5 h-4.5 text-[#2878C8]" />,
      iconBg: dm ? "bg-[#2878C8]/10" : "bg-[#2878C8]/8",
      label: t("تنبيهات البريد","Email Alerts"),
      sublabel: emailAlerts ? t("مفعّلة","On") : t("معطّلة","Off"),
      checked: emailAlerts, onChange: () => setEmailAlerts(v => !v),
    },
  ];

  const handlePasswordReset = async () => {
    if (!authUser?.email) { toast.error(t("لا يوجد بريد إلكتروني","No email found")); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(authUser.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(t("فشل الإرسال","Failed to send"));
    else toast.success(t("تم إرسال رابط إعادة التعيين","Reset link sent"));
  };

  const accountRows = [
    { icon:<KeyRound className="w-4.5 h-4.5 text-[#5B3D8F]" />, label:t("تغيير كلمة المرور","Change Password"), sublabel:t("إعادة تعيين عبر البريد","Reset via email"), iconBg:dm?"bg-[#5B3D8F]/10":"bg-[#5B3D8F]/8", danger:false, onClick:handlePasswordReset },
    {
      icon: confirmDelete ? <AlertTriangle className="w-4.5 h-4.5 text-red-400" /> : <Trash2 className="w-4.5 h-4.5 text-red-400" />,
      label: confirmDelete
        ? (deleting ? t("جارٍ الحذف...","Deleting...") : t("تأكيد الحذف النهائي","Confirm Permanent Delete"))
        : t("حذف الحساب","Delete Account"),
      sublabel: confirmDelete
        ? t("انقر مرة أخرى لتأكيد الحذف","Click again to confirm deletion")
        : t("إجراء لا يمكن التراجع عنه","This cannot be undone"),
      iconBg: dm ? "bg-red-500/10" : "bg-red-50",
      danger: true,
      onClick: confirmDelete ? handleDeleteAccount : () => setConfirmDelete(true),
    },
  ];

  const aboutRows = [
    { label:t("سياسة الخصوصية","Privacy"), value:"→", link:true  },
    { label:t("شروط الاستخدام","Terms"),   value:"→", link:true  },
  ];

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}
      className="min-h-screen py-6 md:py-10 px-4 md:px-8 transition-colors relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -right-32 w-96 h-96 bg-[#2878C8]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -left-32 w-80 h-80 bg-[#5B3D8F]/6 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-6 md:mb-8">
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`text-2xl md:text-3xl font-bold ${txt}`}>{t("الإعدادات","Settings")}</motion.h1>
          <p className={`text-sm mt-1 ${sub}`}>
            {authUser ? t("الإعدادات تُحفظ على حسابك","Settings sync to your account") : t("تحكم في تجربتك داخل التطبيق","Customize your experience")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            {/* General */}
            <div className={`rounded-2xl border overflow-hidden ${glass}`}>
              <div className="px-5 pt-4 pb-2">
                <span className={`text-sm font-semibold ${txt}`}>{t("عام","General")}</span>
              </div>
              {toggleRows.map((row, i) => (
                <div key={row.label} className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${i < toggleRows.length - 1 ? `border-b ${rowDiv}` : ""} ${rowHov}`}>
                  <div className={`w-9 h-9 rounded-xl ${row.iconBg} flex items-center justify-center text-base flex-shrink-0`}>{row.icon}</div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${txt}`}>{row.label}</p>
                    <p className={`text-xs ${sub}`}>{row.sublabel}</p>
                  </div>
                  <Toggle checked={row.checked} onChange={row.onChange} darkMode={dm} />
                </div>
              ))}
            </div>

            {/* Language */}
            <div className={`rounded-2xl border p-5 ${glass}`}>
              <p className={`text-sm font-semibold mb-4 ${txt}`}>{t("اللغة","Language")}</p>
              <div className="grid grid-cols-2 gap-2">
                {(["ar","en"] as const).map(lang => (
                  <button key={lang} onClick={() => setLanguage(lang)}
                    className={`py-3 rounded-xl text-sm font-medium border transition-all ${language === lang ? btnSel : btnIdle}`}
                    style={language === lang ? { background: "linear-gradient(135deg, #1B5FA0, #2878C8)" } : undefined}>
                    {lang === "ar" ? "العربية" : "English"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Account */}
            <div className={`rounded-2xl border overflow-hidden ${glass}`}>
              <div className="px-5 pt-4 pb-2">
                <span className={`text-sm font-semibold ${txt}`}>{t("الحساب","Account")}</span>
              </div>
              {accountRows.map((item, i) => (
                <div key={item.label} onClick={item.onClick}
                  className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors ${i < accountRows.length - 1 ? `border-b ${rowDiv}` : ""} ${item.danger ? dm ? "hover:bg-red-500/10" : "hover:bg-red-50" : rowHov}`}>
                  <div className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center text-base flex-shrink-0`}>{item.icon}</div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${item.danger ? "text-red-400" : txt}`}>{item.label}</p>
                    <p className={`text-xs ${sub}`}>{item.sublabel}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* About */}
            <div className={`rounded-2xl border overflow-hidden ${glass}`}>
              <div className="px-5 pt-4 pb-2">
                <span className={`text-sm font-semibold ${txt}`}>{t("عن التطبيق","About")}</span>
              </div>
              {aboutRows.map((row, i) => (
                <div key={row.label}
                  className={`flex justify-between items-center px-5 py-3 transition-colors ${i < aboutRows.length - 1 ? `border-b ${rowDiv}` : ""} ${row.link ? `cursor-pointer ${rowHov}` : ""}`}>
                  <span className={`text-sm ${sub}`}>{row.label}</span>
                  <span className={`text-sm font-medium ${row.link ? "text-[#2878C8]" : txt}`}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Save */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white shadow-lg shadow-[#2878C8]/20 disabled:opacity-60 transition-all"
              style={{ background: "linear-gradient(135deg, #1B5FA0 0%, #2878C8 50%, #5DADE2 100%)" }}
            >
              {saving
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t("جارٍ الحفظ...","Saving...")}</>
                : t("حفظ الإعدادات","Save Settings")}
            </motion.button>

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
