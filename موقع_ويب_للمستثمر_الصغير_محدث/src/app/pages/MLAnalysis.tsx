import { useState, useEffect } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Brain, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import { useSettings } from "../contexts/SettingsContext";
import mlData from "../../data/ml_predictions.json";

// ─── أنواع ──────────────────────────────────────────────────
interface AlgoMetrics { rmse: number; mae: number; r2: number; mape: number; }
interface Algorithm {
  name: string; name_en: string;
  metrics: AlgoMetrics;
  predictions_test: number[];
  actuals_test: number[];
  future_predictions: number[];
  feature_importance?: Record<string, number>;
}
interface StockData {
  symbol: string; name: string; name_en: string; ticker: string;
  current_price: number; price_change: number; change_percent: number;
  last_updated: string;
  history_chart: { date: string; price: number }[];
  algorithms: { linear_regression: Algorithm; random_forest: Algorithm; lstm: Algorithm };
  best_algorithm: string;
  best_algorithm_name: string;
  best_algorithm_name_en: string;
  best_future_predictions: number[];
  recommendation: { signal: string; signal_en: string; reason: string };
}

const ALGO_KEYS: { key: keyof StockData["algorithms"]; color: string; short: string }[] = [
  { key: "linear_regression", color: "#6366f1", short: "LR" },
  { key: "random_forest",     color: "#f59e0b", short: "RF" },
  { key: "lstm",              color: "#10b981", short: "LSTM" },
];

const SIGNAL_STYLE = {
  شراء:    "bg-emerald-100 text-emerald-800 border-emerald-300",
  بيع:     "bg-red-100 text-red-800 border-red-300",
  احتفاظ:  "bg-yellow-100 text-yellow-800 border-yellow-300",
};
const SIGNAL_STYLE_DARK = {
  شراء:    "bg-emerald-900/40 text-emerald-300 border-emerald-700",
  بيع:     "bg-red-900/40 text-red-300 border-red-700",
  احتفاظ:  "bg-yellow-900/40 text-yellow-300 border-yellow-700",
};

