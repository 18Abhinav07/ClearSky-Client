/**
 * Application Router
 *
 * Handles routing between Landing and Dashboard pages
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "../../config/routes";
import Landing from "../../pages/Landing";
import Dashboard from "../../pages/Dashboard";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LANDING} element={<Landing />} />
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
