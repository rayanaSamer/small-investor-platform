import React, { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { Root } from "./layouts/Root";
import { ProtectedRoute } from "./components/ProtectedRoute";

// تحميل الصفحات بشكل كسول - كل صفحة تُحمَّل فقط عند أول زيارة
const Home        = lazy(() => import("./pages/Home").then(m => ({ default: m.Home })));
const Auth        = lazy(() => import("./pages/Auth").then(m => ({ default: m.Auth })));
const Dashboard   = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const Investment  = lazy(() => import("./pages/Investment").then(m => ({ default: m.Investment })));
const Products    = lazy(() => import("./pages/Products").then(m => ({ default: m.Products })));
const Community   = lazy(() => import("./pages/Community").then(m => ({ default: m.Community })));
const Achievements= lazy(() => import("./pages/Achievements").then(m => ({ default: m.Achievements })));
const Profile     = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const Settings    = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword  = lazy(() => import("./pages/ResetPassword"));
const MLAnalysis     = lazy(() => import("./pages/MLAnalysis").then(m => ({ default: m.MLAnalysis })));

// مؤشر تحميل خفيف بين الصفحات
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const guard = (Component: React.ComponentType) => ({
  element: (
    <ProtectedRoute>
      <Wrap><Component /></Wrap>
    </ProtectedRoute>
  ),
});

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true,             element: <Wrap><Home /></Wrap> },
      { path: "auth",            element: <Wrap><Auth /></Wrap> },
      { path: "forgot-password", element: <Wrap><ForgotPassword /></Wrap> },
      { path: "reset-password",  element: <Wrap><ResetPassword /></Wrap> },

      { path: "dashboard",    ...guard(Dashboard)    },
      { path: "investment",   ...guard(Investment)   },
      { path: "products",     ...guard(Products)     },
      { path: "community",    ...guard(Community)    },
      { path: "achievements", ...guard(Achievements) },
      { path: "profile",      ...guard(Profile)      },
      { path: "settings",     ...guard(Settings)     },
      { path: "ml-analysis",  ...guard(MLAnalysis)   },
    ],
  },
]);
