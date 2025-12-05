/**
 * Device Registration Page
 *
 * Full-page view for registering a new device
 * Shows the multi-step registration form
 */

import { useNavigate } from "react-router-dom";
import { DeviceRegistrationForm } from "../../components/DeviceRegistration/DeviceRegistrationForm";
import { useAuth } from "../../hooks/useAuth";
import { useEffect } from "react";

export default function RegisterDevice() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      {/* Back Button */}
      <div className="container-main mb-6">
        <button
          onClick={() => navigate(-1)}
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
      <DeviceRegistrationForm />
    </div>
  );
}
