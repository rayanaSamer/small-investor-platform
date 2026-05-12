// layouts/Root.tsx
import { Outlet } from "react-router-dom";
import { Navigation } from "../components/Navigation";
import { SettingsProvider, useSettings } from "../contexts/SettingsContext";
import { NotificationsProvider } from "../contexts/NotificationsContext";

function RootWrapper() {
  const { darkMode, language } = useSettings();

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${darkMode ? "dark" : ""} ${
        darkMode
          ? "text-gray-100"
          : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-gray-900"
      }`}
      dir={language === "ar" ? "rtl" : "ltr"}
      style={darkMode ? {
        background: "linear-gradient(135deg, #020617 0%, #0c1a3d 40%, #0a1628 70%, #020617 100%)",
        backgroundAttachment: "fixed",
      } : undefined}
    >
      <Navigation />
      <Outlet />
    </div>
  );
}

export function Root() {
  return (
    <SettingsProvider>
      <NotificationsProvider>
        <RootWrapper />
      </NotificationsProvider>
    </SettingsProvider>
  );
}
