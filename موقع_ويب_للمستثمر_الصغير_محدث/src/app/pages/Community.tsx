import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Textarea } from "../components/ui/textarea";
import { Heart, MessageCircle, Share2, TrendingUp, Users, Target, Trophy, Send, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";

interface Post {
  id: string; author: string; avatar: string; level: number;
  content: string; likes: number; likedBy: string[]; comments: number;
  timestamp: string; createdAt: string; badge?: string; userId?: string;
}

export function Community() {
  const { darkMode, language } = useSettings();
  const { user: authUser } = useAuth();
  const t = (ar: string, en: string) => language === "ar" ? ar : en;

  const CHALLENGES = [
    { id:"1", title:t("تحدي الـ 30 يوماً","30-Day Challenge"), description:t("سجل مصروفاتك يومياً لمدة 30 يوماً متواصلة","Log expenses daily for 30 consecutive days"), goal:t("30 يوم","30 Days"), participants:234, endDate:t("15 مارس 2026","Mar 15, 2026"), reward:500, icon:Target, gradient:"from-emerald-500 to-teal-600" },
    { id:"2", title:t("مستثمر الشهر","Investor of the Month"),   description:t("حقق أعلى نسبة ربح في محافظ الاستثمار","Achieve highest return in investment portfolios"), goal:t("أعلى ربح","Best Return"), participants:156, endDate:t("28 فبراير 2026","Feb 28, 2026"), reward:1000, icon:TrendingUp, gradient:"from-purple-500 to-pink-600" },
    { id:"3", title:t("مدخر محترف","Pro Saver"),                  description:t("وفر 20% من دخلك الشهري","Save 20% of your monthly income"), goal:t("20% توفير","20% Saved"), participants:189, endDate:t("10 مارس 2026","Mar 10, 2026"), reward:300, icon:Trophy, gradient:"from-blue-500 to-cyan-600" },
  ];

  const dm   = darkMode;
  const card = dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-100";
  const txt  = dm ? "text-gray-100" : "text-gray-900";
  const sub  = dm ? "text-gray-400" : "text-gray-500";
  const textareaCls = dm ? "bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500" : "";
  const rowHov = dm ? "hover:bg-gray-700/50" : "hover:bg-gray-50";

  const [posts, setPosts]               = useState<Post[]>([]);
  const [newPost, setNewPost]           = useState("");
  const [loading, setLoading]           = useState(true);
  const [posting, setPosting]           = useState(false);
  const [activeTab, setActiveTab]       = useState<"feed"|"challenges">("feed");

  const currentUserId = authUser?.id ?? null;

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const mapped: Post[] = (data || []).map((row: any) => ({
        id: row.id,
        author: row.user_name || "مستخدم",
        avatar: (row.user_name || "م").slice(0, 2),
        level: row.user_level || 1,
        content: row.content,
        likes: row.likes || 0,
        likedBy: row.liked_by || [],
        comments: 0,
        timestamp: getRelativeTime(row.created_at),
        createdAt: row.created_at,
        userId: row.user_id,
      }));
      setPosts(mapped.length > 0 ? mapped : getSamples());
    } catch { setPosts(getSamples()); }
    finally { setLoading(false); }
  };

  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("الآن", "Just now");
    if (mins < 60) return t(`منذ ${mins} دقيقة`, `${mins}m ago`);
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t(`منذ ${hrs} ساعة`, `${hrs}h ago`);
    const days = Math.floor(hrs / 24);
    return t(`منذ ${days} يوم`, `${days}d ago`);
  };

  const getSamples = (): Post[] => [
    { id:"sample-1", author:t("أحمد محمد","Ahmed Mohammed"), avatar:t("أم","AM"), level:15, content:t("🎉 نجحت في توفير 5000 ريال خلال 3 أشهر! التخطيط والالتزام هما المفتاح.","🎉 I saved 5000 SAR in 3 months! Planning and commitment are key."), likes:42, likedBy:[], comments:8,  timestamp:t("منذ ساعتين","2h ago"),   createdAt:new Date().toISOString(), badge:t("خبير ادخار","Savings Expert") },
    { id:"sample-2", author:t("سارة عبدالله","Sara Abdullah"), avatar:t("سع","SA"), level:12, content:t("نصيحة للمبتدئين: ابدأوا بتتبع مصروفاتكم لمدة شهر قبل وضع ميزانية 💡","Beginner tip: track expenses for a month before setting a budget 💡"), likes:35, likedBy:[], comments:12, timestamp:t("منذ 4 ساعات","4h ago"),  createdAt:new Date().toISOString(), badge:t("مستثمر ناشر","Active Investor") },
    { id:"sample-3", author:t("خالد علي","Khaled Ali"),       avatar:t("خع","KA"), level:18, content:t("حققت ربحاً 15% من استثماراتي في المحافظ! الآن أشعر بثقة أكبر 📈","Achieved 15% return on my portfolio! Feeling more confident 📈"),   likes:56, likedBy:[], comments:15, timestamp:t("منذ 6 ساعات","6h ago"),  createdAt:new Date().toISOString(), badge:t("محترف استثمار","Investment Pro") },
  ];

  const handlePost = async () => {
    if (!newPost.trim()) return;
    if (!authUser) { toast.error(t("يرجى تسجيل الدخول لنشر منشور","Please login to post")); return; }
    setPosting(true);
    try {
      const userName = authUser.name || "مستخدم";
      const { data: inserted, error } = await supabase.from("community_posts").insert({
        user_id: authUser.id,
        user_name: userName,
        user_level: 1,
        content: newPost,
        likes: 0,
        liked_by: [],
      }).select().single();
      if (error) throw error;
      const post: Post = {
        id: inserted.id,
        author: userName,
        avatar: userName.slice(0, 2),
        level: 1,
        content: inserted.content,
        likes: 0,
        likedBy: [],
        comments: 0,
        timestamp: t("الآن","Just now"),
        createdAt: inserted.created_at,
        userId: authUser.id,
      };
      setPosts(prev => [post, ...prev.filter(p => !p.id.startsWith("sample-"))]);
      setNewPost("");
      toast.success(t("تم نشر منشورك ✓ (+10 نقاط)","Post published ✓ (+10 points)"));
      await addUserPoints(authUser.id, 10);
    } catch { toast.error(t("فشل النشر، حاول مجدداً","Post failed, try again")); }
    finally { setPosting(false); }
  };

  const addUserPoints = async (userId: string, pts: number) => {
    try {
      const { data } = await supabase.from("user_stats").select("points, level").eq("user_id", userId).single();
      if (data) {
        const newPoints = (data.points || 0) + pts;
        const newLevel = Math.floor(newPoints / 200) + 1;
        await supabase.from("user_stats").update({ points: newPoints, level: newLevel, updated_at: new Date().toISOString() }).eq("user_id", userId);
      }
    } catch {}
  };

  const handleLike = async (postId: string) => {
    if (!authUser) { toast.error(t("يرجى تسجيل الدخول","Please login")); return; }
    if (postId.startsWith("sample-")) {
      setPosts(prev => prev.map(p => p.id===postId ? { ...p, likes: p.likes+1 } : p));
      return;
    }
    try {
      const { data: post, error } = await supabase.from("community_posts").select("likes, liked_by").eq("id", postId).single();
      if (error || !post) return;
      const likedBy: string[] = post.liked_by || [];
      const alreadyLiked = likedBy.includes(authUser.id);
      const newLikes = alreadyLiked ? Math.max(0, post.likes - 1) : post.likes + 1;
      const newLikedBy = alreadyLiked ? likedBy.filter(id => id !== authUser.id) : [...likedBy, authUser.id];
      await supabase.from("community_posts").update({ likes: newLikes, liked_by: newLikedBy }).eq("id", postId);
      setPosts(prev => prev.map(p => p.id===postId ? { ...p, likes: newLikes, likedBy: newLikedBy } : p));
    } catch {}
  };

  const formatTime = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1)  return t("الآن","now");
    if (mins < 60) return `${t("منذ","")  } ${mins} ${t("دقيقة","m ago")}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${t("منذ","")} ${hrs} ${t("ساعة","h ago")}`;
    return `${t("منذ","")} ${Math.floor(hrs/24)} ${t("يوم","d ago")}`;
  };

  const statCards = [
    { label:t("الأعضاء النشطون","Active Members"), value:"1,234+", gradient:"from-emerald-500 to-teal-600", icon:<Users className="w-5 h-5 text-white"/> },
    { label:t("المنشورات","Posts"),                value:posts.length.toString(),      gradient:"from-purple-500 to-pink-600", icon:<MessageCircle className="w-5 h-5 text-white"/> },
    { label:t("التحديات النشطة","Active Challenges"),value:CHALLENGES.length.toString(), gradient:"from-blue-500 to-cyan-600",    icon:<Trophy className="w-5 h-5 text-white"/> },
  ];

  return (
    <div className={`min-h-screen py-8 px-4 transition-colors ${dm?"bg-gray-950":""}`}>
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-1 ${txt}`}>{t("المجتمع","Community")}</h1>
          <p className={sub}>{t("شارك تجربتك وتعلم من الآخرين","Share your experience and learn from others")}</p>
        </div>

        {/* إحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {statCards.map((s,i) => (
            <div key={i} className={`bg-gradient-to-br ${s.gradient} rounded-2xl p-5 shadow-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">{s.label}</p>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* تابس */}
        <div className={`flex gap-1 p-1 rounded-2xl mb-6 w-fit ${dm?"bg-gray-800":"bg-gray-100"}`}>
          {([["feed", t("آخر المنشورات","Feed")], ["challenges", t("التحديات","Challenges")]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab===key ? "bg-emerald-600 text-white shadow-sm" : dm?"text-gray-400 hover:text-gray-200":"text-gray-600 hover:text-gray-900"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Feed */}
        {activeTab === "feed" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">

              {/* كتابة منشور */}
              <div className={`rounded-2xl border p-5 ${card}`}>
                <div className="flex gap-4">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-emerald-500 text-white text-sm">أن</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder={t("شارك إنجازاتك أو اطرح سؤالاً... (+10 نقاط)","Share achievements or ask a question... (+10 pts)")}
                      value={newPost} onChange={e => setNewPost(e.target.value)}
                      className={`mb-3 min-h-[80px] resize-none rounded-xl ${textareaCls}`} />
                    <div className="flex items-center justify-between">
                      <p className={`text-xs ${sub}`}>{newPost.length}/500</p>
                      <button onClick={handlePost} disabled={!newPost.trim() || posting}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all">
                        {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {t("نشر","Post")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* المنشورات */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              ) : posts.map((post, i) => (
                <motion.div key={post.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}>
                  <div className={`rounded-2xl border p-5 ${card}`}>
                    <div className="flex gap-4">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                          {post.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className={`font-bold text-sm ${txt}`}>{post.author}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${dm?"bg-gray-700 text-gray-400":"bg-gray-100 text-gray-500"}`}>
                            {t("المستوى","Lv.")} {post.level}
                          </span>
                          {post.badge && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500 text-white">{post.badge}</span>}
                        </div>
                        <p className={`text-xs mb-3 ${sub}`}>{post.createdAt ? formatTime(post.createdAt) : post.timestamp}</p>
                        <p className={`text-sm leading-relaxed mb-4 ${txt}`}>{post.content}</p>
                        <div className="flex items-center gap-5">
                          <button onClick={() => handleLike(post.id)}
                            className={`flex items-center gap-1.5 text-sm transition-colors ${currentUserId && post.likedBy?.includes(currentUserId) ? "text-red-500" : `${sub} hover:text-red-400`}`}>
                            <Heart className={`w-4 h-4 ${currentUserId && post.likedBy?.includes(currentUserId) ? "fill-current" : ""}`} />
                            {post.likes}
                          </button>
                          <button className={`flex items-center gap-1.5 text-sm ${sub} hover:text-blue-400 transition-colors`}>
                            <MessageCircle className="w-4 h-4" />{post.comments}
                          </button>
                          <button className={`flex items-center gap-1.5 text-sm ${sub} hover:text-emerald-400 transition-colors`}>
                            <Share2 className="w-4 h-4" />{t("مشاركة","Share")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* الشريط الجانبي */}
            <div className="space-y-5">
              <div className={`rounded-2xl border ${card}`}>
                <div className="p-4 border-b border-inherit">
                  <h3 className={`font-semibold text-sm ${txt}`}>{t("الأعضاء الأكثر نشاطاً","Most Active Members")}</h3>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { name:t("أحمد محمد","Ahmed Mohammed"), level:15, posts:45 },
                    { name:t("سارة عبدالله","Sara Abdullah"), level:14, posts:38 },
                    { name:t("خالد علي","Khaled Ali"),       level:18, posts:32 },
                    { name:t("نورة سعيد","Noura Said"),      level:11, posts:28 },
                  ].map((u,i) => (
                    <div key={i} className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${rowHov}`}>
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-semibold">
                          {u.name.split(" ").map(n=>n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${txt}`}>{u.name}</p>
                        <p className={`text-xs ${sub}`}>{t("المستوى","Lv.")} {u.level} • {u.posts} {t("منشور","posts")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-200/30 dark:shadow-none">
                <h3 className="font-bold mb-2">💡 {t("نصيحة اليوم","Tip of the Day")}</h3>
                <p className="text-emerald-50 text-sm leading-relaxed">
                  {t("قاعدة 50/30/20: خصص 50% للضروريات، 30% للرغبات، و20% للادخار.","50/30/20 Rule: 50% needs, 30% wants, 20% savings.")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* التحديات */}
        {activeTab === "challenges" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CHALLENGES.map((ch, i) => {
              const Icon = ch.icon;
              return (
                <motion.div key={ch.id} initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:i*0.1}}>
                  <div className={`rounded-2xl border h-full flex flex-col ${card}`}>
                    <div className="p-5 flex-1">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${ch.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className={`font-bold text-lg mb-2 ${txt}`}>{ch.title}</h3>
                      <p className={`text-sm mb-4 ${sub}`}>{ch.description}</p>
                      <div className="space-y-2 text-sm mb-4">
                        {[[t("الهدف","Goal"), ch.goal], [t("المشاركون","Participants"), ch.participants], [t("ينتهي في","Ends"), ch.endDate]].map(([k,v]) => (
                          <div key={k as string} className="flex justify-between">
                            <span className={sub}>{k}:</span>
                            <span className={`font-medium ${txt}`}>{v}</span>
                          </div>
                        ))}
                      </div>
                      <div className={`rounded-xl p-3 mb-4 flex items-center gap-2 ${dm?"bg-yellow-900/30 border border-yellow-800":"bg-yellow-50 border border-yellow-200"}`}>
                        <Trophy className={`w-5 h-5 ${dm?"text-yellow-400":"text-yellow-600"}`} />
                        <div>
                          <p className={`text-xs ${dm?"text-yellow-400":"text-yellow-700"}`}>{t("المكافأة","Reward")}</p>
                          <p className={`font-bold ${dm?"text-yellow-300":"text-yellow-900"}`}>{ch.reward} {t("نقطة","pts")}</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-5 pb-5">
                      <button
                        onClick={() => { if (!currentUserId) { toast.error(t("يرجى تسجيل الدخول أولاً","Please login first")); return; } toast.success(t("تم الانضمام للتحدي! 🎯","Joined the challenge! 🎯")); }}
                        className={`w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r ${ch.gradient} hover:opacity-90 transition-all shadow-sm`}>
                        {t("الانضمام للتحدي","Join Challenge")}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
