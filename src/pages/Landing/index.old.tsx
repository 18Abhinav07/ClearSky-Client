/**
 * Landing Page
 *
 * Entry point for unauthenticated users
 * Features:
 * 1. CDP Email Authentication (via AuthButton component)
 * 2. Automatic device registration after wallet creation
 * 3. Navigation to dashboard on success
 */

import { useEffect, useState } from "react";
import { CDPEmailAuth } from "../../components/Auth/CDPEmailAuth";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../config/routes";

export default function Landing() {
  const { isConnected, isAuthenticated, completeDeviceRegistration, isRegistering, error } = useAuth();
  const navigate = useNavigate();
  const [hasTriggeredRegistration, setHasTriggeredRegistration] = useState(false);

  /**
   * After CDP authentication completes (wallet connected),
   * automatically trigger device registration
   */
  useEffect(() => {
    const handleDeviceRegistration = async () => {
      // Only proceed if:
      // 1. Wallet is connected (CDP auth completed)
      // 2. Not already authenticated
      // 3. Haven't triggered registration yet
      // 4. Not currently registering
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

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Hero Section */}
        <div style={styles.hero}>
          <h1 style={styles.title}>Welcome to ClearSky</h1>
          <p style={styles.subtitle}>
            Secure, decentralized authentication powered by Coinbase Developer Platform
          </p>
        </div>

        {/* Authentication Card */}
        <div style={styles.card}>
          {/* CDP Authentication Component */}
          {!isConnected && !isRegistering && (
            <div style={styles.authSection}>
              <CDPEmailAuth
                onSuccess={() => {
                  console.log("CDP authentication successful");
                }}
                onError={(err) => {
                  console.error("CDP authentication error:", err);
                }}
              />
            </div>
          )}

          {/* Loading State: Device Registration */}
          {isConnected && isRegistering && (
            <div style={styles.loadingSection}>
              <div style={styles.spinner}></div>
              <h3 style={styles.loadingTitle}>Completing Authentication</h3>
              <p style={styles.loadingText}>
                Please sign the message to verify wallet ownership...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div style={styles.errorSection}>
              <div style={styles.errorIcon}>⚠️</div>
              <h3 style={styles.errorTitle}>Authentication Failed</h3>
              <p style={styles.errorMessage}>{error}</p>
              <button
                onClick={() => window.location.reload()}
                style={styles.retryButton}
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div style={styles.features}>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>🔒</div>
            <h3 style={styles.featureTitle}>Secure</h3>
            <p style={styles.featureDescription}>
              Your keys, your control. Non-custodial wallet secured by CDP.
            </p>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>⚡</div>
            <h3 style={styles.featureTitle}>Fast</h3>
            <p style={styles.featureDescription}>
              No browser extensions. Authenticate in seconds with email.
            </p>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>🌐</div>
            <h3 style={styles.featureTitle}>Multi-Chain</h3>
            <p style={styles.featureDescription}>
              Access Base and multiple EVM chains seamlessly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline styles for demonstration
// In production, consider using CSS modules or styled-components
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    minWidth: "100vw", 
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  content: {
    maxWidth: "900px",
    width: "100%",
  },
  hero: {
    textAlign: "center" as const,
    marginBottom: "40px",
    color: "white",
  },
  title: {
    fontSize: "48px",
    fontWeight: "bold",
    marginBottom: "16px",
    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  subtitle: {
    fontSize: "20px",
    opacity: 0.9,
  },
  card: {
    background: "white",
    borderRadius: "16px",
    padding: "40px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
    marginBottom: "40px",
  },
  authSection: {
    textAlign: "center" as const,
  },
  cardTitle: {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "12px",
    color: "#333",
  },
  cardDescription: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "32px",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
  },
  loadingSection: {
    textAlign: "center" as const,
    padding: "20px",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  loadingTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "12px",
    color: "#333",
  },
  loadingText: {
    fontSize: "16px",
    color: "#666",
  },
  errorSection: {
    textAlign: "center" as const,
    padding: "20px",
  },
  errorIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  errorTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "12px",
    color: "#d32f2f",
  },
  errorMessage: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "24px",
  },
  retryButton: {
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "12px 32px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "24px",
  },
  feature: {
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center" as const,
    color: "white",
  },
  featureIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  featureTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  featureDescription: {
    fontSize: "14px",
    opacity: 0.9,
  },
};
