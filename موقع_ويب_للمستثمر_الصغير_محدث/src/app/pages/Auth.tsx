import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { useSettings } from "../contexts/SettingsContext";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-85894e5c`;

export function Auth() {
  const navigate = useNavigate();
  const { darkMode, language } = useSettings();
  const t = (ar: string, en: string) => language === "ar" ? ar : en;

  const dm       = darkMode;
  const pageBg   = dm ? "bg-gray-950" : "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50";
  const cardBg   = dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-100";
  const txt      = dm ? "text-gray-100" : "text-gray-900";
  const sub      = dm ? "text-gray-400" : "text-gray-500";
  const inputCls = dm
    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500 rounded-xl focus:ring-emerald-400 focus:border-emerald-400 w-full px-3 py-2 text-sm border outline-none transition-colors"
    : "bg-slate-50 border-slate-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 w-full px-3 py-2 text-sm border outline-none transition-colors";
  const dividerLine = dm ? "border-gray-700" : "border-slate-200";
  const dividerTxt  = dm ? "bg-gray-800 text-gray-500" : "bg-white text-gray-400";
  const tabBase = dm ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900";
  const tabSel  = "text-emerald-600 border-b-2 border-emerald-500 font-semibold";

  const [activeTab, setActiveTab]     = useState<"login"|"signup">("login");
  const [loading, setLoading]         = useState({ login:false, signup:false, google:false });
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData]     = useState({ email:"", password:"" });
  const [signupData, setSignupData]   = useState({ name:"", email:"", password:"", confirmPassword:"" });

  useEffect(() => {
    // نقطة واحدة للـ navigation تشمل: الجلسة الموجودة + تسجيل الدخول + Google OAuth callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        navigate(!meta?.name || !meta?.age ? "/profile" : "/dashboard", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const isLoginValid  = loginData.email.includes("@") && loginData.password.length >= 6;
  const isSignupValid = signupData.name.trim().length >= 2 && signupData.email.includes("@") &&
    signupData.password.length >= 6 && signupData.password === signupData.confirmPassword;

  const handleError = (error: any) => {
    const msg = error?.message || "";
    if (msg.includes("Invalid login") || msg.includes("invalid_credentials"))
      toast.error(t("البريد أو كلمة المرور غير صحيحة","Incorrect email or password"));
    else if (msg.includes("already registered"))
      toast.error(t("هذا البريد مسجل مسبقاً","This email is already registered"));
    else if (msg.includes("Email not confirmed"))
      toast.error(t("تحقق من بريدك الإلكتروني أولاً","Verify your email first"));
    else
      toast.error(t("حدث خطأ، حاول مجدداً","An error occurred, try again"));
  };

  const handleEmailLogin = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!isLoginValid) return;
    setLoading(p => ({ ...p, login:true }));
    try {
      const { error } = await supabase.auth.signInWithPassword(loginData);
      if (error) throw error;
      toast.success(t("مرحباً بعودتك 👋","Welcome back 👋"));
      // التوجيه يتم تلقائياً عبر onAuthStateChange
    } catch(e: any) { handleError(e); }
    finally { setLoading(p => ({ ...p, login:false })); }
  };

  const handleSignup = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!isSignupValid) { toast.error(t("تأكد من صحة جميع البيانات","Please check all fields")); return; }
    setLoading(p => ({ ...p, signup:true }));
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${publicAnonKey}` },
        body: JSON.stringify({ email:signupData.email, password:signupData.password, name:signupData.name }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || t("فشل إنشاء الحساب","Account creation failed"));
      const { error:loginErr } = await supabase.auth.signInWithPassword({ email:signupData.email, password:signupData.password });
      if (loginErr) throw loginErr;
      toast.success(t("🎉 تم إنشاء حسابك بنجاح!","🎉 Account created successfully!"));
      // التوجيه يتم تلقائياً عبر onAuthStateChange
    } catch(e: any) { handleError(e); }
    finally { setLoading(p => ({ ...p, signup:false })); }
  };

  const handleGoogleLogin = async () => {
    setLoading(p => ({ ...p, google:true }));
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider:"google", options:{ redirectTo:`${window.location.origin}/auth` } });
      if (error) throw error;
    } catch { toast.error(t("فشل تسجيل الدخول عبر Google","Google login failed")); }
    finally { setLoading(p => ({ ...p, google:false })); }
  };

  return (
    <div dir={language==="ar"?"rtl":"ltr"} className={`min-h-screen flex items-center justify-center px-4 py-12 transition-colors ${pageBg}`}>
      <div className="max-w-md w-full">

        {/* الشعار */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200/40 mb-4">
            <TrendingUp className="w-9 h-9 text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${txt}`}>{t("المستثمر الصغير","Small Investor")}</h1>
          <p className={`mt-1 ${sub}`}>{t("ابدأ رحلتك المالية 🚀","Start your financial journey 🚀")}</p>
        </div>

        {/* البطاقة */}
        <div className={`rounded-3xl border shadow-xl p-6 ${cardBg}`}>

          {/* تابس */}
          <div className={`flex border-b mb-6 ${dividerLine}`}>
            {([["login", t("دخول","Login")], ["signup", t("حساب جديد","Sign Up")]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex-1 pb-3 text-sm transition-all ${activeTab===key ? tabSel : tabBase}`}>
                {label}
              </button>
            ))}
          </div>

          {/* تسجيل الدخول */}
          {activeTab === "login" && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${sub}`}>{t("البريد الإلكتروني","Email")}</label>
                <input autoFocus type="email" dir="ltr" placeholder="example@email.com"
                  value={loginData.email} onChange={e => setLoginData({ ...loginData, email:e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${sub}`}>{t("كلمة المرور","Password")}</label>
                <div className="relative">
                  <input type={showPassword?"text":"password"} placeholder={t("6 أحرف على الأقل","At least 6 characters")}
                    value={loginData.password} onChange={e => setLoginData({ ...loginData, password:e.target.value })}
                    className={inputCls + " pl-10"} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${sub} hover:text-gray-400 transition-colors`}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className={language==="ar"?"text-left":"text-right"}>
                <button type="button" onClick={() => navigate("/forgot-password")}
                  className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors">
                  {t("نسيت كلمة المرور؟","Forgot password?")}
                </button>
              </div>
              <button type="submit" disabled={!isLoginValid || loading.login}
                className="w-full py-2.5 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-200/40 transition-all">
                {loading.login ? <><Loader2 className="w-4 h-4 animate-spin" />{t("جارٍ الدخول...","Signing in...")}</> : t("تسجيل الدخول","Sign In")}
              </button>

              {/* فاصل */}
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center"><div className={`w-full border-t ${dividerLine}`} /></div>
                <div className="relative flex justify-center"><span className={`px-3 text-xs ${dividerTxt}`}>{t("أو","or")}</span></div>
              </div>

              {/* Google */}
              <button type="button" onClick={handleGoogleLogin} disabled={loading.google}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${dm?"bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600":"bg-white border-slate-200 text-gray-700 hover:bg-slate-50"}`}>
                {loading.google ? <Loader2 className="w-4 h-4 animate-spin" /> : <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />}
                {loading.google ? t("جارٍ التحميل...","Loading...") : t("المتابعة باستخدام Google","Continue with Google")}
              </button>
            </form>
          )}

          {/* إنشاء حساب */}
          {activeTab === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${sub}`}>{t("الاسم الكامل","Full Name")}</label>
                <input placeholder={t("مثال: أحمد محمد","e.g. Ahmed Mohammed")} value={signupData.name}
                  onChange={e => setSignupData({ ...signupData, name:e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${sub}`}>{t("البريد الإلكتروني","Email")}</label>
                <input type="email" dir="ltr" placeholder="example@email.com" value={signupData.email}
                  onChange={e => setSignupData({ ...signupData, email:e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${sub}`}>{t("كلمة المرور","Password")}</label>
                <input type="password" placeholder={t("6 أحرف على الأقل","At least 6 characters")} value={signupData.password}
                  onChange={e => setSignupData({ ...signupData, password:e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${sub}`}>{t("تأكيد كلمة المرور","Confirm Password")}</label>
                <input type="password" placeholder={t("أعد كتابة كلمة المرور","Re-enter your password")}
                  value={signupData.confirmPassword}
                  onChange={e => setSignupData({ ...signupData, confirmPassword:e.target.value })}
                  className={`${inputCls} ${signupData.confirmPassword && signupData.password!==signupData.confirmPassword ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""}`} />
                {signupData.confirmPassword && signupData.password!==signupData.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{t("كلمتا المرور غير متطابقتين","Passwords do not match")}</p>
                )}
              </div>
              <button type="submit" disabled={!isSignupValid || loading.signup}
                className="w-full py-2.5 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-200/40 transition-all">
                {loading.signup ? <><Loader2 className="w-4 h-4 animate-spin" />{t("جارٍ الإنشاء...","Creating...")}</> : t("إنشاء حساب جديد","Create Account")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

