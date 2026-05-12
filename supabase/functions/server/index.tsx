import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", cors());
app.use("*", logger(console.log));

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ==================== Authentication Routes ====================

// Sign up with email and password
app.post("/make-server-85894e5c/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log("Error during signup:", error);
      return c.json({ error: error.message }, 400);
    }

    // Create user profile in KV store
    await kv.set(`profile:${data.user.id}`, {
      id: data.user.id,
      email: data.user.email,
      name,
      avatar: null,
      level: 1,
      points: 0,
      createdAt: new Date().toISOString(),
    });

    return c.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name,
      }
    });
  } catch (error) {
    console.log("Error in signup route:", error);
    return c.json({ error: "Internal server error during signup" }, 500);
  }
});

// ==================== Profile Routes ====================

// Get user profile
app.get("/make-server-85894e5c/profile", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];

    if (!accessToken) {
      return c.json({ error: "Unauthorized - No token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      console.log("Error getting user from token:", error);
      return c.json({ error: "Unauthorized - Invalid token" }, 401);
    }

    // Get profile from KV store
    const profile = await kv.get(`profile:${user.id}`);

    if (!profile) {
      // Create default profile if doesn't exist
      const defaultProfile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || "مستخدم جديد",
        avatar: null,
        level: 1,
        points: 0,
        createdAt: new Date().toISOString(),
      };
      await kv.set(`profile:${user.id}`, defaultProfile);
      return c.json(defaultProfile);
    }

    return c.json(profile);
  } catch (error) {
    console.log("Error in get profile route:", error);
    return c.json({ error: "Internal server error while fetching profile" }, 500);
  }
});

// Update user profile
app.put("/make-server-85894e5c/profile", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];

    if (!accessToken) {
      return c.json({ error: "Unauthorized - No token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      console.log("Error getting user from token:", error);
      return c.json({ error: "Unauthorized - Invalid token" }, 401);
    }

    const updates = await c.req.json();
    const currentProfile = await kv.get(`profile:${user.id}`);

    const updatedProfile = {
      ...currentProfile,
      ...updates,
      id: user.id, // Don't allow changing ID
      email: user.email, // Don't allow changing email
    };

    await kv.set(`profile:${user.id}`, updatedProfile);

    return c.json(updatedProfile);
  } catch (error) {
    console.log("Error in update profile route:", error);
    return c.json({ error: "Internal server error while updating profile" }, 500);
  }
});

// ==================== Financial Products Routes ====================

// Get all financial products
app.get("/make-server-85894e5c/products", async (c) => {
  try {
    const products = await kv.getByPrefix("product:");
    return c.json(products);
  } catch (error) {
    console.log("Error fetching products:", error);
    return c.json({ error: "Internal server error while fetching products" }, 500);
  }
});

// Get product by ID
app.get("/make-server-85894e5c/products/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const product = await kv.get(`product:${id}`);

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    return c.json(product);
  } catch (error) {
    console.log("Error fetching product:", error);
    return c.json({ error: "Internal server error while fetching product" }, 500);
  }
});

// Initialize sample products (admin route)
app.post("/make-server-85894e5c/products/init", async (c) => {
  try {
    const sampleProducts = [
      {
        id: "aramco",
        name: "شركة أرامكو السعودية",
        symbol: "ARAMCO",
        type: "سهم",
        category: "طاقة",
        price: 35.5,
        change: 0.8,
        changePercent: 2.3,
        description: "الشركة الوطنية السعودية للبترول والغاز الطبيعي",
        riskLevel: "منخفض",
        minInvestment: 100,
      },
      {
        id: "rajhi",
        name: "مصرف الراجحي",
        symbol: "RJHI",
        type: "سهم",
        category: "بنوك",
        price: 85.2,
        change: -1.2,
        changePercent: -1.4,
        description: "مصرف الراجحي للخدمات المالية الإسلامية",
        riskLevel: "منخفض",
        minInvestment: 100,
      },
      {
        id: "sabic",
        name: "سابك",
        symbol: "SABIC",
        type: "سهم",
        category: "صناعة",
        price: 92.7,
        change: 2.1,
        changePercent: 2.3,
        description: "الشركة السعودية للصناعات الأساسية",
        riskLevel: "متوسط",
        minInvestment: 100,
      },
      {
        id: "stc",
        name: "الاتصالات السعودية",
        symbol: "STC",
        type: "سهم",
        category: "اتصالات",
        price: 45.8,
        change: 0.5,
        changePercent: 1.1,
        description: "شركة الاتصالات السعودية",
        riskLevel: "منخفض",
        minInvestment: 100,
      },
      {
        id: "fund-1",
        name: "صندوق الأسهم السعودية",
        symbol: "FUND1",
        type: "صندوق استثماري",
        category: "صناديق",
        price: 125.0,
        change: 1.5,
        changePercent: 1.2,
        description: "صندوق استثماري متنوع في السوق السعودي",
        riskLevel: "متوسط",
        minInvestment: 500,
      },
      {
        id: "fund-2",
        name: "صندوق الدخل الثابت",
        symbol: "FUND2",
        type: "صندوق استثماري",
        category: "صناديق",
        price: 110.5,
        change: 0.3,
        changePercent: 0.3,
        description: "صندوق يستثمر في أدوات الدخل الثابت",
        riskLevel: "منخفض",
        minInvestment: 1000,
      },
    ];

    for (const product of sampleProducts) {
      await kv.set(`product:${product.id}`, product);
    }

    return c.json({ success: true, count: sampleProducts.length });
  } catch (error) {
    console.log("Error initializing products:", error);
    return c.json({ error: "Internal server error while initializing products" }, 500);
  }
});

