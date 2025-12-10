/**
 * Device Registration Page
 *
 * Shows SmartLandingView (Welcome page) or DeviceRegistrationForm
 * Based on user navigation
 */

import { useNavigate, useLocation } from "react-router-dom";
import { DeviceRegistrationForm } from "../../components/DeviceRegistration/DeviceRegistrationForm";
import { SmartLandingView } from "../../components/SmartLanding/SmartLandingView";
import { useAuth } from "../../hooks/useAuth";
import { useEffect, useState } from "react";
import { useDeviceStore } from "../../app/store/deviceStore";
import { ROUTES } from "../../config/routes";

export default function RegisterDevice() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { count } = useDeviceStore();
  
  // Check if we should show form directly from location state or device count
  const directToForm = location.state?.directToForm === true;
  const hasDevices = count > 0;
  
  // Show form if explicitly requested OR if user has devices
  const [showForm, setShowForm] = useState(directToForm || hasDevices);

  // Update showForm when count changes (in case it loads after initial render)
  useEffect(() => {
    if (hasDevices && !showForm) {
      setShowForm(true);
    }
  }, [hasDevices, showForm]);

  // Also check for directToForm flag from location state
  useEffect(() => {
    if (directToForm) {
      setShowForm(true);
    }
  }, [directToForm]);

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Handle back button - if came from dashboard, go back to dashboard
  const handleBack = () => {
    if (directToForm || hasDevices) {
      navigate(ROUTES.DASHBOARD);
    } else {
      setShowForm(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  // Show registration form if user clicked "Register Device" button
  if (showForm) {
    return (
      <div className="min-h-screen bg-background py-12">
        {/* Back Button */}
        <div className="container-main mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
        </div>

        {/* Registration Form */}
        <DeviceRegistrationForm onBack={handleBack} />
      </div>
    );
  }

  // Show SmartLandingView (Welcome page) by default
  return (
    <div className="min-h-screen bg-background">
      <SmartLandingView onRegisterClick={() => setShowForm(true)} />
    </div>
  );
}