export function MLAnalysis() {
  const { darkMode, language } = useSettings();
  const t = (ar: string, en: string) => language === "ar" ? ar : en;
  const dm   = darkMode;
  const txt  = dm ? "text-gray-100" : "text-gray-900";
  const sub  = dm ? "text-gray-400" : "text-gray-500";
  const card = dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-100";
  const tooltipStyle = dm
    ? { background: "#1f2937", border: "1px solid #374151", color: "#f3f4f6" }
    : {};

  const stocks = mlData.stocks as Record<string, StockData>;
  const symbols = Object.keys(stocks);

  const [selected, setSelected]     = useState<string>(symbols[0]);
  const [activeTab, setActiveTab]   = useState<"compare" | "history" | "future">("compare");
  const [expanded, setExpanded]     = useState<string | null>(null);

  const stock = stocks[selected];

  // بناء بيانات مقارنة الاختبار
  const testChartData = stock.algorithms.linear_regression.actuals_test.map((val, i) => ({
    idx: i + 1,
    actual:           val,
    linear_regression: stock.algorithms.linear_regression.predictions_test[i],
    random_forest:     stock.algorithms.random_forest.predictions_test[i],
    lstm:              stock.algorithms.lstm.predictions_test[i],
  }));

  // بيانات التنبؤ المستقبلي
  const today = new Date();
  const futureDays = ["اليوم+1","اليوم+2","اليوم+3","اليوم+4","اليوم+5","اليوم+6","اليوم+7"];
  const futureChartData = stock.best_future_predictions.map((val, i) => ({
    day: futureDays[i],
    price: val,
    lr:   stock.algorithms.linear_regression.future_predictions[i],
    rf:   stock.algorithms.random_forest.future_predictions[i],
    lstm: stock.algorithms.lstm.future_predictions[i],
  }));

  // بيانات مقارنة المقاييس (رسم شريطي)
  const metricsBarData = [
    { metric: "R²",  lr: stock.algorithms.linear_regression.metrics.r2,   rf: stock.algorithms.random_forest.metrics.r2,   lstm: stock.algorithms.lstm.metrics.r2 },
  ];
  const rmseBarData = [
    { metric: "RMSE", lr: stock.algorithms.linear_regression.metrics.rmse, rf: stock.algorithms.random_forest.metrics.rmse, lstm: stock.algorithms.lstm.metrics.rmse },
    { metric: "MAE",  lr: stock.algorithms.linear_regression.metrics.mae,  rf: stock.algorithms.random_forest.metrics.mae,  lstm: stock.algorithms.lstm.metrics.mae  },
  ];

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"} className={`min-h-screen py-8 px-4 transition-colors ${dm ? "bg-gray-950" : ""}`}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${txt}`}>
                {t("تحليل الذكاء الاصطناعي","AI Stock Analysis")}
              </h1>
              <p className={`text-sm ${sub}`}>
                {t("بيانات حقيقية من Yahoo Finance + مقارنة 3 خوارزميات","Real data from Yahoo Finance + 3-algorithm comparison")}
              </p>
            </div>
          </div>
          <div className={`mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-xl w-fit border ${dm ? "bg-violet-900/20 border-violet-700 text-violet-300" : "bg-violet-50 border-violet-200 text-violet-700"}`}>
            <ExternalLink className="w-3.5 h-3.5" />
            {t(`مصدر البيانات: Yahoo Finance  •  آخر تحديث: ${mlData.generated_at}`,
               `Data source: Yahoo Finance  •  Last updated: ${mlData.generated_at}`)}
          </div>
        </div>

        {/* اختيار السهم */}
        <div className={`flex gap-2 flex-wrap p-1 rounded-2xl mb-6 w-fit ${dm ? "bg-gray-800" : "bg-gray-100"}`}>
          {symbols.map(sym => (
            <button key={sym} onClick={() => setSelected(sym)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selected === sym
                  ? "bg-violet-600 text-white shadow"
                  : dm ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900"
              }`}>
              {sym}
            </button>
          ))}
        </div>

        {/* بطاقة السهم الحالي */}
        <motion.div key={selected} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-5 mb-6 ${card}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className={`text-2xl font-bold ${txt}`}>{stock.name}</h2>
              <p className={`text-sm ${sub}`}>{stock.ticker} · Yahoo Finance</p>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <p className={`text-4xl font-bold ${txt}`}>{stock.current_price.toFixed(2)}</p>
                <p className={`text-sm ${sub}`}>{t("ر.س","SAR")}</p>
              </div>
              <div className={`text-lg font-semibold ${stock.price_change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {stock.price_change >= 0 ? <TrendingUp className="w-5 h-5 inline me-1" /> : <TrendingDown className="w-5 h-5 inline me-1" />}
                {stock.price_change >= 0 ? "+" : ""}{stock.price_change} ({stock.change_percent}%)
              </div>
              <div className={`px-4 py-2 rounded-xl border text-sm font-bold ${dm ? SIGNAL_STYLE_DARK[stock.recommendation.signal as keyof typeof SIGNAL_STYLE_DARK] || "" : SIGNAL_STYLE[stock.recommendation.signal as keyof typeof SIGNAL_STYLE] || ""}`}>
                {t(stock.recommendation.signal, stock.recommendation.signal_en)}
              </div>
            </div>
          </div>
          <p className={`mt-3 text-sm ${sub}`}>{stock.recommendation.reason}</p>
        </motion.div>

        {/* Tabs */}
        <div className={`flex gap-1 p-1 rounded-2xl mb-6 w-fit ${dm ? "bg-gray-800" : "bg-gray-100"}`}>
          {([
            ["compare", t("مقارنة الخوارزميات","Algorithm Comparison")],
            ["history", t("السعر التاريخي","Price History")],
            ["future",  t("التنبؤ المستقبلي","Future Forecast")],
          ] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === key ? "bg-violet-600 text-white shadow" : dm ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ═══ تاب 1: مقارنة الخوارزميات ═══ */}
        {activeTab === "compare" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

            {/* جدول المقاييس */}
            <div className={`rounded-2xl border overflow-hidden ${card}`}>
              <div className="p-5 border-b border-inherit">
                <h3 className={`font-bold text-lg ${txt}`}>{t("مقارنة مقاييس الأداء","Performance Metrics Comparison")}</h3>
                <p className={`text-xs mt-1 ${sub}`}>{t("R² أقرب لـ 1 = أفضل · RMSE/MAE/MAPE أقل = أدق","R² closer to 1 = better · Lower RMSE/MAE/MAPE = more accurate")}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={dm ? "bg-gray-700/50" : "bg-gray-50"}>
                      <th className={`px-5 py-3 text-start font-semibold ${sub}`}>{t("الخوارزمية","Algorithm")}</th>
                      <th className={`px-5 py-3 text-center font-semibold ${sub}`}>R²</th>
                      <th className={`px-5 py-3 text-center font-semibold ${sub}`}>RMSE</th>
                      <th className={`px-5 py-3 text-center font-semibold ${sub}`}>MAE</th>
                      <th className={`px-5 py-3 text-center font-semibold ${sub}`}>MAPE %</th>
                      <th className={`px-5 py-3 text-center font-semibold ${sub}`}>{t("الحكم","Verdict")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ALGO_KEYS.map(({ key, color }) => {
                      const algo = stock.algorithms[key];
                      const isBest = stock.best_algorithm === key ||
                        (stock.best_algorithm === "lr" && key === "linear_regression") ||
                        (stock.best_algorithm === "rf" && key === "random_forest");
                      return (
                        <tr key={key} className={`border-t ${dm ? "border-gray-700" : "border-gray-100"} ${isBest ? dm ? "bg-violet-900/20" : "bg-violet-50" : ""}`}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                              <span className={`font-medium ${txt}`}>{algo.name}</span>
                              {isBest && <span className="text-xs px-2 py-0.5 rounded-full bg-violet-600 text-white">★ {t("الأفضل","Best")}</span>}
                            </div>
                          </td>
                          <td className={`px-5 py-3 text-center font-bold ${algo.metrics.r2 >= 0.9 ? "text-emerald-500" : algo.metrics.r2 >= 0.8 ? "text-yellow-500" : "text-red-400"}`}>
                            {algo.metrics.r2.toFixed(3)}
                          </td>
                          <td className={`px-5 py-3 text-center ${txt}`}>{algo.metrics.rmse.toFixed(3)}</td>
                          <td className={`px-5 py-3 text-center ${txt}`}>{algo.metrics.mae.toFixed(3)}</td>
                          <td className={`px-5 py-3 text-center ${txt}`}>{algo.metrics.mape.toFixed(2)}%</td>
                          <td className="px-5 py-3 text-center">
                            {isBest
                              ? <span className="text-emerald-500 font-bold">✓ {t("الأفضل","Best")}</span>
                              : <span className={sub}>–</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* رسم R² */}
            <div className={`rounded-2xl border p-5 ${card}`}>
              <h3 className={`font-semibold mb-4 ${txt}`}>{t("مقارنة R² (كلما اقترب من 1 كان أفضل)","R² Comparison (closer to 1 = better)")}</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{
                    name: "R²",
                    "الانحدار الخطي":  stock.algorithms.linear_regression.metrics.r2,
                    "الغابة العشوائية": stock.algorithms.random_forest.metrics.r2,
                    "LSTM":            stock.algorithms.lstm.metrics.r2,
                  }]} barSize={48}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dm ? "#374151" : "#e5e7eb"} />
                    <XAxis dataKey="name" tick={{ fill: dm ? "#9ca3af" : "#6b7280", fontSize: 12 }} />
                    <YAxis domain={[0.6, 1]} tick={{ fill: dm ? "#9ca3af" : "#6b7280", fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => v.toFixed(3)} />
                    <Legend />
                    <Bar dataKey="الانحدار الخطي"  fill="#6366f1" radius={[6,6,0,0]} />
                    <Bar dataKey="الغابة العشوائية" fill="#f59e0b" radius={[6,6,0,0]} />
                    <Bar dataKey="LSTM"             fill="#10b981" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* رسم مقارنة التنبؤات vs الحقيقي */}
            <div className={`rounded-2xl border p-5 ${card}`}>
              <h3 className={`font-semibold mb-1 ${txt}`}>{t("التنبؤات مقابل الأسعار الحقيقية (آخر 15 يوم اختبار)","Predictions vs Actual Prices (last 15 test days)")}</h3>
              <p className={`text-xs mb-4 ${sub}`}>{t("كلما اقتربت الخطوط من بعضها كلما كانت الخوارزمية أدق","Closer lines = more accurate algorithm")}</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={testChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dm ? "#374151" : "#e5e7eb"} />
                    <XAxis dataKey="idx" tick={{ fill: dm ? "#9ca3af" : "#6b7280", fontSize: 10 }} />
                    <YAxis tick={{ fill: dm ? "#9ca3af" : "#6b7280", fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Line type="monotone" dataKey="actual"           stroke="#94a3b8" strokeWidth={2} dot={false} name={t("السعر الحقيقي","Actual")} />
                    <Line type="monotone" dataKey="linear_regression" stroke="#6366f1" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name={t("انحدار خطي","Lin. Reg")} />
                    <Line type="monotone" dataKey="random_forest"     stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name={t("غابة عشوائية","Rand. Forest")} />
                    <Line type="monotone" dataKey="lstm"              stroke="#10b981" strokeWidth={2}   dot={false} name="LSTM" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* أهمية المتغيرات (Random Forest) */}
            {stock.algorithms.random_forest.feature_importance && (
              <div className={`rounded-2xl border p-5 ${card}`}>
                <h3 className={`font-semibold mb-4 ${txt}`}>{t("أهمية المتغيرات — الغابة العشوائية","Feature Importance — Random Forest")}</h3>
                <div className="space-y-3">
                  {Object.entries(stock.algorithms.random_forest.feature_importance)
                    .sort((a, b) => b[1] - a[1])
                    .map(([feat, val]) => (
                      <div key={feat} className="flex items-center gap-3">
                        <span className={`text-sm w-20 text-start font-medium ${txt}`}>{feat}</span>
                        <div className={`flex-1 h-3 rounded-full overflow-hidden ${dm ? "bg-gray-700" : "bg-gray-100"}`}>
                          <div className="h-full rounded-full bg-amber-500 transition-all"
                            style={{ width: `${val * 100}%` }} />
                        </div>
                        <span className={`text-xs w-12 text-end ${sub}`}>{(val * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ تاب 2: السعر التاريخي ═══ */}
        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={`rounded-2xl border p-5 ${card}`}>
              <h3 className={`font-semibold mb-1 ${txt}`}>{t(`سعر ${stock.name} — آخر 3 أشهر`,`${stock.name_en} Price — Last 3 Months`)}</h3>
              <p className={`text-xs mb-4 ${sub}`}>{t("بيانات حقيقية من Yahoo Finance","Real data from Yahoo Finance")}</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stock.history_chart}>
                    <defs>
                      <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={dm ? "#374151" : "#e5e7eb"} />
                    <XAxis dataKey="date" tick={{ fill: dm ? "#9ca3af" : "#6b7280", fontSize: 9 }} interval={1} />
                    <YAxis tick={{ fill: dm ? "#9ca3af" : "#6b7280", fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle}
                      formatter={(v: number) => [`${v.toFixed(2)} ${t("ر.س","SAR")}`, t("السعر","Price")]} />
                    <Area type="monotone" dataKey="price" stroke="#8b5cf6" fill="url(#histGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ تاب 3: التنبؤ المستقبلي ═══ */}
        {activeTab === "future" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className={`rounded-2xl border p-5 ${card}`}>
              <h3 className={`font-semibold mb-1 ${txt}`}>{t("التنبؤ بالأسعار — الأيام السبعة القادمة","Price Forecast — Next 7 Days")}</h3>
              <p className={`text-xs mb-4 ${sub}`}>
                {t(`الخوارزمية المُختارة: ${stock.best_algorithm_name}`,`Best algorithm: ${stock.best_algorithm_name_en}`)}
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={futureChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dm ? "#374151" : "#e5e7eb"} />
                    <XAxis dataKey="day" tick={{ fill: dm ? "#9ca3af" : "#6b7280", fontSize: 10 }} />
                    <YAxis tick={{ fill: dm ? "#9ca3af" : "#6b7280", fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Line type="monotone" dataKey="lr"   stroke="#6366f1" strokeWidth={1.5} dot strokeDasharray="4 2" name={t("انحدار خطي","Lin. Reg")} />
                    <Line type="monotone" dataKey="rf"   stroke="#f59e0b" strokeWidth={1.5} dot strokeDasharray="4 2" name={t("غابة عشوائية","Rand. Forest")} />
                    <Line type="monotone" dataKey="lstm" stroke="#10b981" strokeWidth={2.5} dot name="LSTM ★" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* جدول التنبؤات الرقمية */}
            <div className={`rounded-2xl border overflow-hidden ${card}`}>
              <div className="p-5 border-b border-inherit">
                <h3 className={`font-semibold ${txt}`}>{t("قيم التنبؤ (ر.س)","Predicted Values (SAR)")}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={dm ? "bg-gray-700/50" : "bg-gray-50"}>
                      <th className={`px-5 py-3 text-start ${sub}`}>{t("اليوم","Day")}</th>
                      <th className={`px-5 py-3 text-center ${sub}`}>{t("انحدار خطي","Lin. Reg")}</th>
                      <th className={`px-5 py-3 text-center ${sub}`}>{t("غابة عشوائية","Rand. Forest")}</th>
                      <th className={`px-5 py-3 text-center font-bold text-emerald-500`}>LSTM ★</th>
                    </tr>
                  </thead>
                  <tbody>
                    {futureChartData.map((row, i) => (
                      <tr key={i} className={`border-t ${dm ? "border-gray-700" : "border-gray-100"}`}>
                        <td className={`px-5 py-3 font-medium ${txt}`}>{row.day}</td>
                        <td className={`px-5 py-3 text-center ${sub}`}>{row.lr}</td>
                        <td className={`px-5 py-3 text-center ${sub}`}>{row.rf}</td>
                        <td className="px-5 py-3 text-center font-bold text-emerald-500">{row.lstm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 text-sm ${dm ? "bg-amber-900/20 border-amber-700 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
              ⚠️ {t(
                "هذه التنبؤات للأغراض التعليمية فقط.",
                "These forecasts are for educational purposes only. Do not use for real investment decisions."
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
