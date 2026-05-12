import { Link, useLocation } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  TrendingUp,
  Users,
  Trophy,
  ShoppingBag,
  User,
  Settings,
  Bell,
  X,
  Star,
  Award,
  Target,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useSettings } from "../contexts/SettingsContext";
import { useNotifications } from "../contexts/NotificationsContext";

const NAV_COLORS: Record<string, { from: string; to: string }> = {
  blue:   { from: "#2878C8", to: "#5DADE2" },
  green:  { from: "#1A8A5A", to: "#2ECC71" },
  purple: { from: "#5B3D8F", to: "#7D5CB8" },
};

export function Navigation() {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [avatarColorId, setAvatarColorId] = useState(
    () => localStorage.getItem("hasad_avatar_color") || "blue"
  );
  const bellRef = useRef<HTMLDivElement>(null);
  const { darkMode, language } = useSettings();
  const {
    notifications,
    unreadCount,
    markAllRead,
    clearAll,
  } = useNotifications();

  useEffect(() => {
    const handler = () =>
      setAvatarColorId(
        localStorage.getItem("hasad_avatar_color") || "blue"
      );
    window.addEventListener("hasad-avatar-changed", handler);
    return () => window.removeEventListener("hasad-avatar-changed", handler);
  }, []);

  const t = (ar: string, en: string) =>
    language === "ar" ? ar : en;

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBellClick = () => {
    setShowNotifs((v) => !v);
    if (!showNotifs) markAllRead();
  };

  const links = [
    { to: "/", label: t("الرئيسية", "Home"), icon: Home },
    { to: "/dashboard", label: t("التحكم", "Dashboard"), icon: LayoutDashboard },
    { to: "/investment", label: t("الاستثمار", "Invest"), icon: TrendingUp },
    { to: "/products", label: t("المنتجات", "Products"), icon: ShoppingBag },
    { to: "/community", label: t("المجتمع", "Community"), icon: Users },
    { to: "/achievements", label: t("الإنجازات", "Achievements"), icon: Trophy },
    { to: "/settings", label: t("الإعدادات", "Settings"), icon: Settings },
  ];

  if (
    ["/auth", "/forgot-password", "/reset-password"].includes(
      location.pathname
    )
  )
    return null;

  const dm = darkMode;

  /* ── style tokens ── */
  const navBg = dm
    ? "bg-[#020617]/80 border-white/[0.06]"
    : "bg-white/70 border-gray-200/60";

  const logoText = dm ? "text-white" : "text-gray-900";

  const linkActive = dm
    ? "bg-gradient-to-r from-[#2878C8]/20 to-[#5DADE2]/20 text-[#5DADE2] border border-[#2878C8]/20"
    : "bg-gradient-to-r from-[#2878C8] to-[#1B5FA0] text-white shadow-sm shadow-[#2878C8]/20";

  const linkIdle = dm
    ? "text-gray-400 hover:text-white hover:bg-white/[0.06]"
    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/80";

  const mobileBorder = dm ? "border-white/[0.06]" : "border-gray-200/60";

  const dropBg = dm
    ? "bg-[#0c1a3d]/95 border-white/[0.08] backdrop-blur-xl"
    : "bg-white/95 border-gray-200 backdrop-blur-xl";

  const notifHov = dm ? "hover:bg-white/[0.05]" : "hover:bg-gray-50";
  const txt = dm ? "text-gray-100" : "text-gray-900";
  const sub = dm ? "text-gray-400" : "text-gray-500";

  const typeIcon = (type: string) => {
    if (type === "points")
      return <Star className="w-4 h-4 text-yellow-400" />;
    if (type === "achievement")
      return <Award className="w-4 h-4 text-[#5DADE2]" />;
    if (type === "challenge")
      return <Target className="w-4 h-4 text-cyan-400" />;
    return <Bell className="w-4 h-4 text-gray-400" />;
  };

  const getRelTime = (iso: string) => {
    const mins = Math.floor(
      (Date.now() - new Date(iso).getTime()) / 60000
    );
    if (mins < 1) return t("الآن", "Just now");
    if (mins < 60) return t(`منذ ${mins} د`, `${mins}m ago`);
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t(`منذ ${hrs} س`, `${hrs}h ago`);
    return t(
      `منذ ${Math.floor(hrs / 24)} ي`,
      `${Math.floor(hrs / 24)}d ago`
    );
  };

  return (
    <nav
      className={`${navBg} backdrop-blur-xl border-b sticky top-0 z-50 transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="حاصد"
                className="w-full h-full object-contain"
              />
            </div>
            <span
              className={`font-bold text-lg hidden sm:inline ${logoText}`}
            >
              {t("حاصد", "Small Investor")}
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link key={link.to} to={link.to}>
                  <button
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive ? linkActive : linkIdle
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </button>
                </Link>
              );
            })}
          </div>

          {/* Bell + User */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            {user && (
              <div ref={bellRef} className="relative">
                <button
                  onClick={handleBellClick}
                  className={`relative p-2.5 rounded-xl transition-all duration-200 ${
                    dm
                      ? "hover:bg-white/[0.06] text-gray-400 hover:text-white"
                      : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {showNotifs && (
                  <div
                    className={`absolute ${
                      language === "ar" ? "left-0" : "right-0"
                    } top-12 w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden ${dropBg}`}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
                      <span className={`font-semibold text-sm ${txt}`}>
                        {t("الإشعارات", "Notifications")}
                      </span>
                      <div className="flex items-center gap-2">
                        {notifications.length > 0 && (
                          <button
                            onClick={clearAll}
                            className={`text-xs ${sub} hover:text-red-400 transition-colors`}
                          >
                            {t("مسح الكل", "Clear all")}
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifs(false)}
                          className={`${sub} hover:text-red-400`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell className={`w-8 h-8 mx-auto mb-2 ${sub}`} />
                          <p className={`text-sm ${sub}`}>
                            {t("لا توجد إشعارات", "No notifications")}
                          </p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`flex items-start gap-3 px-4 py-3 border-b border-inherit last:border-0 transition-colors ${notifHov}`}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              {typeIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-snug ${txt}`}>
                                {language === "ar"
                                  ? n.message
                                  : n.messageEn}
                              </p>
                              <p className={`text-xs mt-0.5 ${sub}`}>
                                {getRelTime(n.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Avatar */}
            {user ? (
              <Link to="/profile">
                <button
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                    dm
                      ? "hover:bg-white/[0.06] text-gray-200"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${
                        (
                          NAV_COLORS[avatarColorId] ??
                          NAV_COLORS.blue
                        ).from
                      }, ${
                        (
                          NAV_COLORS[avatarColorId] ??
                          NAV_COLORS.blue
                        ).to
                      })`,
                    }}
                  >
                    {user.user_metadata?.name?.charAt(0) ||
                      user.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </div>
                  <span className="hidden md:inline text-sm font-medium">
                    {user.user_metadata?.name ||
                      t("حسابي", "My Account")}
                  </span>
                </button>
              </Link>
            ) : (
              <Link to="/auth">
                <button className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-[#2878C8] to-[#1B5FA0] hover:opacity-90 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-[#2878C8]/20">
                  <User className="w-4 h-4" />
                  {t("دخول", "Login")}
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden border-t ${mobileBorder} overflow-x-auto`}
      >
        <div className="flex items-center gap-1 px-2 py-2 min-w-max">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to}>
                <button
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive ? linkActive : linkIdle
                  }`}
                >
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
