/**
 * Authentication Modal Component
 *
 * Modal that opens when user clicks "Get Started"
 * Contains CDP Email Authentication flow
 */

import { CDPEmailAuth } from "./CDPEmailAuth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  if (!isOpen) return null;

  const handleSuccess = () => {
    console.log("[AuthModal] Authentication successful");
    onSuccess?.();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={styles.modal}>
        {/* Close Button */}
        <button style={styles.closeButton} onClick={onClose} aria-label="Close">
          ✕
        </button>

        {/* Modal Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Get Started with ClearSky</h2>
          <p style={styles.subtitle}>
            Sign in with your email to create a secure wallet
          </p>
        </div>

        {/* CDP Auth Form */}
        <div style={styles.content}>
          <CDPEmailAuth
            onSuccess={handleSuccess}
            onError={(err) => {
              console.error("[AuthModal] Authentication error:", err);
            }}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modal: {
    position: "relative" as const,
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    maxWidth: "500px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
    animation: "modalFadeIn 0.3s ease-out",
  },
  closeButton: {
    position: "absolute" as const,
    top: "16px",
    right: "16px",
    width: "32px",
    height: "32px",
    border: "none",
    background: "transparent",
    fontSize: "24px",
    color: "#666",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    transition: "background 0.2s",
  },
  header: {
    padding: "32px 32px 0",
    textAlign: "center" as const,
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "24px",
  },
  content: {
    padding: "0 32px 32px",
  },
};
