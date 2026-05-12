import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AppNotification {
  id: string;
  message: string;
  messageEn: string;
  type: "points" | "achievement" | "challenge";
  read: boolean;
  createdAt: string;
}

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (msg: string, msgEn: string, type: AppNotification["type"]) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);
const STORAGE_KEY = "hasad_notifications";

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
  }, [notifications]);

  const addNotification = (message: string, messageEn: string, type: AppNotification["type"]) => {
    setNotifications(prev => [{
      id: Date.now().toString(),
      message, messageEn, type,
      read: false,
      createdAt: new Date().toISOString(),
    }, ...prev].slice(0, 50));
  };

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const clearAll    = () => setNotifications([]);

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount: notifications.filter(n => !n.read).length,
      addNotification, markAllRead, clearAll,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be within NotificationsProvider");
  return ctx;
}
