import { useState, useEffect } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, PieChart, AlertCircle, Sparkles, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";

interface Stock    { id: string; name: string; symbol: string; ticker: string; sector: string; price: number; change: number; changePercent: number; }
interface Portfolio { symbol: string; shares: number; buyPrice: number; }
interface PortfolioHistory { date: string; value: number; }
interface PortfolioAllocation { sector: string; percentage: number; stock_name: string; ticker: string; current_price: number; change_percent: number; signal: string; amount: number; }

const STOCKS: Stock[] = [
  { id:"1", name:"شركة أرامكو",          symbol:"ARAMCO",  ticker:"2222.SR", sector:"طاقة",          price:35.5,  change:0.8,  changePercent:2.3  },
  { id:"2", name:"مصرف الراجحي",          symbol:"RJHI",    ticker:"1120.SR", sector:"بنوك",          price:85.2,  change:-1.2, changePercent:-1.4 },
  { id:"3", name:"سابك",                  symbol:"SABIC",   ticker:"2010.SR", sector:"بتروكيماويات",  price:92.7,  change:2.1,  changePercent:2.3  },
  { id:"4", name:"الاتصالات السعودية",    symbol:"STC",     ticker:"7010.SR", sector:"اتصالات",       price:45.8,  change:0.5,  changePercent:1.1  },
  { id:"5", name:"شركة الكهرباء",         symbol:"SEC",     ticker:"5110.SR", sector:"مرافق",         price:28.3,  change:-0.3, changePercent:-1.0 },
  { id:"6", name:"سليمان الحبيب",         symbol:"HABTOOR", ticker:"4013.SR", sector:"صحة",           price:125.0, change:1.2,  changePercent:0.97 },
];

