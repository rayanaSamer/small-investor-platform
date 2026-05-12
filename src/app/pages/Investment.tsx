import { useState, useEffect } from "react";
import { PYTHON_API } from "../lib/api";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Wallet, PieChart, AlertCircle, Sparkles, ArrowUpRight, ArrowDownRight, Loader2, Star, BarChart3 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";

interface Stock    { id: string; name: string; symbol: string; ticker: string; price: number; change: number; changePercent: number; sector: string; }
interface Portfolio { symbol: string; shares: number; buyPrice: number; buyDate?: string; }
interface PortfolioHistory { date: string; value: number; }
interface Prediction { predicted_price: number; change_percent: number; signal: string; horizon_label?: string; daily_change_percent?: number; }
interface PortfolioAllocation { sector: string; percentage: number; stock_name: string; ticker: string; current_price: number; change_percent: number; signal: string; amount: number; }

const STOCKS: Stock[] = [
  { id:"1",  name:"أرامكو السعودية",                    symbol:"2222.SR", ticker:"2222.SR", price:0, change:0, changePercent:0, sector:"طاقة" },
  { id:"2",  name:"مصرف الراجحي",                       symbol:"1120.SR", ticker:"1120.SR", price:0, change:0, changePercent:0, sector:"بنوك" },
  { id:"3",  name:"سابك",                               symbol:"2010.SR", ticker:"2010.SR", price:0, change:0, changePercent:0, sector:"بتروكيماويات" },
  { id:"4",  name:"الاتصالات السعودية",                 symbol:"7010.SR", ticker:"7010.SR", price:0, change:0, changePercent:0, sector:"اتصالات" },
  { id:"5",  name:"بنك البلاد",                         symbol:"1180.SR", ticker:"1180.SR", price:0, change:0, changePercent:0, sector:"بنوك" },
  { id:"6",  name:"مصرف الإنماء",                       symbol:"1150.SR", ticker:"1150.SR", price:0, change:0, changePercent:0, sector:"بنوك" },
  { id:"7",  name:"بنك الرياض",                         symbol:"1010.SR", ticker:"1010.SR", price:0, change:0, changePercent:0, sector:"بنوك" },
  { id:"8",  name:"معادن",                              symbol:"1211.SR", ticker:"1211.SR", price:0, change:0, changePercent:0, sector:"تعدين" },
  { id:"9",  name:"ينساب",                              symbol:"2290.SR", ticker:"2290.SR", price:0, change:0, changePercent:0, sector:"بتروكيماويات" },
  { id:"10", name:"التصنيع (تاسنيه)",                   symbol:"2060.SR", ticker:"2060.SR", price:0, change:0, changePercent:0, sector:"بتروكيماويات" },
  { id:"11", name:"سافكو",                              symbol:"6010.SR", ticker:"6010.SR", price:0, change:0, changePercent:0, sector:"بتروكيماويات" },
  { id:"12", name:"بنك الجزيرة",                        symbol:"1020.SR", ticker:"1020.SR", price:0, change:0, changePercent:0, sector:"بنوك" },
  { id:"13", name:"موبايلي",                            symbol:"7020.SR", ticker:"7020.SR", price:0, change:0, changePercent:0, sector:"اتصالات" },
  { id:"14", name:"جرير للتسويق",                       symbol:"4190.SR", ticker:"4190.SR", price:0, change:0, changePercent:0, sector:"تجزئة" },
  { id:"15", name:"أكوا باور",                          symbol:"2082.SR", ticker:"2082.SR", price:0, change:0, changePercent:0, sector:"طاقة متجددة" },
  { id:"16", name:"الشركة الوطنية للشحن (بحري)",        symbol:"4030.SR", ticker:"4030.SR", price:0, change:0, changePercent:0, sector:"نقل بحري" },
  { id:"17", name:"الشرق الأوسط للرعاية الصحية",       symbol:"4009.SR", ticker:"4009.SR", price:0, change:0, changePercent:0, sector:"رعاية صحية" },
  { id:"18", name:"طيران ناس",                          symbol:"4264.SR", ticker:"4264.SR", price:0, change:0, changePercent:0, sector:"طيران" },
];

