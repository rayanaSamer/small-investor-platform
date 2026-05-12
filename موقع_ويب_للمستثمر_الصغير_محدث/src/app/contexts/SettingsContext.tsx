import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabase";

type FontSize = "14px" | "16px" | "18px";

type SettingsContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
  language: "ar" | "en";
  setLanguage: (lang: "ar" | "en") => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  notifications: boolean;
  setNotifications: (v: boolean) => void;
  emailAlerts: boolean;
  setEmailAlerts: (v: boolean) => void;
  saveSettings: () => Promise<void>;
  saving: boolean;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguageState] = useState<"ar" | "en">("ar");
  const [fontSize, setFontSizeState] = useState<FontSize>("16px");
  const [notifications, setNotificationsState] = useState(true);
  const [emailAlerts, setEmailAlertsState] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // تحميل الإعدادات عند البداية
  useEffect(() => {
    // تحميل من localStorage فوراً بدون انتظار
    const local = localStorage.getItem("hasad_settings");
    if (local) {
      try { applySettings(JSON.parse(local)); } catch {}
    }

    // الاعتماد على onAuthStateChange فقط - يطلق INITIAL_SESSION عند التحميل
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      const uid = session?.user?.id || null;
      setUserId(uid);
      if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && uid) {
        // تأجيل خارج دورة الحدث الحالية لتجنب استعلام DB داخل القفل
        setTimeout(() => loadFromDB(uid), 0);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadFromDB = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        const s = {
          darkMode: data.dark_mode ?? false,
          language: data.language ?? "ar",
          fontSize: data.font_size ?? "16px",
          notifications: data.notifications ?? true,
          emailAlerts: data.email_alerts ?? false,
        };
        applySettings(s);
        localStorage.setItem("hasad_settings", JSON.stringify(s));
      }
    } catch {}
  };

  const applySettings = (s: any) => {
    if (s.darkMode !== undefined) setDarkMode(s.darkMode);
    if (s.language) setLanguageState(s.language);
    if (s.fontSize) setFontSizeState(s.fontSize);
    if (s.notifications !== undefined) setNotificationsState(s.notifications);
    if (s.emailAlerts !== undefined) setEmailAlertsState(s.emailAlerts);
  };

  const getCurrentSettings = () => ({
    darkMode, language, fontSize, notifications, emailAlerts,
  });

  const saveSettings = async () => {
    const settings = getCurrentSettings();
    localStorage.setItem("hasad_settings", JSON.stringify(settings));
    if (!userId) return;
    setSaving(true);
    try {
      await supabase.from("user_settings").upsert({
        user_id: userId,
        dark_mode: settings.darkMode,
        language: settings.language,
        font_size: settings.fontSize,
        notifications: settings.notifications,
        email_alerts: settings.emailAlerts,
        updated_at: new Date().toISOString(),
      });
    } catch {}
    finally { setSaving(false); }
  };

  // كل تغيير يُحفظ فوراً في localStorage حتى لا يُفقد عند تجديد الـ token
  const toggleDarkMode = () => setDarkMode(p => {
    const next = !p;
    localStorage.setItem("hasad_settings", JSON.stringify({ ...getCurrentSettings(), darkMode: next }));
    return next;
  });
  const setLanguage = (lang: "ar" | "en") => {
    setLanguageState(lang);
    localStorage.setItem("hasad_settings", JSON.stringify({ ...getCurrentSettings(), language: lang }));
  };
  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem("hasad_settings", JSON.stringify({ ...getCurrentSettings(), fontSize: size }));
  };
  const setNotifications = (v: boolean) => {
    setNotificationsState(v);
    localStorage.setItem("hasad_settings", JSON.stringify({ ...getCurrentSettings(), notifications: v }));
  };
  const setEmailAlerts = (v: boolean) => {
    setEmailAlertsState(v);
    localStorage.setItem("hasad_settings", JSON.stringify({ ...getCurrentSettings(), emailAlerts: v }));
  };

  return (
    <SettingsContext.Provider value={{
      darkMode, toggleDarkMode,
      language, setLanguage,
      fontSize, setFontSize,
      notifications, setNotifications,
      emailAlerts, setEmailAlerts,
      saveSettings, saving,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
};