// ==================== User Data Routes ====================

// Save user expenses
app.post("/make-server-85894e5c/expenses", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];

    if (!accessToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const expense = await c.req.json();
    const expenseId = `expense:${user.id}:${Date.now()}`;

    await kv.set(expenseId, {
      ...expense,
      id: expenseId,
      userId: user.id,
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true, id: expenseId, ...expense, id: expenseId });
  } catch (error) {
    console.log("Error saving expense:", error);
    return c.json({ error: "Internal server error while saving expense" }, 500);
  }
});

// Get user expenses
app.get("/make-server-85894e5c/expenses", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];

    if (!accessToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const expenses = await kv.getByPrefix(`expense:${user.id}:`);
    return c.json(expenses);
  } catch (error) {
    console.log("Error fetching expenses:", error);
    return c.json({ error: "Internal server error while fetching expenses" }, 500);
  }
});

// Delete expense
app.delete("/make-server-85894e5c/expenses/:id", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) return c.json({ error: "Unauthorized" }, 401);

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    await kv.del(id);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete" }, 500);
  }
});

// Save user portfolio
app.post("/make-server-85894e5c/portfolio", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];

    if (!accessToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const portfolio = await c.req.json();
    await kv.set(`portfolio:${user.id}`, {
      ...portfolio,
      userId: user.id,
      updatedAt: new Date().toISOString(),
    });

    return c.json({ success: true });
  } catch (error) {
    console.log("Error saving portfolio:", error);
    return c.json({ error: "Internal server error while saving portfolio" }, 500);
  }
});

// Get user portfolio
app.get("/make-server-85894e5c/portfolio", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];

    if (!accessToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const portfolio = await kv.get(`portfolio:${user.id}`);
    return c.json(portfolio || { balance: 10000, positions: [] });
  } catch (error) {
    console.log("Error fetching portfolio:", error);
    return c.json({ error: "Internal server error while fetching portfolio" }, 500);
  }
});

// ==================== Community Posts ====================
app.get("/make-server-85894e5c/posts", async (c) => {
  try {
    const posts = await kv.getByPrefix("post:");
    const sorted = posts.sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return c.json(sorted);
  } catch { return c.json([], 200); }
});

app.post("/make-server-85894e5c/posts", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) return c.json({ error: "Unauthorized" }, 401);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const postId = `post:${Date.now()}`;
    const post = {
      id: postId,
      userId: user.id,
      author: user.user_metadata?.name || "مستخدم",
      avatar: (user.user_metadata?.name || "م").slice(0, 2),
      level: 1,
      content: body.content,
      likes: 0,
      likedBy: [],
      comments: 0,
      createdAt: new Date().toISOString(),
      timestamp: "الآن",
    };
    await kv.set(postId, post);

    // منح نقاط لنشر منشور
    await addPoints(user.id, 10);
    return c.json(post);
  } catch { return c.json({ error: "Failed to post" }, 500); }
});

app.post("/make-server-85894e5c/posts/:id/like", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) return c.json({ error: "Unauthorized" }, 401);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    const post = await kv.get(id);
    if (!post) return c.json({ error: "Not found" }, 404);

    const likedBy: string[] = post.likedBy || [];
    const alreadyLiked = likedBy.includes(user.id);
    const updated = {
      ...post,
      likes: alreadyLiked ? Math.max(0, post.likes - 1) : post.likes + 1,
      likedBy: alreadyLiked ? likedBy.filter((id: string) => id !== user.id) : [...likedBy, user.id],
    };
    await kv.set(id, updated);
    return c.json(updated);
  } catch { return c.json({ error: "Failed to like" }, 500); }
});

// ==================== User Settings ====================
app.get("/make-server-85894e5c/settings", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) return c.json({ error: "Unauthorized" }, 401);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const settings = await kv.get(`settings:${user.id}`);
    return c.json(settings || { language: "ar", fontSize: "16px", darkMode: false, notifications: true, emailAlerts: false });
  } catch { return c.json({ language: "ar", fontSize: "16px", darkMode: false }); }
});

app.put("/make-server-85894e5c/settings", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) return c.json({ error: "Unauthorized" }, 401);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    await kv.set(`settings:${user.id}`, body);
    return c.json({ success: true });
  } catch { return c.json({ error: "Failed to save" }, 500); }
});

// Health check
app.get("/make-server-85894e5c/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ==================== Points Helper ====================
async function addPoints(userId: string, pts: number) {
  try {
    const { data } = await supabase.from("user_stats").select("*").eq("user_id", userId).single();
    if (data) {
      const newPoints = (data.points || 0) + pts;
      const newLevel = Math.floor(newPoints / 200) + 1;
      await supabase.from("user_stats").update({ points: newPoints, level: newLevel, updated_at: new Date().toISOString() }).eq("user_id", userId);
    }
  } catch {}
}

Deno.serve(app.fetch);
