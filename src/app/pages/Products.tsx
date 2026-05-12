import { useState, useEffect } from "react";
import { Search, TrendingUp, TrendingDown, Info, LayoutGrid, List } from "lucide-react";
import { motion } from "motion/react";
import { useSettings } from "../contexts/SettingsContext";
import { PYTHON_API } from "../lib/api";

interface Product {
  id: string; name: string; ticker: string; symbol: string; type: string; category: string;
  price: number; change: number; changePercent: number; description: string;
  riskLevel: string;
}

const BASE_PRODUCTS: Omit<Product, "price"|"change"|"changePercent">[] = [
  { id:"2222", name:"أرامكو السعودية",                  ticker:"2222.SR", symbol:"2222.SR", type:"سهم", category:"طاقة",           description:"الشركة الوطنية السعودية للبترول والغاز الطبيعي، أكبر شركة نفط في العالم",                    riskLevel:"منخفض" },
  { id:"1120", name:"مصرف الراجحي",                     ticker:"1120.SR", symbol:"1120.SR", type:"سهم", category:"بنوك",           description:"أكبر مصرف إسلامي في العالم من حيث الأصول",                                                  riskLevel:"منخفض" },
  { id:"2010", name:"سابك",                             ticker:"2010.SR", symbol:"2010.SR", type:"سهم", category:"بتروكيماويات",   description:"الشركة السعودية للصناعات الأساسية، من أكبر شركات البتروكيماويات عالميا",                     riskLevel:"متوسط" },
  { id:"7010", name:"الاتصالات السعودية",               ticker:"7010.SR", symbol:"7010.SR", type:"سهم", category:"اتصالات",        description:"شركة الاتصالات السعودية، الرائدة في قطاع الاتصالات بالمملكة",                                 riskLevel:"منخفض" },
  { id:"1180", name:"بنك البلاد",                       ticker:"1180.SR", symbol:"1180.SR", type:"سهم", category:"بنوك",           description:"بنك إسلامي سعودي يقدم خدمات مصرفية شاملة للأفراد والشركات",                                 riskLevel:"منخفض" },
  { id:"1150", name:"مصرف الإنماء",                     ticker:"1150.SR", symbol:"1150.SR", type:"سهم", category:"بنوك",           description:"مصرف إسلامي سعودي متخصص في تمويل القطاعين العام والخاص",                                   riskLevel:"منخفض" },
  { id:"1010", name:"بنك الرياض",                       ticker:"1010.SR", symbol:"1010.SR", type:"سهم", category:"بنوك",           description:"أحد أقدم البنوك السعودية، يقدم خدمات مصرفية متكاملة",                                       riskLevel:"منخفض" },
  { id:"1211", name:"معادن",                            ticker:"1211.SR", symbol:"1211.SR", type:"سهم", category:"تعدين",          description:"الشركة السعودية للصناعات المعدنية، رائدة في التعدين والمعادن بالمنطقة",                      riskLevel:"متوسط" },
  { id:"2290", name:"ينساب",                            ticker:"2290.SR", symbol:"2290.SR", type:"سهم", category:"بتروكيماويات",   description:"شركة ينبع الوطنية للبتروكيماويات، تنتج الإيثيلين والبولي إيثيلين",                           riskLevel:"متوسط" },
  { id:"2060", name:"التصنيع (تاسنيه)",                 ticker:"2060.SR", symbol:"2060.SR", type:"سهم", category:"بتروكيماويات",   description:"الشركة الوطنية للتصنيع، متخصصة في البتروكيماويات والمعادن",                                  riskLevel:"متوسط" },
  { id:"6010", name:"سافكو",                            ticker:"6010.SR", symbol:"6010.SR", type:"سهم", category:"بتروكيماويات",   description:"الشركة السعودية للأسمدة، من أكبر منتجي اليوريا والأسمدة في العالم",                         riskLevel:"متوسط" },
  { id:"1020", name:"بنك الجزيرة",                      ticker:"1020.SR", symbol:"1020.SR", type:"سهم", category:"بنوك",           description:"مصرف إسلامي سعودي يقدم خدمات مصرفية للأفراد والمؤسسات",                                   riskLevel:"منخفض" },
  { id:"7020", name:"موبايلي",                          ticker:"7020.SR", symbol:"7020.SR", type:"سهم", category:"اتصالات",        description:"شركة اتحاد اتصالات (موبايلي)، ثاني أكبر مشغل اتصالات في المملكة",                         riskLevel:"منخفض" },
  { id:"4190", name:"جرير للتسويق",                     ticker:"4190.SR", symbol:"4190.SR", type:"سهم", category:"تجزئة",          description:"أكبر سلسلة متاجر إلكترونيات وكتب في المملكة العربية السعودية",                               riskLevel:"منخفض" },
  { id:"2082", name:"أكوا باور",                        ticker:"2082.SR", symbol:"2082.SR", type:"سهم", category:"طاقة متجددة",    description:"شركة عالمية رائدة في تطوير محطات الطاقة المتجددة وتحلية المياه، ركيزة رؤية 2030",           riskLevel:"متوسط" },
  { id:"4030", name:"الشركة الوطنية للشحن (بحري)",      ticker:"4030.SR", symbol:"4030.SR", type:"سهم", category:"نقل بحري",       description:"أكبر شركة ناقلات نفط في المملكة، تمتلك أسطولاً من الناقلات والسفن التجارية",               riskLevel:"متوسط" },
  { id:"4009", name:"الشرق الأوسط للرعاية الصحية",     ticker:"4009.SR", symbol:"4009.SR", type:"سهم", category:"رعاية صحية",     description:"مجموعة مستشفيات ومراكز طبية رائدة في المنطقة، تدعم منظومة الصحة ضمن رؤية 2030",          riskLevel:"منخفض" },
  { id:"4264", name:"طيران ناس",                        ticker:"4264.SR", symbol:"4264.SR", type:"سهم", category:"طيران",          description:"شركة طيران اقتصادي سعودية تدعم قطاع السياحة والنقل الجوي ضمن رؤية 2030",                  riskLevel:"مرتفع" },
];

