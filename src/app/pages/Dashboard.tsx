import { useState, useEffect } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Wallet, TrendingDown, TrendingUp, Plus, Trash2, Loader2, ArrowUpRight, ArrowDownRight, Target, BarChart3 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  type: "income" | "expense";
}

const COLORS = ["#2878C8", "#1A8A5A", "#E8A830", "#5B3D8F", "#5DADE2", "#2ECC71"];

export function Dashboard() {
  const { darkMode, language } = useSettings();
  const { user: authUser } = useAuth();
  const t = (ar: string, en: string) => language === "ar" ? ar : en;

  const CATEGORIES = [
    t("طعام وشراب","Food & Drink"), t("مواصلات","Transport"), t("ترفيه","Entertainment"),
    t("تعليم","Education"), t("صحة","Health"), t("تسوق","Shopping"),
    t("فواتير","Bills"), t("أخرى","Other"),
  ];

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: "", amount: "", description: "", type: "expense" as "income" | "expense" });
  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => Number(localStorage.getItem("hasad_budget")) || 0);

  const dm = darkMode;

  /* ── Glass tokens ── */
  const glass = dm
    ? "bg-white/[0.04] border-white/[0.08] backdrop-blur-xl"
    : "bg-white/70 border-white/60 backdrop-blur-xl shadow-lg";

  const glassInner = dm
    ? "bg-white/[0.04] border-white/[0.06]"
    : "bg-white/50 border-white/40";

  const txt   = dm ? "text-gray-100" : "text-gray-900";
  const sub   = dm ? "text-gray-400" : "text-gray-500";
  const inputCls = dm
    ? "bg-white/[0.06] border-white/[0.08] text-gray-100 placeholder:text-gray-500 focus:ring-[#2878C8]/50 focus:border-[#2878C8]/40"
    : "bg-white/80 border-gray-200/60 focus:ring-[#2878C8]/30 focus:border-[#2878C8]/40";
  const rowHov = dm
    ? "bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04]"
    : "bg-white/40 hover:bg-white/60 border border-white/30";

  const dialogCls = dm
    ? "bg-[#0c1a3d]/95 border-white/[0.08] backdrop-blur-2xl text-gray-100"
    : "bg-white/95 backdrop-blur-2xl";

  const tooltipStyle = dm
    ? { background: "rgba(12, 26, 61, 0.95)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f4f8", backdropFilter: "blur(12px)" }
    : { background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,0,0,0.06)", backdropFilter: "blur(12px)" };

  useEffect(() => {
    if (authUser) { fetchExpenses(); loadBudgetLimits(authUser.id); }
    else setLoading(false);
  }, [authUser?.id]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setExpenses(
        (data || []).map((row: any) => ({
          id: row.id,
          category: row.category || "",
          amount: Number(row.amount),
          description: row.description || "",
          date: row.created_at ? new Date(row.created_at).toISOString().split("T")[0] : "",
          type: row.type as "income" | "expense",
        }))
      );
    } catch { toast.error(t("فشل تحميل البيانات", "Failed to load data")); }
    finally { setLoading(false); }
  };

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.amount) {
      toast.error(t("يرجى ملء الفئة والمبلغ", "Please fill category and amount")); return;
    }
    if (!authUser) { toast.error(t("يرجى تسجيل الدخول أولاً", "Please login first")); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: authUser.id,
        type: newExpense.type,
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success(t("تمت إضافة العملية", "Transaction added"));
      if (newExpense.type === "expense" && monthlyBudget > 0) {
        const month = new Date().toISOString().slice(0, 7);
        const totalSpend = expenses.filter(e => e.type === "expense" && e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0) + parseFloat(newExpense.amount);
        if (totalSpend > monthlyBudget) {
          toast.warning(t(`تجاوزت ميزانيتك الشهرية: ${totalSpend.toFixed(0)} / ${monthlyBudget} ر.س`, `Monthly budget exceeded: ${totalSpend.toFixed(0)} / ${monthlyBudget} SAR`), { duration: 5000 });
        }
      }
      setNewExpense({ category: "", amount: "", description: "", type: "expense" });
      setIsDialogOpen(false);
      await fetchExpenses();
      try {
        const { data: stats } = await supabase.from("user_stats").select("points, level").eq("user_id", authUser.id).single();
        if (stats) {
          const newPoints = (stats.points || 0) + 5;
          const newLevel = Math.floor(newPoints / 200) + 1;
          await supabase.from("user_stats").update({ points: newPoints, level: newLevel, updated_at: new Date().toISOString() }).eq("user_id", authUser.id);
        }
      } catch {}
    } catch { toast.error(t("حدث خطأ", "An error occurred")); }
    finally { setSaving(false); }
  };

  const loadBudgetLimits = async (uid: string) => {
    try {
      const { data } = await supabase.from("user_settings").select("budget_limits").eq("user_id", uid).maybeSingle();
      if (data?.budget_limits && typeof data.budget_limits === "number") {
        setMonthlyBudget(data.budget_limits);
        localStorage.setItem("hasad_budget", String(data.budget_limits));
      }
    } catch {}
  };

  const updateBudget = (val: string) => {
    const num = parseFloat(val) || 0;
    setMonthlyBudget(num);
    localStorage.setItem("hasad_budget", String(num));
    if (!authUser) return;
    supabase.from("user_settings").upsert({ user_id: authUser.id, budget_limits: num, updated_at: new Date().toISOString() }).then(() => {});
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast.success(t("تم الحذف", "Deleted"));
    } catch { toast.error(t("فشل الحذف", "Delete failed")); }
  };

  const totalIncome   = expenses.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenses.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const balance       = totalIncome - totalExpenses;
  const savingsRate   = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : "0";

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthData   = expenses.filter(e => e.date.startsWith(currentMonth));
  const monthSpend  = monthData.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const monthTopCats  = Object.entries(
    monthData.filter(e => e.type === "expense")
      .reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const budgetPct  = monthlyBudget > 0 ? Math.min(100, (monthSpend / monthlyBudget) * 100) : 0;
  const budgetOver = monthlyBudget > 0 && monthSpend > monthlyBudget;

  const pieData = Object.entries(
    expenses.filter(e => e.type === "expense").reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const lineData = Object.values(
    [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc, e) => {
        if (!acc[e.date]) acc[e.date] = { date: e.date, income: 0, expenses: 0 };
        if (e.type === "income") acc[e.date].income += e.amount;
        else acc[e.date].expenses += e.amount;
        return acc;
      }, {} as Record<string, { date: string; income: number; expenses: number }>)
  );

  /* ── Summary cards config (logo colors) ── */
  const summaryCards = [
    {
      label: t("الرصيد الحالي","Current Balance"),
      value: `${balance.toLocaleString()} ${t("ر.س","SAR")}`,
      icon: Wallet,
      gradient: "from-[#2878C8] to-[#5DADE2]",
      iconBg: "bg-[#2878C8]/20",
      change: balance >= 0,
    },
    {
      label: t("إجمالي الدخل","Total Income"),
      value: `${totalIncome.toLocaleString()} ${t("ر.س","SAR")}`,
      icon: ArrowUpRight,
      gradient: "from-[#1A8A5A] to-[#2ECC71]",
      iconBg: "bg-[#1A8A5A]/20",
      change: true,
    },
    {
      label: t("إجمالي المصروفات","Total Expenses"),
      value: `${totalExpenses.toLocaleString()} ${t("ر.س","SAR")}`,
      icon: ArrowDownRight,
      gradient: "from-[#E8A830] to-[#F5C542]",
      iconBg: "bg-[#E8A830]/20",
      change: false,
    },
    {
      label: t("نسبة الادخار","Savings Rate"),
      value: `${savingsRate}%`,
      icon: Target,
      gradient: "from-[#5B3D8F] to-[#7D5CB8]",
      iconBg: "bg-[#5B3D8F]/20",
      change: Number(savingsRate) > 0,
    },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-[#2878C8] animate-spin" />
        <p className={sub}>{t("جارٍ تحميل بياناتك...", "Loading your data...")}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4 transition-colors relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -right-32 w-96 h-96 bg-[#2878C8]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -left-32 w-80 h-80 bg-[#1A8A5A]/6 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-[#E8A830]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-3xl font-bold mb-1 ${txt}`}
            >
              {t("لوحة التحكم", "Dashboard")}
            </motion.h1>
            <p className={sub}>{t("إدارة ميزانيتك الشخصية", "Manage your personal budget")}</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg shadow-[#2878C8]/25 transition-all"
                style={{ background: "linear-gradient(135deg, #1B5FA0 0%, #2878C8 50%, #5DADE2 100%)" }}
              >
                <Plus className="w-4 h-4" />
                {t("إضافة عملية", "Add Transaction")}
              </motion.button>
            </DialogTrigger>
            <DialogContent dir={language === "ar" ? "rtl" : "ltr"} className={`rounded-2xl ${dialogCls}`}>
              <DialogHeader>
                <DialogTitle className={txt}>{t("إضافة عملية جديدة", "Add New Transaction")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label className={txt}>{t("النوع", "Type")}</Label>
                  <Select value={newExpense.type} onValueChange={(v: "income"|"expense") => setNewExpense({ ...newExpense, type: v, category: "" })}>
                    <SelectTrigger className={`rounded-xl mt-1 ${inputCls}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={dm ? "bg-[#0c1a3d] border-white/[0.08] text-gray-100" : ""}>
                      <SelectItem value="income">{t("دخل", "Income")}</SelectItem>
                      <SelectItem value="expense">{t("مصروف", "Expense")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={txt}>{t("الفئة", "Category")}</Label>
                  <Select value={newExpense.category} onValueChange={v => setNewExpense({ ...newExpense, category: v })}>
                    <SelectTrigger className={`rounded-xl mt-1 ${inputCls}`}>
                      <SelectValue placeholder={t("اختر الفئة", "Select category")} />
                    </SelectTrigger>
                    <SelectContent className={dm ? "bg-[#0c1a3d] border-white/[0.08] text-gray-100" : ""}>
                      {newExpense.type === "expense" ? CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>) : (
                        <>
                          <SelectItem value={t("راتب","Salary")}>{t("راتب","Salary")}</SelectItem>
                          <SelectItem value={t("مكافأة","Bonus")}>{t("مكافأة","Bonus")}</SelectItem>
                          <SelectItem value={t("عمل حر","Freelance")}>{t("عمل حر","Freelance")}</SelectItem>
                          <SelectItem value={t("أخرى","Other")}>{t("أخرى","Other")}</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={txt}>{t("المبلغ (ريال)", "Amount (SAR)")}</Label>
                  <Input type="number" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="0" min="1" className={`rounded-xl mt-1 ${inputCls}`} />
                </div>
                <div>
                  <Label className={txt}>{t("الوصف", "Description")} <span className={`text-xs ${sub}`}>({t("اختياري","optional")})</span></Label>
                  <Input value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder={t("اكتب وصفا مختصرا (اختياري)", "Short description (optional)")} className={`rounded-xl mt-1 ${inputCls}`} />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddExpense}
                  disabled={saving}
                  className="w-full py-2.5 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#2878C8]/20 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #1B5FA0 0%, #2878C8 50%, #5DADE2 100%)" }}
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />{t("جارٍ الحفظ...", "Saving...")}</> : t("إضافة", "Add")}
                </motion.button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {summaryCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className={`rounded-2xl border p-5 transition-all duration-300 ${glass}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-xs font-medium ${sub}`}>{c.label}</p>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                      <Icon className={`w-4.5 h-4.5 bg-gradient-to-r ${c.gradient} bg-clip-text`} style={{ color: c.gradient.includes("2878C8") ? "#2878C8" : c.gradient.includes("1A8A5A") ? "#1A8A5A" : c.gradient.includes("E8A830") ? "#E8A830" : "#5B3D8F" }} />
                    </div>
                  </div>
                  <p className={`text-xl font-bold ${txt}`}>{c.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts */}
        {expenses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className={`rounded-2xl border p-5 ${glass}`}>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-[#2878C8]" />
                  <h3 className={`font-semibold ${txt}`}>{t("توزيع المصروفات","Expense Breakdown")}</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={85} dataKey="value" labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [`${v.toLocaleString()} ${t("ر.س","SAR")}`]}
                        contentStyle={tooltipStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className={`rounded-2xl border p-5 ${glass}`}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-[#1A8A5A]" />
                  <h3 className={`font-semibold ${txt}`}>{t("الدخل والمصروفات عبر الوقت","Income vs Expenses")}</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={dm ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: dm ? "#94a3b8" : "#6b7280" }} />
                      <YAxis tick={{ fontSize: 10, fill: dm ? "#94a3b8" : "#6b7280" }} />
                      <Tooltip
                        formatter={(v: number) => [`${v.toLocaleString()} ${t("ر.س","SAR")}`]}
                        contentStyle={tooltipStyle}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="income"   stroke="#1A8A5A" name={t("الدخل","Income")}    strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="expenses" stroke="#E8A830" name={t("المصروفات","Expenses")} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Monthly Budget */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className={`rounded-2xl border mb-6 ${glass}`}>
            <div className="p-5 border-b border-inherit">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#E8A830]" />
                <h3 className={`font-semibold ${txt}`}>{t("الميزانية الشهرية","Monthly Budget")}</h3>
              </div>
              <p className={`text-xs mt-1 ${sub}`}>{t("حدّد ميزانيتك الشهرية الإجمالية وتابع إنفاقك","Set your total monthly budget and track spending")}</p>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-5">
                <input type="number" min="0" value={monthlyBudget || ""}
                  onChange={e => updateBudget(e.target.value)}
                  placeholder={t("أدخل ميزانيتك الشهرية...","Enter your monthly budget...")}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm border outline-none focus:ring-2 transition-all ${inputCls}`} />
                <span className={`text-sm font-medium flex-shrink-0 ${sub}`}>{t("ر.س","SAR")}</span>
              </div>

              {monthlyBudget > 0 ? (
                <>
                  <div className="mb-1 flex justify-between items-end">
                    <span className={`text-sm font-semibold ${budgetOver ? "text-red-400" : txt}`}>
                      {monthSpend.toLocaleString()} / {monthlyBudget.toLocaleString()} {t("ر.س","SAR")}
                    </span>
                    <span className={`text-sm font-bold ${budgetOver ? "text-red-400" : budgetPct > 75 ? "text-[#E8A830]" : "text-[#2878C8]"}`}>
                      {budgetPct.toFixed(0)}%
                    </span>
                  </div>
                  <div className={`h-4 rounded-full overflow-hidden mb-2 ${dm ? "bg-white/[0.06]" : "bg-gray-100"}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${budgetPct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${budgetOver ? "bg-red-500" : budgetPct > 75 ? "bg-[#E8A830]" : "bg-gradient-to-r from-[#2878C8] to-[#5DADE2]"}`}
                    />
                  </div>
                  <p className={`text-xs mb-5 ${budgetOver ? "text-red-400" : "text-[#2878C8]"}`}>
                    {budgetOver
                      ? t(`تجاوزت الميزانية بـ ${(monthSpend - monthlyBudget).toLocaleString()} ر.س`, `Over budget by ${(monthSpend - monthlyBudget).toLocaleString()} SAR`)
                      : t(`متبقٍ ${(monthlyBudget - monthSpend).toLocaleString()} ر.س`, `${(monthlyBudget - monthSpend).toLocaleString()} SAR remaining`)}
                  </p>

                  {monthTopCats.length > 0 && (
                    <div className={`rounded-xl border p-4 ${glassInner}`}>
                      <p className={`text-xs font-semibold mb-3 ${txt}`}>{t("توزيع الإنفاق هذا الشهر","Spending Breakdown This Month")}</p>
                      {monthTopCats.map(([cat, amt], i) => {
                        const catPct = monthSpend > 0 ? Math.min(100, ((amt as number) / monthSpend) * 100) : 0;
                        return (
                          <div key={i} className="mb-3 last:mb-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs ${sub}`}>{cat}</span>
                              <span className={`text-xs font-semibold ${txt}`}>{(amt as number).toLocaleString()} {t("ر.س","SAR")} <span className={sub}>({catPct.toFixed(0)}%)</span></span>
                            </div>
                            <div className={`h-2 rounded-full overflow-hidden ${dm ? "bg-white/[0.06]" : "bg-gray-100"}`}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${catPct}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1 }}
                                className="h-full rounded-full"
                                style={{ background: COLORS[i % COLORS.length] }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className={`text-center py-8 rounded-xl border ${glassInner}`}>
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#E8A830]/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-[#E8A830]" />
                  </div>
                  <p className={`text-sm font-medium ${txt} mb-1`}>{t("لم تحدد ميزانية بعد","No budget set yet")}</p>
                  <p className={`text-xs ${sub}`}>{t("أدخل مبلغا أعلاه لتتابع إنفاقك الشهري","Enter an amount above to track your monthly spending")}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className={`rounded-2xl border ${glass}`}>
            <div className="p-5 border-b border-inherit">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#5DADE2]" />
                <h3 className={`font-semibold ${txt}`}>{t("العمليات الأخيرة","Recent Transactions")}</h3>
              </div>
            </div>
            <div className="p-5">
              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#2878C8]/10 flex items-center justify-center">
                    <Wallet className="w-7 h-7 text-[#2878C8]" />
                  </div>
                  <p className={`font-medium ${txt} mb-1`}>{t("لا توجد عمليات بعد","No transactions yet")}</p>
                  <p className={`text-sm ${sub}`}>{t("ابدأ بإضافة أول عملية مالية","Add your first transaction")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {expenses.slice(0, 15).map((expense, idx) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, x: language === "ar" ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 group ${rowHov}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          expense.type === "income"
                            ? "bg-[#1A8A5A]/15"
                            : "bg-[#E8A830]/15"
                        }`}>
                          {expense.type === "income"
                            ? <ArrowUpRight className="w-5 h-5 text-[#1A8A5A]" />
                            : <ArrowDownRight className="w-5 h-5 text-[#E8A830]" />}
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${txt}`}>{expense.description || expense.category}</p>
                          <p className={`text-xs ${sub}`}>{expense.category} {expense.description ? `· ${expense.date}` : expense.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-sm ${expense.type === "income" ? "text-[#1A8A5A]" : "text-[#E8A830]"}`}>
                          {expense.type === "income" ? "+" : "-"}{expense.amount.toLocaleString()} {t("ر.س","SAR")}
                        </span>
                        <button onClick={() => handleDelete(expense.id)}
                          className={`opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg ${dm ? "hover:bg-red-500/20" : "hover:bg-red-100"} text-gray-400 hover:text-red-500`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
