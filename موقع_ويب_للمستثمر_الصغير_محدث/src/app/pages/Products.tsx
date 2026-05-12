import { useState, useEffect } from "react";
import { Search, TrendingUp, TrendingDown, DollarSign, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useSettings } from "../contexts/SettingsContext";

interface Product {
  id: string; name: string; symbol: string; type: string; category: string;
  price: number; change: number; changePercent: number; description: string;
  riskLevel: string; minInvestment: number;
}

const SAMPLE_PRODUCTS: Product[] = [
  { id:"aramco", name:"شركة أرامكو السعودية", symbol:"ARAMCO", type:"سهم", category:"طاقة", price:35.5, change:0.8, changePercent:2.3, description:"الشركة الوطنية السعودية للبترول والغاز الطبيعي", riskLevel:"منخفض", minInvestment:100 },
  { id:"rajhi",  name:"مصرف الراجحي",          symbol:"RJHI",   type:"سهم", category:"بنوك", price:85.2, change:-1.2, changePercent:-1.4, description:"مصرف الراجحي للخدمات المالية الإسلامية", riskLevel:"منخفض", minInvestment:100 },
  { id:"sabic",  name:"سابك",                  symbol:"SABIC",  type:"سهم", category:"صناعة", price:92.7, change:2.1, changePercent:2.3, description:"الشركة السعودية للصناعات الأساسية", riskLevel:"متوسط", minInvestment:100 },
  { id:"stc",    name:"الاتصالات السعودية",    symbol:"STC",    type:"سهم", category:"اتصالات", price:45.8, change:0.5, changePercent:1.1, description:"شركة الاتصالات السعودية", riskLevel:"منخفض", minInvestment:100 },
  { id:"fund-1", name:"صندوق الأسهم السعودية", symbol:"FUND1",  type:"صندوق استثماري", category:"صناديق", price:125.0, change:1.5, changePercent:1.2, description:"صندوق استثماري متنوع في السوق السعودي", riskLevel:"متوسط", minInvestment:500 },
  { id:"fund-2", name:"صندوق الدخل الثابت",   symbol:"FUND2",  type:"صندوق استثماري", category:"صناديق", price:110.5, change:0.3, changePercent:0.3, description:"صندوق يستثمر في أدوات الدخل الثابت", riskLevel:"منخفض", minInvestment:1000 },
];

