import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { supabase } from "../lib/supabase";

type Settings = { darkMode: boolean; language: "ar" | "en"; notifications: boolean };

type SettingsContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
  language: "ar" | "en";
  setLanguage: (lang: "ar" | "en") => void;
  notifications: boolean;
  setNotifications: (v: boolean) => void;
  saveSettings: () => Promise<void>;
  saving: boolean;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [darkMode, setDarkMode]           = useState(false);
  const [language, setLanguageState]      = useState<"ar" | "en">("ar");
  const [notifications, setNotificationsState] = useState(true);
  const [saving, setSaving]               = useState(false);

  const userIdRef  = useRef<string | null>(null);
  const latestRef  = useRef<Settings>({ darkMode, language, notifications });
  const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latestRef.current = { darkMode, language, notifications };
  }, [darkMode, language, notifications]);

  useEffect(() => {
    const local = localStorage.getItem("hasad_settings");
    if (local) { try { applySettings(JSON.parse(local)); } catch {} }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      const uid = session?.user?.id || null;
      userIdRef.current = uid;
      if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && uid) {
        setTimeout(() => loadFromDB(uid), 0);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadFromDB = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("user_settings").select("*").eq("user_id", uid).maybeSingle();
      if (error) throw error;
      if (data) {
        const s: Settings = {
          darkMode:      data.dark_mode      ?? false,
          language:      data.language       ?? "ar",
          notifications: data.notifications  ?? true,
        };
        applySettings(s);
        localStorage.setItem("hasad_settings", JSON.stringify(s));
      }
    } catch {}
  };

  const applySettings = (s: Partial<Settings>) => {
    if (s.darkMode      !== undefined) setDarkMode(s.darkMode);
    if (s.language)                    setLanguageState(s.language);
    if (s.notifications !== undefined) setNotificationsState(s.notifications);
  };

  const scheduleSave = (s: Settings) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistToDB(s), 800);
  };

  const persistToDB = async (s: Settings) => {
    const uid = userIdRef.current;
    if (!uid) return;
    await supabase.from("user_settings").upsert({
      user_id:       uid,
      dark_mode:     s.darkMode,
      language:      s.language,
      notifications: s.notifications,
      updated_at:    new Date().toISOString(),
    });
  };

  const saveSettings = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const s = latestRef.current;
    localStorage.setItem("hasad_settings", JSON.stringify(s));
    setSaving(true);
    try { await persistToDB(s); } catch {} finally { setSaving(false); }
  };

  const toggleDarkMode = () => setDarkMode(prev => {
    const next = !prev;
    const s = { ...latestRef.current, darkMode: next };
    localStorage.setItem("hasad_settings", JSON.stringify(s));
    scheduleSave(s);
    return next;
  });

  const setLanguage = (lang: "ar" | "en") => {
    setLanguageState(lang);
    const s = { ...latestRef.current, language: lang };
    localStorage.setItem("hasad_settings", JSON.stringify(s));
    scheduleSave(s);
  };

  const setNotifications = (v: boolean) => {
    setNotificationsState(v);
    const s = { ...latestRef.current, notifications: v };
    localStorage.setItem("hasad_settings", JSON.stringify(s));
    scheduleSave(s);
  };

  return (
    <SettingsContext.Provider value={{
      darkMode, toggleDarkMode,
      language, setLanguage,
      notifications, setNotifications,
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
