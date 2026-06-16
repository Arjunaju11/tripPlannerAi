import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthBootstrap } from "./components/auth-bootstrap";
import { Layout } from "./components/layout";
import { ProtectedRoute } from "./components/protected-route";
import { ToastProvider } from "./components/toast";
import { LoginPage, RegisterPage } from "./pages/auth";
import { DashboardPage } from "./pages/dashboard";
import { ItineraryDetailPage, SharedItineraryPage } from "./pages/itinerary";
import { LandingPage } from "./pages/landing";
import { NotFoundPage } from "./pages/not-found";
import { ForgotPasswordPage, ResetPasswordPage } from "./pages/password-reset";
import { ProfilePage } from "./pages/profile";
import { UploadPage } from "./pages/upload";
import { useThemeStore } from "./stores/theme-store";
import "./styles.css";

useThemeStore.getState().setTheme(useThemeStore.getState().theme);

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password/:token", element: <ResetPasswordPage /> },
      { path: "/share/:shareId", element: <SharedItineraryPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/upload", element: <UploadPage /> },
          { path: "/itinerary/:id", element: <ItineraryDetailPage /> },
          { path: "/profile", element: <ProfilePage /> }
        ]
      },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <ToastProvider>
        <AuthBootstrap>
          <RouterProvider router={router} />
        </AuthBootstrap>
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
