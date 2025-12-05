/**
 * Dashboard Page
 *
 * Main application interface after successful authentication
 * Displays user's wallet information and registered devices
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../config/routes";

export default function Dashboard() {
  const { isAuthenticated, address, devices, tokens, logout } = useAuth();
  const navigate = useNavigate();

  /**
   * Redirect to landing if not authenticated
   */
  
  const handleLogout = () => {
    logout();
    navigate(ROUTES.LANDING);
  };

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.logo}>ClearSky</h1>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.contentWrapper}>
          {/* Welcome Section */}
          <div style={styles.welcomeCard}>
            <h2 style={styles.welcomeTitle}>Welcome to Your Dashboard</h2>
            <p style={styles.welcomeSubtitle}>
              You're successfully authenticated with CDP + Wagmi
            </p>
          </div>

          {/* Wallet Info Card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <span style={styles.cardIcon}>💼</span>
              Wallet Information
            </h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Wallet Address</span>
                <span style={styles.infoValue}>{address}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(address || "")}
                  style={styles.copyButton}
                >
                  Copy
                </button>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Network</span>
                <span style={styles.infoValue}>Base / Base Sepolia</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Authentication Type</span>
                <span style={styles.infoValue}>CDP Embedded Wallet</span>
              </div>
            </div>
          </div>

          {/* Devices Card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <span style={styles.cardIcon}>📱</span>
              Registered Devices ({devices.length})
            </h3>
            <div style={styles.devicesList}>
              {devices.map((device) => (
                <div key={device.deviceId} style={styles.deviceItem}>
                  <div style={styles.deviceInfo}>
                    <div style={styles.deviceName}>{device.deviceName}</div>
                    <div style={styles.deviceMeta}>
                      Registered: {new Date(device.registeredAt).toLocaleDateString()}
                    </div>
                    {device.lastUsed && (
                      <div style={styles.deviceMeta}>
                        Last used: {new Date(device.lastUsed).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div style={styles.deviceBadge}>Current</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tokens Info (Debug) */}
          {tokens && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🔑</span>
                Authentication Tokens
              </h3>
              <div style={styles.tokenInfo}>
                <div style={styles.tokenItem}>
                  <span style={styles.tokenLabel}>Access Token</span>
                  <span style={styles.tokenValue}>
                    {tokens.access_token.substring(0, 20)}...
                  </span>
                </div>
                <div style={styles.tokenItem}>
                  <span style={styles.tokenLabel}>Refresh Token</span>
                  <span style={styles.tokenValue}>
                    {tokens.refresh_token.substring(0, 20)}...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Features Grid */}
          <div style={styles.featuresGrid}>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>✅</div>
              <h4 style={styles.featureTitle}>Signature Verified</h4>
              <p style={styles.featureDescription}>
                Your device was registered with cryptographic proof of wallet ownership
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🔐</div>
              <h4 style={styles.featureTitle}>Secure Sessions</h4>
              <p style={styles.featureDescription}>
                JWT tokens ensure secure API communication
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🌐</div>
              <h4 style={styles.featureTitle}>Multi-Device</h4>
              <p style={styles.featureDescription}>
                Access your account from any registered device
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Inline styles
const styles = {
  container: {
    minHeight: "100vh",
    background: "#f5f7fa",
  },
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  headerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "white",
    margin: 0,
  },
  logoutButton: {
    background: "rgba(255,255,255,0.2)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: "8px",
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  main: {
    padding: "40px 20px",
  },
  contentWrapper: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  welcomeCard: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "16px",
    padding: "40px",
    marginBottom: "32px",
    color: "white",
    textAlign: "center" as const,
  },
  welcomeTitle: {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "12px",
  },
  welcomeSubtitle: {
    fontSize: "18px",
    opacity: 0.9,
  },
  card: {
    background: "white",
    borderRadius: "16px",
    padding: "32px",
    marginBottom: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "24px",
    color: "#333",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  cardIcon: {
    fontSize: "28px",
  },
  infoGrid: {
    display: "grid",
    gap: "20px",
  },
  infoItem: {
    display: "grid",
    gridTemplateColumns: "200px 1fr auto",
    alignItems: "center",
    gap: "16px",
    padding: "16px",
    background: "#f8f9fa",
    borderRadius: "8px",
  },
  infoLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#666",
  },
  infoValue: {
    fontSize: "14px",
    color: "#333",
    fontFamily: "monospace",
    wordBreak: "break-all" as const,
  },
  copyButton: {
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "6px 16px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  devicesList: {
    display: "grid",
    gap: "16px",
  },
  deviceItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    background: "#f8f9fa",
    borderRadius: "12px",
    border: "2px solid #e9ecef",
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "8px",
  },
  deviceMeta: {
    fontSize: "13px",
    color: "#666",
    marginBottom: "4px",
  },
  deviceBadge: {
    background: "#667eea",
    color: "white",
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },
  tokenInfo: {
    display: "grid",
    gap: "16px",
  },
  tokenItem: {
    display: "grid",
    gridTemplateColumns: "150px 1fr",
    gap: "16px",
    padding: "16px",
    background: "#f8f9fa",
    borderRadius: "8px",
  },
  tokenLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#666",
  },
  tokenValue: {
    fontSize: "14px",
    color: "#333",
    fontFamily: "monospace",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    marginTop: "32px",
  },
  featureCard: {
    background: "white",
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center" as const,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  featureIcon: {
    fontSize: "40px",
    marginBottom: "16px",
  },
  featureTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "8px",
    color: "#333",
  },
  featureDescription: {
    fontSize: "14px",
    color: "#666",
    lineHeight: "1.5",
  },
};
