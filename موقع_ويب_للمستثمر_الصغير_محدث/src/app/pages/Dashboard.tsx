import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Wallet, TrendingDown, TrendingUp, Plus, Trash2, Loader2 } from "lucide-react";
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

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

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

  // dark mode shorthand classes
  const dm = darkMode;
  const card    = dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-100";
  const cardHov = dm ? "hover:bg-gray-750" : "hover:bg-gray-50";
  const txt     = dm ? "text-gray-100" : "text-gray-900";
  const sub     = dm ? "text-gray-400" : "text-gray-500";
  const muted   = dm ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-700";
  const inputCls= dm ? "bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500" : "bg-slate-50 border-slate-200";
  const rowHov  = dm ? "bg-gray-700/50 hover:bg-gray-700" : "bg-gray-50 hover:bg-gray-100";

  useEffect(() => {
    if (authUser) fetchExpenses();
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
    if (!newExpense.category || !newExpense.amount || !newExpense.description) {
      toast.error(t("يرجى ملء جميع الحقول", "Please fill all fields")); return;
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
      toast.success(t("تمت إضافة العملية ✓", "Transaction added ✓"));
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

  const pieData = Object.entries(
    expenses.filter(e => e.type === "expense").reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const lineData = Object.values(
    expenses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc, e) => {
        if (!acc[e.date]) acc[e.date] = { date: e.date, income: 0, expenses: 0 };
        if (e.type === "income") acc[e.date].income += e.amount;
        else acc[e.date].expenses += e.amount;
        return acc;
      }, {} as Record<string, { date: string; income: number; expenses: number }>)
  );

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${dm ? "bg-gray-950" : ""}`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className={sub}>{t("جارٍ تحميل بياناتك...", "Loading your data...")}</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen py-8 px-4 transition-colors ${dm ? "bg-gray-950" : ""}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold mb-1 ${txt}`}>{t("لوحة التحكم", "Dashboard")}</h1>
            <p className={sub}>{t("إدارة ميزانيتك الشخصية", "Manage your personal budget")}</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all">
                <Plus className="w-4 h-4" />
                {t("إضافة عملية", "Add Transaction")}
              </button>
            </DialogTrigger>
            <DialogContent dir={language === "ar" ? "rtl" : "ltr"} className={dm ? "bg-gray-800 border-gray-700 text-gray-100" : ""}>
              <DialogHeader>
                <DialogTitle className={txt}>{t("إضافة عملية جديدة", "Add New Transaction")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label className={txt}>{t("النوع", "Type")}</Label>
                  <Select value={newExpense.type} onValueChange={(v: "income"|"expense") => setNewExpense({ ...newExpense, type: v, category: "" })}>
                    <SelectTrigger className={`rounded-xl mt-1 ${dm ? "bg-gray-700 border-gray-600 text-gray-100" : ""}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={dm ? "bg-gray-800 border-gray-700 text-gray-100" : ""}>
                      <SelectItem value="income">🟢 {t("دخل", "Income")}</SelectItem>
                      <SelectItem value="expense">🔴 {t("مصروف", "Expense")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={txt}>{t("الفئة", "Category")}</Label>
                  <Select value={newExpense.category} onValueChange={v => setNewExpense({ ...newExpense, category: v })}>
                    <SelectTrigger className={`rounded-xl mt-1 ${dm ? "bg-gray-700 border-gray-600 text-gray-100" : ""}`}>
                      <SelectValue placeholder={t("اختر الفئة", "Select category")} />
                    </SelectTrigger>
                    <SelectContent className={dm ? "bg-gray-800 border-gray-700 text-gray-100" : ""}>
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
                  <Label className={txt}>{t("الوصف", "Description")}</Label>
                  <Input value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder={t("اكتب وصفاً مختصراً", "Short description")} className={`rounded-xl mt-1 ${inputCls}`} />
                </div>
                <button onClick={handleAddExpense} disabled={saving}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />{t("جارٍ الحفظ...", "Saving...")}</> : t("إضافة", "Add")}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* بطاقات الملخص */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: t("الرصيد الحالي","Current Balance"), value: `${balance.toLocaleString()} ${t("ر.س","SAR")}`, gradient: "from-emerald-500 to-teal-600", icon: <Wallet className="w-6 h-6 text-white" /> },
            { label: t("إجمالي الدخل","Total Income"),    value: `${totalIncome.toLocaleString()} ${t("ر.س","SAR")}`, gradient: "from-blue-500 to-cyan-600", icon: <TrendingUp className="w-6 h-6 text-white" /> },
            { label: t("إجمالي المصروفات","Total Expenses"),value: `${totalExpenses.toLocaleString()} ${t("ر.س","SAR")}`, gradient: "from-orange-500 to-red-500", icon: <TrendingDown className="w-6 h-6 text-white" /> },
            { label: t("نسبة الادخار","Savings Rate"),    value: `${savingsRate}%`, gradient: "from-purple-500 to-pink-600", icon: <span className="text-xl">🎯</span> },
          ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <div className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 shadow-lg`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs mb-1">{card.label}</p>
                    <p className="text-xl font-bold text-white">{card.value}</p>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">{card.icon}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* الرسوم البيانية */}
        {expenses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className={`rounded-2xl border p-5 ${card}`}>
              <h3 className={`font-semibold mb-4 ${txt}`}>{t("توزيع المصروفات","Expense Breakdown")}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={85} dataKey="value" labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v.toLocaleString()} ${t("ر.س","SAR")}`]} contentStyle={dm ? { background: "#1f2937", border: "1px solid #374151", color: "#f3f4f6" } : {}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={`rounded-2xl border p-5 ${card}`}>
              <h3 className={`font-semibold mb-4 ${txt}`}>{t("الدخل والمصروفات عبر الوقت","Income vs Expenses")}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dm ? "#374151" : "#e5e7eb"} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: dm ? "#9ca3af" : "#6b7280" }} />
                    <YAxis tick={{ fontSize: 10, fill: dm ? "#9ca3af" : "#6b7280" }} />
                    <Tooltip formatter={(v: number) => [`${v.toLocaleString()} ${t("ر.س","SAR")}`]} contentStyle={dm ? { background: "#1f2937", border: "1px solid #374151", color: "#f3f4f6" } : {}} />
                    <Legend />
                    <Line type="monotone" dataKey="income"   stroke="#10b981" name={t("الدخل","Income")}    strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" name={t("المصروفات","Expenses")} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* قائمة العمليات */}
        <div className={`rounded-2xl border ${card}`}>
          <div className="p-5 border-b border-inherit">
            <h3 className={`font-semibold ${txt}`}>{t("العمليات الأخيرة","Recent Transactions")}</h3>
          </div>
          <div className="p-5">
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">💸</div>
                <p className={`${sub} mb-1`}>{t("لا توجد عمليات بعد","No transactions yet")}</p>
                <p className={`text-sm ${sub}`}>{t("ابدأ بإضافة أول عملية مالية","Add your first transaction")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.slice(0, 15).map(expense => (
                  <motion.div key={expense.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={`flex items-center justify-between p-4 rounded-xl transition-colors group ${rowHov}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${expense.type === "income" ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-red-100 dark:bg-red-900/40"}`}>
                        {expense.type === "income"
                          ? <TrendingUp className="w-5 h-5 text-emerald-600" />
                          : <TrendingDown className="w-5 h-5 text-red-600" />}
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${txt}`}>{expense.description}</p>
                        <p className={`text-xs ${sub}`}>{expense.category} • {expense.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${expense.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                        {expense.type === "income" ? "+" : "-"}{expense.amount.toLocaleString()} {t("ر.س","SAR")}
                      </span>
                      <button onClick={() => handleDelete(expense.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
