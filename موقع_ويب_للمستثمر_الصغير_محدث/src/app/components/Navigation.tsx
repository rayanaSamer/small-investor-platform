import { Link, useLocation } from "react-router-dom";
import { Home, LayoutDashboard, TrendingUp, Users, Trophy, ShoppingBag, User, Settings, Brain } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useSettings } from "../contexts/SettingsContext";

export function Navigation() {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const { darkMode, language } = useSettings();
  const t = (ar: string, en: string) => language === "ar" ? ar : en;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const links = [
    { to: "/",           label: t("الرئيسية", "Home"),        icon: Home },
    { to: "/dashboard",  label: t("التحكم", "Dashboard"),     icon: LayoutDashboard },
    { to: "/investment", label: t("الاستثمار", "Invest"),     icon: TrendingUp },
    { to: "/products",   label: t("المنتجات", "Products"),    icon: ShoppingBag },
    { to: "/community",  label: t("المجتمع", "Community"),    icon: Users },
    { to: "/achievements",label: t("الإنجازات", "Achievements"), icon: Trophy },
    { to: "/ml-analysis", label: t("تحليل AI", "AI Analysis"),  icon: Brain  },
    { to: "/settings",   label: t("الإعدادات", "Settings"),   icon: Settings },
  ];

  if (location.pathname === "/auth") return null;

  const navBg    = darkMode ? "bg-gray-900/95 border-gray-700" : "bg-white/80 border-gray-200";
  const logoText = darkMode ? "text-white" : "text-gray-900";
  const linkActive = "bg-emerald-600 hover:bg-emerald-700 text-white";
  const linkIdle  = darkMode
    ? "text-gray-300 hover:bg-gray-800 hover:text-white"
    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
  const mobileBorder = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    <nav className={`${navBg} backdrop-blur-md border-b sticky top-0 z-50 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className={`font-bold text-lg ${logoText} hidden sm:inline`}>
              {t("المستثمر الصغير", "Small Investor")}
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link key={link.to} to={link.to}>
                  <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive ? linkActive : linkIdle}`}>
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </button>
                </Link>
              );
            })}
          </div>

          {/* User */}
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/profile">
                <button className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${darkMode ? "hover:bg-gray-800 text-gray-200" : "hover:bg-gray-100 text-gray-700"}`}>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-semibold">
                      {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium">
                    {user.user_metadata?.name || t("حسابي", "My Account")}
                  </span>
                </button>
              </Link>
            ) : (
              <Link to="/auth">
                <button className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm">
                  <User className="w-4 h-4" />
                  {t("دخول", "Login")}
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`md:hidden border-t ${mobileBorder} overflow-x-auto`}>
        <div className="flex items-center gap-1 px-2 py-2 min-w-max">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to}>
                <button className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${isActive ? linkActive : linkIdle}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