export function Products() {
  const { language, darkMode } = useSettings();
  const t = (ar: string, en: string) => language === "ar" ? ar : en;

  const dm = darkMode;

  /* ── Glass tokens ── */
  const glass = dm
    ? "bg-white/[0.04] border-white/[0.08] backdrop-blur-xl"
    : "bg-white/70 border-white/60 backdrop-blur-xl shadow-lg";

  const glassInner = dm
    ? "bg-white/[0.04] border-white/[0.06]"
    : "bg-white/50 border-white/40";

  const txt  = dm ? "text-gray-100" : "text-gray-900";
  const sub  = dm ? "text-gray-400" : "text-gray-500";
  const inputCls = dm
    ? "bg-white/[0.06] border-white/[0.08] text-gray-100 placeholder:text-gray-500 focus:ring-[#2878C8]/50"
    : "bg-white/80 border-gray-200/60 focus:ring-[#2878C8]/30";

  const [products, setProducts]                 = useState<Product[]>(BASE_PRODUCTS.map(p => ({ ...p, price:0, change:0, changePercent:0 })));
  const [pricesLoading, setPricesLoading]       = useState(true);
  const [searchQuery, setSearchQuery]           = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode]                 = useState<"grid"|"list">("grid");

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(`${PYTHON_API}/prices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tickers: BASE_PRODUCTS.map(p => p.ticker) }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setProducts(BASE_PRODUCTS.map(p => ({
          ...p,
          price:         data[p.ticker]?.price         ?? 0,
          change:        data[p.ticker]?.change        ?? 0,
          changePercent: data[p.ticker]?.changePercent ?? 0,
        })));
      } catch {}
      finally { setPricesLoading(false); }
    };
    fetchPrices();
  }, []);

  const CATEGORIES = [
    { key:"all",            label:t("الكل","All") },
    { key:"بنوك",           label:t("بنوك","Banks") },
    { key:"طاقة",           label:t("طاقة","Energy") },
    { key:"طاقة متجددة",   label:t("طاقة متجددة","Renewable") },
    { key:"بتروكيماويات",   label:t("بتروكيماويات","Petrochem") },
    { key:"اتصالات",        label:t("اتصالات","Telecom") },
    { key:"تعدين",          label:t("تعدين","Mining") },
    { key:"تجزئة",          label:t("تجزئة","Retail") },
    { key:"رعاية صحية",    label:t("رعاية صحية","Healthcare") },
    { key:"نقل بحري",       label:t("نقل بحري","Shipping") },
    { key:"طيران",          label:t("طيران","Aviation") },
  ];

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "all" || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const riskColor = (risk: string) => {
    if (risk === "منخفض") return dm ? "bg-[#1A8A5A]/15 text-[#2ECC71] border-[#1A8A5A]/20"   : "bg-[#1A8A5A]/5 text-[#1A8A5A] border-[#1A8A5A]/20";
    if (risk === "متوسط") return dm ? "bg-[#E8A830]/15 text-[#F5C542] border-[#E8A830]/20" : "bg-[#E8A830]/5 text-[#E8A830] border-[#E8A830]/20";
    return dm ? "bg-red-500/15 text-red-400 border-red-500/20" : "bg-red-50 text-red-600 border-red-200";
  };

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"} className="min-h-screen py-8 px-4 transition-colors relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -right-32 w-96 h-96 bg-[#5B3D8F]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -left-32 w-80 h-80 bg-[#2878C8]/6 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-[#E8A830]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-8">
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`text-3xl font-bold mb-2 ${txt}`}>{t("المنتجات المالية","Financial Products")}</motion.h1>
          <p className={sub}>{t("تصفح الأسهم السعودية مع أسعار حية من السوق","Browse Saudi stocks with live market prices")}</p>
        </div>

        {/* Search & Filters */}
        <div className={`rounded-2xl border p-5 mb-8 ${glass}`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 ${language === "ar" ? "right-3" : "left-3"} ${sub}`} />
              <input type="text" placeholder={t("ابحث عن سهم...","Search stocks...")}
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className={`rounded-xl w-full px-4 py-2.5 text-sm border outline-none focus:ring-2 transition-all ${inputCls} ${language === "ar" ? "pr-10" : "pl-10"}`} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <button key={cat.key} onClick={() => setSelectedCategory(cat.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    selectedCategory === cat.key
                      ? "text-white border-[#2878C8] shadow-sm"
                      : dm ? "bg-white/[0.04] text-gray-400 border-white/[0.08] hover:border-[#2878C8]/40 hover:text-[#5DADE2]" : "bg-white/50 text-gray-600 border-gray-200/60 hover:border-[#2878C8]/40 hover:text-[#2878C8]"
                  }`}
                  style={selectedCategory === cat.key ? { background: "linear-gradient(135deg, #1B5FA0, #2878C8)" } : undefined}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* View toggle */}
        <div className={`flex gap-1 p-1 rounded-xl w-fit mb-6 ${dm ? "bg-white/[0.04] border border-white/[0.06]" : "bg-white/50 border border-white/40"}`}>
          {([["grid", t("شبكة","Grid"), LayoutGrid], ["list", t("قائمة","List"), List]] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setViewMode(key as "grid"|"list")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === key
                  ? "text-white shadow-sm"
                  : dm ? "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]" : "text-gray-600 hover:text-gray-900 hover:bg-white/40"
              }`}
              style={viewMode === key ? { background: "linear-gradient(135deg, #1B5FA0, #2878C8)" } : undefined}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className={`rounded-2xl border p-12 text-center ${glass}`}>
            <p className={sub}>{t("لا توجد منتجات تطابق بحثك","No products match your search")}</p>
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => (
              <motion.div key={product.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, delay:index * 0.05 }}>
                <div className={`h-full rounded-2xl border hover:scale-[1.02] transition-all duration-300 flex flex-col ${glass}`}>
                  <div className="p-5 border-b border-inherit">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className={`text-lg font-bold mb-0.5 ${txt}`}>{product.name}</h3>
                        <p className={`text-sm ${sub}`}>{product.symbol}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${dm ? "bg-white/[0.06] text-gray-300 border-white/[0.08]" : "bg-white/60 text-gray-600 border-white/40"}`}>
                        {product.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${riskColor(product.riskLevel)}`}>{product.riskLevel}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${dm ? "border-white/[0.06] text-gray-400" : "border-white/40 text-gray-500"}`}>{product.category}</span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2 mb-1">
                        {pricesLoading
                          ? <span className={`text-sm ${sub}`}>...</span>
                          : <><span className={`text-3xl font-bold ${txt}`}>{product.price.toFixed(2)}</span><span className={sub}>{t("ر.س","SAR")}</span></>
                        }
                      </div>
                      {!pricesLoading && (
                        <div className={`flex items-center gap-1 text-sm ${product.change >= 0 ? "text-[#1A8A5A]" : "text-red-400"}`}>
                          {product.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span>{product.change >= 0 ? "+" : ""}{product.change} ({product.changePercent >= 0 ? "+" : ""}{product.changePercent}%)</span>
                        </div>
                      )}
                    </div>
                    <p className={`text-sm mb-4 line-clamp-2 flex-1 ${sub}`}>{product.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && filteredProducts.length > 0 && (
          <div className="space-y-4">
            {filteredProducts.map((product, index) => (
              <motion.div key={product.id} initial={{ opacity:0, x: language === "ar" ? 20 : -20 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.3, delay:index * 0.05 }}>
                <div className={`rounded-2xl border hover:scale-[1.01] transition-all duration-300 p-5 ${glass}`}>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`text-lg font-bold ${txt}`}>{product.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${dm ? "bg-white/[0.06] text-gray-400" : "bg-white/60 text-gray-500"}`}>{product.symbol}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${riskColor(product.riskLevel)}`}>{product.riskLevel}</span>
                      </div>
                      <p className={`text-sm mb-2 ${sub}`}>{product.description}</p>
                      <div className={`flex items-center gap-3 text-xs ${sub}`}>
                        <span>{product.type}</span><span>·</span>
                        <span>{product.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div>
                        {pricesLoading
                          ? <p className={`text-sm ${sub}`}>...</p>
                          : <>
                              <p className={`text-2xl font-bold ${txt}`}>{product.price.toFixed(2)} {t("ر.س","SAR")}</p>
                              <div className={`flex items-center gap-1 text-sm ${product.change >= 0 ? "text-[#1A8A5A]" : "text-red-400"}`}>
                                {product.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                <span>{product.change >= 0 ? "+" : ""}{product.change} ({product.changePercent >= 0 ? "+" : ""}{product.changePercent}%)</span>
                              </div>
                            </>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Note */}
        <div className={`mt-8 rounded-2xl border p-5 flex gap-4 ${dm ? "bg-[#2878C8]/10 border-[#2878C8]/20" : "bg-[#2878C8]/5 border-[#2878C8]/20"}`}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #1B5FA0, #2878C8)" }}>
            <Info className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={`font-bold mb-1 ${txt}`}>{t("ملاحظة تعليمية","Educational Note")}</h3>
            <p className={`text-sm ${sub}`}>
              {t(
                "الأسعار المعروضة حية من Yahoo Finance وتمثل آخر سعر إغلاق في السوق السعودي. هذه المنصة للأغراض التعليمية فقط.",
                "Prices are live from Yahoo Finance representing the latest Saudi market closing price. This platform is for educational purposes only."
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
