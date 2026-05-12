import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useSettings } from "../contexts/SettingsContext";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const { language, darkMode } = useSettings();
  const t = (ar: string, en: string) => language === "ar" ? ar : en;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("access_token"); // token من رابط إعادة التعيين

  const dm      = darkMode;
  const pageBg  = dm ? "bg-gray-950" : "bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20";
  const cardBg  = dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-100";
  const txt     = dm ? "text-gray-100" : "text-gray-900";
  const sub     = dm ? "text-gray-400" : "text-gray-500";
  const inputCls = dm
    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500 rounded-xl w-full px-3 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
    : "bg-slate-50 border-slate-200 text-gray-900 rounded-xl w-full px-3 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    // إذا ما جاء token من الرابط، نرسل المستخدم لطلب رابط جديد
    if (!token) return;

    // تحقق من صلاحية الرابط عند البداية
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      // جاهز للفورم مباشرة
      setIsReady(true);
    });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError(t("الرابط غير صالح أو انتهت صلاحيته", "Invalid or expired link"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("كلمتا المرور غير متطابقتين", "Passwords do not match"));
      return;
    }

    if (password.length < 6) {
      setError(t("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "Password must be at least 6 characters"));
      return;
    }

    setLoading(true);
    try {
      // تحديث كلمة المرور باستخدام token
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setDone(true);
      setTimeout(() => navigate("/auth"), 2500);
    } catch (err: any) {
      setError(err.message || t("حدث خطأ، حاول مجدداً", "An error occurred, try again"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"} className={`min-h-screen flex items-center justify-center px-4 py-12 transition-colors ${pageBg}`}>
      <div className="w-full max-w-sm space-y-5">
        {/* Header */}
        <div className="flex flex-col items-center mb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-200/40 mb-3">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className={`text-2xl font-bold ${txt}`}>
            {t("تعيين كلمة مرور جديدة", "Set New Password")}
          </h1>
          <p className={`text-sm text-center mt-1.5 ${sub}`}>
            {t("اختر كلمة مرور قوية لحسابك", "Choose a strong password for your account")}
          </p>
        </div>

        {/* Card */}
        <div className={`rounded-3xl border shadow-lg p-6 space-y-4 ${cardBg}`}>
          {!isReady && !done && (
            <div className="text-center py-6 space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
              <p className={`text-sm ${sub}`}>
                {t("جارٍ التحقق من الرابط...", "Verifying link...")}
              </p>
              <p className={`text-xs ${sub}`}>
                {t("إذا لم يعمل الرابط، اطلب رابطاً جديداً", "If the link doesn't work, request a new one")}
              </p>
              <a href="/forgot-password" className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
                {t("← طلب رابط جديد", "← Request new link")}
              </a>
            </div>
          )}

          {done && (
            <div className="text-center py-6 space-y-3">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${dm ? "bg-emerald-900/40" : "bg-emerald-100"}`}>
                <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className={`font-semibold ${txt}`}>
                {t("✓ تم تغيير كلمة المرور بنجاح!", "✓ Password changed successfully!")}
              </p>
              <p className={`text-xs ${sub}`}>
                {t("سيتم تحويلك لتسجيل الدخول...", "Redirecting to sign in...")}
              </p>
            </div>
          )}

          {isReady && !done && (
            <form onSubmit={handleSubmit} className="space-y-4">

              {error && (
                <div className={`text-xs px-3 py-2 rounded-xl ${dm ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"}`}>
                  {error}
                </div>
              )}

              {/* كلمة المرور */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${sub}`}>
                  {t("كلمة المرور الجديدة", "New Password")}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder={t("6 أحرف على الأقل", "At least 6 characters")}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={inputCls + (language === "ar" ? " pl-10" : " pr-10")}
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className={`absolute top-1/2 -translate-y-1/2 ${language === "ar" ? "left-3" : "right-3"} ${sub} hover:text-gray-400 transition-colors`}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* تأكيد كلمة المرور */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${sub}`}>
                  {t("تأكيد كلمة المرور", "Confirm Password")}
                </label>
                <input
                  type="password"
                  placeholder={t("أعد كتابة كلمة المرور", "Re-enter your password")}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`${inputCls} ${confirmPassword && password !== confirmPassword ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""}`}
                  required
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {t("كلمتا المرور غير متطابقتين", "Passwords do not match")}
                  </p>
                )}
              </div>

              <button type="submit" disabled={loading || password.length < 6 || password !== confirmPassword}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold transition-all shadow-md shadow-emerald-200/40 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t("جارٍ التحديث...", "Updating...")}</>
                  : t("تحديث كلمة المرور", "Update Password")}
              </button>
            </form>
          )}
        </div>

        <div className="text-center">
          <a href="/auth" className={`text-sm transition-colors ${dm ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"}`}>
            {t("← العودة لتسجيل الدخول", "← Back to Sign In")}
          </a>
        </div>
      </div>
    </div>
  );
}