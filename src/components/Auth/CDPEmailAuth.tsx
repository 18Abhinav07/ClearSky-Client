/**
 * CDP Email Authentication Component
 *
 * Based on official CDP documentation:
 * https://docs.cdp.coinbase.com/embedded-wallets/react-hooks
 *
 * Uses official CDP hooks for proper authentication flow:
 * - useSignInWithEmail: Initiates email OTP flow
 * - useVerifyEmailOTP: Completes authentication with OTP
 */

import { useState } from "react";
import { useSignInWithEmail, useVerifyEmailOTP } from "@coinbase/cdp-hooks";

interface CDPEmailAuthProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function CDPEmailAuth({ onSuccess, onError }: CDPEmailAuthProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [flowId, setFlowId] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "success">("email");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Official CDP hooks
  const { signInWithEmail } = useSignInWithEmail();
  const { verifyEmailOTP } = useVerifyEmailOTP();

  /**
   * Step 1: Send OTP to email
   * Official CDP flow: signInWithEmail returns flowId
   */
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("[CDP Auth] Sending OTP to:", email);

      // Official CDP hook usage - returns flowId
      const result = await signInWithEmail({ email });

      console.log("[CDP Auth] OTP sent successfully, flowId:", result.flowId);
      setFlowId(result.flowId);
      setStep("otp");
    } catch (err: any) {
      console.error("[CDP Auth] Failed to send OTP:", err);
      const errorMsg = err?.message || "Failed to send verification code";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 2: Verify OTP
   * Official CDP flow: verifyEmailOTP returns user object
   */
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !flowId || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("[CDP Auth] Verifying OTP...");

      // Official CDP hook usage - returns user and isNewUser
      const result = await verifyEmailOTP({ flowId, otp });

      console.log("[CDP Auth] OTP verified successfully!");
      console.log("[CDP Auth] User:", result.user);
      console.log("[CDP Auth] Is new user:", result.isNewUser);
      console.log("[CDP Auth] EVM accounts:", result.user.evmAccounts);

      setStep("success");
      onSuccess?.();
    } catch (err: any) {
      console.error("[CDP Auth] Failed to verify OTP:", err);
      const errorMsg = err?.message || "Invalid verification code. Please try again.";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp("");
    setError(null);
    await handleSendOTP(new Event("submit") as any);
  };

  const handleBack = () => {
    setStep("email");
    setOtp("");
    setError(null);
  };

  // Email input step
  if (step === "email") {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Sign In with Email</h2>
        <p style={styles.subtitle}>
          We'll send you a verification code
        </p>
        <form onSubmit={handleSendOTP} style={styles.form}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={styles.input}
            disabled={isLoading}
            autoFocus
            required
          />
          {error && <div style={styles.error}>{error}</div>}
          <button
            type="submit"
            style={isLoading ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
            disabled={isLoading || !email}
          >
            {isLoading ? "Sending..." : "Continue"}
          </button>
        </form>
      </div>
    );
  }

  // OTP verification step
  if (step === "otp") {
    return (
      <div style={styles.container}>
        <button onClick={handleBack} style={styles.backButton} disabled={isLoading}>
          Back
        </button>
        <h2 style={styles.title}>Enter Verification Code</h2>
        <p style={styles.subtitle}>
          We sent a 6-digit code to <strong>{email}</strong>
        </p>
        <form onSubmit={handleVerifyOTP} style={styles.form}>
          <input
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(e) => {
              // Only allow numbers, max 6 digits
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              setOtp(value);
            }}
            placeholder="000000"
            style={styles.otpInput}
            disabled={isLoading}
            maxLength={6}
            autoFocus
            autoComplete="one-time-code"
            required
          />
          {error && <div style={styles.error}>{error}</div>}
          <button
            type="submit"
            style={
              isLoading || otp.length !== 6
                ? { ...styles.button, ...styles.buttonDisabled }
                : styles.button
            }
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
          <button
            type="button"
            onClick={handleResendOTP}
            style={styles.linkButton}
            disabled={isLoading}
          >
            Didn't receive code? Resend
          </button>
        </form>
      </div>
    );
  }

  // Success state
  return (
    <div style={styles.container}>
      <div style={styles.success}>
        <div style={styles.checkmark}>✓</div>
        <h2 style={styles.title}>Successfully Authenticated</h2>
        <p style={styles.subtitle}>Creating your wallet...</p>
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    width: "100%",
    maxWidth: "400px",
    margin: "0 auto",
    padding: "24px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "8px",
    color: "#333",
    textAlign: "center" as const,
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "24px",
    textAlign: "center" as const,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  input: {
    padding: "12px 16px",
    fontSize: "16px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "inherit",
  },
  otpInput: {
    padding: "16px",
    fontSize: "32px",
    fontWeight: "bold",
    textAlign: "center" as const,
    letterSpacing: "8px",
    border: "2px solid #ddd",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "monospace",
  },
  button: {
    padding: "14px 24px",
    fontSize: "16px",
    fontWeight: "600",
    color: "white",
    background: "#667eea",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  buttonDisabled: {
    background: "#ccc",
    cursor: "not-allowed",
  },
  linkButton: {
    padding: "8px",
    fontSize: "14px",
    color: "#667eea",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    textDecoration: "underline",
  },
  backButton: {
    padding: "8px 16px",
    fontSize: "14px",
    color: "#667eea",
    background: "transparent",
    border: "1px solid #667eea",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "16px",
  },
  error: {
    padding: "12px",
    fontSize: "14px",
    color: "#d32f2f",
    background: "#ffebee",
    borderRadius: "8px",
    border: "1px solid #ef9a9a",
    textAlign: "center" as const,
  },
  success: {
    textAlign: "center" as const,
    padding: "32px 0",
  },
  checkmark: {
    width: "64px",
    height: "64px",
    fontSize: "48px",
    lineHeight: "64px",
    margin: "0 auto 16px",
    color: "#4caf50",
    border: "3px solid #4caf50",
    borderRadius: "50%",
  },
};