export function Investment() {
  const { darkMode, language } = useSettings();
  const { user: authUser } = useAuth();
  const t = (ar: string, en: string) => language === "ar" ? ar : en;

  const dm = darkMode;

  /* ── Glass tokens ── */
  const glass = dm
    ? "bg-white/[0.04] border-white/[0.08] backdrop-blur-xl"
    : "bg-white/70 border-white/60 backdrop-blur-xl shadow-lg";

  const glassInner = dm
    ? "bg-white/[0.04] border-white/[0.06]"
    : "bg-white/50 border-white/40";

  const txt     = dm ? "text-gray-100" : "text-gray-900";
  const sub     = dm ? "text-gray-400" : "text-gray-500";
  const inputCls= dm
    ? "bg-white/[0.06] border-white/[0.08] text-gray-100 placeholder:text-gray-500 focus:ring-[#2878C8]/50"
    : "bg-white/80 border-gray-200/60 focus:ring-[#2878C8]/30";

  const rowBase = dm
    ? "border-white/[0.08] hover:border-[#2878C8]/40 bg-white/[0.02]"
    : "border-gray-200/60 hover:border-[#2878C8]/40 bg-white/40";
  const rowSel  = dm
    ? "border-[#1A8A5A]/50 bg-[#1A8A5A]/10"
    : "border-[#1A8A5A]/50 bg-[#1A8A5A]/5";

  const tooltipStyle = dm
    ? { background: "rgba(12, 26, 61, 0.95)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f4f8", backdropFilter: "blur(12px)" }
    : { background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,0,0,0.06)", backdropFilter: "blur(12px)" };

  const dialogCls = dm
    ? "bg-[#0c1a3d]/95 border-white/[0.08] backdrop-blur-2xl text-gray-100"
    : "bg-white/95 backdrop-blur-2xl";

  const [liveStocks, setLiveStocks]       = useState<Stock[]>(STOCKS);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [balance, setBalance]             = useState(0);
  const [dashboardBalance, setDashboardBalance] = useState(0);
  const [portfolio, setPortfolio]         = useState<Portfolio[]>([]);
  const [history, setHistory]             = useState<PortfolioHistory[]>([]);
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const selectedStock = selectedStockId ? (liveStocks.find(s => s.id === selectedStockId) ?? null) : null;
  const [shares, setShares]               = useState("");
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [sellConfirm, setSellConfirm]     = useState<string | null>(null);
  const [showDeposit, setShowDeposit]     = useState(false);
  const [depositInput, setDepositInput]   = useState("");
  const [activeTab, setActiveTab]         = useState<"market"|"portfolio"|"suggested">("market");
  const [sectorFilter, setSectorFilter]   = useState<string>("الكل");
  const [suggestedAmount, setSuggestedAmount]       = useState("");
  const [horizon, setHorizon]                       = useState<"short"|"medium"|"long">("long");
  useEffect(() => { setSuggestedPortfolio([]); }, [horizon]);
  const [suggestedPortfolio, setSuggestedPortfolio] = useState<PortfolioAllocation[]>([]);
  const [confirmApply, setConfirmApply]             = useState(false);
  const [applying, setApplying]                     = useState(false);
  const [loadingSuggestion, setLoadingSuggestion]   = useState(false);
  const [favorites, setFavorites]         = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("hasad_favorites") || "[]")); } catch { return new Set(); }
  });
  const [predictions, setPredictions]     = useState<Record<string, Prediction>>({});
  const [predicting, setPredicting]       = useState<Set<string>>(new Set());
  const [predFailed, setPredFailed]       = useState<Set<string>>(new Set());

  const fetchPrediction = async (ticker: string) => {
    setPredicting(prev => new Set(prev).add(ticker));
    setPredFailed(prev => { const s = new Set(prev); s.delete(ticker); return s; });
    try {
      const res = await fetch(`${PYTHON_API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, horizon: 'short' }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPredictions(prev => ({ ...prev, [ticker]: data }));
    } catch {
      setPredFailed(prev => new Set(prev).add(ticker));
    } finally {
      setPredicting(prev => { const s = new Set(prev); s.delete(ticker); return s; });
    }
  };

  const SECTORS = ["الكل", "المفضلة", "بنوك", "طاقة", "طاقة متجددة", "بتروكيماويات", "اتصالات", "تعدين", "تجزئة", "رعاية صحية", "نقل بحري", "طيران"];
  const filteredStocks = sectorFilter === "الكل" ? liveStocks
    : sectorFilter === "المفضلة" ? liveStocks.filter(s => favorites.has(s.symbol))
    : liveStocks.filter(s => s.sector === sectorFilter);

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(symbol) ? next.delete(symbol) : next.add(symbol);
      localStorage.setItem("hasad_favorites", JSON.stringify([...next]));
      return next;
    });
  };

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(`${PYTHON_API}/prices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tickers: STOCKS.map(s => s.ticker) }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setLiveStocks(prev => prev.map(s =>
          data[s.ticker] ? { ...s, ...data[s.ticker] } : s
        ));
      } catch {}
      finally { setPricesLoading(false); }
    };
    fetchPrices();
  }, []);

  useEffect(() => {
    if (authUser) {
      loadPortfolio(authUser.id);
      supabase.from("transactions").select("type,amount").eq("user_id", authUser.id).then(({ data }) => {
        if (!data) return;
        const income   = data.filter(r => r.type === "income").reduce((s, r) => s + Number(r.amount), 0);
        const expenses = data.filter(r => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0);
        setDashboardBalance(income - expenses);
      });
    } else setLoading(false);
  }, [authUser?.id]);

  const loadPortfolio = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setBalance(Number(data.balance ?? 0));
        setPortfolio(data.positions ?? []);
        setHistory(data.history ?? []);
        if (data.suggested_amount) setSuggestedAmount(String(data.suggested_amount));
      }
    } catch (e) { console.error("Portfolio load error:", e); }
    finally { setLoading(false); }
  };

  const savePortfolio = async (nb: number, np: Portfolio[], nh: PortfolioHistory[]) => {
    if (!authUser) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("portfolios").upsert({
        user_id: authUser.id,
        balance: nb,
        positions: np,
        history: nh,
        suggested_amount: parseFloat(suggestedAmount) || 0,
        updated_at: new Date().toISOString(),
      });
      if (error) console.error("Portfolio save failed:", error);
    } catch (e) { console.error("Portfolio save error:", e); }
    finally { setSaving(false); }
  };

  const portfolioValue  = portfolio.reduce((s, i) => s + (liveStocks.find(x => x.symbol===i.symbol)?.price || 0) * i.shares, 0);
  const totalInvestment = portfolio.reduce((s, i) => s + i.buyPrice * i.shares, 0);
  const profit          = portfolioValue - totalInvestment;
  const profitPct       = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;

  const handleBuy = async () => {
    if (!selectedStock || !shares || parseFloat(shares) <= 0) return;
    if (!selectedStock.price) { toast.error(t("انتظر تحميل الأسعار","Wait for prices to load")); return; }
    const qty  = parseFloat(shares);
    const cost = selectedStock.price * qty;
    if (cost > balance) { toast.error(t("رصيدك غير كافٍ","Insufficient balance")); return; }
    const existing = portfolio.find(p => p.symbol === selectedStock.symbol);
    let np: Portfolio[];
    if (existing) {
      const total = existing.shares + qty;
      np = portfolio.map(p => p.symbol===selectedStock.symbol ? { ...p, shares:total, buyPrice:(p.buyPrice*p.shares+cost)/total } : p);
    } else {
      np = [...portfolio, { symbol:selectedStock.symbol, shares:qty, buyPrice:selectedStock.price, buyDate:new Date().toLocaleString(language === "ar" ? "ar-SA" : "en-US", { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }) }];
    }
    const nb = balance - cost;
    const nh = [...history, { date: new Date().toLocaleDateString("ar-SA"), value: nb + portfolioValue }].slice(-12);
    setBalance(nb); setPortfolio(np); setHistory(nh); setShares(""); setSelectedStockId(null);
    toast.success(t(`تم شراء ${qty} سهم من ${selectedStock.name}`,`Bought ${qty} shares of ${selectedStock.name}`));
    await savePortfolio(nb, np, nh);
  };

  const handleSell = async (symbol: string) => {
    const pos   = portfolio.find(p => p.symbol===symbol);
    const stock = liveStocks.find(s => s.symbol===symbol);
    if (!pos || !stock) return;
    const revenue = stock.price * pos.shares;
    const gain    = revenue - pos.buyPrice * pos.shares;
    const nb      = balance + revenue;
    const np          = portfolio.filter(p => p.symbol!==symbol);
    const remainingVal = np.reduce((s, i) => s + (liveStocks.find(x => x.symbol===i.symbol)?.price || 0) * i.shares, 0);
    const nh          = [...history, { date: new Date().toLocaleDateString("ar-SA"), value: nb + remainingVal }].slice(-12);
    setBalance(nb); setPortfolio(np); setHistory(nh); setSellConfirm(null);
    toast.success(t(`تم بيع ${stock.name}`,`Sold ${stock.name}`));
    await savePortfolio(nb, np, nh);
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositInput);
    if (!amount || amount <= 0) { toast.error(t("أدخل مبلغا صحيحا","Enter a valid amount")); return; }
    if (amount > dashboardBalance) { toast.error(t(`صافي رصيدك غير كافٍ — المتاح: ${dashboardBalance.toLocaleString()} ر.س`, `Insufficient net balance — available: ${dashboardBalance.toLocaleString()} SAR`)); return; }
    if (!authUser) return;
    const nb = balance + amount;
    await supabase.from("transactions").insert({
      user_id: authUser.id,
      type: "expense",
      category: t("استثمار","Investment"),
      amount,
      description: t("إيداع في المحفظة الاستثمارية","Investment portfolio deposit"),
      created_at: new Date().toISOString(),
    });
    setDashboardBalance(prev => prev - amount);
    setBalance(nb);
    setDepositInput("");
    setShowDeposit(false);
    toast.success(t(`تم تحويل ${amount.toLocaleString()} ر.س إلى محفظتك الاستثمارية`,`Transferred ${amount.toLocaleString()} SAR to your investment portfolio`));
    await savePortfolio(nb, portfolio, history);
  };

  const totalSuggested = suggestedPortfolio.reduce((s, r) => s + r.amount, 0);

  const handleApplyPortfolio = async () => {
    if (!authUser) { toast.error(t("يجب تسجيل الدخول أولاً","Please login first")); return; }
    setApplying(true);
    let np = [...portfolio];
    let nb = balance;
    let bought = 0;
    for (const row of suggestedPortfolio) {
      const stock = liveStocks.find(s => s.ticker === row.ticker);
      if (!stock || !stock.price) continue;
      // استخدم رصيدك الفعلي × نسبة القطاع (مو المبلغ المقترح)
      const allocatedAmount = balance * (row.percentage / 100);
      const qty = Math.floor(allocatedAmount / stock.price);
      if (qty <= 0) continue;
      const cost = stock.price * qty;
      if (cost > nb) continue;
      const existing = np.find(p => p.symbol === stock.symbol);
      if (existing) {
        const total = existing.shares + qty;
        np = np.map(p => p.symbol === stock.symbol ? { ...p, shares: total, buyPrice: (p.buyPrice * p.shares + cost) / total } : p);
      } else {
        np = [...np, { symbol: stock.symbol, shares: qty, buyPrice: stock.price, buyDate: new Date().toLocaleString(language === "ar" ? "ar-SA" : "en-US", { year:"numeric", month:"short", day:"numeric" }) }];
      }
      nb -= cost;
      bought++;
    }
    if (bought === 0) {
      setApplying(false);
      setConfirmApply(false);
      toast.error(t("رصيدك غير كافٍ لشراء ولو سهم واحد — أودع رصيداً أكبر وأعد المحاولة","Balance too low to buy even 1 share — deposit more and try again"));
      return;
    }
    const nh = [...history, { date: new Date().toLocaleDateString("ar-SA"), value: nb + np.reduce((s,i) => s + (liveStocks.find(x=>x.symbol===i.symbol)?.price||0)*i.shares,0) }].slice(-12);
    setBalance(nb); setPortfolio(np); setHistory(nh);
    setConfirmApply(false);
    setApplying(false);
    toast.success(t(`تم شراء ${bought} أسهم بنجاح! انتقل لتاب محفظتي للمتابعة`, `Bought ${bought} stocks successfully! Check My Portfolio tab`));
    await savePortfolio(nb, np, nh);
    setActiveTab("portfolio");
  };

  const handleGeneratePortfolio = async () => {
    const amount = parseFloat(suggestedAmount);
    if (!amount || amount <= 0) { toast.error(t("أدخل مبلغاً صحيحاً","Enter a valid amount")); return; }
    setLoadingSuggestion(true);
    setSuggestedPortfolio([]);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const res = await fetch(`${PYTHON_API}/portfolio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          stocks: STOCKS.map(s => ({ ticker: s.ticker, name: s.name, sector: s.sector })),
          horizon,
          amount,
        }),
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "API error");
      }
      const data = await res.json();
      setSuggestedPortfolio(data.allocations ?? []);
    } catch (e: any) {
      if (e?.name === "AbortError")
        toast.error(t("انتهت مهلة الطلب — حجم البيانات كبير. أعد المحاولة","Request timed out — please try again"));
      else if (e?.message && e.message !== "API error")
        toast.error(e.message);
      else
        toast.error(t("تعذر الاتصال بالـ API. تأكد من تشغيل: python predict_api.py","Cannot connect to API. Make sure to run: python predict_api.py"));
    } finally {
      setLoadingSuggestion(false);
    }
  };

  /* ── Summary cards ── */
  const summaryCards = [
    { label: t("الرصيد النقدي","Cash Balance"),    value: `${balance.toLocaleString()} ${t("ر.س","SAR")}`,            icon: Wallet,        gradient: "from-[#2878C8] to-[#5DADE2]", iconColor: "#2878C8" },
    { label: t("قيمة المحفظة","Portfolio Value"),   value: `${portfolioValue.toLocaleString()} ${t("ر.س","SAR")}`,     icon: PieChart,      gradient: "from-[#1A8A5A] to-[#2ECC71]", iconColor: "#1A8A5A" },
    { label: t("الربح / الخسارة","Profit / Loss"),  value: `${profit>=0?"+":""}${profit.toFixed(2)} ${t("ر.س","SAR")}`,icon: profit>=0 ? ArrowUpRight : ArrowDownRight, gradient: profit>=0 ? "from-[#1A8A5A] to-[#2ECC71]" : "from-[#E8A830] to-[#F5C542]", iconColor: profit>=0 ? "#1A8A5A" : "#E8A830" },
    { label: t("نسبة العائد","Return Rate"),        value: `${profitPct>=0?"+":""}${profitPct.toFixed(2)}%`,            icon: TrendingUp,    gradient: "from-[#5B3D8F] to-[#7D5CB8]", iconColor: "#5B3D8F" },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-[#2878C8] animate-spin" />
        <p className={sub}>{t("جارٍ تحميل محفظتك...","Loading portfolio...")}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4 transition-colors relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -right-32 w-96 h-96 bg-[#1A8A5A]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -left-32 w-80 h-80 bg-[#2878C8]/6 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-[#5B3D8F]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className={`text-3xl font-bold mb-1 ${txt}`}>{t("محافظ الاستثمار","Investment Portfolio")}</motion.h1>
            <p className={sub}>{t("تعلم الاستثمار في بيئة آمنة","Learn investing risk-free")}</p>
          </div>
          {authUser && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setDepositInput(""); setShowDeposit(true); }}
              className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#2878C8]/25 transition-all flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #1B5FA0 0%, #2878C8 50%, #5DADE2 100%)" }}
            >
              <Wallet className="w-4 h-4" />
              {t("إيداع رصيد","Deposit Funds")}
            </motion.button>
          )}
        </div>

        {/* Alerts */}
        {authUser && balance === 0 && dashboardBalance <= 0 && !loading && (
          <div className={`flex items-start gap-3 p-4 rounded-2xl border mb-6 ${dm ? "bg-[#E8A830]/10 border-[#E8A830]/20" : "bg-[#E8A830]/5 border-[#E8A830]/20"}`}>
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#E8A830]" />
            <div>
              <p className={`font-semibold text-sm ${txt}`}>{t("رصيد المحفظة فارغ","Portfolio balance is empty")}</p>
              <p className={`text-xs mt-0.5 ${sub}`}>
                {t("أضف دخلا في لوحة التحكم أولا، ثم عد هنا واضغط إيداع رصيد لتحويل جزء منه إلى محفظتك الاستثمارية.",
                  "Add income in the Dashboard first, then come back and press Deposit Funds to transfer some of it into your investment portfolio.")}
              </p>
            </div>
          </div>
        )}

        {authUser && balance === 0 && dashboardBalance > 0 && !loading && (
          <div className={`flex items-start gap-3 p-4 rounded-2xl border mb-6 ${dm ? "bg-[#1A8A5A]/10 border-[#1A8A5A]/20" : "bg-[#1A8A5A]/5 border-[#1A8A5A]/20"}`}>
            <Wallet className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#1A8A5A]" />
            <div>
              <p className={`font-semibold text-sm ${txt}`}>{t("لديك رصيد جاهز للاستثمار!","You have balance ready to invest!")}</p>
              <p className={`text-xs mt-0.5 ${sub}`}>
                {t(`رصيدك المتاح ${dashboardBalance.toLocaleString()} ر.س — اضغط إيداع رصيد لبدء الاستثمار.`,
                  `Available balance: ${dashboardBalance.toLocaleString()} SAR — press Deposit Funds to start investing.`)}
              </p>
            </div>
          </div>
        )}

        {/* Deposit Dialog */}
        <Dialog open={showDeposit} onOpenChange={setShowDeposit}>
          <DialogContent dir={language === "ar" ? "rtl" : "ltr"} className={`rounded-2xl ${dialogCls}`}>
            <DialogHeader>
              <DialogTitle className={txt}>{t("إيداع رصيد","Deposit Funds")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className={`flex items-center justify-between p-3 rounded-xl border ${glassInner}`}>
                <span className={`text-sm ${sub}`}>{t("صافي رصيدك الحالي","Your Current Net Balance")}</span>
                <span className={`font-bold ${dashboardBalance > 0 ? "text-[#1A8A5A]" : "text-red-500"}`}>{dashboardBalance.toLocaleString()} {t("ر.س","SAR")}</span>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-xl border ${glassInner}`}>
                <span className={`text-sm ${sub}`}>{t("رصيدك الاستثماري الحالي","Current Investment Balance")}</span>
                <span className={`font-semibold ${txt}`}>{balance.toLocaleString()} {t("ر.س","SAR")}</span>
              </div>
              <div>
                <Label className={txt}>{t("المبلغ المراد إيداعه (ر.س)","Amount to Deposit (SAR)")}</Label>
                <Input type="number" min="1" max={dashboardBalance}
                  value={depositInput}
                  onChange={e => setDepositInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleDeposit()}
                  placeholder="0"
                  className={`rounded-xl mt-1 ${inputCls}`} />
                {depositInput && parseFloat(depositInput) > dashboardBalance && (
                  <p className="text-xs text-red-400 mt-1">{t("يتجاوز صافي رصيدك المتاح","Exceeds your available net balance")}</p>
                )}
              </div>
              <div className="flex gap-2">
                {[1000, 5000, 10000, 50000].map(v => (
                  <button key={v} onClick={() => setDepositInput(String(v))}
                    disabled={v > dashboardBalance}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${dm ? "bg-white/[0.04] border-white/[0.08] text-gray-300 hover:bg-white/[0.08]" : "bg-white/60 border-gray-200/60 text-gray-600 hover:bg-white/80"}`}>
                    {v.toLocaleString()}
                  </button>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeposit}
                disabled={!depositInput || parseFloat(depositInput) <= 0 || parseFloat(depositInput) > dashboardBalance}
                className="w-full py-2.5 text-white rounded-xl font-semibold transition-all shadow-lg shadow-[#2878C8]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #1B5FA0 0%, #2878C8 50%, #5DADE2 100%)" }}
              >
                {t("تأكيد الإيداع","Confirm Deposit")}
              </motion.button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {summaryCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div key={i} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.08}}>
                <div className={`rounded-2xl border p-5 transition-all duration-300 ${glass}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-xs font-medium ${sub}`}>{c.label}</p>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${c.iconColor}15` }}>
                      <Icon className="w-4.5 h-4.5" style={{ color: c.iconColor }} />
                    </div>
                  </div>
                  <p className={`text-xl font-bold ${txt}`}>{c.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Portfolio History Chart */}
        {history.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className={`rounded-2xl border p-5 mb-8 ${glass}`}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-[#1A8A5A]" />
                <h3 className={`font-semibold ${txt}`}>{t("تاريخ المحفظة","Portfolio History")}</h3>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#1A8A5A" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1A8A5A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={dm ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
                    <XAxis dataKey="date" tick={{fontSize:10, fill: dm ? "#94a3b8" : "#6b7280"}} />
                    <YAxis tick={{fontSize:10, fill: dm ? "#94a3b8" : "#6b7280"}} />
                    <Tooltip formatter={(v:number)=>[`${v.toLocaleString()} ${t("ر.س","SAR")}`, t("قيمة المحفظة","Portfolio Value")]} contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="value" stroke="#1A8A5A" fill="url(#grad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className={`flex gap-1 p-1 rounded-2xl mb-6 w-fit ${dm ? "bg-white/[0.04] border border-white/[0.06]" : "bg-white/50 border border-white/40"}`}>
          {([ ["market", t("السوق","Market")], ["portfolio", `${t("محفظتي","My Portfolio")} (${portfolio.length})`], ["suggested", `${t("محفظة مقترحة","Suggested")} `] ] as ["market"|"portfolio"|"suggested", string][]).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab===key
                  ? "text-white shadow-sm"
                  : dm ? "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]" : "text-gray-600 hover:text-gray-900 hover:bg-white/40"
              }`}
              style={activeTab===key ? { background: "linear-gradient(135deg, #1B5FA0, #2878C8)" } : undefined}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Market Tab */}
        {activeTab === "market" && (
          <div className="space-y-4">
          <button onClick={() => setActiveTab("suggested")}
            className={`w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl border-2 border-dashed transition-all text-right
              ${dm ? "border-[#1A8A5A]/40 bg-[#1A8A5A]/10 hover:bg-[#1A8A5A]/20" : "border-[#1A8A5A]/30 bg-[#1A8A5A]/5 hover:bg-[#1A8A5A]/10"}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div className="text-right">
                <p className={`font-semibold text-sm ${dm?"text-[#2ECC71]":"text-[#1A8A5A]"}`}>
                  {t("هل تريد توزيع مبلغك بذكاء؟","Want to invest smarter?")}
                </p>
                <p className={`text-xs mt-0.5 ${sub}`}>
{t(
  "خيارات استثمارية مقترحة بناءً على تحليل البيانات والمؤشرات",
  "Suggested investment options based on data and market analysis"
)}                </p>
              </div>
            </div>
            <span className={`text-sm font-semibold whitespace-nowrap ${dm?"text-[#2ECC71]":"text-[#1A8A5A]"}`}>
              {t("محفظة مقترحة ⭐","Suggested ⭐")} ←
            </span>
          </button>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className={`rounded-2xl border ${glass}`}>
                <div className="p-5 border-b border-inherit space-y-3">
                  <h3 className={`font-semibold ${txt}`}>{t("الأسهم المتاحة","Available Stocks")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {SECTORS.map(s => (
                      <button key={s} onClick={() => setSectorFilter(s)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                          sectorFilter===s
                            ? "text-white border-[#2878C8]"
                            : dm ? "border-white/[0.08] text-gray-400 hover:border-[#2878C8]/40 hover:text-[#5DADE2]" : "border-gray-200/60 text-gray-500 hover:border-[#2878C8]/40 hover:text-[#2878C8]"
                        }`}
                        style={sectorFilter===s ? { background: "linear-gradient(135deg, #1B5FA0, #2878C8)" } : undefined}
                      >
                        {s === "المفضلة" && <Star className="w-3 h-3 inline mr-1 fill-current" />}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {filteredStocks.map(stock => (
                    <motion.div key={stock.id} whileHover={{scale:1.01}}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedStock?.id===stock.id ? rowSel : rowBase}`}
                      onClick={() => { setSelectedStockId(stock.id); fetchPrediction(stock.ticker); }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`font-bold ${txt}`}>{stock.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${dm ? "bg-white/[0.06] text-gray-400" : "bg-gray-100/80 text-gray-500"}`}>{stock.symbol}</span>
                          </div>
                          {!pricesLoading && (
                            <span className={`text-sm font-medium ${stock.change>=0?"text-[#1A8A5A]":"text-red-400"}`}>
                              {stock.change>=0?"▲":"▼"} {Math.abs(stock.change)} ({stock.changePercent>=0?"+":""}{stock.changePercent}%)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={e => { e.stopPropagation(); toggleFavorite(stock.symbol); }}
                            className={`p-1.5 rounded-lg transition-all hover:scale-110 ${favorites.has(stock.symbol) ? "text-[#E8A830]" : `${sub} hover:text-[#E8A830]`}`}>
                            <Star className={`w-4 h-4 ${favorites.has(stock.symbol) ? "fill-[#E8A830]" : ""}`} />
                          </button>
                          <p className={`text-xl font-bold ${txt}`}>
                            {pricesLoading ? <span className={`text-sm ${sub}`}>...</span> : `${stock.price} ${t("ر.س","SAR")}`}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Buy Panel */}
            <div>
              <div className={`rounded-2xl border sticky top-24 ${glass}`}>
                <div className="p-5 border-b border-inherit">
                  <h3 className={`font-semibold ${txt}`}>{t("شراء أسهم","Buy Stocks")}</h3>
                </div>
                <div className="p-5">
                  {selectedStock ? (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl border ${dm ? "bg-[#1A8A5A]/10 border-[#1A8A5A]/20" : "bg-[#1A8A5A]/5 border-[#1A8A5A]/20"}`}>
                        <p className="text-xs text-[#1A8A5A] mb-1">{t("السهم المحدد","Selected Stock")}</p>
                        <p className={`font-bold ${txt}`}>{selectedStock.name}</p>
                        <p className="text-sm text-[#1A8A5A]">{t("السعر","Price")}: {selectedStock.price} {t("ر.س","SAR")}</p>
                      </div>

                      {/* AI Prediction */}
                      <div className={`rounded-xl border overflow-hidden ${dm ? "border-white/[0.08]" : "border-gray-200/60"}`}>
                        <div className={`px-3 py-2 flex items-center justify-between ${dm ? "bg-white/[0.04]" : "bg-gray-50/80"}`}>
                          <span className={`text-xs font-semibold uppercase tracking-wide ${sub}`}>{t("توقع ذكي — سنة واحدة","AI Forecast — 1 Year")}</span>
                          <Sparkles className="w-3.5 h-3.5 text-[#E8A830]" />
                        </div>
                        <div className="p-3">
                          {predicting.has(selectedStock.ticker) ? (
                            <div className="flex items-center justify-center gap-2 py-2">
                              <Loader2 className="w-4 h-4 animate-spin text-[#2878C8]" />
                              <span className={`text-xs ${sub}`}>{t("جارٍ التحليل...","Analysing...")}</span>
                            </div>
                          ) : predFailed.has(selectedStock.ticker) ? (
                            <p className={`text-xs text-center py-2 ${sub}`}>{t("التوقع غير متاح حاليا","Prediction unavailable")}</p>
                          ) : predictions[selectedStock.ticker] ? (() => {
                            const p            = predictions[selectedStock.ticker];
                            const livePrice    = selectedStock.price;
                            const changePct    = Math.round(p.change_percent * 100) / 100;
                            const displayPredicted = livePrice > 0
                              ? Math.round(livePrice * (1 + changePct / 100) * 100) / 100
                              : p.predicted_price;
                            const isUp         = changePct >= 0;
                            const signalType   = p.signal === "شراء" ? "buy" : p.signal === "بيع" ? "sell" : "wait";
                            const signal       = signalType === "buy" ? t("شراء","Buy") : signalType === "sell" ? t("بيع","Sell") : t("انتظار","Wait");
                            const signalColor  = signalType === "buy"
                              ? `text-[#1A8A5A] ${dm ? "bg-[#1A8A5A]/15 border-[#1A8A5A]/20" : "bg-[#1A8A5A]/5 border-[#1A8A5A]/20"}`
                              : signalType === "sell"
                              ? `text-red-400 ${dm ? "bg-red-500/15 border-red-500/20" : "bg-red-50 border-red-200"}`
                              : `text-[#E8A830] ${dm ? "bg-[#E8A830]/15 border-[#E8A830]/20" : "bg-[#E8A830]/5 border-[#E8A830]/20"}`;
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className={`text-xs ${sub}`}>{t("السعر المتوقع","Predicted Price")}</p>
                                    <p className={`text-lg font-bold ${txt}`}>{displayPredicted} <span className="text-xs font-normal">{t("ر.س","SAR")}</span></p>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-xs ${sub}`}>{t("التغير المتوقع","Expected Change")}</p>
                                    <p className={`text-lg font-bold ${isUp ? "text-[#1A8A5A]" : "text-red-400"}`}>
                                      {isUp ? "+" : ""}{changePct}%
                                    </p>
                                  </div>
                                </div>
                                <div className={`flex items-center justify-center py-1.5 rounded-lg border text-sm font-bold ${signalColor}`}>
                                  {signalType === "buy" ? "▲ " : signalType === "sell" ? "▼ " : "— "}{signal}
                                </div>
                              </div>
                            );
                          })() : (
                            <p className={`text-xs text-center py-1 ${sub}`}>{t("جارٍ التحميل...","Loading...")}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className={txt}>{t("عدد الأسهم","Number of Shares")}</Label>
                        <Input type="number" value={shares} onChange={e=>setShares(e.target.value)}
                          placeholder="0" min="1" className={`rounded-xl mt-1 ${inputCls}`} />
                      </div>
                      {shares && parseFloat(shares) > 0 && (
                        <div className={`p-4 rounded-xl border ${dm ? "bg-[#2878C8]/10 border-[#2878C8]/20" : "bg-[#2878C8]/5 border-[#2878C8]/20"}`}>
                          <p className="text-xs text-[#2878C8] mb-1">{t("إجمالي التكلفة","Total Cost")}</p>
                          <p className={`text-xl font-bold ${txt}`}>
                            {(selectedStock.price * parseFloat(shares)).toLocaleString()} {t("ر.س","SAR")}
                          </p>
                          {selectedStock.price * parseFloat(shares) > balance && (
                            <p className="text-xs text-red-400 mt-1">{t("يتجاوز رصيدك","Exceeds your balance")}</p>
                          )}
                        </div>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleBuy}
                        disabled={pricesLoading || !selectedStock.price || !shares || parseFloat(shares)<=0 || selectedStock.price*parseFloat(shares)>balance}
                        className="w-full py-2.5 text-white rounded-xl font-semibold transition-all shadow-lg shadow-[#2878C8]/20 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #1B5FA0 0%, #2878C8 50%, #5DADE2 100%)" }}
                      >
                        {pricesLoading ? t("جارٍ تحميل الأسعار...","Loading prices...") : t("شراء الأسهم","Buy Stocks")}
                      </motion.button>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#2878C8]/10 flex items-center justify-center">
                        <Sparkles className="w-7 h-7 text-[#2878C8]" />
                      </div>
                      <p className={sub}>{t("اختر سهما من القائمة للبدء","Select a stock to begin")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === "portfolio" && (
          <div className={`rounded-2xl border ${glass}`}>
            <div className="p-5 border-b border-inherit">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#5B3D8F]" />
                <h3 className={`font-semibold ${txt}`}>{t("استثماراتك الحالية","Your Investments")}</h3>
              </div>
            </div>
            <div className="p-5">
              {portfolio.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#5B3D8F]/10 flex items-center justify-center">
                    <PieChart className="w-7 h-7 text-[#5B3D8F]" />
                  </div>
                  <p className={`font-medium ${txt} mb-1`}>{t("محفظتك فارغة","Portfolio is empty")}</p>
                  <p className={`text-sm ${sub}`}>{t("ابدأ بشراء أسهم من تبويب السوق","Buy stocks from the Market tab")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {portfolio.map(pos => {
                    const stock = liveStocks.find(s => s.symbol===pos.symbol);
                    if (!stock) return null;
                    const cur = stock.price * pos.shares;
                    const inv = pos.buyPrice * pos.shares;
                    const pp  = cur - inv;
                    const pct = (pp / inv) * 100;
                    return (
                      <div key={pos.symbol} className={`p-5 rounded-xl border ${glassInner}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className={`font-bold text-lg ${txt}`}>{stock.name}</h3>
                            <p className={`text-sm ${sub}`}>{pos.shares} {t("سهم","shares")}</p>
                          </div>
                          <button onClick={() => setSellConfirm(pos.symbol)}
                            className={`px-3 py-1.5 border rounded-xl text-sm font-medium transition-all ${dm ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-red-300 text-red-500 hover:bg-red-50"}`}>
                            {t("بيع الكل","Sell All")}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {[
                            { label:t("سعر الشراء","Buy Price"),       value:`${pos.buyPrice.toFixed(2)} ${t("ر.س","SAR")}` },
                            { label:t("السعر الحالي","Current Price"),  value:`${stock.price} ${t("ر.س","SAR")}` },
                            { label:t("القيمة الحالية","Current Value"),value:`${cur.toLocaleString()} ${t("ر.س","SAR")}` },
                            { label:t("الربح/الخسارة","P/L"),           value:`${pp>=0?"+":""}${pp.toFixed(2)} (${pct>=0?"+":""}${pct.toFixed(1)}%)`, color:pp>=0?"text-[#1A8A5A]":"text-red-400" },
                            { label:t("وقت الشراء","Purchase Time"),  value: pos.buyDate ?? "—" },
                          ].map((item,i) => (
                            <div key={i}>
                              <p className={`text-xs ${sub} mb-1`}>{item.label}</p>
                              <p className={`font-medium text-sm ${(item as any).color || txt}`}>{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* محفظة مقترحة */}
        {activeTab === "suggested" && (
          <div className="space-y-6">
            <div className={`rounded-2xl border p-6 ${glass}`}>
              <h3 className={`font-semibold text-lg mb-5 ${txt}`}>
                {t("احسب محفظتك الاستثمارية المقترحة","Calculate Your Suggested Portfolio")}
              </h3>
              <div className="space-y-5">
                <div>
                  <Label className={txt}>{t("المبلغ المتاح للاستثمار (ر.س)","Available Amount (SAR)")}</Label>
                  <Input type="number" value={suggestedAmount} onChange={e => setSuggestedAmount(e.target.value)}
                    placeholder="50000" min="1000" className={`rounded-xl mt-1 ${inputCls}`} />
                </div>
                <div>
                  <Label className={`${txt} mb-3 block`}>{t("أفق الاستثمار","Investment Horizon")}</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {([ ["short","قصير المدى","توقع سنة واحدة"], ["medium","متوسط المدى","توقع 2-3 سنوات"], ["long","طويل المدى","توقع 3-6 سنوات ⭐"] ] as ["short"|"medium"|"long", string, string][]).map(([val, lbl, cap]) => (
                      <button key={val} onClick={() => setHorizon(val)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${horizon===val
                          ? "border-[#2878C8] bg-[#2878C8]/10"
                          : dm ? "border-white/[0.08] hover:border-white/20" : "border-gray-200/60 hover:border-gray-300"}`}>
                        <p className={`font-semibold text-sm ${horizon===val ? "text-[#2878C8]" : txt}`}>{lbl}</p>
                        <p className={`text-xs mt-0.5 ${sub}`}>{cap}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleGeneratePortfolio}
                  disabled={loadingSuggestion || !suggestedAmount || parseFloat(suggestedAmount) <= 0}
                  className="w-full py-3 text-white rounded-xl font-semibold transition-all shadow-lg shadow-[#2878C8]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #1B5FA0 0%, #2878C8 50%, #5DADE2 100%)" }}>
                  {loadingSuggestion
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> {t("جارٍ التحليل...","Analyzing...")}</>
                    : <><Sparkles className="w-5 h-5" /> {t("احسب المحفظة المقترحة","Calculate Suggested Portfolio")}</>}
                </motion.button>
              </div>
            </div>

            {suggestedPortfolio.length > 0 && (
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className={`rounded-2xl border ${glass}`}>
                <div className="p-5 border-b border-inherit">
                  <h3 className={`font-semibold ${txt}`}>
                    {t("محفظتك المقترحة","Your Suggested Portfolio")} — {parseFloat(suggestedAmount).toLocaleString()} {t("ر.س","SAR")}
                  </h3>
                  <p className={`text-sm mt-1 ${sub}`}>
                    {horizon==="long"
                      ? t("طويل المدى — التوقع على مدى 3-6 سنوات (1260 يوم تداول)","Long-term — forecast over 3-6 years (1260 trading days)")
                      : horizon==="medium"
                      ? t("متوسط المدى — التوقع على مدى 2-3 سنوات (630 يوم تداول)","Medium-term — forecast over 2-3 years (630 trading days)")
                      : t("قصير المدى — التوقع على مدى سنة واحدة (252 يوم تداول)","Short-term — forecast over 1 year (252 trading days)")}
                  </p>
                </div>
                <div className="p-5">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`border-b ${dm?"border-white/[0.08]":"border-gray-200/60"}`}>
                          {[t("القطاع","Sector"), t("النسبة","Allocation"), t("الشركة","Company"), t("المبلغ (ر.س)","Amount (SAR)"), t(horizon==="short"?"التوقع (سنة)":horizon==="medium"?"التوقع (2-3 سنوات)":"التوقع (3-6 سنوات)", horizon==="short"?"Forecast (1Y)":horizon==="medium"?"Forecast (2-3Y)":"Forecast (3-6Y)")].map(h => (
                            <th key={h} className={`py-2 px-3 text-right font-medium ${sub}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {suggestedPortfolio.map((row, i) => {
                          const rowColors = ["#2878C8","#1A8A5A","#E8A830","#5B3D8F","#5DADE2","#1B5FA0"];
                          const rc = rowColors[i % rowColors.length];
                          return (
                          <tr key={i} className={`border-b last:border-0 transition-colors ${dm?"border-white/[0.06] hover:bg-white/[0.03]":"border-gray-100 hover:bg-gray-50/50"}`}>
                            <td className={`py-3 px-3 font-medium ${txt}`}>
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{backgroundColor:rc}} />
                                {row.sector}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className="h-2 rounded-full" style={{width:`${Math.min(row.percentage, 80)}px`, backgroundColor:rc}} />
                                <span className="font-bold" style={{color:rc}}>{row.percentage}%</span>
                              </div>
                            </td>
                            <td className={`py-3 px-3 ${txt}`}>{row.stock_name}</td>
                            <td className={`py-3 px-3 font-semibold ${txt}`}>{row.amount.toLocaleString()}</td>
                            <td className={`py-3 px-3 font-medium ${row.change_percent>=0?"text-[#1A8A5A]":"text-red-400"}`}>
                              {row.change_percent>=0?"▲":"▼"} {Math.abs(row.change_percent)}%
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className={`mt-5 p-4 rounded-xl border ${dm?"bg-[#2878C8]/10 border-[#2878C8]/20":"bg-[#2878C8]/5 border-[#2878C8]/20"}`}>
                    <p className={`text-sm ${dm?"text-blue-300":"text-[#1B5FA0]"}`}>
                      ⭐ {t("هذه الاقتراحات مستوحاة من توزيع الصناديق الاستثمارية الناجحة في السوق السعودي كما يرصدها موقع حاصد، ومعالجتها بنموذج تعلم آلي.",
                          "These suggestions are inspired by successful Saudi market fund allocations as tracked by Hasad, processed through a machine learning model.")}
                    </p>
                    <p className={`text-xs mt-1 ${sub}`}>
                      ⚠️ {t("القرار النهائي لك — هذه مقترحات تعليمية فقط","Final decision is yours — educational suggestions only")}
                    </p>
                  </div>

                  {/* تنبيه الرصيد */}
                  {balance < totalSuggested ? (
                    <div className={`mt-4 p-4 rounded-xl border ${dm?"bg-[#E8A830]/10 border-[#E8A830]/20":"bg-[#E8A830]/5 border-[#E8A830]/20"}`}>
                      <p className="text-sm text-[#E8A830] font-semibold">
                        ⚠️ {t("رصيدك الاستثماري غير كافٍ لتطبيق هذه المحفظة","Your investment balance is insufficient for this portfolio")}
                      </p>
                      <div className={`mt-2 text-xs ${sub} space-y-1`}>
                        <div className="flex justify-between">
                          <span>{t("المطلوب","Required")}</span>
                          <span className="font-semibold">{totalSuggested.toLocaleString()} {t("ر.س","SAR")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("رصيدك","Your balance")}</span>
                          <span className={`font-semibold ${balance > 0 ? "text-[#1A8A5A]" : "text-red-400"}`}>{balance.toLocaleString()} {t("ر.س","SAR")}</span>
                        </div>
                        <div className="flex justify-between border-t border-[#E8A830]/20 pt-1">
                          <span>{t("الفرق","Difference")}</span>
                          <span className="font-semibold text-red-400">-{(totalSuggested - balance).toLocaleString()} {t("ر.س","SAR")}</span>
                        </div>
                      </div>
                      <button onClick={() => { setConfirmApply(false); setShowDeposit(true); }}
                        className="mt-3 w-full py-2 rounded-xl text-xs font-semibold text-white"
                        style={{ background: "linear-gradient(135deg, #E8A830, #F5C542)" }}>
                        {t("إيداع رصيد إضافي","Deposit More Funds")}
                      </button>
                    </div>
                  ) : (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setConfirmApply(true)}
                      className="mt-4 w-full py-3 text-white rounded-xl font-semibold shadow-lg shadow-[#2878C8]/20 flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(135deg, #1B5FA0 0%, #2878C8 50%, #5DADE2 100%)" }}>
                      <Sparkles className="w-5 h-5" />
                      {t("طبّق هذه المحفظة","Apply This Portfolio")}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Dialog تأكيد تطبيق المحفظة */}
        <Dialog open={confirmApply} onOpenChange={setConfirmApply}>
          <DialogContent dir={language==="ar"?"rtl":"ltr"} className={`rounded-2xl ${dialogCls}`}>
            <DialogHeader>
              <DialogTitle className={txt}>{t("تأكيد تطبيق المحفظة المقترحة","Confirm Apply Suggested Portfolio")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className={`p-4 rounded-xl border space-y-2 ${glassInner}`}>
                {(() => {
                  const rows = suggestedPortfolio.map(row => {
                    const stock = liveStocks.find(s => s.ticker === row.ticker);
                    const allocatedAmount = balance * (row.percentage / 100);
                    const qty = stock?.price ? Math.floor(allocatedAmount / stock.price) : 0;
                    const cost = qty * (stock?.price || 0);
                    return { row, stock, qty, cost };
                  });
                  const actualTotal = rows.reduce((s, r) => s + r.cost, 0);
                  const canBuyCount = rows.filter(r => r.qty > 0).length;
                  return (
                    <>
                      {rows.map(({ row, stock, qty, cost }, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className={sub}>{row.stock_name} ({row.sector})</span>
                          {qty > 0
                            ? <span className={`font-medium ${txt}`}>{qty} {t("سهم","shares")} × {stock?.price} = {cost.toLocaleString()} {t("ر.س","SAR")}</span>
                            : <span className="text-[#E8A830] text-xs">{t("المبلغ المخصص أقل من سعر السهم","Allocated amount below share price")}</span>
                          }
                        </div>
                      ))}
                      {canBuyCount === 0 && (
                        <p className="text-xs text-red-400 text-center pt-1">
                          ⚠️ {t(`المبلغ المقترح (${totalSuggested.toLocaleString()} ر.س) أقل من سعر معظم الأسهم — أدخل مبلغاً أكبر`,`Suggested amount too low — enter a larger amount`)}
                        </p>
                      )}
                      <div className={`flex justify-between text-sm border-t pt-2 ${dm?"border-white/[0.08]":"border-gray-200"}`}>
                        <span className={`font-semibold ${sub}`}>{t("التكلفة الفعلية","Actual Cost")}</span>
                        <span className={`font-bold ${txt}`}>{actualTotal.toLocaleString()} {t("ر.س","SAR")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={sub}>{t("الرصيد بعد الشراء","Balance after purchase")}</span>
                        <span className="font-bold text-[#1A8A5A]">{(balance - actualTotal).toLocaleString()} {t("ر.س","SAR")}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleApplyPortfolio} disabled={applying}
                  className="flex-1 py-2.5 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #1B5FA0 0%, #2878C8 50%, #5DADE2 100%)" }}>
                  {applying ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t("تأكيد الشراء","Confirm Purchase")}
                </motion.button>
                <button onClick={() => setConfirmApply(false)}
                  className={`flex-1 py-2.5 rounded-xl font-semibold border transition-all ${dm?"border-white/[0.08] text-gray-300 hover:bg-white/[0.04]":"border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                  {t("إلغاء","Cancel")}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Sell Confirmation Dialog */}
        <Dialog open={!!sellConfirm} onOpenChange={() => setSellConfirm(null)}>
          <DialogContent dir={language==="ar"?"rtl":"ltr"} className={`rounded-2xl ${dialogCls}`}>
            <DialogHeader>
              <DialogTitle className={txt}>{t("تأكيد عملية البيع","Confirm Sale")}</DialogTitle>
            </DialogHeader>
            {sellConfirm && (() => {
              const stock = liveStocks.find(s => s.symbol===sellConfirm);
              const pos   = portfolio.find(p => p.symbol===sellConfirm);
              if (!stock || !pos) return null;
              const revenue = stock.price * pos.shares;
              const gain    = revenue - pos.buyPrice * pos.shares;
              return (
                <div className="space-y-4 mt-2">
                  <div className={`p-4 rounded-xl border space-y-2 ${glassInner}`}>
                    {[
                      [t("السهم","Stock"), stock.name],
                      [t("عدد الأسهم","Shares"), pos.shares],
                      [t("العائد","Revenue"), `${revenue.toLocaleString()} ${t("ر.س","SAR")}`],
                    ].map(([k,v]) => (
                      <div key={k as string} className="flex justify-between text-sm">
                        <span className={sub}>{k}</span>
                        <span className={`font-medium ${txt}`}>{v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm">
                      <span className={sub}>{t("الربح / الخسارة","P / L")}</span>
                      <span className={`font-bold ${gain>=0?"text-[#1A8A5A]":"text-red-400"}`}>
                        {gain>=0?"+":""}{gain.toFixed(2)} {t("ر.س","SAR")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleSell(sellConfirm)}
                      className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all">
                      {t("تأكيد البيع","Confirm Sale")}
                    </button>
                    <button onClick={() => setSellConfirm(null)}
                      className={`flex-1 py-2.5 rounded-xl font-semibold border transition-all ${dm ? "border-white/[0.08] text-gray-300 hover:bg-white/[0.04]" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                      {t("إلغاء","Cancel")}
                    </button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {saving && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl text-sm shadow-lg text-white backdrop-blur-xl"
            style={{ background: "rgba(12, 26, 61, 0.9)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("جارٍ الحفظ...","Saving...")}
          </div>
        )}
      </div>
    </div>
  );
}
