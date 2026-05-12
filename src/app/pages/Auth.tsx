import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { useSettings } from "../contexts/SettingsContext";
import { motion } from "motion/react";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-85894e5c`;

export function Auth() {
  const navigate = useNavigate();
  const { darkMode, language } = useSettings();
  const t = (ar: string, en: string) => language === "ar" ? ar : en;

  const dm = darkMode;
  const txt = dm ? "text-gray-100" : "text-gray-900";
  const sub = dm ? "text-gray-400" : "text-gray-500";

  const glass = dm
    ? "bg-white/[0.04] border-white/[0.08] backdrop-blur-xl"
    : "bg-white/70 border-white/60 backdrop-blur-xl shadow-xl";

  const inputCls = dm
    ? "bg-white/[0.06] border-white/[0.1] text-gray-100 placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-[#2878C8] focus:border-[#2878C8] w-full px-3 py-2.5 text-sm border outline-none transition-all"
    : "bg-white/60 border-white/40 text-gray-900 placeholder:text-gray-400 rounded-xl focus:ring-2 focus:ring-[#2878C8] focus:border-[#2878C8] w-full px-3 py-2.5 text-sm border outline-none transition-all";

  const dividerLine = dm ? "border-white/[0.08]" : "border-gray-200/60";
  const dividerTxt = dm ? "bg-transparent text-gray-500" : "bg-transparent text-gray-400";
  const tabBase = dm ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900";
  const tabSel = "text-[#2878C8] border-b-2 border-[#2878C8] font-semibold";

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState({ login: false, signup: false, google: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const skipNav = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (skipNav.current) return;
      if (session?.user) {
        const meta = session.user.user_metadata;
        navigate(!meta?.name || !meta?.age ? "/profile" : "/dashboard", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const isLoginValid = loginData.email.includes("@") && loginData.password.length >= 6;
  const isSignupValid = signupData.name.trim().length >= 2 && signupData.email.includes("@") &&
    signupData.password.length >= 6 && signupData.password === signupData.confirmPassword;

  const handleError = (error: any) => {
    const msg = error?.message || "";
    if (msg.includes("Invalid login") || msg.includes("invalid_credentials"))
      toast.error(t("البريد أو كلمة المرور غير صحيحة", "Incorrect email or password"));
    else if (msg.includes("already registered"))
      toast.error(t("هذا البريد مسجل مسبقاً", "This email is already registered"));
    else if (msg.includes("Email not confirmed"))
      toast.error(t("تحقق من بريدك الإلكتروني أولاً", "Verify your email first"));
    else
      toast.error(t("حدث خطأ، حاول مجدداً", "An error occurred, try again"));
  };

  const handleEmailLogin = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!isLoginValid) return;
    setLoading(p => ({ ...p, login: true }));
    try {
      const { error } = await supabase.auth.signInWithPassword(loginData);
      if (error) throw error;
      toast.success(t("مرحباً بعودتك 👋", "Welcome back 👋"));
    } catch (e: any) { handleError(e); }
    finally { setLoading(p => ({ ...p, login: false })); }
  };

  const handleSignup = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!isSignupValid) { toast.error(t("تأكد من صحة جميع البيانات", "Please check all fields")); return; }
    skipNav.current = true;
    setLoading(p => ({ ...p, signup: true }));
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ email: signupData.email, password: signupData.password, name: signupData.name }),
      });
      const result = await res.json();
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email: signupData.email, password: signupData.password });
      if (!loginErr) {
        await supabase.auth.signOut();
      } else if (!res.ok) {
        throw new Error(result.error || t("فشل إنشاء الحساب", "Account creation failed"));
      }
      toast.success(t("تم إنشاء حسابك! سجل دخولك الآن", "Account created! Sign in now"));
      setActiveTab("login");
      setLoginData({ email: signupData.email, password: "" });
      setSignupData({ name: "", email: "", password: "", confirmPassword: "" });
    } catch (e: any) { handleError(e); }
    finally { skipNav.current = false; setLoading(p => ({ ...p, signup: false })); }
  };

  const handleGoogleLogin = async () => {
    setLoading(p => ({ ...p, google: true }));
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth` } });
      if (error) throw error;
    } catch { toast.error(t("فشل تسجيل الدخول عبر Google", "Google login failed")); }
    finally { setLoading(p => ({ ...p, google: false })); }
  };

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}
      className="min-h-screen flex items-center justify-center px-4 py-12 transition-colors relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 -right-40 w-[500px] h-[500px] bg-[#2878C8]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 -left-40 w-[400px] h-[400px] bg-[#5B3D8F]/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#1A8A5A]/6 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-18 h-18 mx-auto mb-4"
          >
            <img src="/logo.png" alt="حاصد" className="w-full h-full object-contain drop-shadow-lg" />
          </motion.div>
          <h1 className={`text-2xl font-bold ${txt}`}>{t("حاصد", "Small Investor")}</h1>
          <p className={`mt-1 text-sm ${sub}`}>{t("ابدأ رحلتك المالية", "Start your financial journey")}</p>
        </div>

        {/* Card */}
        <div className={`rounded-3xl border p-6 ${glass}`}>

          {/* Tabs */}
          <div className={`flex border-b mb-6 ${dividerLine}`}>
            {([["login", t("دخول", "Login")], ["signup", t("حساب جديد", "Sign Up")]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex-1 pb-3 text-sm transition-all ${activeTab === key ? tabSel : tabBase}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Login */}
          {activeTab === "login" && (
            <motion.form
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleEmailLogin} className="space-y-4"
            >
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${sub}`}>{t("البريد الإلكتروني", "Email")}</label>
                <input autoFocus type="email" dir="ltr" placeholder="example@email.com"
                  value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${sub}`}>{t("كلمة المرور", "Password")}</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder={t("6 أحرف على الأقل", "At least 6 characters")}
                    value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                    className={inputCls + " pl-10"} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${sub} hover:text-[#2878C8] transition-colors`}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className={language === "ar" ? "text-left" : "text-right"}>
                <button type="button" onClick={() => navigate("/forgot-password")}
                  className="text-sm text-[#2878C8] hover:text-[#5DADE2] transition-colors">
                  {t("نسيت كلمة المرور؟", "Forgot password?")}
                </button>
              </div>
              <button type="submit" disabled={!isLoginValid || loading.login}
                className="w-full py-2.5 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#2878C8]/25 disabled:opacity-50 transition-all hover:shadow-xl hover:shadow-[#2878C8]/30"
                style={{ background: "linear-gradient(135deg, #1B5FA0 0%, #2878C8 50%, #5DADE2 100%)" }}>
                {loading.login ? <><Loader2 className="w-4 h-4 animate-spin" />{t("جارٍ الدخول...", "Signing in...")}</> : t("تسجيل الدخول", "Sign In")}
              </button>

              {/* Divider */}
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center"><div className={`w-full border-t ${dividerLine}`} /></div>
                <div className="relative flex justify-center">
                  <span className={`px-3 text-xs ${dividerTxt}`} style={{ backgroundColor: dm ? "transparent" : "transparent" }}>
                    <span className={`px-2 py-0.5 rounded-full ${dm ? "bg-[#0c1a3d]" : "bg-white/80"}`}>{t("أو", "or")}</span>
                  </span>
                </div>
              </div>

              {/* Google */}
              <button type="button" onClick={handleGoogleLogin} disabled={loading.google}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${dm ? "bg-white/[0.06] border-white/[0.1] text-gray-200 hover:bg-white/[0.1]" : "bg-white/60 border-white/40 text-gray-700 hover:bg-white/80"}`}>
                {loading.google ? <Loader2 className="w-4 h-4 animate-spin" /> : <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />}
                {loading.google ? t("جارٍ التحميل...", "Loading...") : t("المتابعة باستخدام Google", "Continue with Google")}
              </button>
            </motion.form>
          )}

          {/* Signup */}
          {activeTab === "signup" && (
            <motion.form
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSignup} className="space-y-4"
            >
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${sub}`}>{t("الاسم الكامل", "Full Name")}</label>
                <input placeholder={t("مثال: أحمد محمد", "e.g. Ahmed Mohammed")} value={signupData.name}
                  onChange={e => setSignupData({ ...signupData, name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${sub}`}>{t("البريد الإلكتروني", "Email")}</label>
                <input type="email" dir="ltr" placeholder="example@email.com" value={signupData.email}
                  onChange={e => setSignupData({ ...signupData, email: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${sub}`}>{t("كلمة المرور", "Password")}</label>
                <input type="password" placeholder={t("6 أحرف على الأقل", "At least 6 characters")} value={signupData.password}
                  onChange={e => setSignupData({ ...signupData, password: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${sub}`}>{t("تأكيد كلمة المرور", "Confirm Password")}</label>
                <input type="password" placeholder={t("أعد كتابة كلمة المرور", "Re-enter your password")}
                  value={signupData.confirmPassword}
                  onChange={e => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  className={`${inputCls} ${signupData.confirmPassword && signupData.password !== signupData.confirmPassword ? "border-red-400/60 focus:border-red-400 focus:ring-red-400/50" : ""}`} />
                {signupData.confirmPassword && signupData.password !== signupData.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">{t("كلمتا المرور غير متطابقتين", "Passwords do not match")}</p>
                )}
              </div>
              <button type="submit" disabled={!isSignupValid || loading.signup}
                className="w-full py-2.5 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#2878C8]/25 disabled:opacity-50 transition-all hover:shadow-xl hover:shadow-[#2878C8]/30"
                style={{ background: "linear-gradient(135deg, #1B5FA0 0%, #2878C8 50%, #5DADE2 100%)" }}>
                {loading.signup ? <><Loader2 className="w-4 h-4 animate-spin" />{t("جارٍ الإنشاء...", "Creating...")}</> : t("إنشاء حساب جديد", "Create Account")}
              </button>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
