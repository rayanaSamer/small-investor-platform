import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { supabase } from "../lib/supabase";

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  level?: number;
  points?: number;
  created_at?: string;
  last_sign_in_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        // TOKEN_REFRESHED: تحديث الـ token فقط بدون re-render إذا نفس المستخدم
        if (event === "TOKEN_REFRESHED") return;

        if (session?.user) {
          setUser(prev =>
            prev?.id === session.user.id ? prev : {
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.name || "",
              created_at: session.user.created_at,
              last_sign_in_at: session.user.last_sign_in_at,
            }
          );

          // upsert فقط عند تسجيل الدخول الفعلي
          if (event === "SIGNED_IN") {
            const uid = session.user.id;
            const name = session.user.user_metadata?.name || "مستخدم";
            setTimeout(() => {
              supabase.from("profiles").upsert(
                { id: uid, name },
                { onConflict: "id" }
              );
              supabase.from("user_stats").upsert(
                { user_id: uid, level: 1, points: 0, achievements: 0, total_achievements: 8 },
                { onConflict: "user_id" }
              );
            }, 0);
          }
        } else {
          setUser(null);
        }

        if (mounted) setLoading(false);
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 🔐 تسجيل الدخول
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session?.user) {
      setUser({
        id: data.session.user.id,
        email: data.session.user.email || "",
        name: data.session.user.user_metadata?.name || "",
      });
    }
  };

  // 🔐 تسجيل خروج
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  // 🔵 Google Login
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const signUp = async () => {
    throw new Error("Use signup page instead");
  };

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, signInWithGoogle, signUp }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
