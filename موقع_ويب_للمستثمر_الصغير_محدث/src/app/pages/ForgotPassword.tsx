import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useSettings } from "../contexts/SettingsContext";
import { Eye, EyeOff } from "lucide-react";

type Step = "email" | "otp" | "password";

export default function ForgotPassword() {
  const { language, darkMode } = useSettings();
  const t = (ar: string, en: string) => language === "ar" ? ar : en;
  const navigate = useNavigate();

  const dm      = darkMode;
  const pageBg  = dm ? "bg-gray-950" : "bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20";
  const cardBg  = dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-100";
  const txt     = dm ? "text-gray-100" : "text-gray-900";
  const sub     = dm ? "text-gray-400" : "text-gray-500";
  const inputCls = dm
    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500 rounded-xl w-full px-3 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
    : "bg-slate-50 border-slate-200 text-gray-900 rounded-xl w-full px-3 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors";
  const btnCls = "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold transition-all shadow-md shadow-emerald-200/40 disabled:opacity-60 disabled:cursor-not-allowed";

  const [step, setStep]         = useState<Step>("email");
  const [email, setEmail]       = useState("");
  const [otp, setOtp]           = useState(["", "", "", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ─── Step 1: إرسال OTP ───────────────────────────────────────
  const handleSendOtp = async () => {
    setError("");
    if (!email.includes("@")) { setError(t("أدخل بريد إلكتروني صحيح", "Enter a valid email")); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(t("تم إرسال الرمز إلى بريدك", "Code sent to your email"));
      setStep("otp");
    } catch (e: any) {
      setError(e.message || t("حدث خطأ، حاول مجدداً", "An error occurred"));
    } finally { setLoading(false); }
  };

  // ─── Step 2: التحقق من OTP ───────────────────────────────────
  const handleVerifyOtp = async () => {
    setError("");
    const token = otp.join("");
    if (token.length < 8) { setError(t("أدخل الرمز المكون من 8 أرقام", "Enter the 8-digit code")); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: "recovery" });
      if (error) throw error;
      setStep("password");
    } catch (e: any) {
      setError(t("الرمز غير صحيح أو انتهت صلاحيته", "Invalid or expired code"));
    } finally { setLoading(false); }
  };

  // ─── Step 3: تغيير كلمة المرور ──────────────────────────────
  const handleUpdatePassword = async () => {
    setError("");
    if (password.length < 6) { setError(t("كلمة المرور 6 أحرف على الأقل", "Password must be at least 6 characters")); return; }
    if (password !== confirm) { setError(t("كلمتا المرور غير متطابقتين", "Passwords do not match")); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t("✓ تم تغيير كلمة المرور بنجاح!", "✓ Password changed successfully!"));
      setTimeout(() => navigate("/auth"), 1500);
    } catch (e: any) {
      setError(e.message || t("حدث خطأ، حاول مجدداً", "An error occurred"));
    } finally { setLoading(false); }
  };

  // ─── OTP input handler ───────────────────────────────────────
  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 7) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
    if (digits.length === 8) {
      setOtp(digits.split(""));
      otpRefs.current[7]?.focus();
    }
  };

  // ─── Step labels ─────────────────────────────────────────────
  const steps = [
    t("البريد", "Email"),
    t("الرمز", "Code"),
    t("كلمة المرور", "Password"),
  ];
  const stepIndex = step === "email" ? 0 : step === "otp" ? 1 : 2;

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}
      className={`min-h-screen flex items-center justify-center px-4 py-12 transition-colors ${pageBg}`}>
      <div className="w-full max-w-sm space-y-5">

        {/* Header */}
        <div className="flex flex-col items-center mb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-200/40 mb-3">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className={`text-2xl font-bold ${txt}`}>{t("نسيت كلمة المرور؟", "Forgot Password?")}</h1>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-3">
            {steps.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < stepIndex ? "bg-emerald-500 text-white" :
                    i === stepIndex ? "bg-emerald-600 text-white ring-2 ring-emerald-300" :
                    dm ? "bg-gray-700 text-gray-400" : "bg-slate-200 text-slate-400"
                  }`}>
                    {i < stepIndex ? "✓" : i + 1}
                  </div>
                  <span className={`text-xs mt-1 ${i === stepIndex ? "text-emerald-500 font-medium" : sub}`}>{label}</span>
                </div>
                {i < 2 && (
                  <div className={`w-8 h-0.5 mb-4 transition-all ${i < stepIndex ? "bg-emerald-500" : dm ? "bg-gray-700" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className={`rounded-3xl border shadow-lg p-6 space-y-4 ${cardBg}`}>

          {error && (
            <div className={`text-xs px-3 py-2 rounded-xl ${dm ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"}`}>
              {error}
            </div>
          )}

          {/* ── Step 1: Email ── */}
          {step === "email" && (
            <>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${sub}`}>{t("البريد الإلكتروني", "Email")}</label>
                <input
                  type="email" dir="ltr" placeholder="example@email.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                  className={inputCls} autoFocus
                />
                <p className={`text-xs mt-1.5 ${sub}`}>
                  {t("سنرسل لك رمزاً مكوناً من 8 أرقام", "We'll send you an 8-digit code")}
                </p>
              </div>
              <button onClick={handleSendOtp} disabled={loading || !email.includes("@")} className={btnCls}>
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t("جارٍ الإرسال...", "Sending...")}</>
                  : t("إرسال الرمز", "Send Code")}
              </button>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
            <>
              <div>
                <p className={`text-xs font-medium mb-3 text-center ${sub}`}>
                  {t(`أدخل الرمز المرسل إلى ${email}`, `Enter the code sent to ${email}`)}
                </p>
                {/* OTP boxes */}
                <div className="flex justify-center gap-2" dir="ltr" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text" inputMode="numeric" maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKey(i, e)}
                      className={`w-11 h-12 text-center text-lg font-bold rounded-xl border-2 outline-none transition-all ${
                        digit
                          ? dm ? "border-emerald-500 bg-emerald-900/20 text-emerald-400" : "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : dm ? "border-gray-600 bg-gray-700 text-gray-100" : "border-slate-200 bg-slate-50 text-gray-900"
                      } focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30`}
                    />
                  ))}
                </div>
                <p className={`text-xs text-center mt-3 ${sub}`}>
                  {t("لم تستلم الرمز؟ ", "Didn't receive the code? ")}
                  <button onClick={() => { setOtp(["","","","","",""]); setStep("email"); setError(""); }}
                    className="text-emerald-500 hover:text-emerald-400 transition-colors">
                    {t("أعد الإرسال", "Resend")}
                  </button>
                </p>
              </div>
              <button onClick={handleVerifyOtp} disabled={loading || otp.join("").length < 8} className={btnCls}>
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t("جارٍ التحقق...", "Verifying...")}</>
                  : t("تأكيد الرمز", "Verify Code")}
              </button>
            </>
          )}

          {/* ── Step 3: New Password ── */}
          {step === "password" && (
            <>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${sub}`}>{t("كلمة المرور الجديدة", "New Password")}</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder={t("6 أحرف على الأقل", "At least 6 characters")}
                    value={password} onChange={e => setPassword(e.target.value)}
                    className={inputCls + (language === "ar" ? " pl-10" : " pr-10")}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className={`absolute top-1/2 -translate-y-1/2 ${language === "ar" ? "left-3" : "right-3"} ${sub}`}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${sub}`}>{t("تأكيد كلمة المرور", "Confirm Password")}</label>
                <input
                  type="password"
                  placeholder={t("أعد كتابة كلمة المرور", "Re-enter password")}
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleUpdatePassword()}
                  className={`${inputCls} ${confirm && password !== confirm ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""}`}
                />
                {confirm && password !== confirm && (
                  <p className="text-xs text-red-500 mt-1">{t("كلمتا المرور غير متطابقتين", "Passwords do not match")}</p>
                )}
              </div>
              <button onClick={handleUpdatePassword} disabled={loading || password.length < 6 || password !== confirm} className={btnCls}>
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t("جارٍ الحفظ...", "Saving...")}</>
                  : t("حفظ كلمة المرور الجديدة", "Save New Password")}
              </button>
            </>
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
