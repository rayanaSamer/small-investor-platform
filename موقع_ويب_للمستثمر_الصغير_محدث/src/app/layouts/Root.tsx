// layouts/Root.tsx
import { Outlet } from "react-router-dom";
import { Navigation } from "../components/Navigation";
import { SettingsProvider, useSettings } from "../contexts/SettingsContext";
import { useEffect } from "react";

function RootWrapper() {
  const { darkMode, language, fontSize } = useSettings();

  // تحديث حجم الخط عالمياً عبر CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty("--font-size", fontSize);
  }, [fontSize]);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${darkMode ? "dark" : ""} ${
        darkMode
          ? "bg-gray-950 text-gray-100"
          : "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 text-gray-900"
      }`}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <Navigation />
      <Outlet />
    </div>
  );
}

export function Root() {
  return (
    <SettingsProvider>
      <RootWrapper />
    </SettingsProvider>
  );
}
