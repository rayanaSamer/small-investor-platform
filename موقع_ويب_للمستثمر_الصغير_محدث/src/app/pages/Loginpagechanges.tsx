// LoginPageChanges.tsx
import { useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { useSettings } from "../contexts/SettingsContext";

export default function LoginPageChanges() {
  const { language, darkMode } = useSettings();
  const t = (ar: string, en: string) => language === "ar" ? ar : en;

  const dm = darkMode;

  const pageBg = dm
    ? "bg-gray-950"
    : "bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20";

  const cardBg = dm
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-slate-100";

  const txt = dm ? "text-gray-100" : "text-gray-900";
  const sub = dm ? "text-gray-400" : "text-gray-500";

  const inputCls = dm
    ? "bg-gray-700 border-gray-600 text-gray-100 rounded-xl w-full px-3 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-emerald-400"
    : "bg-slate-50 border-slate-200 text-gray-900 rounded-xl w-full px-3 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-emerald-400";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error(t("املأ جميع الحقول", "Fill all fields"));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success(t("تم تسجيل الدخول بنجاح", "Logged in successfully"));
      window.location.href = "/dashboard"; // غيّرها حسب مشروعك

    } catch (err: any) {
      toast.error(err.message || t("خطأ في تسجيل الدخول", "Login error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      className={`min-h-screen flex items-center justify-center px-4 ${pageBg}`}
    >
      <div className="w-full max-w-sm space-y-5">

        {/* Header */}
        <div className="text-center">
          <h1 className={`text-2xl font-bold ${txt}`}>
            {t("تسجيل الدخول", "Login")}
          </h1>
          <p className={`text-sm mt-1 ${sub}`}>
            {t("ادخل بياناتك للمتابعة", "Enter your details to continue")}
          </p>
        </div>

        {/* Card */}
        <div className={`rounded-3xl border shadow-lg p-6 space-y-4 ${cardBg}`}>

          {/* Email */}
          <div>
            <label className={`block text-xs mb-1 ${sub}`}>
              {t("البريد الإلكتروني", "Email")}
            </label>
            <input
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="example@email.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className={`block text-xs mb-1 ${sub}`}>
              {t("كلمة المرور", "Password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* 🔥 Forgot Password */}
          <div className={`${language === "ar" ? "text-right" : "text-left"}`}>
            <Link
              to="/forgot-password"
              className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
            >
              {t("نسيت كلمة السر؟", "Forgot your password?")}
            </Link>
          </div>

          {/* Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {loading
              ? t("جاري الدخول...", "Logging in...")
              : t("تسجيل الدخول", "Login")}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm">
          <span className={sub}>
            {t("ليس لديك حساب؟", "Don't have an account?")}
          </span>{" "}
          <Link to="/register" className="text-emerald-600 hover:underline">
            {t("إنشاء حساب", "Sign up")}
          </Link>
        </div>
<div style={{ textAlign: "left", marginBottom: "1rem" }}>
    <Link to="/reset-password" className="forgot-password-link">
      نسيت كلمة السر؟
    </Link>
  </div>
      </div>
    </div>
  );
}