export function Products() {
  const { language, darkMode } = useSettings();
  const t = (ar: string, en: string) => language === "ar" ? ar : en;

  const dm   = darkMode;
  const txt  = dm ? "text-gray-100" : "text-gray-900";
  const sub  = dm ? "text-gray-400" : "text-gray-600";
  const card = dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-100";
  const inputCls = dm
    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500 rounded-xl w-full px-4 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
    : "bg-slate-50 border-slate-200 text-gray-900 rounded-xl w-full px-4 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors";

  const [products, setProducts]               = useState<Product[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [searchQuery, setSearchQuery]         = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode]               = useState<"grid"|"list">("grid");

  useEffect(() => {
    setProducts(SAMPLE_PRODUCTS);
    setLoading(false);
  }, []);

  const categories = [
    { key:"all",   label:t("الكل","All") },
    { key:"stock", label:t("أسهم","Stocks") },
    { key:"fund",  label:t("صناديق استثمارية","Funds") },
  ];

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "all" ||
      (selectedCategory === "stock" && p.type === "سهم") ||
      (selectedCategory === "fund"  && p.type === "صندوق استثماري");
    return matchSearch && matchCat;
  });

  const riskColor = (risk: string) => {
    if (risk === "منخفض" || risk === "Low")    return dm ? "bg-green-900/40 text-green-400 border-green-700"  : "bg-green-100 text-green-800 border-green-200";
    if (risk === "متوسط" || risk === "Medium") return dm ? "bg-yellow-900/40 text-yellow-400 border-yellow-700" : "bg-yellow-100 text-yellow-800 border-yellow-200";
    return dm ? "bg-red-900/40 text-red-400 border-red-700" : "bg-red-100 text-red-800 border-red-200";
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${dm?"bg-gray-950":""}`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className={`text-sm ${sub}`}>{t("جاري تحميل المنتجات...","Loading products...")}</p>
      </div>
    </div>
  );

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"} className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${txt}`}>{t("المنتجات المالية","Financial Products")}</h1>
          <p className={sub}>{t("تصفح واستثمر في مجموعة متنوعة من المنتجات المالية","Browse and invest in a variety of financial products")}</p>
        </div>

        {/* Search & Filters */}
        <div className={`rounded-2xl border shadow-sm p-5 mb-8 ${card}`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 ${language==="ar"?"right-3":"left-3"} ${sub}`} />
              <input
                type="text"
                placeholder={t("ابحث عن منتج مالي...","Search financial products...")}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={inputCls + (language==="ar" ? " pr-10" : " pl-10")}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button key={cat.key} onClick={() => setSelectedCategory(cat.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    selectedCategory === cat.key
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : dm ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600" : "bg-slate-50 text-gray-600 border-slate-200 hover:bg-slate-100"
                  }`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* View toggle */}
        <div className={`flex gap-1 p-1 rounded-xl w-fit mb-6 ${dm?"bg-gray-800":"bg-gray-100"}`}>
          {([["grid", t("شبكة","Grid")], ["list", t("قائمة","List")]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setViewMode(key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${viewMode===key ? "bg-emerald-600 text-white shadow-sm" : dm?"text-gray-400 hover:text-gray-200":"text-gray-600 hover:text-gray-900"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filteredProducts.length === 0 && (
          <div className={`rounded-2xl border p-12 text-center ${card}`}>
            <p className={sub}>{t("لا توجد منتجات تطابق بحثك","No products match your search")}</p>
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => (
              <motion.div key={product.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, delay:index*0.05 }}>
                <div className={`h-full rounded-2xl border shadow-sm hover:shadow-md transition-shadow flex flex-col ${card}`}>
                  <div className="p-5 border-b border-inherit">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className={`text-lg font-bold mb-0.5 ${txt}`}>{product.name}</h3>
                        <p className={`text-sm ${sub}`}>{product.symbol}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${dm?"bg-gray-700 text-gray-300 border-gray-600":"bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {product.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${riskColor(product.riskLevel)}`}>{product.riskLevel}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${dm?"border-gray-600 text-gray-400":"border-slate-200 text-slate-500"}`}>{product.category}</span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className={`text-3xl font-bold ${txt}`}>{product.price.toFixed(2)}</span>
                        <span className={sub}>{t("ر.س","SAR")}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${product.change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {product.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{product.change >= 0 ? "+" : ""}{product.change} ({product.changePercent >= 0 ? "+" : ""}{product.changePercent}%)</span>
                      </div>
                    </div>
                    <p className={`text-sm mb-4 line-clamp-2 flex-1 ${sub}`}>{product.description}</p>
                    <div className={`flex items-center justify-between text-sm mb-4 ${sub}`}>
                      <span>{t("الحد الأدنى:","Min:")}</span>
                      <span className={`font-medium ${txt}`}>{product.minInvestment} {t("ر.س","SAR")}</span>
                    </div>
                    <button className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm">
                      <DollarSign className="w-4 h-4" />
                      {t("استثمر الآن","Invest Now")}
                    </button>
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
              <motion.div key={product.id} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.3, delay:index*0.05 }}>
                <div className={`rounded-2xl border shadow-sm hover:shadow-md transition-shadow p-5 ${card}`}>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`text-lg font-bold ${txt}`}>{product.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${dm?"bg-gray-700 text-gray-400":"bg-slate-100 text-slate-500"}`}>{product.symbol}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${riskColor(product.riskLevel)}`}>{product.riskLevel}</span>
                      </div>
                      <p className={`text-sm mb-2 ${sub}`}>{product.description}</p>
                      <div className={`flex items-center gap-3 text-xs ${sub}`}>
                        <span>{product.type}</span>
                        <span>•</span>
                        <span>{product.category}</span>
                        <span>•</span>
                        <span>{t("الحد الأدنى:","Min:")} {product.minInvestment} {t("ر.س","SAR")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div>
                        <p className={`text-2xl font-bold ${txt}`}>{product.price.toFixed(2)} {t("ر.س","SAR")}</p>
                        <div className={`flex items-center gap-1 text-sm ${product.change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {product.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span>{product.change >= 0 ? "+" : ""}{product.change} ({product.changePercent >= 0 ? "+" : ""}{product.changePercent}%)</span>
                        </div>
                      </div>
                      <button className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-sm">
                        <DollarSign className="w-4 h-4" />
                        {t("استثمر","Invest")}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Note */}
        <div className={`mt-8 rounded-2xl border p-5 flex gap-4 ${dm ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-200"}`}>
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={`font-bold mb-1 ${dm?"text-blue-300":"text-blue-900"}`}>{t("ملاحظة تعليمية","Educational Note")}</h3>
            <p className={`text-sm ${dm?"text-blue-400":"text-blue-800"}`}>
              {t(
                "هذه المنتجات المالية هي للأغراض التعليمية فقط. جميع الأسعار والبيانات افتراضية ولا تمثل السوق الحقيقي. استخدم هذه المنصة لتعلم أساسيات الاستثمار قبل الانتقال إلى الاستثمار الحقيقي.",
                "These financial products are for educational purposes only. All prices and data are simulated and do not represent the real market. Use this platform to learn investment basics before moving to real investing."
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
