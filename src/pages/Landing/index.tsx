/**
 * Landing Page - With Auth Modal
 *
 * Entry point for unauthenticated users
 * Features:
 * 1. Get Started button opens authentication modal
 * 2. CDP Email Authentication in modal
 * 3. Automatic device registration after wallet creation
 * 4. Navigation to dashboard on success
 */

import { useEffect, useState } from "react";
import { AuthModal } from "../../components/Auth/AuthModal";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../config/routes";
import LandingPage from "./LandingPage";

export default function Landing() {
  const { isConnected, isAuthenticated, completeDeviceRegistration, isRegistering, error } = useAuth();
  const navigate = useNavigate();
  const [hasTriggeredRegistration, setHasTriggeredRegistration] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  /**
   * After CDP authentication completes (wallet connected),
   * automatically trigger device registration
   */
  useEffect(() => {
    const handleDeviceRegistration = async () => {
      if (isConnected && !isAuthenticated && !hasTriggeredRegistration && !isRegistering) {
        setHasTriggeredRegistration(true);
        try {
          await completeDeviceRegistration();
          // Registration successful, navigate to dashboard
          navigate(ROUTES.DASHBOARD);
        } catch (err) {
          console.error("Failed to complete device registration:", err);
          setHasTriggeredRegistration(false); // Allow retry
        }
      }
    };

    handleDeviceRegistration();
  }, [isConnected, isAuthenticated, hasTriggeredRegistration, isRegistering, completeDeviceRegistration, navigate]);

  /**
   * If already authenticated, redirect to dashboard
   */
  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, navigate]);

  const handleGetStarted = () => {
    setIsAuthModalOpen(true);
  };

  if (isConnected && isRegistering) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Completing Authentication</h2>
        <p className="text-muted-foreground">Registering your device with backend...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-destructive mb-2">Authentication Failed</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <LandingPage onGetStarted={handleGetStarted} />
      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          console.log("CDP authentication successful from modal");
          setIsAuthModalOpen(false);
        }}
      />
    </>
  );
}
