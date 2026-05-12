import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Textarea } from "../components/ui/textarea";
import { Heart, MessageCircle, Share2, TrendingUp, Users, Target, Trophy, Send, Loader2, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationsContext";

interface Post {
  id: string; author: string; avatar: string; level: number;
  content: string; likes: number; likedBy: string[]; comments: number;
  timestamp: string; createdAt: string; badge?: string; userId?: string;
}

export function Community() {
  const { darkMode, language } = useSettings();
  const { user: authUser } = useAuth();
  const { addNotification } = useNotifications();
  const t = (ar: string, en: string) => language === "ar" ? ar : en;

  const CHALLENGES = [
    { id:"1", title:t("تحدي الـ 30 يوماً","30-Day Challenge"),    description:t("سجل مصروفاتك يومياً لمدة 30 يوماً متواصلة","Log expenses daily for 30 consecutive days"), goal:t("30 يوم","30 Days"), endDateISO:"2026-09-15", reward:500,  icon:Target,   gradient:"from-[#1A8A5A] to-[#2ECC71]"  },
    { id:"2", title:t("مستثمر الشهر","Investor of the Month"),     description:t("حقق أعلى نسبة ربح في محافظ الاستثمار","Achieve highest return in investment portfolios"), goal:t("أعلى ربح","Best Return"), endDateISO:"2026-04-28", reward:1000, icon:TrendingUp, gradient:"from-[#5B3D8F] to-[#7D5CB8]" },
    { id:"3", title:t("مدخر محترف","Pro Saver"),                    description:t("وفر 20% من دخلك الشهري","Save 20% of your monthly income"), goal:t("20% توفير","20% Saved"), endDateISO:"2026-08-10", reward:300,  icon:Trophy,   gradient:"from-[#2878C8] to-[#5DADE2]"   },
  ];

  const getChallengeStatus = (endDateISO: string) => {
    const now      = new Date();
    const end      = new Date(endDateISO);
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000);
    const display  = end.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { year:"numeric", month:"long", day:"numeric" });
    return { isExpired: daysLeft < 0, daysLeft, display };
  };

  const dm   = darkMode;
  const card = dm ? "bg-white/[0.04] border-white/[0.08] backdrop-blur-xl" : "bg-white/70 border-white/60 backdrop-blur-xl shadow-lg";
  const txt  = dm ? "text-gray-100" : "text-gray-900";
  const sub  = dm ? "text-gray-400" : "text-gray-500";
  const textareaCls = dm ? "bg-white/[0.04] border-white/[0.06] text-gray-100 placeholder:text-gray-400" : "bg-white/50 border-white/40 text-gray-900 placeholder:text-gray-600";
  const rowHov = dm ? "hover:bg-white/[0.06]" : "hover:bg-white/60";

  const [posts, setPosts]               = useState<Post[]>([]);
  const [newPost, setNewPost]           = useState("");
  const [loading, setLoading]           = useState(true);
  const [posting, setPosting]           = useState(false);
  const [activeTab, setActiveTab]       = useState<"feed"|"challenges">("feed");
  const [activeMembers, setActiveMembers]       = useState<{name:string;level:number;posts:number}[]>([]);
  const [activeMembersCount, setActiveMembersCount] = useState(0);
  const [joinedChallenges, setJoinedChallenges] = useState<Set<string>>(new Set());

  interface LeaderEntry { name: string; value: number; }
  const [challLoading, setChallLoading]   = useState(false);
  const [myProgress, setMyProgress]       = useState({ days: 0, savingsRate: 0, portfolioVal: 0 });
  const [leaders, setLeaders]             = useState<{ c1: LeaderEntry[]; c2: LeaderEntry[]; c3: LeaderEntry[] }>({ c1: [], c2: [], c3: [] });

  const currentUserId = authUser?.id ?? null;

  useEffect(() => {
    fetchPosts();
    fetchActiveMembers();
  }, []);

  useEffect(() => {
    if (activeTab === "challenges") fetchChallengeData();
  }, [activeTab, authUser?.id]);

  const fetchChallengeData = async () => {
    if (challLoading) return;
    setChallLoading(true);
    try {
      const now          = new Date();
      const thirtyAgo    = new Date(now.getTime() - 30 * 86400000).toISOString();
      const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [leaderRes, myTxRes, myMonthRes, myPortRes] = await Promise.all([
        supabase.rpc("get_challenge_leaderboard"),
        authUser ? supabase.from("transactions").select("created_at").eq("user_id", authUser.id).gte("created_at", thirtyAgo) : Promise.resolve({ data: [] }),
        authUser ? supabase.from("transactions").select("type,amount").eq("user_id", authUser.id).gte("created_at", monthStart) : Promise.resolve({ data: [] }),
        authUser ? supabase.from("portfolios").select("balance,positions").eq("user_id", authUser.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      // تقدمي — تحدي 1
      const myDays = new Set(((myTxRes.data || []) as any[]).map((r: any) => r.created_at.slice(0, 10))).size;

      // تقدمي — تحدي 3
      const txList  = (myMonthRes.data || []) as any[];
      const income   = txList.filter(r => r.type === "income").reduce((s, r) => s + Number(r.amount), 0);
      const expenses = txList.filter(r => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0);
      const myRate   = income > 0 ? Math.round((income - expenses) / income * 100) : 0;

      // تقدمي — تحدي 2
      const port      = myPortRes.data as any;
      const invested  = ((port?.positions || []) as any[]).reduce((s: number, p: any) => s + p.buyPrice * p.shares, 0);
      const myPortVal = Math.round(Number(port?.balance || 0) + invested);

      setMyProgress({ days: myDays, savingsRate: myRate, portfolioVal: myPortVal });

      if (leaderRes.data) {
        const lb = leaderRes.data as any;
        setLeaders({
          c1: (lb.c1 || []).map((r: any) => ({ name: r.name, value: r.days })),
          c2: (lb.c2 || []).map((r: any) => ({ name: r.name, value: r.total_value })),
          c3: (lb.c3 || []).map((r: any) => ({ name: r.name, value: r.savings_rate })),
        });
      }
    } catch (e) { console.error(e); }
    finally { setChallLoading(false); }
  };

  const fetchActiveMembers = async () => {
    const { data } = await supabase
      .from("community_posts")
      .select("user_id, user_name, user_level")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!data) return;
    const map = new Map<string, { name: string; level: number; posts: number }>();
    data.forEach((row: any) => {
      if (!map.has(row.user_id)) map.set(row.user_id, { name: row.user_name || t("مستخدم","User"), level: row.user_level || 1, posts: 0 });
      map.get(row.user_id)!.posts++;
    });
    const sorted = Array.from(map.values()).sort((a, b) => b.posts - a.posts).slice(0, 4);
    setActiveMembers(sorted);
    setActiveMembersCount(map.size);
  };

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
      setPosts(mapped);
    } catch { setPosts([]); }
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

  const handleShare = async (post: Post) => {
    const text = `${post.author}: ${post.content}`;
    if (navigator.share) {
      try { await navigator.share({ text, title: t("مجتمع حاصد","Hasad Community") }); }
      catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast.success(t("تم نسخ المنشور","Post copied to clipboard"));
      } catch { toast.error(t("تعذّر النسخ","Could not copy")); }
    }
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    if (newPost.length > 500) { toast.error(t("المنشور يتجاوز 500 حرف","Post exceeds 500 characters")); return; }
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
      addNotification("نشرت منشوراً وكسبت 10 نقاط 🎉", "You posted and earned 10 points 🎉", "points");
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

  const handleDeletePost = async (postId: string) => {
    if (postId.startsWith("sample-")) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      return;
    }
    try {
      const { error } = await supabase.from("community_posts").delete().eq("id", postId);
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success(t("تم حذف المنشور", "Post deleted"));
    } catch { toast.error(t("فشل الحذف", "Delete failed")); }
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
    if (mins < 60) return language === "ar" ? `منذ ${mins} دقيقة` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return language === "ar" ? `منذ ${hrs} ساعة` : `${hrs}h ago`;
    return language === "ar" ? `منذ ${Math.floor(hrs/24)} يوم` : `${Math.floor(hrs/24)}d ago`;
  };

  const statCards = [
    { label:t("الأعضاء النشطون","Active Members"), value: activeMembersCount > 0 ? activeMembersCount.toString() : "—", gradient:"from-[#2878C8] to-[#5DADE2]", icon:<Users className="w-5 h-5 text-white"/> },
    { label:t("المنشورات","Posts"),                value:posts.length.toString(),      gradient:"from-[#5B3D8F] to-[#7D5CB8]", icon:<MessageCircle className="w-5 h-5 text-white"/> },
    { label:t("التحديات النشطة","Active Challenges"),value:CHALLENGES.length.toString(), gradient:"from-[#1A8A5A] to-[#2ECC71]",    icon:<Trophy className="w-5 h-5 text-white"/> },
  ];

  return (
    <div className={`relative overflow-hidden min-h-screen py-8 px-4 transition-colors`}>
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute w-96 h-96 rounded-full opacity-20 blur-3xl ${dm ? "bg-blue-500" : "bg-blue-200"}`} style={{top: "-10%", left: "-10%"}} />
        <div className={`absolute w-96 h-96 rounded-full opacity-20 blur-3xl ${dm ? "bg-purple-500" : "bg-purple-200"}`} style={{top: "50%", right: "-5%"}} />
        <div className={`absolute w-96 h-96 rounded-full opacity-20 blur-3xl ${dm ? "bg-green-500" : "bg-green-200"}`} style={{bottom: "0", left: "20%"}} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">

        <motion.div className="mb-8" initial={{opacity: 0, y: -20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5}}>
          <h1 className={`text-3xl font-bold mb-1 ${txt}`}>{t("مجتمع حاصد","Community")}</h1>
          <p className={sub}>{t("شارك تجربتك وتعلم من الآخرين","Share your experience and learn from others")}</p>
        </motion.div>

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
        <div className={`flex gap-1 p-1 rounded-2xl mb-6 w-fit ${card}`}>
          {([["feed", t("آخر المنشورات","Feed")], ["challenges", t("التحديات","Challenges")]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab===key ? "bg-gradient-to-r from-[#2878C8] to-[#5DADE2] text-white shadow-sm" : dm?"text-gray-400 hover:text-gray-200":"text-gray-600 hover:text-gray-900"}`}>
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
                    <AvatarFallback className="bg-gradient-to-br from-[#2878C8] to-[#5DADE2] text-white text-sm">أن</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder={t("شارك إنجازاتك أو اطرح سؤالاً... (+10 نقاط)","Share achievements or ask a question... (+10 pts)")}
                      value={newPost} onChange={e => setNewPost(e.target.value)}
                      maxLength={500}
                      className={`mb-3 min-h-[80px] resize-none rounded-xl ${textareaCls}`} />
                    <div className="flex items-center justify-between">
                      <p className={`text-xs ${sub}`}>{newPost.length}/500</p>
                      <button onClick={handlePost} disabled={!newPost.trim() || posting}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#2878C8] to-[#5DADE2] hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all">
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
                  <Loader2 className="w-8 h-8 text-[#4A90E2] animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <div className={`rounded-2xl border p-12 text-center ${card}`}>
                  <p className="text-4xl mb-3">💬</p>
                  <p className={`font-semibold mb-1 ${txt}`}>{t("لا توجد منشورات بعد","No posts yet")}</p>
                  <p className={`text-sm ${sub}`}>{t("كن أول من يشارك تجربته!","Be the first to share!")}</p>
                </div>
              ) : posts.map((post, i) => (
                <motion.div key={post.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}>
                  <div className={`rounded-2xl border p-5 ${card}`}>
                    <div className="flex gap-4">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-[#2878C8] to-[#5B3D8F] text-white text-sm">
                          {post.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className={`font-bold text-sm ${txt}`}>{post.author}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${dm?"bg-white/[0.08] text-gray-300":"bg-white/50 text-gray-700"}`}>
                            {t("المستوى","Lv.")} {post.level}
                          </span>
                          {post.badge && <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-[#2878C8] to-[#5DADE2] text-white">{post.badge}</span>}
                        </div>
                        <p className={`text-xs mb-3 ${sub}`}>{post.createdAt ? formatTime(post.createdAt) : post.timestamp}</p>
                        <p className={`text-sm leading-relaxed mb-4 ${txt}`}>{post.content}</p>
                        <div className="flex items-center gap-5">
                          <button onClick={() => handleLike(post.id)}
                            className={`flex items-center gap-1.5 text-sm transition-colors ${currentUserId && post.likedBy?.includes(currentUserId) ? "text-red-500" : `${sub} hover:text-red-400`}`}>
                            <Heart className={`w-4 h-4 ${currentUserId && post.likedBy?.includes(currentUserId) ? "fill-current" : ""}`} />
                            {post.likes}
                          </button>
                          <button onClick={() => handleShare(post)}
                            className={`flex items-center gap-1.5 text-sm ${sub} hover:text-[#2878C8] transition-colors`}>
                            <Share2 className="w-4 h-4" />{t("مشاركة","Share")}
                          </button>
                          {currentUserId === post.userId && (
                            <button onClick={() => handleDeletePost(post.id)}
                              className={`flex items-center gap-1.5 text-sm ${sub} hover:text-red-400 transition-colors ms-auto`}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
                <div className={`p-4 border-b ${dm ? "border-white/[0.08]" : "border-white/60"}`}>
                  <h3 className={`font-semibold text-sm ${txt}`}>{t("الأعضاء الأكثر نشاطاً","Most Active Members")}</h3>
                </div>
                <div className="p-4 space-y-3">
                  {(activeMembers.length > 0 ? activeMembers : []).map((u,i) => (
                    <div key={i} className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${rowHov}`}>
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-gradient-to-br from-[#2878C8] to-[#1A8A5A] text-white text-xs font-semibold">
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

              <div className={`rounded-2xl border p-5 ${card} bg-gradient-to-br from-[#2878C8]/10 to-[#5DADE2]/10`}>
                <h3 className="font-bold mb-2 text-[#2878C8]">💡 {t("نصيحة اليوم","Tip of the Day")}</h3>
                <p className={`text-sm leading-relaxed ${txt}`}>
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
              const { isExpired, daysLeft, display } = getChallengeStatus(ch.endDateISO);
              const isJoined = joinedChallenges.has(ch.id);

              // بيانات التقدم والمتصدرين الخاصة بكل تحدي
              const progressData = ch.id === "1"
                ? { current: myProgress.days, target: 30, label: t(`سجّلت ${myProgress.days} من 30 يوم`, `Logged ${myProgress.days}/30 days`), leaderList: leaders.c1, fmtVal: (v:number) => t(`${v} يوم`,`${v}d`) }
                : ch.id === "2"
                ? { current: myProgress.portfolioVal, target: null, label: t(`قيمة محفظتك: ${myProgress.portfolioVal.toLocaleString()} ر.س`, `Portfolio: ${myProgress.portfolioVal.toLocaleString()} SAR`), leaderList: leaders.c2, fmtVal: (v:number) => t(`${v.toLocaleString()} ر.س`,`${v.toLocaleString()} SAR`) }
                : { current: myProgress.savingsRate, target: 20, label: t(`توفيرك هذا الشهر: ${myProgress.savingsRate}%`, `Saved this month: ${myProgress.savingsRate}%`), leaderList: leaders.c3, fmtVal: (v:number) => `${v}%` };

              const pct = progressData.target ? Math.min(100, Math.round((progressData.current / progressData.target) * 100)) : null;
              const medals = ["🥇","🥈","🥉"];

              return (
                <motion.div key={ch.id} initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:i*0.1}}>
                  <div className={`rounded-2xl border h-full flex flex-col transition-opacity ${card} ${isExpired ? "opacity-60" : ""}`}>
                    <div className="p-5 flex-1">

                      {/* الأيقونة + شارة الحالة */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${isExpired ? "from-gray-400 to-gray-500" : ch.gradient} flex items-center justify-center shadow-lg`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        {isExpired ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">{t("انتهى","Ended")}</span>
                        ) : daysLeft <= 7 ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 animate-pulse">
                            ⏰ {t(`باقي ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"}`, `${daysLeft}d left`)}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {t(`باقي ${daysLeft} يوم`, `${daysLeft}d left`)}
                          </span>
                        )}
                      </div>

                      <h3 className={`font-bold text-lg mb-1 ${txt}`}>{ch.title}</h3>
                      <p className={`text-sm mb-3 ${sub}`}>{ch.description}</p>

                      <div className="flex justify-between text-sm mb-3">
                        <span className={sub}>{t("تاريخ الانتهاء","End Date")}:</span>
                        <span className={`font-medium ${isExpired ? "text-red-400" : txt}`}>{display}</span>
                      </div>

                      {/* شريط التقدم — فقط للتحديين 1 و3 */}
                      {currentUserId && pct !== null && !isExpired && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className={sub}>{t("تقدمك","Your progress")}</span>
                            <span className={`font-semibold ${pct >= 100 ? "text-emerald-500" : txt}`}>{pct}%</span>
                          </div>
                          <div className={`h-2 rounded-full overflow-hidden ${dm ? "bg-gray-700" : "bg-gray-100"}`}>
                            <div className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${pct >= 100 ? "from-emerald-400 to-emerald-600" : ch.gradient}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                          <p className={`text-xs mt-1 ${pct >= 100 ? "text-emerald-500 font-semibold" : sub}`}>
                            {pct >= 100 ? t("🎉 أنجزت التحدي!","🎉 Challenge complete!") : progressData.label}
                          </p>
                        </div>
                      )}

                      {/* تقدم تحدي المحفظة (بدون شريط) */}
                      {currentUserId && ch.id === "2" && !isExpired && (
                        <div className={`rounded-xl px-3 py-2 mb-3 text-sm ${dm ? "bg-white/[0.06] border border-white/[0.08]" : "bg-white/50 border border-white/60"}`}>
                          <span className={sub}>{t("قيمة محفظتك الكلية","Your total portfolio")}: </span>
                          <span className={`font-bold ${txt}`}>{myProgress.portfolioVal.toLocaleString()} {t("ر.س","SAR")}</span>
                        </div>
                      )}

                      {/* المكافأة */}
                      <div className={`rounded-xl p-3 mb-3 flex items-center gap-2 ${dm?"bg-[#E8A830]/10 border border-[#E8A830]/30":"bg-[#E8A830]/15 border border-[#E8A830]/40"}`}>
                        <Trophy className={`w-5 h-5 flex-shrink-0 text-[#E8A830]`} />
                        <div>
                          <p className={`text-xs text-[#E8A830]`}>{t("المكافأة","Reward")}</p>
                          <p className={`font-bold text-sm text-[#E8A830]`}>{ch.reward} {t("نقطة","pts")}</p>
                        </div>
                      </div>

                      {/* لوحة المتصدرين */}
                      {challLoading ? (
                        <div className={`rounded-xl p-3 text-center text-xs ${sub} ${dm?"bg-white/[0.06]":"bg-white/50"}`}>
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        </div>
                      ) : progressData.leaderList.length > 0 && (
                        <div className={`rounded-xl overflow-hidden border ${dm?"border-white/[0.08]":"border-white/60"}`}>
                          <div className={`px-3 py-1.5 text-xs font-semibold ${dm?"bg-white/[0.06] text-gray-300":"bg-white/50 text-gray-700"}`}>
                            {t("المتصدرون","Leaderboard")}
                          </div>
                          {progressData.leaderList.map((l, ri) => (
                            <div key={ri} className={`flex items-center justify-between px-3 py-2 text-sm ${ri < progressData.leaderList.length - 1 ? `border-b ${dm?"border-white/[0.08]":"border-white/60"}` : ""}`}>
                              <div className="flex items-center gap-2">
                                <span className="text-base">{medals[ri]}</span>
                                <span className={`truncate max-w-[100px] ${txt}`}>{l.name}</span>
                              </div>
                              <span className={`font-bold text-xs ${ri === 0 ? "text-yellow-500" : ri === 1 ? "text-gray-400" : "text-amber-600"}`}>
                                {progressData.fmtVal(l.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="px-5 pb-5 pt-2">
                      {isExpired ? (
                        <div className={`w-full py-2.5 rounded-xl text-center text-sm font-semibold ${dm ? "bg-white/[0.06] text-gray-500" : "bg-white/50 text-gray-500"}`}>
                          {t("انتهى هذا التحدي","This challenge has ended")}
                        </div>
                      ) : isJoined ? (
                        <div className={`flex items-center gap-2 py-2.5 rounded-xl justify-center text-sm font-semibold text-[#1A8A5A] ${dm?"bg-[#1A8A5A]/20":"bg-[#1A8A5A]/15"}`}>
                          ✓ {t("منضم للتحدي","Joined")}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (!currentUserId) { toast.error(t("يرجى تسجيل الدخول أولاً","Please login first")); return; }
                            setJoinedChallenges(prev => new Set([...prev, ch.id]));
                            toast.success(t("تم الانضمام للتحدي! 🎯","Joined the challenge! 🎯"));
                            addNotification(`انضممت إلى تحدي: ${ch.title} 🎯`, `Joined challenge: ${ch.title} 🎯`, "challenge");
                          }}
                          className={`w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r ${ch.gradient} hover:opacity-90 transition-all shadow-sm`}>
                          {t("الانضمام للتحدي","Join Challenge")}
                        </button>
                      )}
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
