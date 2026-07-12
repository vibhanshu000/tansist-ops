import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SplashScreen } from "./components/layout/SplashScreen";
import { AuthProvider } from "./features/auth/AuthContext";
import { ThemeProvider } from "./components/layout/ThemeContext";
import { ToastProvider } from "./components/ui/ToastContext";
import { ConfirmProvider } from "./components/ui/ConfirmDialog";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { RoleRoute } from "./features/auth/RoleRoute";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./features/auth/LoginPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { VehiclesPage } from "./features/vehicles/VehiclesPage";
import { DriversPage } from "./features/drivers/DriversPage";
import { TripsPage } from "./features/trips/TripsPage";
import { MaintenancePage } from "./features/maintenance/MaintenancePage";
import { FuelExpensePage } from "./features/fuel-expense/FuelExpensePage";
import { ReportsPage } from "./features/reports/ReportsPage";
import { DocumentsPage } from "./features/documents/DocumentsPage";

export default function App() {
  // Show the splash once per browser session so refreshes during normal use
  // don't replay it. Clear sessionStorage (or open a new tab) to see it again.
  const [booting, setBooting] = useState(() => !sessionStorage.getItem("splashSeen"));

  return (
    <ThemeProvider>
      <AnimatePresence>
        {booting && (
          <SplashScreen
            onFinish={() => {
              sessionStorage.setItem("splashSeen", "1");
              setBooting(false);
            }}
          />
        )}
      </AnimatePresence>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/vehicles" element={<RoleRoute path="/vehicles"><VehiclesPage /></RoleRoute>} />
                  <Route path="/drivers" element={<RoleRoute path="/drivers"><DriversPage /></RoleRoute>} />
                  <Route path="/trips" element={<RoleRoute path="/trips"><TripsPage /></RoleRoute>} />
                  <Route path="/maintenance" element={<RoleRoute path="/maintenance"><MaintenancePage /></RoleRoute>} />
                  <Route path="/fuel-expense" element={<RoleRoute path="/fuel-expense"><FuelExpensePage /></RoleRoute>} />
                  <Route path="/reports" element={<RoleRoute path="/reports"><ReportsPage /></RoleRoute>} />
                  <Route path="/documents" element={<RoleRoute path="/documents"><DocumentsPage /></RoleRoute>} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