export function Investment() {
  const { darkMode, language } = useSettings();
  const { user: authUser } = useAuth();
  const t = (ar: string, en: string) => language === "ar" ? ar : en;

  const dm      = darkMode;
  const card    = dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-100";
  const txt     = dm ? "text-gray-100" : "text-gray-900";
  const sub     = dm ? "text-gray-400" : "text-gray-500";
  const inputCls= dm ? "bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500" : "bg-slate-50 border-slate-200";
  const rowBase = dm ? "border-gray-600 hover:border-emerald-500" : "border-gray-200 hover:border-emerald-300";
  const rowSel  = dm ? "border-emerald-500 bg-emerald-900/30" : "border-emerald-500 bg-emerald-50";
  const buyPanel= dm ? "bg-emerald-900/30 border-emerald-700" : "bg-emerald-50 border-emerald-200";
  const costPanel=dm ? "bg-blue-900/30 border-blue-700" : "bg-blue-50 border-blue-200";
  const posPanel= dm ? "bg-gray-700/50" : "bg-gray-50";
  const tooltipStyle = dm ? { background:"#1f2937", border:"1px solid #374151", color:"#f3f4f6" } : {};

  const [balance, setBalance]           = useState(10000);
  const [portfolio, setPortfolio]       = useState<Portfolio[]>([]);
  const [history, setHistory]           = useState<PortfolioHistory[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [shares, setShares]             = useState("");
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [sellConfirm, setSellConfirm]   = useState<string | null>(null);
  const [activeTab, setActiveTab]       = useState<"market"|"portfolio"|"suggested">("market");
  const [suggestedAmount, setSuggestedAmount] = useState("50000");
  const [horizon, setHorizon]                 = useState<"short"|"medium"|"long">("long");
  const [suggestedPortfolio, setSuggestedPortfolio] = useState<PortfolioAllocation[]>([]);
  const [loadingSuggestion, setLoadingSuggestion]   = useState(false);

  useEffect(() => {
    if (authUser) loadPortfolio(authUser.id);
    else setLoading(false);
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
        setBalance(data.balance ?? 10000);
        setPortfolio(data.positions ?? []);
        setHistory(data.history ?? []);
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
        updated_at: new Date().toISOString(),
      });
      if (error) console.error("Portfolio save failed:", error);
    } catch (e) { console.error("Portfolio save error:", e); }
    finally { setSaving(false); }
  };

  const portfolioValue  = portfolio.reduce((s, i) => s + (STOCKS.find(x => x.symbol===i.symbol)?.price || 0) * i.shares, 0);
  const totalInvestment = portfolio.reduce((s, i) => s + i.buyPrice * i.shares, 0);
  const profit          = portfolioValue - totalInvestment;
  const profitPct       = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;

  const handleBuy = async () => {
    if (!selectedStock || !shares || parseFloat(shares) <= 0) return;
    const qty  = parseFloat(shares);
    const cost = selectedStock.price * qty;
    if (cost > balance) { toast.error(t("رصيدك غير كافٍ","Insufficient balance")); return; }
    const existing = portfolio.find(p => p.symbol === selectedStock.symbol);
    let np: Portfolio[];
    if (existing) {
      const total = existing.shares + qty;
      np = portfolio.map(p => p.symbol===selectedStock.symbol ? { ...p, shares:total, buyPrice:(p.buyPrice*p.shares+cost)/total } : p);
    } else {
      np = [...portfolio, { symbol:selectedStock.symbol, shares:qty, buyPrice:selectedStock.price }];
    }
    const nb = balance - cost;
    const nh = [...history, { date: new Date().toLocaleDateString("ar-SA"), value: nb + portfolioValue }].slice(-12);
    setBalance(nb); setPortfolio(np); setHistory(nh); setShares(""); setSelectedStock(null);
    toast.success(`✓ ${t("تم شراء","Bought")} ${qty} ${t("سهم من","shares of")} ${selectedStock.name}`);
    await savePortfolio(nb, np, nh);
  };

  const handleSell = async (symbol: string) => {
    const pos   = portfolio.find(p => p.symbol===symbol);
    const stock = STOCKS.find(s => s.symbol===symbol);
    if (!pos || !stock) return;
    const revenue = stock.price * pos.shares;
    const gain    = revenue - pos.buyPrice * pos.shares;
    const nb      = balance + revenue;
    const np      = portfolio.filter(p => p.symbol!==symbol);
    const nh      = [...history, { date: new Date().toLocaleDateString("ar-SA"), value: nb }].slice(-12);
    setBalance(nb); setPortfolio(np); setHistory(nh); setSellConfirm(null);
    toast.success(`${t("تم بيع","Sold")} ${stock.name} ${gain>=0 ? `${t("بربح","profit")} ${gain.toFixed(2)} ${t("ر.س","SAR")} 📈` : `${t("بخسارة","loss")} ${Math.abs(gain).toFixed(2)} ${t("ر.س","SAR")}`}`);
    await savePortfolio(nb, np, nh);
  };

  const handleGeneratePortfolio = async () => {
    const amount = parseFloat(suggestedAmount);
    if (!amount || amount <= 0) { toast.error(t("أدخل مبلغاً صحيحاً","Enter a valid amount")); return; }
    setLoadingSuggestion(true);
    setSuggestedPortfolio([]);
    try {
      const res = await fetch("http://localhost:5000/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stocks: STOCKS.map(s => ({ ticker: s.ticker, name: s.name, sector: s.sector })),
          horizon,
          amount,
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setSuggestedPortfolio(data.allocations ?? []);
    } catch {
      toast.error(t("تعذر الاتصال بنموذج التحليل. تأكد من تشغيل الـ API","Could not connect to analysis model. Make sure the API is running"));
    } finally {
      setLoadingSuggestion(false);
    }
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${dm ? "bg-gray-950" : ""}`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className={sub}>{t("جارٍ تحميل محفظتك...","Loading portfolio...")}</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen py-8 px-4 transition-colors ${dm ? "bg-gray-950" : ""}`}>
      <div className="max-w-7xl mx-auto">

        <div className="mb-6">
          <h1 className={`text-3xl font-bold mb-1 ${txt}`}>{t("محافظ الاستثمار","Investment Portfolio")}</h1>
          <p className={sub}>{t("تعلم الاستثمار في بيئة آمنة","Learn investing risk-free")}</p>
        </div>

        {/* تنبيه */}
        <div className={`mb-6 flex items-center gap-3 p-4 rounded-2xl border ${dm ? "bg-blue-900/20 border-blue-800 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-800"}`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            {t("هذا محاكي تعليمي — جميع الأسعار والبيانات افتراضية","Educational simulator — all prices and data are simulated")}
            {saving && <span className="font-semibold ms-2">💾 {t("جارٍ الحفظ...","Saving...")}</span>}
          </p>
        </div>

        {/* بطاقات الملخص */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label:t("الرصيد النقدي","Cash Balance"),   value:`${balance.toLocaleString()} ${t("ر.س","SAR")}`,           gradient:"from-emerald-500 to-teal-600", icon:<DollarSign className="w-5 h-5 text-white"/> },
            { label:t("قيمة المحفظة","Portfolio Value"),  value:`${portfolioValue.toLocaleString()} ${t("ر.س","SAR")}`,    gradient:"from-blue-500 to-cyan-600",    icon:<PieChart className="w-5 h-5 text-white"/> },
            { label:t("الربح / الخسارة","Profit / Loss"), value:`${profit>=0?"+":""}${profit.toFixed(2)} ${t("ر.س","SAR")}`,gradient:profit>=0?"from-green-500 to-emerald-600":"from-red-500 to-orange-600", icon:profit>=0?<ArrowUpRight className="w-5 h-5 text-white"/>:<ArrowDownRight className="w-5 h-5 text-white"/> },
            { label:t("نسبة العائد","Return Rate"),        value:`${profitPct>=0?"+":""}${profitPct.toFixed(2)}%`,           gradient:"from-purple-500 to-pink-600",  icon:<TrendingUp className="w-5 h-5 text-white"/> },
          ].map((c,i) => (
            <motion.div key={i} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.08}}>
              <div className={`bg-gradient-to-br ${c.gradient} rounded-2xl p-4 shadow-lg`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs mb-1">{c.label}</p>
                    <p className="text-lg font-bold text-white">{c.value}</p>
                  </div>
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">{c.icon}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* رسم بياني */}
        {history.length > 1 && (
          <div className={`rounded-2xl border p-5 mb-8 ${card}`}>
            <h3 className={`font-semibold mb-4 ${txt}`}>{t("تاريخ المحفظة","Portfolio History")}</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={dm?"#374151":"#e5e7eb"} />
                  <XAxis dataKey="date" tick={{fontSize:10, fill:dm?"#9ca3af":"#6b7280"}} />
                  <YAxis tick={{fontSize:10, fill:dm?"#9ca3af":"#6b7280"}} />
                  <Tooltip formatter={(v:number)=>[`${v.toLocaleString()} ${t("ر.س","SAR")}`, t("قيمة المحفظة","Portfolio Value")]} contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* تابس */}
        <div className={`flex gap-1 p-1 rounded-2xl mb-6 w-fit ${dm?"bg-gray-800":"bg-gray-100"}`}>
          {([ ["market", t("السوق","Market")], ["portfolio", `${t("محفظتي","My Portfolio")} (${portfolio.length})`], ["suggested", `${t("محفظة مقترحة","Suggested")} ⭐`] ] as ["market"|"portfolio"|"suggested", string][]).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab===key ? "bg-emerald-600 text-white shadow-sm" : dm?"text-gray-400 hover:text-gray-200":"text-gray-600 hover:text-gray-900"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* السوق */}
        {activeTab === "market" && (
          <div className="space-y-4">
          <button onClick={() => setActiveTab("suggested")}
            className={`w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl border-2 border-dashed transition-all text-right
              ${dm ? "border-emerald-700 bg-emerald-900/20 hover:bg-emerald-900/40" : "border-emerald-300 bg-emerald-50 hover:bg-emerald-100"}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className={`font-semibold text-sm ${dm?"text-emerald-400":"text-emerald-700"}`}>
                  {t("هل تريد توزيع مبلغك بذكاء؟","Want to invest smarter?")}
                </p>
                <p className={`text-xs mt-0.5 ${sub}`}>
                  {t("جرّب المحفظة المقترحة — توزيع ذكي مبني على نموذج Random Forest","Try the Suggested Portfolio — AI-powered allocation")}
                </p>
              </div>
            </div>
            <span className={`text-sm font-semibold whitespace-nowrap ${dm?"text-emerald-400":"text-emerald-600"}`}>
              {t("محفظة مقترحة ⭐","Suggested ⭐")} ←
            </span>
          </button>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className={`rounded-2xl border ${card}`}>
                <div className="p-5 border-b border-inherit">
                  <h3 className={`font-semibold ${txt}`}>{t("الأسهم المتاحة","Available Stocks")}</h3>
                </div>
                <div className="p-4 space-y-3">
                  {STOCKS.map(stock => (
                    <motion.div key={stock.id} whileHover={{scale:1.01}}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedStock?.id===stock.id ? rowSel : rowBase}`}
                      onClick={() => setSelectedStock(stock)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`font-bold ${txt}`}>{stock.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${dm?"bg-gray-700 text-gray-400":"bg-gray-100 text-gray-500"}`}>{stock.symbol}</span>
                          </div>
                          <span className={`text-sm font-medium ${stock.change>=0?"text-emerald-500":"text-red-500"}`}>
                            {stock.change>=0?"▲":"▼"} {Math.abs(stock.change)} ({stock.changePercent>=0?"+":""}{stock.changePercent}%)
                          </span>
                        </div>
                        <p className={`text-xl font-bold ${txt}`}>{stock.price} {t("ر.س","SAR")}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className={`rounded-2xl border sticky top-24 ${card}`}>
                <div className="p-5 border-b border-inherit">
                  <h3 className={`font-semibold ${txt}`}>{t("شراء أسهم","Buy Stocks")}</h3>
                </div>
                <div className="p-5">
                  {selectedStock ? (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl border ${buyPanel}`}>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">{t("السهم المحدد","Selected Stock")}</p>
                        <p className={`font-bold ${txt}`}>{selectedStock.name}</p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">{t("السعر","Price")}: {selectedStock.price} {t("ر.س","SAR")}</p>
                      </div>
                      <div>
                        <Label className={txt}>{t("عدد الأسهم","Number of Shares")}</Label>
                        <Input type="number" value={shares} onChange={e=>setShares(e.target.value)}
                          placeholder="0" min="1" className={`rounded-xl mt-1 ${inputCls}`} />
                      </div>
                      {shares && parseFloat(shares) > 0 && (
                        <div className={`p-4 rounded-xl border ${costPanel}`}>
                          <p className={`text-xs mb-1 ${dm?"text-blue-400":"text-blue-700"}`}>{t("إجمالي التكلفة","Total Cost")}</p>
                          <p className={`text-xl font-bold ${dm?"text-blue-300":"text-blue-900"}`}>
                            {(selectedStock.price * parseFloat(shares)).toLocaleString()} {t("ر.س","SAR")}
                          </p>
                          {selectedStock.price * parseFloat(shares) > balance && (
                            <p className="text-xs text-red-500 mt-1">⚠️ {t("يتجاوز رصيدك","Exceeds your balance")}</p>
                          )}
                        </div>
                      )}
                      <button onClick={handleBuy}
                        disabled={!shares || parseFloat(shares)<=0 || selectedStock.price*parseFloat(shares)>balance}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-all">
                        {t("شراء الأسهم","Buy Stocks")}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Sparkles className={`w-12 h-12 mx-auto mb-3 ${dm?"text-gray-600":"text-gray-300"}`} />
                      <p className={sub}>{t("اختر سهماً من القائمة للبدء","Select a stock to begin")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* المحفظة */}
        {activeTab === "portfolio" && (
          <div className={`rounded-2xl border ${card}`}>
            <div className="p-5 border-b border-inherit">
              <h3 className={`font-semibold ${txt}`}>{t("استثماراتك الحالية","Your Investments")}</h3>
            </div>
            <div className="p-5">
              {portfolio.length === 0 ? (
                <div className="text-center py-12">
                  <PieChart className={`w-14 h-14 mx-auto mb-4 ${dm?"text-gray-600":"text-gray-300"}`} />
                  <p className={`${sub} mb-1`}>{t("محفظتك فارغة","Portfolio is empty")}</p>
                  <p className={`text-sm ${sub}`}>{t("ابدأ بشراء أسهم من تبويب السوق","Buy stocks from the Market tab")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {portfolio.map(pos => {
                    const stock = STOCKS.find(s => s.symbol===pos.symbol);
                    if (!stock) return null;
                    const cur = stock.price * pos.shares;
                    const inv = pos.buyPrice * pos.shares;
                    const pp  = cur - inv;
                    const pct = (pp / inv) * 100;
                    return (
                      <div key={pos.symbol} className={`p-5 rounded-xl ${posPanel}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className={`font-bold text-lg ${txt}`}>{stock.name}</h3>
                            <p className={`text-sm ${sub}`}>{pos.shares} {t("سهم","shares")}</p>
                          </div>
                          <button onClick={() => setSellConfirm(pos.symbol)}
                            className="px-3 py-1.5 border border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-medium transition-all">
                            {t("بيع الكل","Sell All")}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label:t("سعر الشراء","Buy Price"),   value:`${pos.buyPrice.toFixed(2)} ${t("ر.س","SAR")}` },
                            { label:t("السعر الحالي","Current Price"),value:`${stock.price} ${t("ر.س","SAR")}` },
                            { label:t("القيمة الحالية","Current Value"),value:`${cur.toLocaleString()} ${t("ر.س","SAR")}` },
                            { label:t("الربح/الخسارة","P/L"),      value:`${pp>=0?"+":""}${pp.toFixed(2)} (${pct>=0?"+":""}${pct.toFixed(1)}%)`, color:pp>=0?"text-emerald-500":"text-red-500" },
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

        {/* المحفظة المقترحة */}
        {activeTab === "suggested" && (
          <div className="space-y-6">
            {/* بطاقة الإدخال */}
            <div className={`rounded-2xl border p-6 ${card}`}>
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
                    {([ ["short","قصير المدى","أقل من سنة"], ["medium","متوسط المدى","1–3 سنوات"], ["long","طويل المدى","3+ سنوات ⭐"] ] as ["short"|"medium"|"long", string, string][]).map(([val, label, caption]) => (
                      <button key={val} onClick={() => setHorizon(val)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${horizon===val ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : dm?"border-gray-600 hover:border-gray-500":"border-gray-200 hover:border-gray-300"}`}>
                        <p className={`font-semibold text-sm ${horizon===val?"text-emerald-600 dark:text-emerald-400":txt}`}>{label}</p>
                        <p className={`text-xs mt-0.5 ${sub}`}>{caption}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleGeneratePortfolio}
                  disabled={loadingSuggestion || !suggestedAmount || parseFloat(suggestedAmount) <= 0}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                  {loadingSuggestion
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> {t("جارٍ التحليل...","Analyzing...")}</>
                    : <><Sparkles className="w-5 h-5" /> {t("احسب المحفظة المقترحة","Calculate Suggested Portfolio")}</>}
                </button>
              </div>
            </div>

            {/* نتائج التوزيع */}
            {suggestedPortfolio.length > 0 && (
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className={`rounded-2xl border ${card}`}>
                <div className="p-5 border-b border-inherit">
                  <h3 className={`font-semibold ${txt}`}>
                    {t("محفظتك المقترحة","Your Suggested Portfolio")} — {parseFloat(suggestedAmount).toLocaleString()} {t("ر.س","SAR")}
                  </h3>
                  <p className={`text-sm mt-1 ${sub}`}>
                    {t(
                      horizon==="long" ? "أفق طويل المدى: 3+ سنوات" : horizon==="medium" ? "أفق متوسط: 1–3 سنوات" : "أفق قصير: أقل من سنة",
                      horizon==="long" ? "Long-term: 3+ years"      : horizon==="medium" ? "Medium-term: 1–3 years" : "Short-term: < 1 year"
                    )}
                  </p>
                </div>
                <div className="p-5">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`border-b ${dm?"border-gray-600":"border-gray-200"}`}>
                          {[t("القطاع","Sector"), t("النسبة","Allocation"), t("الشركة","Company"), t("المبلغ (ر.س)","Amount (SAR)"), t("التوقع","Forecast"), t("الإشارة","Signal")].map(h => (
                            <th key={h} className={`py-2 px-3 text-right font-medium ${sub}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {suggestedPortfolio.map((row, i) => (
                          <tr key={i} className={`border-b last:border-0 transition-colors ${dm?"border-gray-700 hover:bg-gray-700/30":"border-gray-100 hover:bg-gray-50"}`}>
                            <td className={`py-3 px-3 font-medium ${txt}`}>{row.sector}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className="h-2 rounded-full bg-emerald-500" style={{width:`${Math.min(row.percentage, 80)}px`}} />
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{row.percentage}%</span>
                              </div>
                            </td>
                            <td className={`py-3 px-3 ${txt}`}>{row.stock_name}</td>
                            <td className={`py-3 px-3 font-semibold ${txt}`}>{row.amount.toLocaleString()}</td>
                            <td className={`py-3 px-3 font-medium ${row.change_percent>=0?"text-emerald-500":"text-red-500"}`}>
                              {row.change_percent>=0?"▲":"▼"} {Math.abs(row.change_percent)}%
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                row.signal==="شراء" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" :
                                row.signal==="بيع"  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" :
                                                      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                              }`}>{row.signal}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className={`mt-5 p-4 rounded-xl border ${dm?"bg-blue-900/20 border-blue-800":"bg-blue-50 border-blue-200"}`}>
                    <p className={`text-sm ${dm?"text-blue-300":"text-blue-800"}`}>
                      ⭐ {t(
                        "تم إنشاء هذه المحفظة بناءً على نموذج Random Forest لتوقع الأسهم وتنويع استثماري مستوحى من أبرز الصناديق الناجحة في السوق السعودي.",
                        "This portfolio was generated using a Random Forest model for stock prediction, inspired by top-performing Saudi market funds."
                      )}
                    </p>
                    <p className={`text-xs mt-1 ${dm?"text-blue-400":"text-blue-600"}`}>
                      ⚠️ {t("القرار النهائي لك — هذه مقترحات تعليمية فقط","Final decision is yours — these are educational suggestions only")}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Dialog تأكيد البيع */}
        <Dialog open={!!sellConfirm} onOpenChange={() => setSellConfirm(null)}>
          <DialogContent dir={language==="ar"?"rtl":"ltr"} className={dm?"bg-gray-800 border-gray-700 text-gray-100":""}>
            <DialogHeader>
              <DialogTitle className={txt}>{t("تأكيد عملية البيع","Confirm Sale")}</DialogTitle>
            </DialogHeader>
            {sellConfirm && (() => {
              const stock = STOCKS.find(s => s.symbol===sellConfirm);
              const pos   = portfolio.find(p => p.symbol===sellConfirm);
              if (!stock || !pos) return null;
              const revenue = stock.price * pos.shares;
              const gain    = revenue - pos.buyPrice * pos.shares;
              return (
                <div className="space-y-4 mt-2">
                  <div className={`p-4 rounded-xl space-y-2 ${dm?"bg-gray-700":"bg-gray-50"}`}>
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
                      <span className={`font-bold ${gain>=0?"text-emerald-500":"text-red-500"}`}>
                        {gain>=0?"+":""}{gain.toFixed(2)} {t("ر.س","SAR")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleSell(sellConfirm)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all">
                      {t("تأكيد البيع","Confirm Sale")}
                    </button>
                    <button onClick={() => setSellConfirm(null)} className={`flex-1 py-2.5 rounded-xl font-semibold border transition-all ${dm?"border-gray-600 text-gray-300 hover:bg-gray-700":"border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                      {t("إلغاء","Cancel")}
                    </button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
