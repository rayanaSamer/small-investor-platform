import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

// Custom fetch with 8-second timeout to prevent indefinite hangs
const fetchWithTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 8000);
  return fetch(input, { ...(init as RequestInit), signal: controller.signal })
    .finally(() => clearTimeout(id));
};

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // تجاوز Web Lock API — يمنع تجميد استعلامات DB أثناء تجديد التوكن
      lock: async (_name: string, _timeout: number, fn: () => Promise<any>) => fn(),
    },
    global: { fetch: fetchWithTimeout },
  }
);
